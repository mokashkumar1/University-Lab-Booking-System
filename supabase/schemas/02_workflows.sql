create function public.booking_department(p_booking public.bookings) returns uuid language sql stable set search_path=public as $$ select coalesce((select department_id from labs where id=p_booking.lab_id),(select l.department_id from booking_items i join equipment e on e.id=i.equipment_id join labs l on l.id=e.lab_id where i.booking_id=p_booking.id limit 1),(select department_id from profiles where id=p_booking.user_id)) $$;
create function public.authorize_booking(p_actor uuid,p_booking public.bookings,p_roles public.app_role[]) returns void language plpgsql stable set search_path=public as $$ declare a profiles; begin a:=require_actor(p_actor); perform authorize_department(p_actor,booking_department(p_booking),p_roles); if a.role<>'Admin' and exists(select 1 from booking_items i join equipment e on e.id=i.equipment_id join labs l on l.id=e.lab_id where i.booking_id=p_booking.id and l.department_id is distinct from a.department_id) then raise exception 'Multi-department requests require an admin' using errcode='42501'; end if; end $$;
create function public.lock_booking_resources(p_booking public.bookings) returns void language plpgsql set search_path=public as $$ begin perform 1 from labs where id=p_booking.lab_id or id in(select e.lab_id from equipment e join booking_items i on i.equipment_id=e.id where i.booking_id=p_booking.id) order by id for update; perform 1 from equipment where id in(select equipment_id from booking_items where booking_id=p_booking.id) order by id for update; end $$;
create function public.decide_booking(p_actor uuid,p_booking_id uuid,p_approve boolean,p_reason text default '') returns void language plpgsql set search_path=public as $$
declare b bookings; a profiles; begin
 select * into b from bookings where id=p_booking_id for update; if not found then raise exception 'Booking not found'; end if; a:=require_actor(p_actor);
 perform authorize_booking(p_actor,b,array['Lab Staff','Coordinator','Admin']::app_role[]);
 if p_approve and a.role='Lab Staff' and exists(select 1 from booking_items i join equipment e on e.id=i.equipment_id where i.booking_id=b.id and e.unit_value_high) then raise exception 'High-value requests require coordinator or admin approval' using errcode='42501'; end if;
 if b.approval_status=(case when p_approve then 'Approved' else 'Rejected' end) and b.booking_status<>'Pending Approval' then return; end if;
 if b.booking_status<>'Pending Approval' then raise exception 'Only pending requests can be decided'; end if;
 if not p_approve and length(trim(coalesce(p_reason,'')))<3 then raise exception 'Provide a rejection reason'; end if;
 perform lock_booking_resources(b);
 if p_approve is null then raise exception 'Approval decision is required'; end if;
 if p_approve and b.end_at<=now() then raise exception 'This request has expired'; end if;
 if p_approve and (exists(select 1 from labs where id=b.lab_id and (archived or status<>'Available')) or exists(select 1 from resource_blocks where lab_id=b.lab_id and start_at<b.end_at and end_at>b.start_at) or exists(select 1 from booking_items i where i.booking_id=b.id and equipment_available(i.equipment_id,b.start_at,b.end_at,b.id)<i.quantity)) then raise exception 'Resource availability changed; resolve this request before approval'; end if;
 update bookings set booking_status=case when p_approve then 'Reserved'::booking_status else 'Rejected'::booking_status end, approval_status=case when p_approve then 'Approved' else 'Rejected' end, approved_by=p_actor,decision_reason=p_reason where id=b.id;
 insert into audit_log(actor,action,entity,entity_id,before_data,after_data) values(p_actor,case when p_approve then 'booking.approved' else 'booking.rejected' end,'bookings',b.id,to_jsonb(b),(select to_jsonb(x) from bookings x where id=b.id));
 insert into notifications(user_id,booking_id,message,category) values(b.user_id,b.id,case when p_approve then 'Your booking has been approved and reserved.' else 'Your booking was rejected: '||p_reason end,'Approvals');
end $$;
create function public.cancel_booking(p_actor uuid,p_booking_id uuid) returns void language plpgsql set search_path=public as $$
declare b bookings; a profiles; begin select * into b from bookings where id=p_booking_id for update; if not found then raise exception 'Booking not found'; end if; a:=require_actor(p_actor); if a.id<>b.user_id and a.role<>'Admin' then raise exception 'Only the requester can cancel' using errcode='42501'; end if; if b.booking_status='Cancelled' then return; end if; if b.booking_status not in ('Pending Approval','Approved','Reserved') or exists(select 1 from issue_returns where booking_id=b.id) then raise exception 'Booking cannot be cancelled after issue or closure'; end if; perform lock_booking_resources(b); update bookings set booking_status='Cancelled' where id=b.id; insert into audit_log(actor,action,entity,entity_id,before_data) values(p_actor,'booking.cancelled','bookings',b.id,to_jsonb(b)); insert into notifications(user_id,booking_id,message) values(b.user_id,b.id,'Your booking has been cancelled.'); end $$;
create function public.issue_booking(p_actor uuid,p_booking_id uuid,p_items jsonb) returns void language plpgsql set search_path=public as $$
declare b bookings; item record; reserved integer; e equipment; physical integer; begin
 select * into b from bookings where id=p_booking_id for update; if not found then raise exception 'Booking not found'; end if;
 perform authorize_booking(p_actor,b,array['Lab Staff','Admin']::app_role[]);
 if b.booking_status='In Use' then return; end if; if b.booking_status<>'Reserved' then raise exception 'Only reserved bookings can be issued'; end if;
 if now()<b.start_at-interval '30 minutes' or now()>=b.end_at then raise exception 'Issue is only available near the reserved time'; end if;
 perform lock_booking_resources(b);
 if b.lab_id is not null then if exists(select 1 from labs where id=b.lab_id and (archived or status<>'Available')) or exists(select 1 from resource_blocks where lab_id=b.lab_id and start_at<now() and end_at>now()) or exists(select 1 from bookings where id<>b.id and lab_id=b.lab_id and booking_status='In Use') then raise exception 'Lab cannot be checked in while blocked or occupied'; end if; end if;
 if exists(select 1 from booking_items where booking_id=b.id) and jsonb_array_length(coalesce(p_items,'[]'))=0 then raise exception 'Record actual quantities before issuing equipment'; end if;
 for item in select (x->>'equipment_id')::uuid id,sum((x->>'quantity')::integer)::integer quantity,max(coalesce(x->>'condition','Good')) condition from jsonb_array_elements(coalesce(p_items,'[]')) x group by 1 loop
 select quantity into reserved from booking_items where booking_id=b.id and equipment_id=item.id;
 if reserved is null or item.quantity<1 or item.quantity>reserved then raise exception 'Issued quantity must be within the reservation'; end if;
 select * into e from equipment where id=item.id;
 select coalesce(sum(quantity-returned_quantity),0) into physical from issue_returns where equipment_id=item.id and returned_at is null;
 if e.archived or e.maintenance_status or e.condition='Damaged' or exists(select 1 from labs where id=e.lab_id and (archived or status<>'Available')) or exists(select 1 from resource_blocks where lab_id=e.lab_id and start_at<now() and end_at>now()) or e.total_quantity-physical<item.quantity or exists(select 1 from resource_blocks where equipment_id=e.id and start_at<now() and end_at>now()) then raise exception 'Equipment unavailable at issue; physical stock has been rechecked'; end if;
 insert into issue_returns(booking_id,equipment_id,quantity,due_at,issue_condition,issued_by) values(b.id,item.id,item.quantity,b.end_at,item.condition,p_actor);
 end loop;
 update bookings set booking_status='In Use' where id=b.id;
 insert into audit_log(actor,action,entity,entity_id,after_data) values(p_actor,'equipment.issued','bookings',b.id,p_items);
 insert into notifications(user_id,booking_id,message) values(b.user_id,b.id,'Your booking is in use. Please return equipment before the due time.');
end $$;
create function public.return_booking(p_actor uuid,p_booking_id uuid,p_items jsonb,p_remarks text default '',p_damage_note text default '') returns void language plpgsql set search_path=public as $$
declare b bookings; item record; ir issue_returns; late boolean; damaged boolean; changed boolean:=false; next_status booking_status; begin
 select * into b from bookings where id=p_booking_id for update; if not found then raise exception 'Booking not found'; end if;
 perform authorize_booking(p_actor,b,array['Lab Staff','Admin']::app_role[]);
 if b.booking_status in ('Completed','Returned Late','Damaged') then return; end if;
 if b.booking_status<>'In Use' then raise exception 'Only issued bookings can be returned'; end if;
 perform lock_booking_resources(b);
 -- Quantities are cumulative targets: sending the same total again has no effect.
 for item in select (x->>'equipment_id')::uuid id,(x->>'quantity')::integer quantity,coalesce(x->>'condition','Good') condition from jsonb_array_elements(coalesce(p_items,'[]')) x loop
 select * into ir from issue_returns where booking_id=b.id and equipment_id=item.id for update;
 if not found then raise exception 'Equipment was not issued'; end if;
 if item.quantity is null or item.quantity<ir.returned_quantity or item.quantity>ir.quantity then raise exception 'Total returned must be between the already returned and issued quantity'; end if;
 if item.condition not in ('Good','Fair','Damaged') then raise exception 'Choose a valid return condition'; end if;
 if ir.returned_at is not null or item.quantity=ir.returned_quantity then continue; end if;
 if item.condition='Damaged' and length(trim(coalesce(p_damage_note,'')))<3 then raise exception 'Provide a damage note'; end if;
 changed:=true;
 update issue_returns set returned_quantity=item.quantity,returned_at=case when item.quantity=quantity then now() else null end,return_condition=case when return_condition='Damaged' then 'Damaged' else item.condition end,remarks=p_remarks,damage_note=case when item.condition='Damaged' then p_damage_note else damage_note end,returned_by=p_actor where id=ir.id;
 if item.condition='Damaged' then
 update equipment set condition='Damaged',maintenance_status=true where id=item.id;
 insert into notifications(user_id,booking_id,message,category) select distinct future.user_id,future.id,'Equipment in your upcoming booking was returned damaged. Staff will review its availability.','System' from bookings future join booking_items i on i.booking_id=future.id where i.equipment_id=item.id and future.id<>b.id and future.end_at>now() and future.booking_status in ('Pending Approval','Approved','Reserved');
 end if;
 end loop;
 if exists(select 1 from issue_returns where booking_id=b.id and returned_at is null) then
 if changed then
 insert into audit_log(actor,action,entity,entity_id,after_data) values(p_actor,'equipment.partial_return','bookings',b.id,jsonb_build_object('cumulative_items',p_items));
 insert into notifications(user_id,booking_id,message) values(b.user_id,b.id,'A partial equipment return was recorded. Your booking remains in use until all issued equipment is returned.');
 end if;
 return;
 end if;
 select coalesce(bool_or(returned_at>due_at),false),coalesce(bool_or(return_condition='Damaged'),false) into late,damaged from issue_returns where booking_id=b.id;
 late:=late or (not exists(select 1 from issue_returns where booking_id=b.id) and now()>b.end_at);
 next_status:=case when damaged then 'Damaged' when late then 'Returned Late' else 'Completed' end;
 if late and not b.late_recorded then update profiles set late_count=late_count+1,restricted_until=case when late_count+1>=rule_for_actor(b.user_id,'late_return_limit',3) then now()+make_interval(days=>rule_for_actor(b.user_id,'restriction_days',7)::integer) else restricted_until end where id=b.user_id; end if;
 update bookings set booking_status=next_status,late_recorded=late_recorded or late where id=b.id;
 insert into audit_log(actor,action,entity,entity_id,after_data) values(p_actor,'equipment.returned','bookings',b.id,jsonb_build_object('cumulative_items',p_items,'late',late,'damaged',damaged));
 insert into notifications(user_id,booking_id,message) values(b.user_id,b.id,'Booking closed: '||next_status::text||'.');
end $$;
create function public.manage_rule(p_actor uuid,p_key text,p_value jsonb) returns void language plpgsql set search_path=public as $$ declare a profiles; old jsonb; begin a:=require_actor(p_actor); if a.role not in ('Coordinator','Admin') then raise exception 'Permission denied' using errcode='42501'; end if;  if p_key is null or p_key not in ('max_duration_hours','max_advance_days','max_quantity_per_user','late_return_limit','restriction_days','high_value_approval_required') then raise exception 'Unknown rule'; end if; if p_value is null or p_value='null'::jsonb then raise exception 'A rule value is required'; end if; if p_key='high_value_approval_required' then if jsonb_typeof(p_value)<>'boolean' or p_value<>'true'::jsonb then raise exception 'High-value approval must remain enabled'; end if; else if jsonb_typeof(p_value)<>'number' then raise exception 'Rule value must be an integer'; end if; if (p_value#>>'{}')::numeric<=0 or (p_value#>>'{}')::numeric>365 or trunc((p_value#>>'{}')::numeric)<>(p_value#>>'{}')::numeric then raise exception 'Rule value must be an integer between 1 and 365'; end if; end if; if a.role='Coordinator' then select value into old from department_rules where department_id=a.department_id and key=p_key; insert into department_rules(department_id,key,value) values(a.department_id,p_key,p_value) on conflict(department_id,key) do update set value=excluded.value; insert into audit_log(actor,action,entity,before_data,after_data) values(p_actor,'department.rule.updated','department_rules',jsonb_build_object(p_key,old),jsonb_build_object(p_key,p_value)); return; end if; select value into old from rules where key=p_key; insert into rules(key,value) values(p_key,p_value) on conflict(key) do update set value=excluded.value,updated_at=now(); insert into audit_log(actor,action,entity,before_data,after_data) values(p_actor,'rule.updated','rules',jsonb_build_object(p_key,old),jsonb_build_object(p_key,p_value)); end $$;
create function public.block_resource(p_actor uuid,p_lab_id uuid,p_equipment_id uuid,p_start_at timestamptz,p_end_at timestamptz,p_reason text) returns uuid language plpgsql set search_path=public as $$ declare dept uuid; bid uuid; begin if num_nonnulls(p_lab_id,p_equipment_id)<>1 then raise exception 'Choose exactly one resource'; end if; if p_lab_id is not null then select department_id into dept from labs where id=p_lab_id for update; else select l.department_id into dept from equipment e join labs l on l.id=e.lab_id where e.id=p_equipment_id; perform 1 from equipment where id=p_equipment_id for update; end if; if dept is null then raise exception 'Resource not found'; end if; perform authorize_department(p_actor,dept,array['Lab Staff','Coordinator','Admin']::app_role[]); if p_start_at is null or p_end_at is null or p_start_at>=p_end_at or length(trim(coalesce(p_reason,'')))<3 then raise exception 'Valid dates and block reason required'; end if; if exists(select 1 from bookings b where b.booking_status in ('Pending Approval','Approved','Reserved','In Use') and b.start_at<p_end_at and b.end_at>p_start_at and (b.lab_id=p_lab_id or exists(select 1 from booking_items i join equipment e on e.id=i.equipment_id where i.booking_id=b.id and (i.equipment_id=p_equipment_id or e.lab_id=p_lab_id)))) then raise exception 'Resolve existing reservations before blocking this resource'; end if; insert into resource_blocks(lab_id,equipment_id,start_at,end_at,reason,actor) values(p_lab_id,p_equipment_id,p_start_at,p_end_at,p_reason,p_actor) returning id into bid; insert into audit_log(actor,action,entity,entity_id) values(p_actor,'resource.blocked','resource_blocks',bid); return bid; end $$;


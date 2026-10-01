create function public.manage_resource(p_actor uuid,p_entity text,p_id uuid,p_data jsonb) returns uuid language plpgsql set search_path=public as $$
declare a profiles; target uuid:=coalesce(p_id,gen_random_uuid()); old jsonb; dept uuid; live integer; begin
 a:=require_actor(p_actor);
 if p_entity not in ('labs','equipment','departments','categories','profiles') then raise exception 'Unknown management entity'; end if;
 if a.role<>'Admin' then
 if p_id is null or p_entity not in ('labs','equipment') or exists(select 1 from jsonb_object_keys(p_data) k where k not in ('status','maintenance_status','condition')) then raise exception 'Permission denied' using errcode='42501'; end if;
 if p_entity='labs' then select department_id into dept from labs where id=p_id; else select l.department_id into dept from equipment e join labs l on l.id=e.lab_id where e.id=p_id; end if;
 perform authorize_department(p_actor,dept,array['Lab Staff','Coordinator','Admin']::app_role[]);
 end if;
 if p_entity='labs' then
 select to_jsonb(l) into old from labs l where id=target for update;
 perform 1 from equipment where lab_id=target order by id for update;
 if old is not null and (p_data->>'status' in ('Maintenance','Closed') or (p_data->>'archived')::boolean) and exists(select 1 from bookings b where (b.lab_id=target or exists(select 1 from booking_items i join equipment e on e.id=i.equipment_id where i.booking_id=b.id and e.lab_id=target)) and b.booking_status in ('Pending Approval','Approved','Reserved','In Use') and (b.end_at>now() or b.booking_status='In Use')) then raise exception 'Resolve active or future reservations before closing a lab'; end if;
 if old is null then insert into labs(id,name,department_id,capacity,location,facilities,status,description,image_url) values(target,p_data->>'name',(p_data->>'department_id')::uuid,(p_data->>'capacity')::integer,coalesce(p_data->>'location',''),array(select jsonb_array_elements_text(coalesce(p_data->'facilities','[]'))),coalesce(p_data->>'status','Available'),coalesce(p_data->>'description',''),p_data->>'image_url');
 else
 if p_data?'capacity' and exists(select 1 from bookings where lab_id=target and booking_status in ('Pending Approval','Approved','Reserved','In Use') and end_at>now() and attendees>(p_data->>'capacity')::integer) then raise exception 'Capacity cannot be reduced below existing reservations'; end if;
 if p_data?'department_id' and (p_data->>'department_id')::uuid is distinct from (old->>'department_id')::uuid and exists(select 1 from bookings where lab_id=target and booking_status in ('Pending Approval','Approved','Reserved','In Use') and end_at>now()) then raise exception 'Resolve reservations before reassigning the lab department'; end if;
 update labs set name=coalesce(p_data->>'name',name),department_id=coalesce((p_data->>'department_id')::uuid,department_id),capacity=coalesce((p_data->>'capacity')::integer,capacity),location=coalesce(p_data->>'location',location),facilities=case when p_data?'facilities' then array(select jsonb_array_elements_text(p_data->'facilities')) else facilities end,status=coalesce(p_data->>'status',status),description=coalesce(p_data->>'description',description),image_url=coalesce(p_data->>'image_url',image_url),archived=coalesce((p_data->>'archived')::boolean,archived) where id=target; end if;
 elsif p_entity='equipment' then
 -- Parent lab lock precedes equipment lock, matching creation.
 perform 1 from labs where id in (select lab_id from equipment where id=target union select (p_data->>'lab_id')::uuid where p_data?'lab_id') order by id for update;
 select to_jsonb(e) into old from equipment e where id=target for update;
 if old is not null then
 if ((p_data->>'maintenance_status')::boolean or (p_data->>'archived')::boolean or (p_data?'lab_id' and (p_data->>'lab_id')::uuid is distinct from (old->>'lab_id')::uuid)) and exists(select 1 from booking_items i join bookings b on b.id=i.booking_id where i.equipment_id=target and b.booking_status in ('Pending Approval','Approved','Reserved','In Use') and b.end_at>now()) then raise exception 'Resolve reservations before moving, archiving or maintaining equipment'; end if;
 if p_data?'total_quantity' then
 select greatest(coalesce(max(used),0),coalesce((select sum(quantity-returned_quantity) from issue_returns where equipment_id=target and returned_at is null),0)) into live from (
 select sum(delta) over(order by t) used from (select t,sum(delta) delta from (select b.start_at t,i.quantity delta from booking_items i join bookings b on b.id=i.booking_id where i.equipment_id=target and b.booking_status in ('Pending Approval','Approved','Reserved','In Use') and b.end_at>now() union all select b.end_at,-i.quantity from booking_items i join bookings b on b.id=i.booking_id where i.equipment_id=target and b.booking_status in ('Pending Approval','Approved','Reserved','In Use') and b.end_at>now()) events group by t) grouped) occupancy;
 if (p_data->>'total_quantity')::integer<live then raise exception 'Stock cannot be reduced below peak reservations or issued quantity'; end if; end if;
 update equipment set name=coalesce(p_data->>'name',name),category=coalesce(p_data->>'category',category),total_quantity=coalesce((p_data->>'total_quantity')::integer,total_quantity),lab_id=coalesce((p_data->>'lab_id')::uuid,lab_id),condition=coalesce(p_data->>'condition',condition),maintenance_status=coalesce((p_data->>'maintenance_status')::boolean,maintenance_status),unit_value_high=coalesce((p_data->>'unit_value_high')::boolean,unit_value_high),description=coalesce(p_data->>'description',description),image_url=coalesce(p_data->>'image_url',image_url),archived=coalesce((p_data->>'archived')::boolean,archived) where id=target;
 else insert into equipment(id,name,category,total_quantity,lab_id,condition,maintenance_status,unit_value_high,description,image_url) values(target,p_data->>'name',coalesce(p_data->>'category','General'),(p_data->>'total_quantity')::integer,(p_data->>'lab_id')::uuid,coalesce(p_data->>'condition','Good'),coalesce((p_data->>'maintenance_status')::boolean,false),coalesce((p_data->>'unit_value_high')::boolean,false),coalesce(p_data->>'description',''),p_data->>'image_url'); end if;
 elsif p_entity='profiles' then
 select to_jsonb(p) into old from profiles p where id=target for update; if old is null then raise exception 'Create authentication user before assigning a profile'; end if;
 if p_data?'email' and not exists(select 1 from auth.users where id=target and lower(email)=lower(p_data->>'email')) then raise exception 'Profile email must match the authenticated account'; end if;
 update profiles set email=coalesce(p_data->>'email',email),name=coalesce(p_data->>'name',name),role=coalesce((p_data->>'role')::app_role,role),department_id=coalesce((p_data->>'department_id')::uuid,department_id),active=coalesce((p_data->>'active')::boolean,active),restricted_until=case when p_data?'restricted_until' then (p_data->>'restricted_until')::timestamptz else restricted_until end,late_count=coalesce((p_data->>'late_count')::integer,late_count) where id=target;
 else
 execute format('select to_jsonb(t) from public.%I t where id=$1 for update',p_entity) into old using target;
 execute format('insert into public.%I(id,name,archived) values($1,$2,$3) on conflict(id) do update set name=excluded.name,archived=excluded.archived',p_entity) using target,coalesce(p_data->>'name',old->>'name'),coalesce((p_data->>'archived')::boolean,(old->>'archived')::boolean,false);
 end if;
 insert into audit_log(actor,action,entity,entity_id,before_data,after_data) values(p_actor,case when old is null then 'resource.created' else 'resource.updated' end,p_entity,target,old,p_data);
 return target;
end $$;
grant select on auth.users to service_role;
-- Auth owns email confirmation. This trigger creates a minimally privileged Student profile;
-- authorization always reads `profiles.role`, never caller-controlled user metadata.
create function public.handle_new_auth_user() returns trigger language plpgsql security definer set search_path=public,auth as $$
declare profile_name text; dept_id uuid;
begin
 profile_name:=coalesce(nullif(trim(new.raw_user_meta_data->>'name'),''),split_part(new.email,'@',1));
 begin
  dept_id:=(new.raw_user_meta_data->>'department_id')::uuid;
 exception when others then dept_id:=null;
 end;
 insert into public.profiles(id,name,email,role,department_id,active)
 values(new.id,profile_name,new.email,'Student',dept_id,true)
 on conflict (id) do nothing;
 return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_auth_user();
revoke all on function public.handle_new_auth_user() from public,anon,authenticated;
grant execute on function public.handle_new_auth_user() to service_role;
create function public.create_profile(p_actor uuid,p_user_id uuid,p_name text,p_email text,p_role public.app_role,p_department_id uuid,p_active boolean) returns uuid language plpgsql set search_path=public as $$ declare a profiles; begin
 a:=require_actor(p_actor); if a.role<>'Admin' then raise exception 'Only administrators can create users' using errcode='42501'; end if;
 if p_user_id is null or p_name is null or length(trim(p_name))<2 or p_email is null or p_role is null or p_active is null then raise exception 'Name, email, role and status are required'; end if;
 if not exists(select 1 from auth.users where id=p_user_id and lower(email)=lower(trim(p_email))) then raise exception 'Profile email must match the authenticated account'; end if;
 insert into profiles(id,name,email,role,department_id,active) values(p_user_id,trim(p_name),trim(p_email),p_role,p_department_id,p_active)
 on conflict(id) do update set name=excluded.name,email=excluded.email,role=excluded.role,department_id=excluded.department_id,active=excluded.active;
 insert into audit_log(actor,action,entity,entity_id,after_data) values(p_actor,'user.created','profiles',p_user_id,jsonb_build_object('name',p_name,'email',p_email,'role',p_role,'department_id',p_department_id,'active',p_active));
 return p_user_id;
end $$;
create function public.set_booking_priority(p_actor uuid,p_booking_id uuid,p_priority integer) returns void language plpgsql set search_path=public as $$ declare b bookings; begin select * into b from bookings where id=p_booking_id for update; if not found then raise exception 'Booking not found'; end if; perform authorize_booking(p_actor,b,array['Coordinator','Admin']::app_role[]); if p_priority not between 0 and 3 then raise exception 'Priority must be between 0 and 3'; end if; update bookings set priority=p_priority where id=b.id; insert into audit_log(actor,action,entity,entity_id,before_data,after_data) values(p_actor,'booking.priority','bookings',b.id,jsonb_build_object('priority',b.priority),jsonb_build_object('priority',p_priority)); end $$;
-- Explicitly close all function APIs to untrusted callers, including helper functions.
do $$ declare f record; begin for f in select p.oid::regprocedure signature from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in ('rule_number','rule_for_actor','require_actor','authorize_department','equipment_available','validate_request','create_booking','booking_department','authorize_booking','lock_booking_resources','decide_booking','cancel_booking','issue_booking','return_booking','manage_rule','block_resource','manage_resource','set_booking_priority','create_profile') loop execute format('revoke all on function %s from public,anon,authenticated',f.signature); execute format('grant execute on function %s to service_role',f.signature); end loop; end $$;

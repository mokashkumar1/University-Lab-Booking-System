-- Apply to an existing UniLab database after reviewing alongside
-- `supabase/schemas/03_management.sql`. This is intentionally incremental;
-- `scripts/apply-schema.mjs` only initializes an empty database.
grant select on auth.users to service_role;

create or replace function public.handle_new_auth_user() returns trigger language plpgsql security definer set search_path=public,auth as $$
declare profile_name text;
begin
  profile_name:=coalesce(nullif(trim(new.raw_user_meta_data->>'name'),''),split_part(new.email,'@',1));
  insert into public.profiles(id,name,email,role,active)
  values(new.id,profile_name,new.email,'Student',true)
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_auth_user();
revoke all on function public.handle_new_auth_user() from public,anon,authenticated;
grant execute on function public.handle_new_auth_user() to service_role;

create or replace function public.create_profile(p_actor uuid,p_user_id uuid,p_name text,p_email text,p_role public.app_role,p_department_id uuid,p_active boolean) returns uuid language plpgsql set search_path=public as $$
declare a profiles;
begin
  a:=require_actor(p_actor);
  if a.role<>'Admin' then raise exception 'Only administrators can create users' using errcode='42501'; end if;
  if p_user_id is null or p_name is null or length(trim(p_name))<2 or p_email is null or p_role is null or p_active is null then raise exception 'Name, email, role and status are required'; end if;
  if not exists(select 1 from auth.users where id=p_user_id and lower(email)=lower(trim(p_email))) then raise exception 'Profile email must match the authenticated account'; end if;
  insert into profiles(id,name,email,role,department_id,active)
  values(p_user_id,trim(p_name),trim(p_email),p_role,p_department_id,p_active)
  on conflict(id) do update set name=excluded.name,email=excluded.email,role=excluded.role,department_id=excluded.department_id,active=excluded.active;
  insert into audit_log(actor,action,entity,entity_id,after_data) values(p_actor,'user.created','profiles',p_user_id,jsonb_build_object('name',p_name,'email',p_email,'role',p_role,'department_id',p_department_id,'active',p_active));
  return p_user_id;
end $$;

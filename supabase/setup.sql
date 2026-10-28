-- Safe to run several times in your NEW external project: it creates what is missing
-- and never deletes tables or rows. Never run against the original application's service.
begin;
create table if not exists public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 full_name text not null default '', profession text not null default '',
 organization text not null default '', specialization text not null default '',
 biography text not null default '', location text not null default '',
 avatar_path text, language text not null default 'fr', created_at timestamptz not null default now()
);
alter table public.profiles add column if not exists full_name text not null default '';
alter table public.profiles add column if not exists profession text not null default '';
alter table public.profiles add column if not exists organization text not null default '';
alter table public.profiles add column if not exists specialization text not null default '';
alter table public.profiles add column if not exists biography text not null default '';
alter table public.profiles add column if not exists location text not null default '';
alter table public.profiles add column if not exists avatar_path text;
alter table public.profiles add column if not exists language text not null default 'fr';
alter table public.profiles add column if not exists created_at timestamptz not null default now();
grant select, insert, update, delete on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
drop policy if exists own_profiles on public.profiles;
create policy own_profiles on public.profiles for all to authenticated using (id=auth.uid()) with check (id=auth.uid());
create or replace function public.create_profile() returns trigger language plpgsql security definer set search_path=public as $$
begin insert into public.profiles(id,full_name) values(new.id,left(coalesce(new.raw_user_meta_data->>'full_name',''),120)) on conflict(id) do nothing; return new; end; $$;
revoke all on function public.create_profile() from public, anon, authenticated;
drop trigger if exists on_new_user on auth.users;
create trigger on_new_user after insert on auth.users for each row execute function public.create_profile();
insert into public.profiles(id) select id from auth.users on conflict(id) do nothing;
create table if not exists public.diagnostics (
 id uuid primary key default gen_random_uuid(), user_id uuid not null,
 report_number text not null, title text not null, language text not null default 'fr',
 result jsonb not null, measurements jsonb not null default '[]', image_path text,
 created_at timestamptz not null default now(), unique(user_id,report_number)
);
grant select, insert, update, delete on public.diagnostics to authenticated;
alter table public.diagnostics add column if not exists measurements jsonb not null default '[]';
alter table public.diagnostics add column if not exists image_path text;
grant all on public.diagnostics to service_role;
alter table public.diagnostics enable row level security;
drop policy if exists own_diagnostics on public.diagnostics;
create policy own_diagnostics on public.diagnostics for all to authenticated using (user_id=auth.uid()) with check(user_id=auth.uid());
create index if not exists diagnostics_owner_date on public.diagnostics(user_id,created_at desc);
create table if not exists public.schematics (
 id uuid primary key default gen_random_uuid(), user_id uuid not null,
 diagnostic_id uuid not null references public.diagnostics(id) on delete cascade,
 mode text not null, content jsonb not null, created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.schematics to authenticated;
grant all on public.schematics to service_role;
alter table public.schematics enable row level security;
drop policy if exists own_schematics on public.schematics;
create policy own_schematics on public.schematics for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid() and exists(select 1 from public.diagnostics d where d.id=diagnostic_id and d.user_id=auth.uid()));
create table if not exists public.ai_usage (
 user_id uuid not null, day date not null default current_date, requests integer not null default 0,
 primary key(user_id,day)
);
grant select on public.ai_usage to authenticated;
grant all on public.ai_usage to service_role;
alter table public.ai_usage enable row level security;
drop policy if exists own_ai_usage on public.ai_usage;
create policy own_ai_usage on public.ai_usage for select to authenticated using(user_id=auth.uid());
create or replace function public.consume_ai_request() returns boolean language plpgsql security definer set search_path=public as $$
declare count_after integer;
begin
 if auth.uid() is null then return false; end if;
 insert into public.ai_usage(user_id,day,requests) values(auth.uid(),current_date,1)
 on conflict(user_id,day) do update set requests=ai_usage.requests+1 where ai_usage.requests<50
 returning requests into count_after;
 return count_after is not null;
end; $$;
revoke all on function public.consume_ai_request() from public,anon;
grant execute on function public.consume_ai_request() to authenticated;
-- Prevent storing paths outside the owner's private folder and incompatible fields.
create or replace function public.validate_owned_record() returns trigger language plpgsql set search_path=public as $$
begin
 if TG_TABLE_NAME='profiles' then
   if new.language not in ('fr','en') or length(new.full_name)>120 or length(new.biography)>2000 then raise exception 'Invalid profile'; end if;
   if new.avatar_path is not null and split_part(new.avatar_path,'/',1)<>new.id::text then raise exception 'Invalid avatar path'; end if;
 elsif TG_TABLE_NAME='diagnostics' then
   if new.image_path is not null and split_part(new.image_path,'/',1)<>new.user_id::text then raise exception 'Invalid image path'; end if;
   if new.language not in ('fr','en') or jsonb_typeof(new.result)<>'object' or jsonb_typeof(new.measurements)<>'array' then raise exception 'Invalid report'; end if;
 elsif TG_TABLE_NAME='schematics' then
   if new.mode not in ('detailed','blocks') or jsonb_typeof(new.content)<>'object' then raise exception 'Invalid schematic'; end if;
 end if; return new;
end; $$;
drop trigger if exists validate_profile on public.profiles;
create trigger validate_profile before insert or update on public.profiles for each row execute function public.validate_owned_record();
drop trigger if exists validate_diagnostic on public.diagnostics;
create trigger validate_diagnostic before insert or update on public.diagnostics for each row execute function public.validate_owned_record();
drop trigger if exists validate_schematic on public.schematics;
create trigger validate_schematic before insert or update on public.schematics for each row execute function public.validate_owned_record();
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
 values('diagnostic-images','diagnostic-images',false,3145728,array['image/jpeg','image/png','image/webp']),
 ('avatars','avatars',false,2097152,array['image/jpeg','image/png','image/webp']) on conflict(id) do nothing;
drop policy if exists private_files_read on storage.objects;
create policy private_files_read on storage.objects for select to authenticated using(bucket_id in ('diagnostic-images','avatars') and (storage.foldername(name))[1]=auth.uid()::text);
drop policy if exists private_files_insert on storage.objects;
create policy private_files_insert on storage.objects for insert to authenticated with check(bucket_id in ('diagnostic-images','avatars') and (storage.foldername(name))[1]=auth.uid()::text);
drop policy if exists private_files_delete on storage.objects;
create policy private_files_delete on storage.objects for delete to authenticated using(bucket_id in ('diagnostic-images','avatars') and (storage.foldername(name))[1]=auth.uid()::text);
commit;

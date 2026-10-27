-- Run against an isolated disposable database with setup.sql applied.
-- Test identities are fixed UUIDs; no real user data or credentials.
begin;
insert into auth.users(id) values('00000000-0000-4000-8000-000000000001'),('00000000-0000-4000-8000-000000000002');
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000001',true);
insert into public.diagnostics(id,user_id,report_number,title,result) values('00000000-0000-4000-8000-000000000003','00000000-0000-4000-8000-000000000001','TEST','Test','{}');
do $$begin if (select count(*) from public.profiles)<>1 then raise exception 'Profile privacy failed'; end if; if (select count(*) from public.diagnostics)<>1 then raise exception 'Own report missing'; end if; end$$;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000002',true);
do $$begin if (select count(*) from public.diagnostics)<>0 then raise exception 'Other user can read report'; end if;
 begin insert into public.diagnostics(user_id,report_number,title,result) values('00000000-0000-4000-8000-000000000001','FORGED','Test','{}'); raise exception 'Forged owner accepted'; exception when insufficient_privilege then null; end;
 begin insert into public.schematics(user_id,diagnostic_id,mode,content) values('00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000003','detailed','{}'); raise exception 'Other report linkage accepted'; exception when insufficient_privilege then null; end;
end$$;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000001',true);
do $$begin for i in 1..50 loop if not public.consume_ai_request() then raise exception 'Quota too short'; end if; end loop; if public.consume_ai_request() then raise exception 'Quota bypass'; end if; end$$;
rollback;

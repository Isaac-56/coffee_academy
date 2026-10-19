-- Run once in Supabase SQL Editor. Private data is accessed only through
-- authenticated, permission-checked functions; no client can edit admin roles.
begin;
create schema if not exists tera_private;
revoke all on schema tera_private from public, anon, authenticated;
create table tera_private.admins(user_id uuid primary key references auth.users(id) on delete cascade);
create table tera_private.profiles(id uuid primary key references auth.users(id) on delete cascade,name text not null default '' check(length(name)<=120),phone text not null default '' check(length(phone)<=30));
create table tera_private.courses(
 id uuid primary key default gen_random_uuid(),title text not null check(length(trim(title)) between 1 and 120),description text not null check(length(trim(description)) between 1 and 4000),
 format text not null check(format in ('online','in-person')),level text not null check(level in ('beginner','intermediate','professional')),
 duration text not null check(length(trim(duration)) between 1 and 120),fee text not null check(length(trim(fee)) between 1 and 100),
 status text not null default 'draft' check(status in ('draft','published','archived')),
 schedule text not null default '' check(length(schedule)<=500),location text not null default '' check(length(location)<=500),
 whatsapp text not null default '' check(whatsapp='' or whatsapp ~ '^https://chat[.]whatsapp[.]com/[A-Za-z0-9]+$'),
 created timestamptz not null default now(),check(format<>'online' or level='beginner'));
create table tera_private.lessons(id uuid primary key default gen_random_uuid(),course_id uuid not null references tera_private.courses(id),title text not null check(length(trim(title)) between 1 and 160),notes text not null default '' check(length(notes)<=30000),position integer not null check(position between 1 and 1000),published boolean not null default false);
create table tera_private.enrolments(user_id uuid references auth.users(id) on delete cascade,course_id uuid references tera_private.courses(id),status text not null default 'pending' check(status in ('pending','approved','rejected','revoked')),consent_at timestamptz not null default now(),created timestamptz not null default now(),primary key(user_id,course_id));
create table tera_private.progress(user_id uuid references auth.users(id) on delete cascade,lesson_id uuid references tera_private.lessons(id),completed timestamptz not null default now(),primary key(user_id,lesson_id));
create table tera_private.files(id uuid primary key,lesson_id uuid not null references tera_private.lessons(id),name text not null check(length(name) between 1 and 255),type text not null check(type in ('video/mp4','video/webm','application/pdf')),size bigint not null check(size>0 and size<=26214400),path text unique not null,created timestamptz not null default now());
create table tera_private.audit(id bigint generated always as identity primary key,actor uuid not null,action text not null,target text,created timestamptz not null default now());
create index on tera_private.lessons(course_id);
create index on tera_private.enrolments(course_id,status);
create index on tera_private.files(lesson_id);
alter table tera_private.admins enable row level security;
alter table tera_private.profiles enable row level security;
alter table tera_private.courses enable row level security;
alter table tera_private.lessons enable row level security;
alter table tera_private.enrolments enable row level security;
alter table tera_private.progress enable row level security;
alter table tera_private.files enable row level security;
alter table tera_private.audit enable row level security;
revoke all on all tables in schema tera_private from public,anon,authenticated;
create function public.tera_is_admin() returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from tera_private.admins where user_id=auth.uid());
$$;
revoke all on function public.tera_is_admin() from public,anon;
grant execute on function public.tera_is_admin() to authenticated;
create function public.tera_can_read_file(object_path text) returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and (public.tera_is_admin() or exists(select 1 from tera_private.files f join tera_private.lessons l on l.id=f.lesson_id join tera_private.courses c on c.id=l.course_id join tera_private.enrolments e on e.course_id=c.id where f.path=object_path and l.published and c.status='published' and e.user_id=auth.uid() and e.status='approved'));
$$;
revoke all on function public.tera_can_read_file(text) from public,anon;
grant execute on function public.tera_can_read_file(text) to authenticated;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('tera-lessons','tera-lessons',false,26214400,array['video/mp4','video/webm','application/pdf']);
create policy tera_files_read on storage.objects for select to authenticated using(bucket_id='tera-lessons' and public.tera_can_read_file(name));
create policy tera_files_upload on storage.objects for insert to authenticated with check(bucket_id='tera-lessons' and public.tera_is_admin());
create policy tera_files_delete on storage.objects for delete to authenticated using(bucket_id='tera-lessons' and public.tera_is_admin());
create function public.tera_api(endpoint text,payload jsonb default '{}'::jsonb,verb text default 'GET') returns jsonb language plpgsql security definer set search_path='' as $$
declare
 uid uuid:=auth.uid(); adm boolean; cid uuid; lid uuid; fid uuid; target_uid uuid;
 c tera_private.courses%rowtype; l tera_private.lessons%rowtype; f tera_private.files%rowtype;
 result jsonb; rows_json jsonb; completed_json jsonb; p jsonb:=coalesce(payload,'{}'::jsonb);
begin
 if uid is null then raise exception 'Sign in to continue.' using errcode='42501'; end if;
 adm:=public.tera_is_admin();
 -- Serialize mutations so concurrent requests cannot break publishing invariants.
 if verb<>'GET' then perform pg_advisory_xact_lock(84219001); end if;
 insert into tera_private.profiles(id,name) select uid,left(coalesce(raw_user_meta_data->>'name','Student'),120) from auth.users where id=uid on conflict do nothing;
 if endpoint='me' and verb='GET' then
  select jsonb_build_object('user',jsonb_build_object('id',u.id,'name',pr.name,'phone',pr.phone,'email',u.email),'admin',adm) into result from auth.users u join tera_private.profiles pr on pr.id=u.id where u.id=uid;
  return result;
 elsif endpoint='profile' and verb='POST' then
  if coalesce(trim(p->>'name'),'')='' or coalesce(p->>'phone','') !~ '^\+[1-9][0-9 ()-]{6,28}$' then raise exception 'Enter your name and a WhatsApp number with country code.'; end if;
  update tera_private.profiles set name=trim(p->>'name'),phone=p->>'phone' where id=uid;
  return '{"ok":true}';
 elsif endpoint='courses' and verb='GET' then
  if coalesce((p->>'admin')::boolean,false) and not adm then raise exception 'Administrator access required.' using errcode='42501'; end if;
  select coalesce(jsonb_agg(case when adm and coalesce((p->>'admin')::boolean,false) then to_jsonb(x) else to_jsonb(x)-'whatsapp' end order by x.created desc),'[]') into result from tera_private.courses x where (adm and coalesce((p->>'admin')::boolean,false)) or x.status='published';
  select coalesce(jsonb_agg(to_jsonb(e)),'[]') into rows_json from tera_private.enrolments e where e.user_id=uid;
  return jsonb_build_object('courses',result,'enrolments',rows_json);
 elsif endpoint='apply' and verb='POST' then
  cid:=(p->>'courseId')::uuid;
  if coalesce((p->>'consent')::boolean,false) is not true then raise exception 'Please agree to be contacted about your application.'; end if;
  if not exists(select 1 from tera_private.profiles where id=uid and trim(name)<>'' and phone ~ '^\+[1-9][0-9 ()-]{6,28}$') then raise exception 'Complete your profile first.'; end if;
  if not exists(select 1 from tera_private.courses where id=cid and status='published') then raise exception 'This course is not accepting applications.'; end if;
  insert into tera_private.enrolments(user_id,course_id) values(uid,cid) on conflict do nothing;
  return '{"ok":true}';
 elsif endpoint='learning' and verb='GET' then
  cid:=(p->>'courseId')::uuid; select * into c from tera_private.courses where id=cid;
  if c.id is null or (not adm and (c.status<>'published' or not exists(select 1 from tera_private.enrolments where course_id=cid and user_id=uid and status='approved'))) then raise exception 'This course requires instructor approval.' using errcode='42501'; end if;
  select coalesce(jsonb_agg(to_jsonb(x) order by x.position,x.id),'[]') into rows_json from tera_private.lessons x where x.course_id=cid and (adm or x.published);
  select coalesce(jsonb_agg(to_jsonb(x)),'[]') into result from tera_private.files x join tera_private.lessons ll on ll.id=x.lesson_id where ll.course_id=cid and (adm or ll.published);
  select coalesce(jsonb_agg(pr.lesson_id),'[]') into completed_json from tera_private.progress pr join tera_private.lessons ll on ll.id=pr.lesson_id where pr.user_id=uid and ll.course_id=cid and (adm or ll.published);
  return jsonb_build_object('course',to_jsonb(c),'lessons',rows_json,'files',result,'completed',completed_json);
 elsif endpoint='progress' and verb='POST' then
  lid:=(p->>'lessonId')::uuid;
  if not exists(select 1 from tera_private.lessons ll join tera_private.courses cc on cc.id=ll.course_id join tera_private.enrolments e on e.course_id=cc.id where ll.id=lid and ll.published and cc.status='published' and e.user_id=uid and e.status='approved') then raise exception 'Course access required.' using errcode='42501'; end if;
  if coalesce((p->>'completed')::boolean,false) then insert into tera_private.progress(user_id,lesson_id) values(uid,lid) on conflict do nothing; else delete from tera_private.progress where user_id=uid and lesson_id=lid; end if;
  return '{"ok":true}';
 end if;
 if not adm then raise exception 'Administrator access required.' using errcode='42501'; end if;
 if endpoint='enrolments' and verb='GET' then
  select coalesce(jsonb_agg(to_jsonb(x) order by x.created desc),'[]') into result from (select e.*,pr.name,pr.phone,u.email,cc.title,cc.format,cc.level from tera_private.enrolments e join tera_private.profiles pr on pr.id=e.user_id join auth.users u on u.id=e.user_id join tera_private.courses cc on cc.id=e.course_id) x;
  return jsonb_build_object('enrolments',result);
 elsif endpoint='enrolments' and verb='POST' then
  cid:=(p->>'courseId')::uuid; target_uid:=(p->>'userId')::uuid;
  update tera_private.enrolments set status=p->>'status' where user_id=target_uid and course_id=cid;
  if not found then raise exception 'Application not found.'; end if; result:='{"ok":true}';
 elsif endpoint='courses' and verb='POST' then
  cid:=coalesce(nullif(p->>'id','')::uuid,gen_random_uuid()); select * into c from tera_private.courses where id=cid;
  if c.id is not null and (c.format<>p->>'format' or c.level<>p->>'level') and exists(select 1 from tera_private.enrolments where course_id=cid) then raise exception 'Format and level cannot change after students have applied.'; end if;
  if p->>'status'='published' and p->>'format'='online' and not exists(select 1 from tera_private.lessons where course_id=cid and published) then raise exception 'Add a published lesson before publishing this course.'; end if;
  insert into tera_private.courses(id,title,description,format,level,duration,fee,status,schedule,location,whatsapp) values(cid,trim(p->>'title'),trim(p->>'description'),p->>'format',p->>'level',p->>'duration',p->>'fee',p->>'status',coalesce(p->>'schedule',''),coalesce(p->>'location',''),coalesce(p->>'whatsapp','')) on conflict(id) do update set title=excluded.title,description=excluded.description,format=excluded.format,level=excluded.level,duration=excluded.duration,fee=excluded.fee,status=excluded.status,schedule=excluded.schedule,location=excluded.location,whatsapp=excluded.whatsapp;
  result:=jsonb_build_object('id',cid);
 elsif endpoint='lessons' and verb='POST' then
  cid:=(p->>'courseId')::uuid; lid:=coalesce(nullif(p->>'id','')::uuid,gen_random_uuid()); select * into c from tera_private.courses where id=cid;
  if c.id is null or c.format<>'online' then raise exception 'Lessons belong to an online course.'; end if;
  select * into l from tera_private.lessons where id=lid;
  if l.id is not null and l.course_id<>cid then raise exception 'A lesson cannot move between courses.'; end if;
  if coalesce((p->>'published')::boolean,false) and trim(coalesce(p->>'notes',''))='' and not exists(select 1 from tera_private.files where lesson_id=lid) then raise exception 'Add notes or a file before publishing this lesson.'; end if;
  if c.status='published' and not coalesce((p->>'published')::boolean,false) and not exists(select 1 from tera_private.lessons where course_id=cid and id<>lid and published) then raise exception 'Keep at least one published lesson, or archive the course first.'; end if;
  insert into tera_private.lessons(id,course_id,title,notes,position,published) values(lid,cid,trim(p->>'title'),coalesce(p->>'notes',''),(p->>'position')::integer,coalesce((p->>'published')::boolean,false)) on conflict(id) do update set title=excluded.title,notes=excluded.notes,position=excluded.position,published=excluded.published;
  result:=jsonb_build_object('id',lid);
 elsif endpoint='files' and verb='POST' then
  lid:=(p->>'lessonId')::uuid; fid:=(p->>'id')::uuid;
  if not exists(select 1 from tera_private.lessons where id=lid) then raise exception 'Lesson not found.'; end if;
  if p->>'path' <> lid::text||'/'||fid::text then raise exception 'Invalid file path.'; end if;
  if not exists(select 1 from storage.objects where bucket_id='tera-lessons' and name=p->>'path' and (metadata->>'size')::bigint=(p->>'size')::bigint and metadata->>'mimetype'=p->>'type') then raise exception 'Uploaded file could not be verified.'; end if;
  insert into tera_private.files(id,lesson_id,name,type,size,path) values(fid,lid,p->>'name',p->>'type',(p->>'size')::bigint,p->>'path'); result:=jsonb_build_object('id',fid);
 elsif endpoint='files' and verb='DELETE' then
  fid:=(p->>'id')::uuid; select * into f from tera_private.files where id=fid;
  if f.id is null then raise exception 'File not found.'; end if;
  select * into l from tera_private.lessons where id=f.lesson_id;
  if l.published and trim(l.notes)='' and not exists(select 1 from tera_private.files where lesson_id=l.id and id<>fid) then raise exception 'Add lesson notes or unpublish the lesson before removing its last file.'; end if;
  delete from tera_private.files where id=fid; result:=jsonb_build_object('path',f.path);
 else raise exception 'Unknown academy operation.'; end if;
 insert into tera_private.audit(actor,action,target) values(uid,verb||':'||endpoint,coalesce(cid::text,lid::text,fid::text)); return result;
end;
$$;
revoke all on function public.tera_api(text,jsonb,text) from public,anon;
grant execute on function public.tera_api(text,jsonb,text) to authenticated;
commit;

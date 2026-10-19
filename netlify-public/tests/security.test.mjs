import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
const admin='00000000-0000-0000-0000-000000000001',alice='00000000-0000-0000-0000-000000000002',bob='00000000-0000-0000-0000-000000000003';
test('Supabase migration enforces academy and storage authorization in PostgreSQL',async t=>{
 const db=new PGlite();
 try{
 await db.exec(`create role anon;create role authenticated;create schema auth;create schema storage;
 create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb default '{}');
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 grant usage on schema auth,storage to authenticated,anon;
 create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
 create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text,metadata jsonb);
 alter table storage.objects enable row level security;
 grant select,insert,delete on storage.objects to authenticated;
 insert into auth.users values('${admin}','admin@example.test','{"name":"Henok"}'),('${alice}','alice@example.test','{"name":"Alice","role":"admin"}'),('${bob}','bob@example.test','{"name":"Bob"}');`);
 await db.exec(await readFile(new URL('../../supabase/migrations/202610190001_tera.sql',import.meta.url),'utf8'));
 await db.exec(`insert into tera_private.admins values('${admin}')`);
 const as=async id=>{await db.exec('reset role');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id||'']);await db.exec(id?'set role authenticated':'set role anon')};
 const api=async(endpoint,payload={},verb='GET')=>(await db.query('select public.tera_api($1,$2::jsonb,$3) as result',[endpoint,JSON.stringify(payload),verb])).rows[0].result;
 let course,lesson,group;
 const blank={title:'Fundamentals',description:'Start with coffee.',format:'online',level:'beginner',duration:'4 weeks',fee:'ETB 5,000',status:'draft'};
 await t.test('anonymous blocked, metadata cannot grant admin, private tables inaccessible',async()=>{
  await as(null);await assert.rejects(api('me'),/permission denied/);
  await as(alice);assert.equal((await api('me')).admin,false);
  await assert.rejects(api('courses',blank,'POST'),/Administrator/);
  await assert.rejects(api('courses',{admin:true}),/Administrator/);
  await assert.rejects(db.query('select * from tera_private.admins'),/permission denied/);
  await assert.rejects(db.query(`insert into storage.objects(bucket_id,name) values('tera-lessons','bad')`),/row-level security/);
 });
 await t.test('online beginner only, publishing requires a real lesson, drafts stay private',async()=>{
  await as(admin);await assert.rejects(api('courses',{...blank,level:'professional'},'POST'),/check constraint/);
  await assert.rejects(api('courses',{...blank,status:'published'},'POST'),/published lesson/);
  course=(await api('courses',blank,'POST')).id;
  await as(alice);assert.equal((await api('courses')).courses.length,0);
  await assert.rejects(api('learning',{courseId:course}),/approval/);
  await as(admin);await assert.rejects(api('lessons',{courseId:course,title:'First',notes:'',position:1,published:true},'POST'),/Add notes/);
  lesson=(await api('lessons',{courseId:course,title:'First',notes:'How to brew.',position:1,published:true},'POST')).id;
  await api('courses',{...blank,id:course,status:'published'},'POST');
  await assert.rejects(api('lessons',{id:lesson,courseId:course,title:'First',notes:'How to brew.',position:1,published:false},'POST'),/at least one/);
 });
 await t.test('application cannot self-approve; approval grants only the enrolled account access',async()=>{
  await as(alice);await api('profile',{name:'Alice',phone:'+251911123456'},'POST');
  await assert.rejects(api('apply',{courseId:course,consent:false},'POST'),/agree/);
  await api('apply',{courseId:course,consent:true,status:'approved'},'POST');
  assert.equal((await api('courses')).enrolments[0].status,'pending');
  await assert.rejects(api('learning',{courseId:course}),/approval/);
  await assert.rejects(api('enrolments',{userId:alice,courseId:course,status:'approved'},'POST'),/Administrator/);
  await as(admin);await api('enrolments',{userId:alice,courseId:course,status:'approved'},'POST');
  await as(alice);assert.equal((await api('learning',{courseId:course})).lessons.length,1);
  await api('progress',{lessonId:lesson,completed:true},'POST');
  assert.deepEqual((await api('learning',{courseId:course})).completed,[lesson]);
  await as(bob);await assert.rejects(api('learning',{courseId:course}),/approval/);await assert.rejects(api('progress',{lessonId:lesson,completed:true},'POST'),/access/);
 });
 await t.test('private WhatsApp hidden from catalogue and pending applicants',async()=>{
  await as(admin);await assert.rejects(api('courses',{...blank,format:'in-person',whatsapp:'https://evil.test/x'},'POST'),/check constraint/);
  group=(await api('courses',{...blank,format:'in-person',status:'published',whatsapp:'https://chat.whatsapp.com/TestGroup'},'POST')).id;
  await as(alice);assert.equal(Object.hasOwn((await api('courses')).courses.find(x=>x.id===group),'whatsapp'),false);
  await api('apply',{courseId:group,consent:true},'POST');await assert.rejects(api('learning',{courseId:group}),/approval/);
  await as(admin);await api('enrolments',{userId:alice,courseId:group,status:'approved'},'POST');
  await as(alice);assert.equal((await api('learning',{courseId:group})).course.whatsapp,'https://chat.whatsapp.com/TestGroup');
 });
 await t.test('storage policies follow enrolments; revocation denies future file and lesson requests',async()=>{
  const file='00000000-0000-0000-0000-000000000009',path=lesson+'/'+file;
  await as(admin);
  await db.query(`insert into storage.objects(bucket_id,name,metadata) values('tera-lessons',$1,'{"size":100,"mimetype":"application/pdf"}')`,[path]);
  await api('files',{id:file,lessonId:lesson,path,name:'Guide.pdf',type:'application/pdf',size:100},'POST');
  await as(alice);assert.equal((await db.query('select * from storage.objects')).rows.length,1);
  await assert.rejects(api('files',{id:file},'DELETE'),/Administrator/);
  await as(bob);assert.equal((await db.query('select * from storage.objects')).rows.length,0);
  await as(admin);await api('enrolments',{userId:alice,courseId:course,status:'revoked'},'POST');
  await as(alice);assert.equal((await db.query('select * from storage.objects')).rows.length,0);await assert.rejects(api('learning',{courseId:course}),/approval/);
  await assert.rejects(api('progress',{lessonId:lesson,completed:true},'POST'),/access/);
 });
 await t.test('archived courses deny class access even for previously approved students',async()=>{
  await as(admin);await api('courses',{...blank,id:group,format:'in-person',status:'archived'},'POST');
  await as(alice);await assert.rejects(api('learning',{courseId:group}),/approval/);
 });
 }finally{await db.close()}
});

// Platform injects identity headers after authentication. Never deploy this API
// behind a proxy that accepts these headers directly from an untrusted client.
const json=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const fail=(message,status=400)=>{throw Object.assign(new Error(message),{status})};
const id=()=>crypto.randomUUID();
function text(value,max=200,required=false){if(typeof value!=='string'||value.length>max||(required&&!value.trim()))fail('Please check the required fields and their length.');return value.trim();}
export function validateCourse(b){
 const v={title:text(b.title,120,true),description:text(b.description,4000,true),format:b.format,level:b.level,duration:text(b.duration,120,true),fee:text(b.fee,100,true),status:b.status,schedule:text(b.schedule||'',500),location:text(b.location||'',500),whatsapp:text(b.whatsapp||'',200)};
 if(!['online','in-person'].includes(v.format)||!['beginner','intermediate','professional'].includes(v.level)||!['draft','published','archived'].includes(v.status))fail('Choose a valid format, level and status.');
 if(v.format==='online'&&v.level!=='beginner')fail('Online courses are for beginners only.');
 if(v.whatsapp&&!/^https:\/\/chat\.whatsapp\.com\/[A-Za-z0-9]+$/.test(v.whatsapp))fail('Use a WhatsApp group invitation starting with https://chat.whatsapp.com/.');
 return v;
}
export function adminEmail(email,env){return (env.ADMIN_EMAILS||'').split(',').map(x=>x.trim().toLowerCase()).filter(Boolean).includes(email.toLowerCase());}
export async function handleAcademy(request,env){
 try{
 const url=new URL(request.url),path=url.pathname.replace(/^\/api\/academy\/?/,'').split('/').filter(Boolean),method=request.method;
 const userId=request.headers.get('oai-authenticated-user-id'),email=request.headers.get('oai-authenticated-user-email');
 if(!userId||!email)return json({error:'Please sign in to continue.'},401);
 const admin=adminEmail(email,env),db=env.DB;
 if(!db)return json({error:'The academy database is not available yet.'},503);
 if(!['GET','HEAD'].includes(method)){
  if(request.headers.get('Origin')!==url.origin)fail('This request must come from the academy website.',403);
  if(path[0]!=='upload'&&!request.headers.get('content-type')?.includes('application/json'))fail('Expected a JSON request.',415);
 }
 const one=(sql,...args)=>db.prepare(sql).bind(...args).first();
 const all=async(sql,...args)=>(await db.prepare(sql).bind(...args).all()).results;
 const run=(sql,...args)=>db.prepare(sql).bind(...args).run();
 const log=(action,target)=>db.prepare('INSERT INTO audit VALUES (?,?,?,?,?)').bind(id(),userId,action,target,Date.now());
 let display=email.split('@')[0];try{const n=request.headers.get('oai-authenticated-user-full-name');if(n)display=request.headers.get('oai-authenticated-user-full-name-encoding')==='percent-encoded-utf-8'?decodeURIComponent(n):n;}catch{}
 await run('INSERT INTO users(id,email,name,created) VALUES(?,?,?,?) ON CONFLICT(id) DO UPDATE SET email=excluded.email',userId,email,display.slice(0,120),Date.now());
 const requireAdmin=()=>{if(!admin)fail('Administrator access required.',403)};
 const course=async cid=>{const c=await one('SELECT * FROM courses WHERE id=?',cid);if(!c)fail('Course not found.',404);return c};
 const access=async lid=>{const l=await one('SELECT * FROM lessons WHERE id=?',lid);if(!l)fail('Lesson not found.',404);if(!admin){const e=await one("SELECT e.status FROM enrolments e JOIN courses c ON c.id=e.course_id WHERE e.user_id=? AND e.course_id=? AND e.status='approved' AND c.status='published'",userId,l.course_id);if(!e||!l.published)fail('This lesson requires an approved enrolment.',403);}return l};
 async function body(){if(+(request.headers.get('content-length')||0)>65536)fail('Request is too large.',413);const raw=await request.text();if(raw.length>65536)fail('Request is too large.',413);try{return JSON.parse(raw)}catch{fail('Invalid JSON.')}}
 if(path[0]==='me'&&method==='GET')return json({user:await one('SELECT * FROM users WHERE id=?',userId),admin});
 if(path[0]==='profile'&&method==='POST'){const b=await body();const name=text(b.name,120,true),phone=text(b.phone,30,true);if(!/^\+[0-9 ()-]{7,24}$/.test(phone))fail('Enter a WhatsApp number with country code.');await run('UPDATE users SET name=?,phone=? WHERE id=?',name,phone,userId);return json({ok:true});}
 if(path[0]==='courses'&&method==='GET'){
 const rows=admin&&url.searchParams.get('admin')==='1'?await all('SELECT * FROM courses ORDER BY created DESC'):await all("SELECT id,title,description,format,level,duration,fee,status,created FROM courses WHERE status='published' ORDER BY created DESC");
 const enrolments=await all('SELECT course_id,status FROM enrolments WHERE user_id=?',userId);
 return json({courses:rows,enrolments});
 }
 if(path[0]==='courses'&&method==='POST'){
 requireAdmin();const b=await body(),v=validateCourse(b),cid=b.id?text(b.id,80,true):id();
 if(b.id){const old=await course(cid);if(old.format!==v.format||old.level!==v.level){const count=await one('SELECT count(*) AS n FROM enrolments WHERE course_id=?',cid);if(count.n)fail('Format and level cannot change after students apply. Create a new course instead.');}}
 if(v.status==='published'&&v.format==='online'){const count=await one('SELECT count(*) AS n FROM lessons WHERE course_id=? AND published=1',cid);if(!count.n)fail('Add at least one published lesson before publishing an online course.');}
 await db.batch([db.prepare('INSERT INTO courses(id,title,description,format,level,duration,fee,status,schedule,location,whatsapp,created) VALUES(?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET title=excluded.title,description=excluded.description,format=excluded.format,level=excluded.level,duration=excluded.duration,fee=excluded.fee,status=excluded.status,schedule=excluded.schedule,location=excluded.location,whatsapp=excluded.whatsapp').bind(cid,v.title,v.description,v.format,v.level,v.duration,v.fee,v.status,v.schedule,v.location,v.whatsapp,Date.now()),log('course.save',cid)]);return json({id:cid});
 }
 if(path[0]==='apply'&&method==='POST'){
 const b=await body(),c=await course(text(b.courseId,80,true));if(c.status!=='published')fail('This course is not accepting applications.');const profile=await one('SELECT phone FROM users WHERE id=?',userId);if(!profile.phone)fail('Save your name and WhatsApp number first.');if(b.consent!==true)fail('Please agree to be contacted about your application.');
 await run("INSERT INTO enrolments(user_id,course_id,status,created) VALUES(?,?,'pending',?) ON CONFLICT(user_id,course_id) DO NOTHING",userId,c.id,Date.now());return json({ok:true});
 }
 if(path[0]==='enrolments'&&method==='GET'){requireAdmin();return json({enrolments:await all('SELECT e.*,u.name,u.email,u.phone,c.title,c.format,c.level FROM enrolments e JOIN users u ON u.id=e.user_id JOIN courses c ON c.id=e.course_id ORDER BY e.created DESC')});}
 if(path[0]==='enrolments'&&method==='POST'){requireAdmin();const b=await body();if(!['pending','approved','rejected','revoked'].includes(b.status))fail('Invalid status.');const uid=text(b.userId,120,true),cid=text(b.courseId,80,true);if(!await one('SELECT 1 FROM enrolments WHERE user_id=? AND course_id=?',uid,cid))fail('Application not found.',404);await db.batch([db.prepare('UPDATE enrolments SET status=? WHERE user_id=? AND course_id=?').bind(b.status,uid,cid),log('enrolment.'+b.status,uid+':'+cid)]);return json({ok:true});}
 if(path[0]==='learning'&&method==='GET'){
 const cid=text(url.searchParams.get('courseId'),80,true),c=await course(cid);
 const e=await one('SELECT status FROM enrolments WHERE user_id=? AND course_id=?',userId,cid);
 if(!admin&&(e?.status!=='approved'||c.status!=='published'))fail('Your enrolment needs approval before you can access this course.',403);
 const ls=await all('SELECT * FROM lessons WHERE course_id=?'+(admin?'':' AND published=1')+' ORDER BY position, id',cid);
 const fs=await all('SELECT f.id,f.lesson_id,f.name,f.type,f.size FROM files f JOIN lessons l ON l.id=f.lesson_id WHERE l.course_id=?'+(admin?'':' AND l.published=1'),cid);
 const done=await all('SELECT p.lesson_id FROM progress p JOIN lessons l ON l.id=p.lesson_id WHERE p.user_id=? AND l.course_id=?',userId,cid);
 return json({course:c,lessons:ls,files:fs,completed:done.map(x=>x.lesson_id)});
 }
 if(path[0]==='lessons'&&method==='POST'){
 requireAdmin();const b=await body(),cid=text(b.courseId,80,true);const c=await course(cid);if(c.format!=='online')fail('Lessons belong to online courses.');const lid=b.id?text(b.id,80,true):id();if(b.id){const old=await access(lid);if(old.course_id!==cid)fail('A lesson cannot be moved between courses.');}
 const title=text(b.title,160,true),notes=text(b.notes||'',30000),position=Number(b.position);if(!Number.isInteger(position)||position<1||position>1000)fail('Lesson order must be between 1 and 1000.');
 if(!notes&&b.published){const f=await one('SELECT count(*) AS n FROM files WHERE lesson_id=?',lid);if(!f.n)fail('Add notes or upload a file before publishing the lesson.');}
 if(!b.published&&c.status==='published'){const n=await one('SELECT count(*) AS n FROM lessons WHERE course_id=? AND published=1 AND id<>?',cid,lid);if(!n.n)fail('Keep one lesson published or change the course to draft first.');}
 await db.batch([db.prepare('INSERT INTO lessons(id,course_id,title,notes,position,published) VALUES(?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET title=excluded.title,notes=excluded.notes,position=excluded.position,published=excluded.published').bind(lid,cid,title,notes,position,b.published?1:0),log('lesson.save',lid)]);return json({id:lid});
 }
 if(path[0]==='progress'&&method==='POST'){const b=await body(),lid=text(b.lessonId,80,true);await access(lid);if(b.completed===true)await run('INSERT INTO progress VALUES(?,?,?) ON CONFLICT(user_id,lesson_id) DO NOTHING',userId,lid,Date.now());else await run('DELETE FROM progress WHERE user_id=? AND lesson_id=?',userId,lid);return json({ok:true});}
 if(path[0]==='upload'&&method==='POST'){
 requireAdmin();const lid=text(url.searchParams.get('lessonId'),80,true);await access(lid);if(!env.BUCKET)fail('File storage is unavailable.',503);
 const type=request.headers.get('content-type')?.split(';')[0];if(!['video/mp4','video/webm','application/pdf'].includes(type))fail('Upload an MP4, WebM or PDF file.');
 const declared=Number(request.headers.get('content-length'));if(declared>25*1024*1024)fail('Files must be 25 MB or smaller.',413);
 const reader=request.body?.getReader();if(!reader)fail('Choose a file.');const chunks=[];let size=0;while(true){const {value,done}=await reader.read();if(done)break;size+=value.byteLength;if(size>25*1024*1024){await reader.cancel();fail('Files must be 25 MB or smaller.',413);}chunks.push(value);}if(!size)fail('The file is empty.');
 const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
 const signature=new TextDecoder().decode(bytes.slice(0,12));if(type==='application/pdf'&&!signature.startsWith('%PDF-')||type==='video/mp4'&&signature.slice(4,8)!=='ftyp'||type==='video/webm'&&!(bytes[0]===0x1a&&bytes[1]===0x45&&bytes[2]===0xdf&&bytes[3]===0xa3))fail('The file content does not match its format.');
 const fid=id(),name=text(url.searchParams.get('name')||'Lesson file',180,true);await env.BUCKET.put(fid,bytes,{httpMetadata:{contentType:type}});
 try{await db.batch([db.prepare('INSERT INTO files VALUES(?,?,?,?,?,?)').bind(fid,lid,name,type,size,Date.now()),log('file.upload',fid)]);}catch(e){await env.BUCKET.delete(fid);throw e;}return json({id:fid});
 }
 if(path[0]==='files'&&path[1]&&method==='GET'){
 const f=await one('SELECT * FROM files WHERE id=?',path[1]);if(!f)fail('File not found.',404);await access(f.lesson_id);
 const object=await env.BUCKET.get(f.id,{range:request.headers});if(!object)fail('File not found.',404);
 const h=new Headers({'Content-Type':f.type,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Accept-Ranges':'bytes','Content-Disposition':`inline; filename*=UTF-8''${encodeURIComponent(f.name)}`});let status=200;
 if(object.range&&'offset' in object.range){const {offset,length}=object.range;h.set('Content-Range',`bytes ${offset}-${offset+length-1}/${object.size}`);h.set('Content-Length',String(length));status=206;}else h.set('Content-Length',String(object.size));return new Response(object.body,{status,headers:h});
 }
 if(path[0]==='files'&&path[1]&&method==='DELETE'){requireAdmin();const f=await one('SELECT * FROM files WHERE id=?',path[1]);if(!f)fail('File not found.',404);const l=await access(f.lesson_id);if(l.published&&!l.notes){const n=await one('SELECT count(*) AS n FROM files WHERE lesson_id=? AND id<>?',l.id,f.id);if(!n.n)fail('Add notes or another file before removing the last published lesson asset.');}await db.batch([db.prepare('DELETE FROM files WHERE id=?').bind(f.id),log('file.delete',f.id)]);await env.BUCKET.delete(f.id);return json({ok:true});}
 return json({error:'Not found.'},404);
 }catch(e){if(!e.status)console.error('Academy API failure',e.message);return json({error:e.status?e.message:'Something went wrong. Please try again.'},e.status||500);}
}

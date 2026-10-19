import {createClient} from '@supabase/supabase-js';
// Publishable key identifies this project; SQL permissions enforce access.
export const supabase=createClient(__SUPABASE_URL__,__SUPABASE_KEY__);
export async function api(path,data,method='POST') {
 const [endpoint,query]=path.split('?');
 const params=Object.fromEntries(new URLSearchParams(query));
 if(params.admin)params.admin=true;
 const isDelete=endpoint.startsWith('files/')&&method==='DELETE';
 const {data:result,error}=await supabase.rpc('tera_api',{
  endpoint:isDelete?'files':endpoint,
  payload:isDelete?{id:endpoint.slice(6)}:data??params,
  verb:data===undefined?'GET':method
 });
 if(error){
  if(error.code==='PGRST202')throw Error('The academy database is being prepared. Please try again after setup is complete.');
  throw Error(error.message||'Unable to complete this request.');
 }
 if(isDelete){
  const {error:removeError}=await supabase.storage.from('tera-lessons').remove([result.path]);
  if(removeError)throw Error('File access was removed, but storage cleanup failed. The administrator can remove the unused file in Supabase Storage.');
 }
 return result;
}
export async function uploadLesson(lessonId,file){
 if(!['video/mp4','video/webm','application/pdf'].includes(file.type))throw Error('Choose an MP4, WebM or PDF file.');
 if(file.size===0||file.size>25*1024*1024)throw Error('Files must be between 1 byte and 25 MB.');
 const bytes=new Uint8Array(await file.slice(0,16).arrayBuffer());
 const text=new TextDecoder().decode(bytes);
 if((file.type==='application/pdf'&&!text.startsWith('%PDF-'))||(file.type==='video/mp4'&&text.slice(4,8)!=='ftyp')||(file.type==='video/webm'&&![0x1a,0x45,0xdf,0xa3].every((v,i)=>bytes[i]===v)))throw Error('This file does not match its selected format.');
 const id=crypto.randomUUID(),path=lessonId+'/'+id;
 const {error}=await supabase.storage.from('tera-lessons').upload(path,file,{contentType:file.type,upsert:false});
 if(error)throw error;
 try{await api('files',{id,lessonId,path,name:file.name,type:file.type,size:file.size});}
 catch(error){await supabase.storage.from('tera-lessons').remove([path]);throw error;}
}

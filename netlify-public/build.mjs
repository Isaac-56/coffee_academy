import {cp,mkdir,readFile,writeFile,rm} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {build,transform} from 'esbuild';
const here=path.dirname(fileURLToPath(import.meta.url)),root=path.resolve(here,'..'),out=path.join(here,'site');
await rm(out,{recursive:true,force:true});await mkdir(out,{recursive:true});
await cp(path.join(root,'public'),out,{recursive:true});
let html=await readFile(path.join(root,'legacy/home.html'),'utf8');
html=html.replace('<a href="/admin">Instructor workspace ↗</a>','');
await writeFile(path.join(out,'index.html'),html);
// Reuse the approved portal UI. Keep the Sites backend source independently usable.
let portal=await readFile(path.join(root,'app/portal.tsx'),'utf8');
function replaceOnce(from,to){if(!portal.includes(from))throw Error('Portal adapter needs review: '+from.slice(0,80));portal=portal.replace(from,to);}
portal=portal.replace(/async function api\(path:string[\s\S]*?return result;\}/,'');
portal="import React from 'react';\nimport {api,uploadLesson} from './supabase.js';\nimport {LessonVideo,LessonLink,SignOut} from './materials.jsx';\n"+portal;
replaceOnce('<a className="primary" href="/signin-with-chatgpt?return_to=%2Fstudent" target="_top">Sign in with ChatGPT</a>','<button className="primary" onClick={()=>location.reload()}>Try again</button><SignOut/>');
replaceOnce('<a href="/signout-with-chatgpt?return_to=%2F" target="_top">Sign out</a>','<SignOut/>');
replaceOnce('Henok’s administrator account must be configured by the site owner.','Only an account explicitly approved by the site owner can manage the academy.');
replaceOnce('<a className="primary" href="/student">Open student portal</a>','<a className="primary" href="/student">Open student portal</a><SignOut/>');
replaceOnce('<video controls playsInline preload="metadata" src={\'/api/academy/files/\'+f.id}><a href={\'/api/academy/files/\'+f.id}>Open video</a></video>','<LessonVideo file={f}/>');
replaceOnce('<a href={\'/api/academy/files/\'+f.id} target="_blank" rel="noopener noreferrer">{f.type===\'application/pdf\'?\'▤\':\'▷\'} {f.name} ↗<small>{(f.size/1024/1024).toFixed(1)} MB</small></a>','<LessonLink file={f}/>');
const start="const response=await fetch('/api/academy/upload?lessonId='";
const end='if(!response.ok)throw Error(r.error);';
const i=portal.indexOf(start),j=portal.indexOf(end,i);if(i<0||j<0)throw Error('Upload adapter needs review');
portal=portal.slice(0,i)+'await uploadLesson(selected,file);'+portal.slice(j+end.length);
// Status refresh means an approved in-person student sees their invitation without signing in again.
replaceOnce('async function action(fn:',`useEffect(()=>{const refresh=()=>{if(document.visibilityState==='visible')reload().catch(e=>setError(e.message));};const timer=setInterval(refresh,30000);window.addEventListener('focus',refresh);return()=>{clearInterval(timer);window.removeEventListener('focus',refresh)}},[]);
 async function action(fn:`);
if(portal.includes('/api/academy/')||portal.includes('signin-with-chatgpt'))throw Error('Unmigrated backend reference');
await writeFile(path.join(here,'src/portal.generated.jsx'),(await transform(portal,{loader:'tsx',jsx:'automatic'})).code);
const url=process.env.NEXT_PUBLIC_SUPABASE_URL||'https://cqaptnyfgkiwrhcabzkl.supabase.co';
const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||'sb_publishable_87tvAPaSccQW1XZaE93lJA_Ugw1_JDm';
if(!/^https:\/\/[a-z0-9]+\.supabase\.co$/.test(url)||!key.startsWith('sb_publishable_'))throw Error('Use a Supabase project URL and publishable key only.');
await build({entryPoints:[path.join(here,'src/entry.jsx')],bundle:true,minify:true,sourcemap:false,outfile:path.join(out,'portal.js'),jsx:'automatic',define:{__SUPABASE_URL__:JSON.stringify(url),__SUPABASE_KEY__:JSON.stringify(key),'process.env.NODE_ENV':'"production"'},nodePaths:[path.join(here,'node_modules')],loader:{'.woff2':'file'}});
await cp(path.join(root,'app/globals.css'),path.join(out,'portal-base.css'));
for(const mode of ['student','admin']){
 await mkdir(path.join(out,mode),{recursive:true});
 await writeFile(path.join(out,mode,'index.html'),`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>TERA — ${mode==='admin'?'Academy management':'Student portal'}</title><link rel="stylesheet" href="/portal-base.css"><link rel="stylesheet" href="/portal.css"></head><body><div id="root"></div><noscript>Please enable JavaScript to use the academy portal.</noscript><script type="module" src="/portal.js"></script></body></html>`);
}
await writeFile(path.join(out,'_headers'),'/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  X-Frame-Options: DENY\n/student*\n  Cache-Control: no-store\n/admin*\n  Cache-Control: no-store\n/portal.js\n  Cache-Control: public, max-age=0, must-revalidate\n/portal.css\n  Cache-Control: public, max-age=0, must-revalidate\n');
await writeFile(path.join(out,'_redirects'),'/student /student/index.html 200\n/admin /admin/index.html 200\n');
console.log('Homepage and Supabase portals built in netlify-public/site. Apply the SQL migration before inviting students.');

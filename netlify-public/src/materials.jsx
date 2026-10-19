import React,{useState,useEffect} from 'react';
import {supabase} from './supabase.js';
async function sign(file){const {data,error}=await supabase.storage.from('tera-lessons').createSignedUrl(file.path,300);if(error)throw error;return data.signedUrl;}
export function LessonVideo({file}){
 const [url,setUrl]=useState(''),[error,setError]=useState(''),[attempt,setAttempt]=useState(0);
 useEffect(()=>{let live=true;setError('');setUrl('');sign(file).then(u=>{if(live)setUrl(u)}).catch(e=>{if(live)setError(e.message)});return()=>{live=false}},[file.path,attempt]);
 return error?<div className="media-status" role="alert"><p>{error}</p><button className="outline" onClick={()=>setAttempt(n=>n+1)}>Reload video</button></div>:url?<video controls playsInline preload="metadata" src={url} onError={()=>setError('The video link may have expired. Reload to check access and continue.')}/>:<p role="status">Loading your video…</p>;
}
export function LessonLink({file}){
 const [error,setError]=useState(''),[busy,setBusy]=useState(false);
 async function open(){const tab=window.open('about:blank','_blank');if(tab)tab.opener=null;setBusy(true);setError('');try{const url=await sign(file);if(tab)tab.location.replace(url);else throw Error('Allow pop-ups to open this material.');}catch(e){tab?.close();setError(e.message)}finally{setBusy(false)}}
 return <div><button className="outline" disabled={busy} onClick={open}>{busy?'Opening…':`${file.type==='application/pdf'?'▤':'▷'} ${file.name} ↗`}<small>{(file.size/1024/1024).toFixed(1)} MB</small></button>{error&&<p role="alert">{error}</p>}</div>;
}
export function SignOut(){const [error,setError]=useState('');return <><button onClick={async()=>{const {error}=await supabase.auth.signOut();if(error)setError(error.message);else location.assign('/')}}>Sign out</button>{error&&<small role="alert">{error}</small>}</>}

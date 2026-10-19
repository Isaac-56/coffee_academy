import React,{useState,useEffect} from 'react';
import {createRoot} from 'react-dom/client';
import Portal from './portal.generated.jsx';
import {supabase} from './supabase.js';
import './auth.css';
const mode=location.pathname.startsWith('/admin')?'admin':'student';
const redirect=()=>location.origin+'/'+mode;
function App(){
 const [session,setSession]=useState(null),[ready,setReady]=useState(false),[screen,setScreen]=useState(location.hash.includes('type=recovery')?'update':'login'),[error,setError]=useState(''),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false);
 useEffect(()=>{
  let live=true;
  const hash=new URLSearchParams(location.hash.slice(1));
  if(hash.get('error_description'))setError(hash.get('error_description'));
  supabase.auth.getSession().then(({data,error})=>{if(live){setSession(data.session);setReady(true);if(error)setError(error.message);}}).catch(()=>{if(live){setError('Could not connect. Check your connection and try again.');setReady(true);}});
  const {data:{subscription}}=supabase.auth.onAuthStateChange((event,s)=>{if(!live)return;setSession(s);setReady(true);if(event==='PASSWORD_RECOVERY')setScreen('update');if(event==='SIGNED_OUT')setScreen('login');});
  return()=>{live=false;subscription.unsubscribe()};
 },[]);
 async function submit(event){
  event.preventDefault();setError('');setNotice('');setBusy(true);
  const fields=new FormData(event.currentTarget),email=String(fields.get('email')||'').trim(),password=String(fields.get('password')||'');
  try{
   let result;
   if(screen==='signup'){
    result=await supabase.auth.signUp({email,password,options:{emailRedirectTo:redirect(),data:{name:String(fields.get('name')).trim()}}});
    if(!result.error&&!result.data.session)setNotice('Check your email for the confirmation link, then return here to sign in.');
   }else if(screen==='reset'){
    result=await supabase.auth.resetPasswordForEmail(email,{redirectTo:redirect()});
    if(!result.error)setNotice('If an account exists for this address, you will receive a password-reset email.');
   }else if(screen==='update'){
    if(password!==fields.get('confirm'))throw Error('The two passwords must match.');
    result=await supabase.auth.updateUser({password});
    if(!result.error){setScreen('login');setNotice('Password updated.');}
   }else result=await supabase.auth.signInWithPassword({email,password});
   if(result.error)throw result.error;
  }catch(e){setError(e.message||'Unable to continue. Please try again.');}finally{setBusy(false)}
 }
 if(!ready)return <div className="loading"><span className="brand-letter">T</span><p>Opening your academy…</p></div>;
 if(session&&screen!=='update')return <Portal key={session.user.id} mode={mode}/>;
 return <main className="auth-shell"><section className="auth-story"><a href="/" className="portal-brand">TERA<span>COFFEE ACADEMY</span></a><div><p className="eyebrow">{mode==='admin'?'THE INSTRUCTOR’S DESK':'YOUR NEXT CHAPTER'}</p><h1>Learn with intention.<br/><em>Create with confidence.</em></h1><p>A considered space for the art and craft of coffee.</p></div><a href="/">← Back to the academy</a></section><section className="auth-form"><p className="eyebrow">{mode==='admin'?'ACADEMY MANAGEMENT':'THE STUDENT PORTAL'}</p><h2>{screen==='signup'?'Begin your journey.':screen==='reset'?'A fresh start.':screen==='update'?'Choose a new password.':'Welcome back.'}</h2><p>{screen==='signup'?'Create your account to explore courses and apply.':screen==='reset'?'Enter the email address associated with your account.':screen==='update'?'Use at least 12 characters.':'Sign in to continue.'}</p>{error&&<p className="alert error" role="alert">{error}</p>}{notice&&<p className="alert success" role="status">{notice}</p>}<form onSubmit={submit}>{screen==='signup'&&<label>Full name<input name="name" required maxLength={120} autoComplete="name"/></label>}{screen!=='update'&&<label>Email address<input name="email" type="email" required autoComplete="email"/></label>}{screen!=='reset'&&<label>Password<input name="password" type="password" required minLength={screen==='login'?1:12} maxLength={128} autoComplete={screen==='login'?'current-password':'new-password'}/></label>}{screen==='update'&&<label>Confirm password<input name="confirm" type="password" required minLength={12} autoComplete="new-password"/></label>}<button className="primary full" disabled={busy}>{busy?'Please wait…':screen==='signup'?'Create account →':screen==='reset'?'Send reset link →':screen==='update'?'Save password →':'Sign in →'}</button></form><div className="auth-options">{screen==='login'?<><button onClick={()=>{setScreen('reset');setError('');setNotice('')}}>Forgot password?</button>{mode==='student'&&<button onClick={()=>{setScreen('signup');setError('');setNotice('')}}>New here? Create an account</button>}</>:<button onClick={()=>{setScreen('login');setError('');setNotice('')}}>Back to sign in</button>}</div>{mode==='admin'&&<p className="hint">Access is restricted to the academy’s approved administrator.</p>}</section></main>;
}
createRoot(document.getElementById('root')).render(<App/>);

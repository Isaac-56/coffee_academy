import {env} from 'cloudflare:workers';
import {requireChatGPTUser} from '../chatgpt-auth';
import {adminEmail} from '../../server/academy.mjs';
import Portal from '../portal';
export const dynamic='force-dynamic';
export default async function Admin(){
 const user=await requireChatGPTUser('/admin');
 if(!adminEmail(user.email,env))return <main className="access"><h1>Administrator access required.</h1><p>Your account does not have permission to access this area.</p><a className="primary" href="/student">Return to student portal</a></main>;
 return <Portal mode="admin"/>;
}

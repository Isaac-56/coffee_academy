import {env} from 'cloudflare:workers';
import {handleAcademy} from '../../../../server/academy.mjs';
export const dynamic='force-dynamic';
export const GET=(request:Request)=>handleAcademy(request,env);
export const POST=GET;
export const DELETE=GET;

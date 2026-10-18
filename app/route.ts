import home from '../legacy/home.html?raw';
export function GET(){return new Response(home,{headers:{'Content-Type':'text/html; charset=utf-8'}})}

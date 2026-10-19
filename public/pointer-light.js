// A softly frosted lens follows the native pointer without obscuring controls.
export function pointerLight(initialPaused=false){
 if(!matchMedia('(hover:hover) and (pointer:fine)').matches)return null;
 const lens=document.createElement('div');lens.className='glass-cursor';lens.setAttribute('aria-hidden','true');document.body.append(lens);
 let paused=initialPaused,frame=0,x=0,y=0,targetX=0,targetY=0,seen=false;
 function draw(){frame=0;if(paused||!seen||document.hidden)return;x+=(targetX-x)*.22;y+=(targetY-y)*.22;lens.style.transform=`translate3d(${x}px,${y}px,0) translate(-50%,-50%)`;if(Math.abs(targetX-x)+Math.abs(targetY-y)>.15)frame=requestAnimationFrame(draw);}
 function hide(){seen=false;lens.classList.remove('visible');cancelAnimationFrame(frame);frame=0;}
 document.addEventListener('pointermove',e=>{if(paused||e.pointerType==='touch')return;targetX=e.clientX;targetY=e.clientY;if(!seen){x=targetX;y=targetY;seen=true;}lens.classList.add('visible');lens.classList.toggle('interactive',!!e.target.closest('a,button'));if(!frame)frame=requestAnimationFrame(draw);},{passive:true});
 document.documentElement.addEventListener('pointerleave',hide);window.addEventListener('blur',hide);document.addEventListener('visibilitychange',()=>{if(document.hidden)hide()});
 return {setPaused(value){paused=value;if(value)hide()}};
}

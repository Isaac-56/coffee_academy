// A short amber light stroke follows movement, then dissipates. Native cursor stays visible.
export function pointerLight(initialPaused=false){
 if(!matchMedia('(hover:hover) and (pointer:fine)').matches)return null;
 const canvas=document.createElement('canvas');canvas.className='pointer-light';canvas.setAttribute('aria-hidden','true');document.body.append(canvas);
 const ctx=canvas.getContext('2d');if(!ctx){canvas.remove();return null;}
 let paused=initialPaused,frame=0,points=[],hover=false;
 function resize(){const ratio=Math.min(devicePixelRatio||1,1.5);canvas.width=innerWidth*ratio;canvas.height=innerHeight*ratio;ctx.setTransform(ratio,0,0,ratio,0,0);points=[];}
 function clear(){points=[];cancelAnimationFrame(frame);frame=0;ctx.clearRect(0,0,innerWidth,innerHeight);}
 function draw(now){frame=0;ctx.clearRect(0,0,innerWidth,innerHeight);points=points.filter(p=>now-p.t<360);if(paused||document.hidden)return;
  for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],life=Math.max(0,1-(now-b.t)/360);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.lineCap='round';ctx.lineWidth=hover?2.4:1.4;ctx.strokeStyle=`rgba(222,183,116,${life*.48})`;ctx.shadowColor='rgba(201,166,107,.65)';ctx.shadowBlur=hover?15:9;ctx.stroke();}
  ctx.shadowBlur=0;if(points.length)frame=requestAnimationFrame(draw);
 }
 document.addEventListener('pointermove',e=>{if(paused||e.pointerType==='touch')return;hover=!!e.target.closest('a,button');const last=points.at(-1);if(last&&Math.hypot(e.clientX-last.x,e.clientY-last.y)>180)points=[];points.push({x:e.clientX,y:e.clientY,t:performance.now()});if(points.length>28)points.shift();if(!frame)frame=requestAnimationFrame(draw);},{passive:true});
 document.documentElement.addEventListener('pointerleave',clear);window.addEventListener('blur',clear);window.addEventListener('resize',resize,{passive:true});document.addEventListener('visibilitychange',()=>{if(document.hidden)clear()});resize();
 return {setPaused(value){paused=value;if(value)clear()}};
}

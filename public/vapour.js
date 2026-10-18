// A small transparent fluid-noise overlay; no model or 3D library download.
export function startVapour(host,initialPaused=false){
 const canvas=document.createElement('canvas');canvas.setAttribute('aria-hidden','true');
 const gl=canvas.getContext('webgl',{alpha:true,premultipliedAlpha:false,antialias:false,powerPreference:'low-power'});
 if(!gl)return null;
 const vertex='attribute vec2 a;varying vec2 uv;void main(){uv=a*.5+.5;gl_Position=vec4(a,0.,1.);}';
 const fragment=`precision mediump float;varying vec2 uv;uniform float time;
 float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
 float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<4;i++){v+=a*noise(p);p=p*2.02+vec2(9.2,4.7);a*=.5;}return v;}
 void main(){float y=uv.y,t=time;vec2 flow=vec2(uv.x*5.,y*4.-t*.32);
 float warp=fbm(flow+vec2(0.,t*.08));
 float curl=fbm(flow*1.8+vec2(warp*2.,-t*.12));
 float bend=(warp-.5)*(.12+y*.55)+sin(y*8.-t*.65)*y*.06;
 float x=uv.x-bend;
 float width=.055+y*.14;
 float a=exp(-pow((x-.32)/width,2.));
 float b=exp(-pow((x-.53-sin(y*9.-t*.4)*.04)/(width*.8),2.));
 float c=exp(-pow((x-.69)/(.04+y*.1),2.));
 float detail=smoothstep(.24,.72,curl)*.75+smoothstep(.38,.76,warp)*.4;
 float fade=smoothstep(0.,.075,y)*(1.-smoothstep(.48,.98,y));
 float alpha=clamp((a*.64+b*.67+c*.40)*detail*fade,0.,.60);
 gl_FragColor=vec4(.94,.92,.88,alpha);}`;
 const shaders=[];let program;
 try{for(const [type,source] of [[gl.VERTEX_SHADER,vertex],[gl.FRAGMENT_SHADER,fragment]]){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error('shader');shaders.push(s);}program=gl.createProgram();shaders.forEach(s=>gl.attachShader(program,s));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('link');}catch{shaders.forEach(s=>gl.deleteShader(s));return null;}
 gl.useProgram(program);const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
 const location=gl.getAttribLocation(program,'a');gl.enableVertexAttribArray(location);gl.vertexAttribPointer(location,2,gl.FLOAT,false,0,0);const clock=gl.getUniformLocation(program,'time');
 canvas.width=300;canvas.height=420;gl.viewport(0,0,300,420);host.append(canvas);host.classList.add('fluid-ready');
 let paused=initialPaused,visible=true,frame=0,last=0,elapsed=12,dead=false;
 function draw(){gl.uniform1f(clock,elapsed);gl.drawArrays(gl.TRIANGLES,0,6);}
 function tick(now){frame=0;if(dead||paused||!visible||document.hidden)return;if(now-last>=40){elapsed+=Math.min((now-last)/1000,.08);last=now;draw();}frame=requestAnimationFrame(tick);}
 function wake(){if(!frame&&!dead&&!paused&&visible&&!document.hidden){last=performance.now();frame=requestAnimationFrame(tick);}}
 const observer=new IntersectionObserver(es=>{visible=es[0].isIntersecting;if(visible)wake();else{cancelAnimationFrame(frame);frame=0;}});observer.observe(host);
 document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;}else wake();});
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();dead=true;cancelAnimationFrame(frame);observer.disconnect();host.classList.remove('fluid-ready');canvas.remove();});
 draw();wake();return {setPaused(value){paused=value;if(paused){cancelAnimationFrame(frame);frame=0;}else wake();}};
}

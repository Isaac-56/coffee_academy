import * as THREE from 'three';

// Procedural meshes keep the experience editable and avoid a large model download.
// A production art pass can replace these groups with compressed GLB assets.
const cream = new THREE.MeshPhysicalMaterial({color:0xf3e9dc, roughness:.22, metalness:.08, clearcoat:.85, clearcoatRoughness:.18, side:THREE.DoubleSide});
const gold = new THREE.MeshStandardMaterial({color:0xc9a66b, roughness:.24, metalness:.75});
function mesh(geometry, material, parent, position=[0,0,0]) {const m=new THREE.Mesh(geometry,material);m.position.set(...position);parent.add(m);return m;}
function ring(radius,tube,material,parent,y){const m=mesh(new THREE.TorusGeometry(radius,tube,10,80),material,parent,[0,y,0]);m.rotation.x=Math.PI/2;return m;}
function coffeeTexture(){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=512;const c=canvas.getContext('2d');
 c.fillStyle='#663a1c';c.fillRect(0,0,512,512);const g=c.createRadialGradient(256,256,0,256,256,255);g.addColorStop(0,'#a56e39');g.addColorStop(.7,'#9a5e29');g.addColorStop(.94,'#d7a361');g.addColorStop(1,'#5d2d12');c.fillStyle=g;c.fillRect(0,0,512,512);
 // Deliberately restrained rosetta pattern, drawn as curved milk ribbons.
 c.save();c.translate(256,265);c.rotate(-.22);c.strokeStyle='#f5e4c7';c.lineCap='round';
 for(let i=0;i<10;i++){const y=-90+i*19;const w=16+i*7;c.lineWidth=10+i*.5;c.beginPath();c.moveTo(0,y+27);c.bezierCurveTo(-w*1.5,y+12,-w,y-12,0,y+7);c.bezierCurveTo(w,y-12,w*1.5,y+12,0,y+27);c.stroke();}
 c.lineWidth=7;c.beginPath();c.moveTo(0,-105);c.quadraticCurveTo(-8,0,8,135);c.stroke();c.restore();
 const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;return t;
}
function cup(){const group=new THREE.Group();
 const points=[[.04,0],[.35,0],[.51,.07],[.66,.22],[.84,.48],[.96,.83],[1,.96],[.94,.97],[.89,.80],[.79,.48],[.60,.23],[.40,.15],[.04,.15]].map(p=>new THREE.Vector2(...p));
 mesh(new THREE.LatheGeometry(points,80),cream,group);ring(.974,.022,gold,group,.965);
 const handle=mesh(new THREE.TorusGeometry(.38,.105,14,50,Math.PI*1.65),cream,group,[1.06,.56,0]);handle.rotation.z=-Math.PI*.82;handle.scale.x=.82;
 const saucerPoints=[[0,-.10],[.55,-.10],[.9,-.08],[1.35,.01],[1.49,.08],[1.5,.10],[1.36,.12],[.90,.02],[.5,-.02],[0,-.02]].map(p=>new THREE.Vector2(...p));
 mesh(new THREE.LatheGeometry(saucerPoints,80),cream,group,[0,-.12,0]);ring(1.47,.012,gold,group,-.015);
 const coffee=mesh(new THREE.CircleGeometry(.927,80),new THREE.MeshStandardMaterial({map:coffeeTexture(),roughness:.32,metalness:.03}),group,[0,.90,0]);coffee.rotation.x=-Math.PI/2;
 const foot=mesh(new THREE.CylinderGeometry(.40,.43,.09,48),cream,group,[0,-.04,0]);
 return group;
}
function bean(color=0x693e22){const g=new THREE.Group();const mat=new THREE.MeshStandardMaterial({color,roughness:.52,metalness:.04});const b=mesh(new THREE.SphereGeometry(1,30,20),mat,g);b.scale.set(.62,.90,.42);
 const pts=[];for(let i=0;i<=20;i++){const y=-.78+i*.078;pts.push(new THREE.Vector3(Math.sin(y*3)*.075,y,Math.sqrt(Math.max(0,1-(y/.93)**2))*.415));}
 mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),30,.035,7,false),new THREE.MeshStandardMaterial({color:0x180c05,roughness:1}),g);return g;
}
function steamTexture(){const c=document.createElement('canvas');c.width=c.height=64;const ctx=c.getContext('2d');const g=ctx.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'rgba(240,223,197,.35)');g.addColorStop(.5,'rgba(240,223,197,.10)');g.addColorStop(1,'rgba(240,223,197,0)');ctx.fillStyle=g;ctx.fillRect(0,0,64,64);return new THREE.CanvasTexture(c);}
export function createScene(canvas,kind,{onReady,onFailure,paused=false}={}) {
 let renderer;
 try{renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:window.devicePixelRatio<2,powerPreference:'low-power'});}catch(e){onFailure?.();return null;}
 renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.65));renderer.setClearColor(0x000000,0);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;
 const scene=new THREE.Scene(), camera=new THREE.PerspectiveCamera(36,1,.1,50);camera.position.set(0,2.8,7.8);camera.lookAt(0,.4,0);
 scene.add(new THREE.HemisphereLight(0xffe8ca,0x362015,2.1));const key=new THREE.DirectionalLight(0xffead2,4.5);key.position.set(-3,6,4);scene.add(key);const rim=new THREE.DirectionalLight(0xc9a66b,3);rim.position.set(4,2,-2);scene.add(rim);const fill=new THREE.DirectionalLight(0xffffff,1);fill.position.set(1,0,4);scene.add(fill);
 const root=new THREE.Group();scene.add(root);let stage=0, targetX=0,targetY=0,angle=0,manualAngle=0,dragging=false,startX=0,visible=true,disposed=false,frame=0,last=0,elapsed=0;
 let cupGroup,beans=[],steam=[],stageGroups=[];
 if(kind==='hero'){
  cupGroup=cup();cupGroup.rotation.y=-.4;cupGroup.rotation.z=-.06;root.add(cupGroup);root.position.set(0,-.2,0);
  [[-1.65,1.8,.15,.18],[1.6,1.7,-.7,.2],[-1.7,.1,.8,.14],[.8,2.5,-1,.12],[2,.5,.1,.15]].forEach((p,i)=>{const b=bean();b.position.set(p[0],p[1],p[2]);b.scale.setScalar(p[3]);b.rotation.set(i*.5,i, i+.5);b.userData.base=b.position.clone();root.add(b);beans.push(b);});
  const texture=steamTexture();for(let i=0;i<12;i++){const m=new THREE.SpriteMaterial({map:texture,transparent:true,opacity:.16,depthWrite:false});const s=new THREE.Sprite(m);s.userData.phase=i/12;s.scale.set(.5,.75,1);root.add(s);steam.push(s);}
 } else {
  const green=bean(0x8b8451);green.rotation.z=.4;green.scale.setScalar(1.3);stageGroups.push(green);
  const roasted=bean(0x693b20);roasted.rotation.z=.4;roasted.scale.setScalar(1.3);stageGroups.push(roasted);
  const grounds=new THREE.Group();const geo=new THREE.IcosahedronGeometry(.055,0), mat=new THREE.MeshStandardMaterial({color:0x734623,roughness:.95});
  const instances=new THREE.InstancedMesh(geo,mat,260),dummy=new THREE.Object3D();
  for(let i=0;i<260;i++){const theta=i*2.39996,r=Math.sqrt(i/260)*1.2;dummy.position.set(Math.cos(theta)*r,(1-r/1.3)*.6-.4,Math.sin(theta)*r);dummy.rotation.set(i,i*.7,i*.3);dummy.scale.setScalar(.65+(i%7)/8);dummy.updateMatrix();instances.setMatrixAt(i,dummy.matrix);}grounds.add(instances);stageGroups.push(grounds);
  const brew=new THREE.Group();const dripper=mesh(new THREE.CylinderGeometry(.86,.15,1.15,48,1,true),cream,brew,[0,.55,0]);ring(.87,.025,gold,brew,1.13);const small=cup();small.scale.setScalar(.6);small.position.y=-.9;brew.add(small);mesh(new THREE.CylinderGeometry(.018,.018,.45,8),new THREE.MeshStandardMaterial({color:0x80421d}),brew,[0,-.20,0]);stageGroups.push(brew);
  const final=cup();final.position.y=-.4;final.scale.setScalar(.9);stageGroups.push(final);
  stageGroups.forEach((g,i)=>{g.visible=i===0;root.add(g);});camera.position.set(0,1.8,7.3);camera.lookAt(0,.1,0);
 }
 // A sparse field is rendered in one draw call.
 const dustPositions=new Float32Array(35*3);for(let i=0;i<35;i++){dustPositions[i*3]=Math.sin(i*18.3)*3.5;dustPositions[i*3+1]=Math.cos(i*7.2)*2.6+1;dustPositions[i*3+2]=Math.sin(i*3.1)*2-1;}
 const dustGeo=new THREE.BufferGeometry();dustGeo.setAttribute('position',new THREE.BufferAttribute(dustPositions,3));const dust=new THREE.Points(dustGeo,new THREE.PointsMaterial({color:0xc9a66b,size:.015,transparent:true,opacity:.38,depthWrite:false}));scene.add(dust);
 function draw(){if(disposed)return;try{renderer.render(scene,camera);}catch(e){onFailure?.();dispose();}}
 function resize(){const r=canvas.getBoundingClientRect();if(!r.width||!r.height)return;renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();draw();}
 const ro=new ResizeObserver(resize);ro.observe(canvas);
 function tick(now){frame=0;if(disposed||paused||!visible||document.hidden)return;const dt=Math.min((now-last)/1000,.04)||0;last=now;elapsed+=dt;angle+=dt*.08;root.rotation.y+=(targetX*.16+manualAngle-root.rotation.y)*.035;root.rotation.x+=(targetY*.055-root.rotation.x)*.03;
 if(kind==='hero') {cupGroup.rotation.y=-.4+Math.sin(elapsed*.25)*.08;cupGroup.position.y=Math.sin(elapsed*.5)*.025;beans.forEach((b,i)=>{b.position.y=b.userData.base.y+Math.sin(elapsed*.6+i)*.09;b.rotation.y+=dt*.16;});steam.forEach((s,i)=>{const phase=(elapsed*.12+s.userData.phase)%1;s.position.set(Math.sin(phase*5+i)*.22,1+phase*1.9,Math.cos(i)*.18);s.scale.set(.3+phase*.8,.5+phase*.7,1);s.material.opacity=Math.sin(phase*Math.PI)*.12;});}
 else{stageGroups[stage].rotation.y=Math.sin(elapsed*.25)*.13;camera.position.z+=(7.3-stage*.14-camera.position.z)*.03;}
 dust.rotation.y=angle*.1;draw();frame=requestAnimationFrame(tick);
 }
 function wake(){if(!frame&&!paused&&visible&&!document.hidden&&!disposed){last=performance.now();frame=requestAnimationFrame(tick);}else draw();}
 const io=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)wake();else{cancelAnimationFrame(frame);frame=0;}},{rootMargin:'100px'});io.observe(canvas);
 const onVisibility=()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;}else wake();};document.addEventListener('visibilitychange',onVisibility);
 function move(e){const rect=canvas.getBoundingClientRect();targetX=(e.clientX-rect.left)/rect.width-.5;targetY=(e.clientY-rect.top)/rect.height-.5;if(dragging&&kind==='craft'){manualAngle+=(e.clientX-startX)*.009;startX=e.clientX;if(paused){root.rotation.y=manualAngle;draw();}}}
 function down(e){if(kind!=='craft')return;dragging=true;startX=e.clientX;canvas.setPointerCapture(e.pointerId);}
 function up(){dragging=false;}canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',up);
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();onFailure?.();dispose();},{once:true});
 function dispose(){if(disposed)return;disposed=true;cancelAnimationFrame(frame);ro.disconnect();io.disconnect();document.removeEventListener('visibilitychange',onVisibility);canvas.removeEventListener('pointermove',move);canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointerup',up);canvas.removeEventListener('pointercancel',up);scene.traverse(o=>{o.geometry?.dispose();if(o.material&&!['MeshPhysicalMaterial'].includes(o.material.type)){o.material.map?.dispose();o.material.dispose();}});renderer.dispose();}
 resize();draw();onReady?.();wake();return {setPaused(value){paused=value;if(paused){cancelAnimationFrame(frame);frame=0;draw();}else wake();},setStage(value){stage=value;stageGroups.forEach((g,i)=>g.visible=i===value);draw();wake();},rotate(value){manualAngle+=value;root.rotation.y=manualAngle;draw();},dispose};
}

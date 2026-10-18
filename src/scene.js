import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {createCup,createBean,createDripper,addMesh} from './coffee-models.js';
import {makeMaterials,contactShadow} from './materials.js';
import {createSteam} from './steam.js';

export function createScene(canvas,kind,{onReady,onFailure,paused=false}={}){
 let renderer;
 try{renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'low-power'});}catch{onFailure?.();return null;}
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.8));renderer.setClearColor(0x000000,0);
 renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(35,1,.1,40),root=new THREE.Group();scene.add(root);
 // Image-based studio reflections give glazed porcelain a readable curved surface.
 const room=new RoomEnvironment();const pmrem=new THREE.PMREMGenerator(renderer);const environment=pmrem.fromScene(room,.055);scene.environment=environment.texture;scene.environmentIntensity=.65;room.dispose();pmrem.dispose();
 scene.add(new THREE.HemisphereLight(0xfff1df,0x2b1a12,.65));
 const key=new THREE.DirectionalLight(0xfff1df,3.2);key.position.set(-3,6,5);key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.camera.left=-3;key.shadow.camera.right=3;key.shadow.camera.top=4;key.shadow.camera.bottom=-3;key.shadow.normalBias=.015;key.shadow.bias=-.0002;key.shadow.radius=4;scene.add(key);
 const rim=new THREE.DirectionalLight(0xe8c18e,1.6);rim.position.set(3,4,-2);scene.add(rim);
 const fill=new THREE.DirectionalLight(0xdfe7f0,.5);fill.position.set(2,2,5);scene.add(fill);
 const materials=makeMaterials(),stageGroups=[],beans=[],steamGroups=[];
 let stage=0,visible=true,disposed=false,frame=0,last=0,elapsed=0,targetX=0,targetY=0,manualAngle=0,dragging=false,startX=0;
 let ro,io,primaryCup;
 if(kind==='hero'){
  primaryCup=createCup(materials);primaryCup.rotation.y=-.15;root.add(primaryCup);
  const steam=createSteam();root.add(steam);steamGroups.push(steam);
  // Keep the product grounded; only the two small beans float slowly.
  [[-1.72,1.20,-.25,.19],[1.85,2.0,-.65,.14]].forEach((p,i)=>{const b=createBean(materials.bean);b.scale.setScalar(p[3]);b.position.set(p[0],p[1],p[2]);b.rotation.set(.35,i*.7,.5+i);b.userData.base=b.position.clone();root.add(b);beans.push(b);});
  const shadow=addMesh(new THREE.PlaneGeometry(5.8,5.8),new THREE.MeshBasicMaterial({map:contactShadow(),transparent:true,depthWrite:false}),root,[0,-.124,0]);shadow.rotation.x=-Math.PI/2;shadow.castShadow=false;
  const receiver=addMesh(new THREE.PlaneGeometry(10,10),new THREE.ShadowMaterial({opacity:.20}),root,[0,-.121,0]);receiver.rotation.x=-Math.PI/2;receiver.castShadow=false;
  camera.position.set(2.8,3.4,7.4);camera.lookAt(0,1.3,0);
 }else{
  const green=createBean(materials.green),roasted=createBean(materials.bean);[green,roasted].forEach(b=>{b.scale.setScalar(1.25);b.rotation.z=.38;});stageGroups.push(green,roasted);
  const grounds=new THREE.Group(),geo=new THREE.IcosahedronGeometry(.035,1),mat=new THREE.MeshStandardMaterial({color:0x613719,roughness:.92});const grains=new THREE.InstancedMesh(geo,mat,850),dummy=new THREE.Object3D();
  for(let i=0;i<850;i++){const a=i*2.39996,r=Math.sqrt(i/850)*1.15;dummy.position.set(Math.cos(a)*r,(1-r/1.2)*.45-.25+Math.sin(i*19)*.02,Math.sin(a)*r);dummy.rotation.set(i*.7,i*.3,i);dummy.scale.set(.5+(i%5)/4,.7+(i%7)/4,.5+(i%3)/3);dummy.updateMatrix();grains.setMatrixAt(i,dummy.matrix);}grains.castShadow=true;grounds.add(grains);stageGroups.push(grounds);
  const brew=new THREE.Group(),dripper=createDripper(materials);dripper.position.y=.2;brew.add(dripper);const lower=createCup(materials);lower.scale.setScalar(.65);lower.position.y=-.72;brew.add(lower);const stream=addMesh(new THREE.CylinderGeometry(.008,.016,.24,8),materials.meniscus,brew,[0,.04,0]);stream.castShadow=false;stageGroups.push(brew);
  const final=new THREE.Group(),c=createCup(materials);final.add(c);const vapour=createSteam();final.add(vapour);steamGroups.push(vapour);final.scale.setScalar(.85);final.position.y=-.5;stageGroups.push(final);
  stageGroups.forEach((g,i)=>{g.visible=i===0;root.add(g);});camera.position.set(1.4,2.1,6.8);camera.lookAt(0,.15,0);
 }
 function fail(){onFailure?.();dispose();}
 // Shader compile errors must retain the fallback instead of showing a blank canvas.
 renderer.debug.onShaderError=()=>queueMicrotask(fail);
 function draw(){if(disposed)return;try{renderer.render(scene,camera);}catch{fail();}}
 function resize(){if(disposed)return;const r=canvas.getBoundingClientRect();if(!r.width||!r.height)return;renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();draw();}
 function tick(now){frame=0;if(disposed||paused||!visible||document.hidden)return;const dt=Math.min((now-last)/1000,.04)||0;last=now;elapsed+=dt;
  root.rotation.y+=(manualAngle+targetX*.11-root.rotation.y)*.035;root.rotation.x+=(targetY*.025-root.rotation.x)*.03;
  if(primaryCup)primaryCup.rotation.y=-.15+Math.sin(elapsed*.18)*.025;
  beans.forEach((b,i)=>{b.position.y=b.userData.base.y+Math.sin(elapsed*.45+i*2)*.07;b.rotation.y+=dt*.09;});
  steamGroups.forEach(g=>g.userData.update(elapsed));
  if(kind==='craft'){stageGroups[stage].rotation.y=Math.sin(elapsed*.2)*.09;camera.position.z+=(6.8-stage*.05-camera.position.z)*.025;}
  draw();if(!disposed)frame=requestAnimationFrame(tick);
 }
 function wake(){if(!frame&&!paused&&visible&&!document.hidden&&!disposed){last=performance.now();frame=requestAnimationFrame(tick);}else draw();}
 ro=new ResizeObserver(resize);ro.observe(canvas);io=new IntersectionObserver(es=>{visible=es[0].isIntersecting;if(visible)wake();else{cancelAnimationFrame(frame);frame=0;}},{rootMargin:'60px'});io.observe(canvas);
 function visibility(){if(document.hidden){cancelAnimationFrame(frame);frame=0;}else wake();}document.addEventListener('visibilitychange',visibility);
 function move(e){const r=canvas.getBoundingClientRect();targetX=(e.clientX-r.left)/r.width-.5;targetY=(e.clientY-r.top)/r.height-.5;if(dragging&&kind==='craft'){manualAngle+=(e.clientX-startX)*.008;startX=e.clientX;if(paused){root.rotation.y=manualAngle;draw();}}}
 function down(e){if(kind!=='craft')return;dragging=true;startX=e.clientX;canvas.setPointerCapture(e.pointerId);}
 function up(){dragging=false;}function contextLost(e){e.preventDefault();fail();}
 canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',up);canvas.addEventListener('webglcontextlost',contextLost);
 function dispose(){if(disposed)return;disposed=true;cancelAnimationFrame(frame);ro?.disconnect();io?.disconnect();document.removeEventListener('visibilitychange',visibility);canvas.removeEventListener('pointermove',move);canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointerup',up);canvas.removeEventListener('pointercancel',up);canvas.removeEventListener('webglcontextlost',contextLost);
  const geometries=new Set(),mats=new Set(Object.values(materials)),textures=new Set();scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)for(const m of Array.isArray(o.material)?o.material:[o.material])mats.add(m);});geometries.forEach(g=>g.dispose());mats.forEach(m=>{for(const value of Object.values(m))if(value?.isTexture)textures.add(value);m.dispose();});textures.forEach(t=>t.dispose());environment.dispose();renderer.dispose();
 }
 resize();draw();if(!disposed){onReady?.();wake();}return {setPaused(v){paused=v;if(v){cancelAnimationFrame(frame);frame=0;draw();}else wake();},setStage(v){stage=Math.max(0,Math.min(4,v));stageGroups.forEach((g,i)=>g.visible=i===stage);draw();wake();},rotate(v){manualAngle+=v;root.rotation.y=manualAngle;draw();},dispose};
}

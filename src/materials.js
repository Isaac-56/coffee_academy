import * as THREE from 'three';

function randomFactory(seed=19){return ()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};}
function texture(size,paint,color=true){const c=document.createElement('canvas');c.width=c.height=size;paint(c.getContext('2d'),size);const t=new THREE.CanvasTexture(c);if(color)t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t;}
export function makeMaterials({onTextureReady}={}){
 const rnd=randomFactory();
 const grain=texture(256,(c,n)=>{const d=c.createImageData(n,n);for(let i=0;i<d.data.length;i+=4){const v=110+rnd()*35;d.data.set([v,v,v,255],i);}c.putImageData(d,0,0);},false);grain.wrapS=grain.wrapT=THREE.RepeatWrapping;grain.repeat.set(4,4);
 const crema=texture(1024,(c,n)=>{
  const g=c.createRadialGradient(n*.42,n*.38,30,n/2,n/2,n*.52);g.addColorStop(0,'#b87736');g.addColorStop(.55,'#a15a25');g.addColorStop(.87,'#c88944');g.addColorStop(.96,'#e3b46e');g.addColorStop(1,'#5c2b0c');c.fillStyle=g;c.fillRect(0,0,n,n);
  // Fine mottling and tiny bubbles prevent a flat illustrated surface.
  for(let i=0;i<18000;i++){const x=rnd()*n,y=rnd()*n,r=.4+rnd()*2.5;c.fillStyle=i%3===0?'rgba(50,20,3,.10)':'rgba(247,204,141,.12)';c.beginPath();c.ellipse(x,y,r,r*.7,0,0,Math.PI*2);c.fill();}
  // One broad heart, filling most of the coffee surface. No stacked leaves.
  c.save();c.translate(n/2,n/2+5);c.rotate(-.13);c.shadowBlur=5;c.shadowColor='#e4bd80';
  c.beginPath();c.moveTo(0,290);
  c.bezierCurveTo(-75,225,-355,100,-330,-85);
  c.bezierCurveTo(-310,-275,-85,-290,0,-130);
  c.bezierCurveTo(90,-295,320,-250,335,-75);
  c.bezierCurveTo(348,100,95,228,0,290);
  c.closePath();const milk=c.createLinearGradient(-220,-180,180,260);milk.addColorStop(0,'#fff1d6');milk.addColorStop(.6,'#f3dfbd');milk.addColorStop(1,'#e8cda5');c.fillStyle=milk;c.fill();
  c.strokeStyle='rgba(255,244,218,.65)';c.lineWidth=5;c.stroke();
  // A short draw-through tip gives the shape a poured finish.
  c.beginPath();c.moveTo(-7,244);c.quadraticCurveTo(1,290,18,325);c.strokeStyle='#f2dfbd';c.lineWidth=10;c.lineCap='round';c.stroke();c.restore();
 });
 const beanMap=texture(512,(c,n)=>{const d=c.createImageData(n,n);for(let y=0;y<n;y++)for(let x=0;x<n;x++){const a=(y*n+x)*4;const v=100+18*Math.sin(x*.13+Math.sin(y*.03)*4)+rnd()*50;d.data.set([v,v,v,255],a);}c.putImageData(d,0,0);c.strokeStyle='#353535';c.lineWidth=1;for(let i=0;i<170;i++){const x=rnd()*n,y=rnd()*n;c.beginPath();c.moveTo(x,y);c.bezierCurveTo(x+8,y+5,x-6,y+10,x+2,y+20+rnd()*15);c.stroke();}},false);
 const label=texture(512,(c,n)=>{c.clearRect(0,0,n,n);c.fillStyle='#8d6939';c.font='400 135px Georgia';c.textAlign='center';c.textBaseline='middle';c.fillText('TERA',n/2,n/2);});
 const materials={
  porcelain:new THREE.MeshPhysicalMaterial({color:0xeee9e0,roughness:.23,metalness:0,ior:1.5,clearcoat:.85,clearcoatRoughness:.12,bumpMap:grain,bumpScale:.00065,envMapIntensity:1.0,side:THREE.DoubleSide}),
  glass:new THREE.MeshPhysicalMaterial({color:0xe6eee7,roughness:.12,metalness:0,transparent:true,opacity:.28,side:THREE.DoubleSide,depthWrite:false,envMapIntensity:1.25,clearcoat:1}),
  glassEdge:new THREE.MeshStandardMaterial({color:0xb2c2b5,roughness:.15,metalness:.2,transparent:true,opacity:.68}),
  wood:new THREE.MeshStandardMaterial({color:0x85603a,roughness:.62,bumpMap:grain,bumpScale:.008}),
  paper:new THREE.MeshStandardMaterial({color:0xe5d8bb,roughness:.95,side:THREE.DoubleSide}),
  brewed:new THREE.MeshPhysicalMaterial({color:0x331608,roughness:.24,clearcoat:.7,envMapIntensity:.5}),
  leather:new THREE.MeshStandardMaterial({color:0x382014,roughness:.7}),
  tray:new THREE.MeshStandardMaterial({color:0x29221c,roughness:.6,metalness:.08}),
  gold:new THREE.MeshStandardMaterial({color:0xb89a61,roughness:.25,metalness:.9,envMapIntensity:1.2}),
  coffee:new THREE.MeshPhysicalMaterial({map:crema,roughness:.36,metalness:0,clearcoat:.25,clearcoatRoughness:.25,envMapIntensity:.5}),
  meniscus:new THREE.MeshPhysicalMaterial({color:0x78451d,roughness:.13,clearcoat:1}),
  bean:new THREE.MeshStandardMaterial({color:0x62381e,bumpMap:beanMap,bumpScale:.025,roughness:.48,roughnessMap:beanMap,envMapIntensity:.6}),
  green:new THREE.MeshStandardMaterial({color:0x98906a,bumpMap:beanMap,bumpScale:.016,roughness:.8,envMapIntensity:.3}),
  wordmark:new THREE.MeshBasicMaterial({map:label,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2}),
 };
 new THREE.TextureLoader().load('./assets/latte-surface.webp',map=>{
  map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=4;
  const previous=materials.coffee.map;materials.coffee.map=map;materials.coffee.needsUpdate=true;
  previous.dispose();if(onTextureReady?.()===false)map.dispose();
 },undefined,()=>{/* Keep the local heart texture when the image cannot load. */});
 return materials;
}
export function contactShadow(){return texture(256,(c,n)=>{const g=c.createRadialGradient(n/2,n/2,10,n/2,n/2,n/2);g.addColorStop(0,'rgba(0,0,0,.8)');g.addColorStop(.35,'rgba(0,0,0,.6)');g.addColorStop(.65,'rgba(0,0,0,.2)');g.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g;c.fillRect(0,0,n,n);},false);}

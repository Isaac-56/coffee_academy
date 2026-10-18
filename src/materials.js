import * as THREE from 'three';

function randomFactory(seed=19){return ()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};}
function texture(size,paint,color=true){const c=document.createElement('canvas');c.width=c.height=size;paint(c.getContext('2d'),size);const t=new THREE.CanvasTexture(c);if(color)t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t;}
export function makeMaterials(){
 const rnd=randomFactory();
 const grain=texture(256,(c,n)=>{const d=c.createImageData(n,n);for(let i=0;i<d.data.length;i+=4){const v=110+rnd()*35;d.data.set([v,v,v,255],i);}c.putImageData(d,0,0);},false);grain.wrapS=grain.wrapT=THREE.RepeatWrapping;grain.repeat.set(4,4);
 const crema=texture(1024,(c,n)=>{
  const g=c.createRadialGradient(n*.42,n*.38,30,n/2,n/2,n*.52);g.addColorStop(0,'#b87736');g.addColorStop(.55,'#a15a25');g.addColorStop(.87,'#c88944');g.addColorStop(.96,'#e3b46e');g.addColorStop(1,'#5c2b0c');c.fillStyle=g;c.fillRect(0,0,n,n);
  // Fine mottling and tiny bubbles prevent a flat illustrated surface.
  for(let i=0;i<18000;i++){const x=rnd()*n,y=rnd()*n,r=.4+rnd()*2.5;c.fillStyle=i%3===0?'rgba(50,20,3,.10)':'rgba(247,204,141,.12)';c.beginPath();c.ellipse(x,y,r,r*.7,0,0,Math.PI*2);c.fill();}
  // A hand-poured tulip: continuous shapes with softly blended edges.
  c.save();c.translate(505,505);c.rotate(-.27);c.shadowBlur=3;c.shadowColor='#e9c998';
  for(let i=0;i<7;i++){const y=145-i*44,w=145-i*13;c.fillStyle=i%2?'#f3dfbd':'#f8e8cb';c.beginPath();c.moveTo(0,y+42);c.bezierCurveTo(-w*.6,y+20,-w*1.25,y-44,-w*.7,y-60);c.bezierCurveTo(-w*.2,y-78,-w*.2,y-35,0,y-30);c.bezierCurveTo(w*.2,y-35,w*.2,y-78,w*.7,y-60);c.bezierCurveTo(w*1.25,y-44,w*.6,y+20,0,y+42);c.fill();}
  c.strokeStyle='#f9ebd1';c.lineWidth=8;c.lineCap='round';c.beginPath();c.moveTo(-4,-190);c.bezierCurveTo(0,-80,-8,70,5,215);c.stroke();c.restore();
 });
 const beanMap=texture(512,(c,n)=>{const d=c.createImageData(n,n);for(let y=0;y<n;y++)for(let x=0;x<n;x++){const a=(y*n+x)*4;const v=100+18*Math.sin(x*.13+Math.sin(y*.03)*4)+rnd()*50;d.data.set([v,v,v,255],a);}c.putImageData(d,0,0);c.strokeStyle='#353535';c.lineWidth=1;for(let i=0;i<170;i++){const x=rnd()*n,y=rnd()*n;c.beginPath();c.moveTo(x,y);c.bezierCurveTo(x+8,y+5,x-6,y+10,x+2,y+20+rnd()*15);c.stroke();}},false);
 const label=texture(512,(c,n)=>{c.clearRect(0,0,n,n);c.fillStyle='#8d6939';c.font='400 135px Georgia';c.textAlign='center';c.textBaseline='middle';c.fillText('TERA',n/2,n/2);});
 return {
  porcelain:new THREE.MeshPhysicalMaterial({color:0xf1e9dd,roughness:.21,metalness:0,ior:1.49,clearcoat:.8,clearcoatRoughness:.16,bumpMap:grain,bumpScale:.0015,envMapIntensity:.85,side:THREE.DoubleSide}),
  gold:new THREE.MeshStandardMaterial({color:0xb89a61,roughness:.25,metalness:.9,envMapIntensity:1.2}),
  coffee:new THREE.MeshPhysicalMaterial({map:crema,roughness:.36,metalness:0,clearcoat:.25,clearcoatRoughness:.25,envMapIntensity:.5}),
  meniscus:new THREE.MeshPhysicalMaterial({color:0x78451d,roughness:.13,clearcoat:1}),
  bean:new THREE.MeshStandardMaterial({color:0x62381e,bumpMap:beanMap,bumpScale:.025,roughness:.48,roughnessMap:beanMap,envMapIntensity:.6}),
  green:new THREE.MeshStandardMaterial({color:0x98906a,bumpMap:beanMap,bumpScale:.016,roughness:.8,envMapIntensity:.3}),
  wordmark:new THREE.MeshBasicMaterial({map:label,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2}),
 };
}
export function contactShadow(){return texture(256,(c,n)=>{const g=c.createRadialGradient(n/2,n/2,10,n/2,n/2,n/2);g.addColorStop(0,'rgba(0,0,0,.8)');g.addColorStop(.35,'rgba(0,0,0,.6)');g.addColorStop(.65,'rgba(0,0,0,.2)');g.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g;c.fillRect(0,0,n,n);},false);}

import * as THREE from 'three';

// Sculpted product proportions. Geometry is shared by hero and craft views.
export function smoothProfile(points, samples=100){
 const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(p[0],p[1],0)),false,'centripetal');
 return new THREE.LatheGeometry(curve.getPoints(samples).map(p=>new THREE.Vector2(Math.max(0,p.x),p.y)),128);
}
export function handleGeometry(){
 // A tapered, flattened D-shaped handle with separate upper and lower shoulders.
 // Neither its centreline nor its section is circular.
 const curve=new THREE.CatmullRomCurve3([
  new THREE.Vector3(.88,.91,0),new THREE.Vector3(1.13,.97,0),
  new THREE.Vector3(1.43,.86,0),new THREE.Vector3(1.49,.64,0),
  new THREE.Vector3(1.36,.39,0),new THREE.Vector3(1.06,.25,0),
  new THREE.Vector3(.72,.29,0),
 ],false,'centripetal');
 const length=96,sides=20,frames=curve.computeFrenetFrames(length,false),positions=[],uv=[],indices=[];
 for(let i=0;i<=length;i++){
  const t=i/length,p=curve.getPointAt(t),thickness=.075+.055*Math.pow(Math.abs(2*t-1),3);
  for(let j=0;j<=sides;j++){
   const a=j/sides*Math.PI*2,offset=frames.normals[i].clone().multiplyScalar(Math.cos(a)*thickness*1.08).addScaledVector(frames.binormals[i],Math.sin(a)*thickness*.82);
   positions.push(p.x+offset.x,p.y+offset.y,p.z+offset.z);uv.push(t,j/sides);
   if(i<length&&j<sides){const k=i*(sides+1)+j;indices.push(k,k+1,k+sides+1,k+1,k+sides+2,k+sides+1);}
  }
 }
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();return g;
}
export function sculptedBeanGeometry(){
 const g=new THREE.SphereGeometry(1,72,48),pos=g.attributes.position;
 for(let i=0;i<pos.count;i++){
  const x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i);
  const creaseX=.045*Math.sin(y*4.3)+.025*y;
  const seam=Math.exp(-Math.pow((x-creaseX)/.085,2))*Math.pow(Math.max(0,z),.6);
  const irregular=1+.018*Math.sin(x*19+y*13)*Math.sin(z*17-y*8);
  pos.setXYZ(i,x*.65*irregular*(1+.045*y),y*.91*irregular,z*.42*irregular-seam*.15);
 }
 g.computeVertexNormals();return g;
}
export function addMesh(g,m,parent,position=[0,0,0]){const o=new THREE.Mesh(g,m);o.position.set(...position);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
function ring(radius,tube,material,parent,y){const o=addMesh(new THREE.TorusGeometry(radius,tube,12,128),material,parent,[0,y,0]);o.rotation.x=Math.PI/2;return o;}
export function createCup(materials){
 const group=new THREE.Group();
 const profile=[[0,.10],[.34,.10],[.44,.13],[.53,.19],[.63,.29],[.73,.43],[.82,.62],[.90,.84],[.945,1.025],[.949,1.055],[.938,1.07],[.920,1.071],[.903,1.052],[.891,1.01],[.85,.84],[.76,.61],[.66,.42],[.54,.28],[.39,.22],[0,.22]];
 addMesh(smoothProfile(profile),materials.porcelain,group);
 addMesh(handleGeometry(),materials.porcelain,group);
 // Tiny fired-gold lip rather than a thick metallic ring.
 // Porcelain lip is part of the continuous profile: no overlapping metal mesh.
 addMesh(smoothProfile([[0,.035],[.35,.035],[.40,.055],[.405,.105],[.37,.135],[0,.135]],40),materials.porcelain,group);
 const saucer=[[0,-.07],[.45,-.07],[.70,-.055],[1.05,-.015],[1.40,.07],[1.53,.115],[1.56,.14],[1.55,.159],[1.50,.166],[1.39,.14],[1.06,.065],[.71,.025],[.47,.018],[0,.018]];
 addMesh(smoothProfile(saucer,90),materials.porcelain,group,[0,-.045,0]);
 const liquid=addMesh(new THREE.CircleGeometry(.89,128),materials.coffee,group,[0,.998,0]);liquid.rotation.x=-Math.PI/2;
 ring(.887,.006,materials.meniscus,group,1.001);
 // Curved lettering follows the face of the cup rather than floating on a plane.
 if(materials.wordmark){const logo=addMesh(new THREE.CylinderGeometry(.91,.765,.32,48,1,true,-.38,.76),materials.wordmark,group,[0,.665,0]);logo.scale.z=1.015;logo.castShadow=false;}
 return group;
}
export function createBean(material){const g=new THREE.Group();addMesh(sculptedBeanGeometry(),material,g);return g;}
// Integrated pour-over brewer: the paper is supported by a continuous glass neck.
// No floating cone, suspended support ring or disconnected coffee stream.
export function createDripper(materials){
 const group=new THREE.Group();group.name='Glass pour-over brewer';
 const glassProfile=[[0,0],[.47,0],[.64,.04],[.72,.17],[.74,.35],[.69,.61],[.54,.86],[.33,1.08],[.29,1.23],[.36,1.40],[.55,1.65],[.75,1.89],[.76,1.92],[.74,1.94],[.72,1.91],[.52,1.66],[.33,1.40],[.27,1.24],[.30,1.07],[.52,.84],[.67,.60],[.71,.35],[.69,.18],[.62,.08],[.46,.045],[0,.045]];
 const vessel=addMesh(smoothProfile(glassProfile,160),materials.glass,group);vessel.castShadow=false;vessel.renderOrder=2;
 ring(.742,.012,materials.glassEdge,group,1.918);
 const collar=addMesh(smoothProfile([[.29,1.02],[.36,1.04],[.39,1.10],[.38,1.24],[.34,1.30],[.29,1.28],[.285,1.03]],60),materials.wood,group);collar.name='Supported wood collar';
 ring(.387,.016,materials.leather,group,1.15);
 const tie=new THREE.CatmullRomCurve3([new THREE.Vector3(.1,1.15,.38),new THREE.Vector3(.18,1.10,.43),new THREE.Vector3(.20,.89,.45)]);
 addMesh(new THREE.TubeGeometry(tie,24,.013,8,false),materials.leather,group);
 // Filter overlaps the glass cone at its wall, with a visible folded paper edge.
 const paperGeo=new THREE.ConeGeometry(.69,.82,96,1,true);paperGeo.rotateZ(Math.PI);
 const paper=addMesh(paperGeo,materials.paper,group,[0,1.57,0]);paper.castShadow=false;
 const grounds=addMesh(new THREE.CircleGeometry(.37,64),materials.bean,group,[0,1.58,0]);grounds.rotation.x=-Math.PI/2;
 const liquid=addMesh(smoothProfile([[0,.06],[.46,.06],[.62,.10],[.68,.23],[.69,.36],[.66,.48],[0,.48]],80),materials.brewed,group);liquid.renderOrder=0;
 const surface=addMesh(new THREE.CircleGeometry(.662,96),materials.brewed,group,[0,.48,0]);surface.rotation.x=-Math.PI/2;
 return group;
}
export function createSampleDish(materials){
 const g=new THREE.Group();
 addMesh(smoothProfile([[0,-.12],[.65,-.12],[1.03,-.07],[1.17,.07],[1.18,.13],[1.14,.15],[1.05,.02],[.65,-.07],[0,-.07]],70),materials.porcelain,g);
 return g;
}

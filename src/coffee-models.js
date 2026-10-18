import * as THREE from 'three';

// Sculpted product proportions. Geometry is shared by hero and craft views.
export function smoothProfile(points, samples=100){
 const curve=new THREE.SplineCurve(points.map(p=>new THREE.Vector2(...p)));
 return new THREE.LatheGeometry(curve.getPoints(samples),128);
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
 ring(.939,.009,materials.gold,group,1.067);
 addMesh(smoothProfile([[0,.035],[.35,.035],[.40,.055],[.405,.105],[.37,.135],[0,.135]],40),materials.porcelain,group);
 const saucer=[[0,-.07],[.45,-.07],[.70,-.055],[1.05,-.015],[1.40,.07],[1.53,.115],[1.56,.14],[1.55,.159],[1.50,.166],[1.39,.14],[1.06,.065],[.71,.025],[.47,.018],[0,.018]];
 addMesh(smoothProfile(saucer,90),materials.porcelain,group,[0,-.045,0]);ring(1.535,.007,materials.gold,group,.111);
 const liquid=addMesh(new THREE.CircleGeometry(.89,128),materials.coffee,group,[0,.998,0]);liquid.rotation.x=-Math.PI/2;
 ring(.887,.006,materials.meniscus,group,1.001);
 // Curved lettering follows the face of the cup rather than floating on a plane.
 if(materials.wordmark){const logo=addMesh(new THREE.CylinderGeometry(.91,.765,.32,48,1,true,-.38,.76),materials.wordmark,group,[0,.665,0]);logo.scale.z=1.015;logo.castShadow=false;}
 return group;
}
export function createBean(material){const g=new THREE.Group();addMesh(sculptedBeanGeometry(),material,g);return g;}
export function createDripper(materials){
 const group=new THREE.Group();
 const profile=[[.13,-.08],[.16,.02],[.31,.32],[.55,.71],[.78,1.10],[.8,1.13],[.78,1.16],[.75,1.14],[.51,.76],[.27,.36],[.13,.05]];
 const geometry=smoothProfile(profile,80),p=geometry.attributes.position;
 for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),y=p.getY(i);const a=Math.atan2(z,x);const r=1+.014*Math.cos(a*22+y*2);p.setXYZ(i,x*r,y,z*r);}
 geometry.computeVertexNormals();addMesh(geometry,materials.porcelain,group);ring(.785,.008,materials.gold,group,1.145);
 ring(.38,.04,materials.porcelain,group,-.05);
 return group;
}

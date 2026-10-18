import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {handleGeometry,sculptedBeanGeometry,createCup} from '../src/coffee-models.js';
test('sculpted geometry is finite and has valid triangle references',()=>{
 for(const g of [handleGeometry(),sculptedBeanGeometry()]){
  assert.ok(g.attributes.position.count>1000);
  for(const n of g.attributes.position.array)assert.ok(Number.isFinite(n));
  for(const n of g.attributes.normal.array)assert.ok(Number.isFinite(n));
  for(const i of g.index.array)assert.ok(i<g.attributes.position.count);
  g.dispose();
 }
});
test('handle joins the cup at two distinct heights and has finger clearance',()=>{
 const g=handleGeometry(),p=g.attributes.position;
 g.computeBoundingBox();assert.ok(g.boundingBox.max.x>1.4);
 // Start and end sections sit at upper and lower attachment shoulders.
 const average=i=>{const v=new THREE.Vector3();for(let j=0;j<=20;j++)v.add(new THREE.Vector3().fromBufferAttribute(p,i*21+j));return v.divideScalar(21);};
 const top=average(0),bottom=average(96);
 assert.ok(top.y>.85&&bottom.y<.35);assert.ok(top.x<1&&bottom.x<.85);
 const mid=new THREE.Vector3();for(let j=0;j<20;j++)mid.add(new THREE.Vector3().fromBufferAttribute(p,48*21+j));mid.divideScalar(20);
 const outer=new THREE.Vector3().fromBufferAttribute(p,48*21).sub(mid);const normal=new THREE.Vector3().fromBufferAttribute(g.attributes.normal,48*21);assert.ok(outer.dot(normal)>0);
 g.dispose();
});
test('cup liquid sits below rim and inside bowl',()=>{
 const m=new THREE.MeshBasicMaterial();const cup=createCup({porcelain:m,gold:m,coffee:m,meniscus:m});
 const liquid=cup.children.find(x=>x.geometry.type==='CircleGeometry');assert.ok(liquid.position.y<1.05);assert.ok(liquid.geometry.parameters.radius<.92);
 cup.traverse(x=>x.geometry?.dispose());m.dispose();
});

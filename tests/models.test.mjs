import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {handleGeometry,sculptedBeanGeometry,createCup} from '../src/coffee-models.js';
test('sculpted geometry is finite and has valid triangle references',()=>{
 for(const g of [handleGeometry(),sculptedBeanGeometry()]){
  assert.ok(g.attributes.position.count>1000);
  for(const n of g.attributes.position.array)assert.ok(Number.isFinite(n));
  for(const n of g.attributes.normal.array)assert.ok(Number.isFinite(n));
  for(const i of (g.index?.array||[]))assert.ok(i<g.attributes.position.count);
  g.dispose();
 }
});
test('ceramic handle has open finger clearance and two attachment shoulders',()=>{
 const g=handleGeometry();g.computeBoundingBox();assert.ok(g.boundingBox.max.x>1.4);assert.ok(g.boundingBox.min.x<.65);
 const mesh=new THREE.Mesh(g,new THREE.MeshBasicMaterial({side:THREE.DoubleSide}));
 const hit=(x,y)=>new THREE.Raycaster(new THREE.Vector3(x,y,2),new THREE.Vector3(0,0,-1)).intersectObject(mesh).length;
 assert.equal(hit(1.13,.65),0);assert.ok(hit(.88,.90)>0);assert.ok(hit(.68,.32)>0);
 g.dispose();mesh.material.dispose();
});
test('cup liquid sits below rim and inside bowl',()=>{
 const m=new THREE.MeshBasicMaterial();const cup=createCup({porcelain:m,gold:m,coffee:m,meniscus:m});
 const liquid=cup.children.find(x=>x.geometry.type==='CircleGeometry');assert.ok(liquid.position.y<1.05);assert.ok(liquid.geometry.parameters.radius<.92);
 cup.traverse(x=>x.geometry?.dispose());m.dispose();
});

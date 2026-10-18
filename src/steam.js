import * as THREE from 'three';
// Continuous advected noise creates rising wisps, rather than floating circles.
export function createSteam(){
 const material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,uniforms:{uTime:{value:2.7},uOpacity:{value:.56}},vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,fragmentShader:`
 precision highp float;
 varying vec2 vUv;uniform float uTime;uniform float uOpacity;
 float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}
 float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
 float fbm(vec2 p){float a=.5,v=0.;for(int i=0;i<4;i++){v+=a*noise(p);p=p*2.03+vec2(12.3,7.1);a*=.5;}return v;}
 void main(){
  float y=vUv.y;
  float bend=sin(y*7.-uTime*.36)*(.025+y*.075)+sin(y*13.-uTime*.22)*y*.025;
  vec2 p=vec2(vUv.x-bend,y);
  float billow=fbm(vec2(p.x*6.,y*5.-uTime*.25));
  float curl=fbm(vec2(p.x*11.+billow*2.,y*8.-uTime*.44));
  float centre=.5+bend*.3;
  float width=.09+y*.22;
  float envelope=exp(-pow((p.x-centre)/width,2.)*2.);
  float strands=smoothstep(.32,.74,curl)*.75+smoothstep(.5,.74,billow)*.25;
  float fade=smoothstep(0.,.08,y)*(1.-smoothstep(.5,1.,y));
  float alpha=envelope*strands*fade*uOpacity;
  gl_FragColor=vec4(vec3(.87,.83,.76),alpha);
 }`});
 const group=new THREE.Group();
 for(let i=0;i<2;i++){const m=material.clone();m.uniforms.uTime.value=2.7+i*19;m.uniforms.uOpacity.value=i===0?.63:.31;const plane=new THREE.Mesh(new THREE.PlaneGeometry(1.7,2.75,1,1),m);plane.position.set(i===0?-.12:.17,2.36,i===0?.12:-.18);plane.rotation.y=i===0?0:.6;plane.renderOrder=3+i;group.add(plane);}
 group.userData.update=t=>group.children.forEach((p,i)=>p.material.uniforms.uTime.value=t+2.7+i*19);return group;
}

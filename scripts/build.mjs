import { mkdir, copyFile, rm } from 'node:fs/promises';
import { build } from 'esbuild';
await mkdir('dist/assets/fonts',{recursive:true});
for(const [family,weight,style] of [['cormorant-garamond',400,'normal'],['cormorant-garamond',400,'italic'],['jost',300,'normal'],['jost',400,'normal'],['jost',500,'normal']]){
 const file=`${family}-latin-${weight}-${style}.woff2`;
 await copyFile(`node_modules/@fontsource/${family}/files/${file}`,`dist/assets/fonts/${file}`);
}
await build({entryPoints:['src/scene.js'],outfile:'dist/scene.js',bundle:true,minify:true,format:'esm',target:'es2022',legalComments:'eof'});
await rm('dist/vendor',{recursive:true,force:true});
console.log('Static site ready: bundled 3D scene, self-hosted fonts, compressed images.');

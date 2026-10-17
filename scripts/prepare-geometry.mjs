// Prepare the expensive static city and contour work once, rather than on each visit.
import fs from 'node:fs/promises';
import {gzipSync} from 'node:zlib';
import * as THREE from '../dist/vendor/three.module.min.js';
const assets=new URL('../dist/assets/',import.meta.url);
const read=async n=>fs.readFile(new URL(n,assets));
const buildings=JSON.parse(await read('buildings.json'));
const bytes=await read('elevation.f32');const height=new Float32Array(bytes.buffer,bytes.byteOffset,bytes.byteLength/4);
const WIDTH=100,DEPTH=93.25,SCALE=512;
const xy=(lon,lat)=>[(lon+122.65)/.38*WIDTH-50,(37.95-lat)/.28*DEPTH-DEPTH/2];
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),mix=(a,b,t)=>a+(b-a)*t;
const relief=h=>h>=0?h*.0105:h*.023;
function elevation(x,z){const u=clamp((x/WIDTH+.5)*512,0,511.999),v=clamp((z/DEPTH+.5)*512,0,511.999),ix=Math.floor(u),iz=Math.floor(v),fx=u-ix,fz=v-iz;return mix(mix(height[iz*513+ix],height[iz*513+ix+1],fx),mix(height[(iz+1)*513+ix],height[(iz+1)*513+ix+1],fx),fz);}
const vertices=[],edges=[];
for(const b of buildings){
 const ring=b.p.map(p=>xy(...p));if(ring.length<3)continue;
 const [cx,cz]=xy(...b.c),y=Math.max(0,relief(elevation(cx,cz)))+.05,h=Math.max(.055,b.h*.0105);
 const roof=THREE.ShapeUtils.triangulateShape(ring.map(p=>new THREE.Vector2(...p)),[]);
 for(const tri of roof)for(const k of tri)vertices.push(ring[k][0],y+h,ring[k][1]);
 for(let i=0;i<ring.length;i++){const a=ring[i],n=ring[(i+1)%ring.length];vertices.push(a[0],y,a[1],a[0],y+h,a[1],n[0],y+h,n[1],a[0],y,a[1],n[0],y+h,n[1],n[0],y,n[1]);edges.push(a[0],y+h+.012,a[1],n[0],y+h+.012,n[1]);if(b.h>35||i%2===0)edges.push(a[0],y,a[1],a[0],y+h,a[1]);}
}
const contours=[],coast=[],n=192;
for(const lev of [-100,-75,-50,-25,-10,0,50,100,200,400,600])for(let j=0;j<n;j++)for(let i=0;i<n;i++){
 const x=-50+i*WIDTH/n,z=-DEPTH/2+j*DEPTH/n,c=[[x,z],[x+WIDTH/n,z],[x+WIDTH/n,z+DEPTH/n],[x,z+DEPTH/n]],h=c.map(p=>elevation(...p)),cross=[];
 for(let a=0;a<4;a++){const b=(a+1)%4;if((h[a]<=lev&&h[b]>lev)||(h[b]<=lev&&h[a]>lev)){const k=(lev-h[a])/(h[b]-h[a]);cross.push([mix(c[a][0],c[b][0],k),relief(lev)+.08,mix(c[a][1],c[b][1],k)]);}}
 const out=lev===0?coast:contours;if(cross.length>=2)out.push(...cross[0],...cross[1]);if(cross.length===4)out.push(...cross[2],...cross[3]);
}
const stats={};
for(const [name,data] of [['city.mesh',vertices],['city.edges',edges],['terrain.contours',contours],['terrain.coast',coast]]){
 const packed=Int16Array.from(data,x=>Math.round(x*SCALE)),buffer=Buffer.from(packed.buffer),gzip=gzipSync(buffer,{level:9});
 await fs.writeFile(new URL(name+'.i16',assets),buffer);await fs.writeFile(new URL(name+'.i16.gz',assets),gzip);stats[name]={values:data.length,rawBytes:buffer.length,gzipBytes:gzip.length};
}
for(const [source,target] of [['elevation.f32','elevation.f32'],['trees.json','trees.json'],['streets.json','streets.json']])await fs.writeFile(new URL(target+'.gz',assets),gzipSync(await read(source),{level:9}));
const lite=Buffer.from(JSON.stringify(buildings.map(({c,h})=>({c,h}))));await fs.writeFile(new URL('buildings.lite.json',assets),lite);await fs.writeFile(new URL('buildings.lite.json.gz',assets),gzipSync(lite,{level:9}));
await fs.writeFile(new URL('geometry-manifest.json',assets),JSON.stringify({scale:SCALE,buildings:buildings.length,...stats},null,2));
console.log(JSON.stringify(stats,null,2));

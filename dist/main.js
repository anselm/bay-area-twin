import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const $=s=>document.querySelector(s);
const params=new URLSearchParams(location.search);
const isBackdrop=params.has('backdrop');
const isEmbed=params.has('embed')||isBackdrop;
if(isEmbed)document.body.classList.add('embed');
if(isBackdrop)document.body.classList.add('backdrop');
const initialBackground=params.get('bg')||(params.get('transparent')==='1'?'transparent':'071019');
const initialCamera=['explore','orbit','tour','static'].includes(params.get('camera'))?params.get('camera'):'explore';
let interactive=params.get('interactive')!=='0',dragging=false,cameraTravel=0,cameraBank=0;
const tourPosition=new THREE.Vector3(),tourTarget=new THREE.Vector3();
const tourTangent=new THREE.Vector3(),tourAhead=new THREE.Vector3(),tourTurn=new THREE.Vector3();
// Flight and observation are authored separately: one continuous westbound journey.
const tourStops=[
  {name:'Bay Bridge approach',position:[62,92,-40],target:[24,48,-5]},
  {name:'Treasure Island',position:[33,61,-17],target:[23.6,47,-4.7]}
];
function bridgeFlight(name,start,end,eyeHeight){
  const a=new THREE.Vector3(...start),b=new THREE.Vector3(...end),direction=b.clone().sub(a).normalize();
  for(const t of [-.4,0,.5,1,1.4]){
    const p=a.clone().lerp(b,t);p.y=46.05+eyeHeight;
    const q=p.clone().addScaledVector(direction,4);q.y=p.y;
    tourStops.push({name,position:p.toArray(),target:q.toArray()});
  }
}
// Enter westbound, from Yerba Buena/Treasure Island toward San Francisco.
bridgeFlight('Through the Bay Bridge',[25,0,-.99911],[18.5,0,6.99375],1.23);
tourStops.push(
  {name:'Into San Francisco',position:[11,51,15],target:[3,49,15]},
  {name:'Along the Embarcadero',position:[6,53,11],target:[-.5,49,4.5]},
  {name:'Approaching Transamerica',position:[5,52,7],target:[5,48,0]},
  {name:'Approaching Transamerica',position:[6,51.5,3],target:[13,47.5,-4]},
  {name:'Around Transamerica',position:[9.7,50.5,5],target:[14.9,47.5,4.93]},
  {name:'Around Transamerica',position:[11.2,50.8,1.2],target:[14.9,47.5,4.93]},
  {name:'Around Transamerica',position:[14.9,51,-.3],target:[14.9,47.5,4.93]},
  {name:'Around Transamerica',position:[18.6,51.2,1.2],target:[14.9,47.5,4.93]},
  {name:'Around Transamerica',position:[20,51.2,4.93],target:[14.9,47.5,4.93]},
  {name:'Around Transamerica',position:[18.6,51.5,8.6],target:[14.9,47.5,4.93]},
  {name:'Around Transamerica',position:[14.9,52,10.2],target:[14.9,47.5,4.93]},
  {name:'Around Transamerica',position:[11.2,52.2,8.6],target:[14.9,47.5,4.93]},
  {name:'Along the waterfront',position:[6,54,7],target:[6,48,0]},
  {name:'Golden Gate approach',position:[-1.5,53,9.8],target:[-4.2,47.7,-1.1]}
);
bridgeFlight('Through the Golden Gate',[-3.80263,0,.48290],[-5.84211,0,-7.62652],1.65);
tourStops.push(
  {name:'Out through the Gate',position:[-9,52,-16],target:[-15,48,-20]},
  {name:'Climbing above the Headlands',position:[-16,62,-24],target:[-25,48,-24]},
  {name:'Sweeping along the coast',position:[-28,74,-29],target:[-34,47,-19]},
  {name:'Turning back toward the city',position:[-41,86,-29],target:[-32,47,-12]},
  {name:'City behind us',position:[-55,98,-23],target:[-7,47,4]},
  {name:'Looking back over the Bay',position:[-62,112,-3],target:[10,47,5]},
  {name:'Bay panorama',position:[-60,116,35],target:[10,45,4]},
  {name:'Around the Bay',position:[-15,140,100],target:[14,46,5]},
  {name:'Returning over the Bay',position:[75,126,72],target:[16,47,8]},
  {name:'Back toward Treasure Island',position:[100,104,-15],target:[24,47,-5]}
);
const tourPath=new THREE.CatmullRomCurve3(tourStops.map(s=>new THREE.Vector3(...s.position)),true,'centripetal');
const tourLook=new THREE.CatmullRomCurve3(tourStops.map(s=>new THREE.Vector3(...s.target)),true,'centripetal');
const tourOrientation=new THREE.Quaternion(),desiredOrientation=new THREE.Quaternion();
const tourLookMatrix=new THREE.Matrix4(),tourUp=new THREE.Vector3(0,1,0),tourDirection=new THREE.Vector3();
let wasTourAutomatic=false;
const requestedSpeed=Number(params.get('speed')??2);
const cameraSpeed=Number.isFinite(requestedSpeed)?Math.min(12,Math.max(.25,requestedSpeed)):2;
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
const state={playing:!reducedMotion,time:16.3,elapsed:0,spread:.82,spreadTarget:.82,focus:-1,orbit:!reducedMotion,draggedAt:-100,ready:false,cameraMode:initialCamera,cameraSpeed};
if(initialCamera==='static')state.orbit=false;
const COLORS=[0x60b4b4,0x7dd7f2,0xa0ddb1,0xf1cc91];
const BOUNDS=[-122.65,37.67,-122.27,37.95];
const WIDTH=100,DEPTH=93.25;
const layers=[];const motions=[];const visualMaterials=[];
let scene,camera,renderer,controls,heightGrid,buildings,trees,streets,root,coast,packedCity,packedEdges,packedContours,packedCoast,stats={};
let sceneInView=true;
const startupAt=performance.now();
const tmp=new THREE.Vector3();
const rng=(seed=>()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;})(91827);
const mix=THREE.MathUtils.lerp;
const clamp=THREE.MathUtils.clamp;
function xy(lon,lat){return [(lon-BOUNDS[0])/(BOUNDS[2]-BOUNDS[0])*WIDTH-WIDTH/2,(BOUNDS[3]-lat)/(BOUNDS[3]-BOUNDS[1])*DEPTH-DEPTH/2];}
function elevation(x,z){
  const u=clamp((x/WIDTH+.5)*512,0,511.999),v=clamp((z/DEPTH+.5)*512,0,511.999),ix=Math.floor(u),iz=Math.floor(v),fx=u-ix,fz=v-iz;
  return mix(mix(heightGrid[iz*513+ix],heightGrid[iz*513+ix+1],fx),mix(heightGrid[(iz+1)*513+ix],heightGrid[(iz+1)*513+ix+1],fx),fz);
}
function relief(h){return h>=0?h*.0105:h*.023;}
function ground(x,z){return Math.max(0,relief(elevation(x,z)));}
function world(lon,lat,extra=0){const [x,z]=xy(lon,lat);return new THREE.Vector3(x,ground(x,z)+extra,z);}
function material(kind,opts){const m=new THREE[kind](opts);m.userData.originalOpacity=m.opacity;m.userData.dynamicGain=1;visualMaterials.push(m);return m;}
function lines(positions,color,opacity=.3,group=undefined){
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  const m=material('LineBasicMaterial',{color,transparent:true,opacity,depthWrite:false,blending:THREE.AdditiveBlending});
  const o=new THREE.LineSegments(g,m);if(group)group.add(o);return o;
}
function trail(points,color,opacity,group){const ps=[];for(let i=1;i<points.length;i++)ps.push(...points[i-1],...points[i]);return lines(ps,color,opacity,group);}
function glowTexture(){const c=document.createElement('canvas');c.width=c.height=64;const ctx=c.getContext('2d'),g=ctx.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.12,'rgba(255,255,255,.95)');g.addColorStop(.35,'rgba(255,255,255,.30)');g.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=g;ctx.fillRect(0,0,64,64);return new THREE.CanvasTexture(c);}
const GLOW=glowTexture();
function points(positions,color,size,opacity,group){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));const m=material('PointsMaterial',{color,size,map:GLOW,transparent:true,opacity,depthWrite:false,blending:THREE.AdditiveBlending,sizeAttenuation:true});const p=new THREE.Points(g,m);group.add(p);return p;}
function initRenderer(){
  renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,isBackdrop?1.35:1.6));
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.setClearColor(0x071019,0);
  $('#scene').appendChild(renderer.domElement);
  scene=new THREE.Scene();scene.fog=new THREE.FogExp2(0x071019,.0018);
  camera=new THREE.PerspectiveCamera(32,1,.02,1500);
  scene.add(new THREE.HemisphereLight(0xb3dfdf,0x112d3d,1.25));
  const key=new THREE.DirectionalLight(0xc0dfd4,2.5);key.position.set(-45,80,20);scene.add(key);
  const fill=new THREE.DirectionalLight(0x6188a0,1);fill.position.set(50,25,-40);scene.add(fill);
  root=new THREE.Group();scene.add(root);
  controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.045;controls.enablePan=true;controls.enableZoom=true;controls.enabled=interactive;controls.minDistance=.4;controls.maxDistance=360;controls.minPolarAngle=.2;controls.maxPolarAngle=Math.PI*.85;controls.rotateSpeed=.45;controls.zoomSpeed=.7;
  controls.addEventListener('start',()=>{dragging=true;state.draggedAt=performance.now()/1000;});
  controls.addEventListener('end',()=>{dragging=false;state.draggedAt=performance.now()/1000;});
  setBackground(initialBackground);if(!params.has('bg')&&params.get('transparent')!=='1')document.documentElement.classList.remove('custom-background');setInteractive(interactive);resetView(false);resize();new ResizeObserver(resize).observe($('#bay-hero'));
  renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();$('#error-copy').textContent='The graphics context was interrupted. Reload to rebuild the view.';$('#error-panel').hidden=false;});
}
function setBackground(value){
  if(typeof value!=='string')return false;
  const transparent=value==='transparent',hex=value.replace(/^#/,'');
  if(!transparent&&!/^[0-9a-f]{6}$/i.test(hex))return false;
  document.documentElement.classList.toggle('transparent',transparent);
  document.documentElement.classList.toggle('custom-background',!transparent);
  document.documentElement.style.setProperty('--bg',transparent?'transparent':'#'+hex);
  scene.fog=transparent?null:new THREE.FogExp2('#'+hex,.0018);
  $('#scene').dataset.background=transparent?'transparent':'#'+hex;
  return true;
}
function setInteractive(value){
  interactive=value;controls.enabled=value;
  document.body.classList.toggle('interactive',value);
  $('#scene').dataset.interactive=String(value);
}
// Broad observation stations, visited in a changing deterministic order rather than a short circuit.
const explorationSites=[
  {name:'The Bay, unfolded',position:[100,112,120],target:[0,25,0]},
  {name:'Golden Gate and Headlands',position:[-47,85,42],target:[-6,37,-5]},
  {name:'Marin living landscape',position:[-65,85,-65],target:[-16,24,-23]},
  {name:'Treasure Island and Bay Bridge',position:[66,80,-38],target:[22,39,0]},
  {name:'San Francisco skyline',position:[43,77,43],target:[11,43,8]},
  {name:'East Bay connections',position:[88,93,35],target:[40,33,-3]},
  {name:'The islands and water',position:[15,97,-88],target:[7,28,-17]},
  {name:'City, coast and Presidio',position:[-65,93,65],target:[-4,31,5]}
];
let exploreClock=0,exploreLeg=0,exploreFrom=0,exploreTo=3;
function explorationView(dt){
  exploreClock+=dt*state.cameraSpeed/2;
  const hold=14;
  const travelTime=()=>Math.max(22,new THREE.Vector3(...explorationSites[exploreFrom].position).distanceTo(new THREE.Vector3(...explorationSites[exploreTo].position))/4);
  let travel=travelTime();
  while(exploreClock>=hold+travel){
    exploreClock-=hold+travel;exploreFrom=exploreTo;exploreLeg++;
    // Coprime steps vary the itinerary; never select the current station.
    exploreTo=(exploreFrom+[3,5,2,7,4][exploreLeg%5])%explorationSites.length;travel=travelTime();
  }
  const a=explorationSites[exploreFrom],b=explorationSites[exploreTo];
  const u=clamp((exploreClock-hold)/travel,0,1),k=u*u*u*(u*(u*6-15)+10);
  tourPosition.fromArray(a.position).lerp(new THREE.Vector3(...b.position),k);
  tourTarget.fromArray(a.target).lerp(new THREE.Vector3(...b.target),k);
  // A restrained drift keeps each observation alive, with zero jumps at station changes.
  const breath=Math.sin(Math.PI*clamp(exploreClock/hold,0,1));
  if(exploreClock<hold){tourPosition.x+=breath*2; tourPosition.z+=breath*1.5;}
  tourPosition.y+=Math.sin(Math.PI*k)*7;
  $('#scene').dataset.tourStop=u===0?a.name:`${a.name} → ${b.name}`;
  $('#scene').dataset.explorationLeg=String(exploreLeg);
}
function moveCamera(dt,now){
  const automatic=state.orbit&&state.playing&&!dragging&&now/1000-state.draggedAt>12;
  controls.autoRotate=automatic&&state.cameraMode==='orbit';controls.autoRotateSpeed=.45*state.cameraSpeed;
  let bankTarget=0;
  const touring=automatic&&['tour','explore'].includes(state.cameraMode);
  if(touring){
    if(!wasTourAutomatic)tourOrientation.setFromRotationMatrix(tourLookMatrix.lookAt(camera.position,controls.target,tourUp));
    cameraTravel+=dt*state.cameraSpeed;const phase=(cameraTravel/110)%1;
    $('#scene').dataset.tourProgress=phase.toFixed(4);
    if(state.cameraMode==='explore')explorationView(dt);else{tourPath.getPoint(phase,tourPosition);tourLook.getPoint(phase,tourTarget);}
    const spacing=.18+state.spread*18.5,reference=.18+.82*18.5;
    const close=clamp((76-tourPosition.y)/22,0,1),layerShift=3*(spacing-reference);
    tourPosition.y+=layerShift*close;
    tourTarget.y=mix(tourTarget.y*spacing/reference,tourTarget.y+layerShift,close);
    // Wide shots breathe on narrow embeds; bridge passes retain their precise centerline.
    if(camera.aspect<1.15)tourPosition.sub(tourTarget).multiplyScalar(1+.2*(1-close)).add(tourTarget);
    const follow=mix(.7*Math.sqrt(state.cameraSpeed),24,close);
    const blend=1-Math.exp(-dt*follow);camera.position.lerp(tourPosition,blend);
    // Limit observation rotation independently of translation. Never swing instantly through 180°.
    const focusDistance=Math.max(2,camera.position.distanceTo(tourTarget));
    desiredOrientation.setFromRotationMatrix(tourLookMatrix.lookAt(camera.position,tourTarget,tourUp));
    const angle=tourOrientation.angleTo(desiredOrientation);
    const turnLimit=THREE.MathUtils.degToRad(75)*state.cameraSpeed/4;
    const turn=Math.min(angle*(1-Math.exp(-dt*8*state.cameraSpeed/4)),dt*turnLimit);
    tourOrientation.rotateTowards(desiredOrientation,turn);
    tourDirection.set(0,0,-1).applyQuaternion(tourOrientation);
    controls.target.copy(camera.position).addScaledVector(tourDirection,focusDistance);
    $('#scene').dataset.cameraTurnRate=String(dt>0?+(turn/dt*180/Math.PI).toFixed(2):0);
    $('#scene').dataset.cameraAimError=String(+(tourOrientation.angleTo(desiredOrientation)*180/Math.PI).toFixed(2));
    tourPath.getTangent(phase,tourTangent);tourPath.getTangent((phase+.006)%1,tourAhead);
    tourTurn.crossVectors(tourTangent,tourAhead);
    // A few degrees of damped bank suggest turning forces without a rolling horizon.
    bankTarget=state.cameraMode==='explore'?0:clamp(-tourTurn.y*1.7,-.065,.065);
    if(state.cameraMode==='tour')$('#scene').dataset.tourStop=tourStops[Math.floor(phase*tourStops.length)].name;
  }
  wasTourAutomatic=touring;
  cameraBank=mix(cameraBank,bankTarget,1-Math.exp(-dt*2.2));
  $('#scene').dataset.cameraBank=String(+(cameraBank*180/Math.PI).toFixed(2));
  $('#scene').dataset.cameraMode=state.cameraMode;
  $('#scene').dataset.cameraSpeed=String(state.cameraSpeed);
  $('#scene').dataset.cameraDistance=String(+camera.position.distanceTo(controls.target).toFixed(3));
  $('#scene').dataset.cameraAutomatic=String(automatic);
}
// The embedding parent can configure display options; no arbitrary scripts or data access.
window.addEventListener('message',event=>{
  if(window.parent===window||event.source!==window.parent)return;
  if(params.has('parentOrigin')&&event.origin!==params.get('parentOrigin'))return;
  const m=event.data;if(!m||!controls)return;
  if(m.type==='bay-layers:event'){showEvent(m.event);return;}
  if(m.type!=='bay-layers:configure')return;
  if(typeof m.background==='string')setBackground(m.background);
  if(typeof m.interactive==='boolean')setInteractive(m.interactive);
  if(Number.isFinite(m.speed))state.cameraSpeed=clamp(m.speed,.25,12);
  if(typeof m.playing==='boolean'){
    state.playing=m.playing;$('#play').setAttribute('aria-pressed',state.playing);$('#play').setAttribute('aria-label',state.playing?'Pause motion':'Play motion');$('#play span').textContent=state.playing?'Ⅱ':'▶';
  }
  if(['explore','orbit','tour','static'].includes(m.camera)){state.cameraMode=m.camera;state.orbit=m.camera!=='static';$('#auto-orbit').setAttribute('aria-pressed',state.orbit);}
  if(Number.isFinite(m.separation)){state.spreadTarget=clamp(m.separation,0,1);$('#separation').value=state.spreadTarget;}
  if(Number.isInteger(m.focus)&&m.focus>=-1&&m.focus<=3)setFocus(m.focus);
  if(m.reset===true)resetView();
});

function resetView(animate=true){
  if(animate)state.draggedAt=performance.now()/1000;
  const mobile=$('#bay-hero').clientWidth<700;
  const position=mobile?new THREE.Vector3(176,157,222):new THREE.Vector3(144,121,177);
  if(!animate&&state.cameraMode==='explore'){
    position.fromArray(explorationSites[0].position);tourTarget.fromArray(explorationSites[0].target);
    camera.position.copy(position);controls.target.copy(tourTarget);controls.update();return;
  }
  if(!animate&&state.cameraMode==='tour'){
    tourPath.getPoint(0,position);tourLook.getPoint(0,tourTarget);
    if(mobile)position.sub(tourTarget).multiplyScalar(1.2).add(tourTarget);
    camera.position.copy(position);controls.target.copy(tourTarget);controls.update();return;
  }
  // The model lives slightly to the right, leaving the introduction quiet.
  if(animate){const from=camera.position.clone(),fromTarget=controls.target.clone();let t=0;motions.push({once:true,update:dt=>{t+=dt*.8;const k=1-Math.pow(1-clamp(t,0,1),3);camera.position.lerpVectors(from,position,k);controls.target.lerpVectors(fromTarget,new THREE.Vector3(mobile||isBackdrop?0:-7,mobile?20:16,0),k);return t>=1;}});}else{camera.position.copy(position);controls.target.set(mobile||isBackdrop?0:-7,mobile?20:16,0);controls.update();}
}
function resize(){if(!renderer)return;const {width,height}=$('#bay-hero').getBoundingClientRect();renderer.setSize(width,height);camera.aspect=width/height;camera.updateProjectionMatrix();}

function makeTerrain(){
  for(let level=0;level<4;level++){
    const g=new THREE.Group();g.userData.level=level;g.userData.fade=1;layers.push(g);root.add(g);
    const border=[-50,0,-DEPTH/2,50,0,-DEPTH/2,50,0,-DEPTH/2,50,0,DEPTH/2,50,0,DEPTH/2,-50,0,DEPTH/2,-50,0,DEPTH/2,-50,0,-DEPTH/2];lines(border,COLORS[level],level===0?.32:.15,g);
    const corner=[];for(const x of [-50,50])for(const z of [-DEPTH/2,DEPTH/2]){corner.push(x,-.3,z,x+Math.sign(-x)*3,-.3,z,x,-.3,z,x,-.3,z+Math.sign(-z)*3);}
    lines(corner,COLORS[level],.65,g);
    const fine=[];for(let i=0;i<=40;i++){const x=-50+i*2.5;fine.push(x,-.2,-DEPTH/2,x,-.2,DEPTH/2);}for(let i=0;i<=36;i++){const z=-DEPTH/2+i*DEPTH/36;fine.push(-50,-.2,z,50,-.2,z);}lines(fine,COLORS[level],level===0?.012:.025,g);
    // Each layer shares the same georeferenced relief, allowing a true reassembly.
    const n=128,geom=new THREE.PlaneGeometry(WIDTH,DEPTH,n,n);geom.rotateX(-Math.PI/2);
    const p=geom.attributes.position,colors=new Float32Array(p.count*3),c=new THREE.Color();
    for(let i=0;i<p.count;i++){
      const x=p.getX(i),z=p.getZ(i),h=elevation(x,z);p.setY(i,relief(h));
      if(h<0)c.set(0x0c323e).lerp(new THREE.Color(0x174c59),clamp((h+110)/110,0,1));
      else c.set(0x183c3d).lerp(new THREE.Color(0x53746b),clamp(h/750,0,1));
      colors[i*3]=c.r;colors[i*3+1]=c.g;colors[i*3+2]=c.b;
    }
    geom.setAttribute('color',new THREE.BufferAttribute(colors,3));geom.computeVertexNormals();
    const m=material('MeshStandardMaterial',{vertexColors:true,roughness:.94,metalness:.12,transparent:true,opacity:level===0?.22:level===3?.12:.08,side:THREE.DoubleSide,depthWrite:false});
    const mesh=new THREE.Mesh(geom,m);g.add(mesh);
    const wire=[],oceanWire=[];const step=8;
    for(let z=0;z<=n;z+=step)for(let x=0;x<n;x+=2){const a=z*(n+1)+x,b=a+2;(p.getY(a)<0&&p.getY(b)<0?oceanWire:wire).push(p.getX(a),p.getY(a)+.035,p.getZ(a),p.getX(b),p.getY(b)+.035,p.getZ(b));}
    for(let x=0;x<=n;x+=step)for(let z=0;z<n;z+=2){const a=z*(n+1)+x,b=a+(n+1)*2;(p.getY(a)<0&&p.getY(b)<0?oceanWire:wire).push(p.getX(a),p.getY(a)+.035,p.getZ(a),p.getX(b),p.getY(b)+.035,p.getZ(b));}
    lines(wire,COLORS[level],level===0?.105:.055,g);
    lines(oceanWire,COLORS[level],level===0?.018:.022,g);
  }
  // Survey-block sides reveal that the bottom layer includes the seabed.
  const walls=[],wallIndices=[];
  const rim=[];const n=192;
  for(let i=0;i<=n;i++)rim.push([-50+i*100/n,-DEPTH/2]);
  for(let i=1;i<=n;i++)rim.push([50,-DEPTH/2+i*DEPTH/n]);
  for(let i=1;i<=n;i++)rim.push([50-i*100/n,DEPTH/2]);
  for(let i=1;i<=n;i++)rim.push([-50,DEPTH/2-i*DEPTH/n]);
  for(let i=0;i<rim.length;i++){const [x,z]=rim[i];walls.push(x,relief(elevation(x,z)),z,x,-5,z);if(i){const k=(i-1)*2;wallIndices.push(k,k+1,k+2,k+1,k+3,k+2);}}
  const wg=new THREE.BufferGeometry();wg.setAttribute('position',new THREE.Float32BufferAttribute(walls,3));wg.setIndex(wallIndices);wg.computeVertexNormals();layers[0].add(new THREE.Mesh(wg,material('MeshStandardMaterial',{color:0x102e38,transparent:true,opacity:.18,side:THREE.DoubleSide,roughness:1})));
  const strata=[];for(const y of [-4,-3,-2])for(let i=1;i<rim.length;i++)strata.push(rim[i-1][0],y,rim[i-1][1],rim[i][0],y,rim[i][1]);lines(strata,0x3e8790,.14,layers[0]);
  makeContours();
}
function packedGeometry(data){
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Int16BufferAttribute(data,3));g.boundingSphere=new THREE.Sphere(new THREE.Vector3(),80*512);return g;
}
function packedLines(data,color,opacity,group){
  const m=material('LineBasicMaterial',{color,transparent:true,opacity,depthWrite:false,blending:THREE.AdditiveBlending});
  const mesh=new THREE.LineSegments(packedGeometry(data),m);mesh.scale.setScalar(1/512);group.add(mesh);return mesh;
}
function makeContours(){
  packedLines(packedContours,0x8ac3bc,.19,layers[0]);
  for(let level=0;level<4;level++)packedLines(packedCoast,COLORS[level],level===0?.65:.38,layers[level]);
}

function makeHydrography(data){
  const segments=[];let count=0;
  for(const f of data.features){
    const paths=f.geometry.type==='MultiLineString'?f.geometry.coordinates:[f.geometry.coordinates];
    for(const path of paths)for(let i=1;i<path.length;i++){
      let [ax,az]=xy(...path[i-1]),[bx,bz]=xy(...path[i]);
      // Clip each segment to this geographic slice (Liang–Barsky).
      const dx=bx-ax,dz=bz-az;let lo=0,hi=1,valid=true;
      for(const [p,q] of [[-dx,ax+50],[dx,50-ax],[-dz,az+DEPTH/2],[dz,DEPTH/2-az]]){
        if(p===0){if(q<0)valid=false;}else{const t=q/p;if(p<0)lo=Math.max(lo,t);else hi=Math.min(hi,t);}
      }
      if(!valid||lo>hi)continue;
      const x1=ax+dx*lo,z1=az+dz*lo,x2=ax+dx*hi,z2=az+dz*hi;
      segments.push(x1,ground(x1,z1)+.16,z1,x2,ground(x2,z2)+.16,z2);count++;
    }
  }
  lines(segments,0x78e6ed,.82,layers[0]);
  stats.hydrographyFeatures=data.features.length;stats.hydrographySegments=count;
}

function makeForces(){
  const g=layers[1],count=610,ps=new Float32Array(count*6),col=new Float32Array(count*6),s=[];
  for(let i=0;i<count;i++){s.push({x:rng()*100-50,z:rng()*DEPTH-DEPTH/2,y:.8+rng()*6,t:rng(),speed:.012+rng()*.016,len:.5+rng()*1.3});const color=new THREE.Color(i%4===0?0xd6eddd:0x76bed4);for(let k=0;k<2;k++){const shade=k===0?.18:1;col.set([color.r*shade,color.g*shade,color.b*shade],i*6+k*3);}}
  const geom=new THREE.BufferGeometry();geom.setAttribute('position',new THREE.BufferAttribute(ps,3));geom.setAttribute('color',new THREE.BufferAttribute(col,3));
  g.add(new THREE.LineSegments(geom,material('LineBasicMaterial',{vertexColors:true,transparent:true,opacity:.6,depthWrite:false,blending:THREE.AdditiveBlending})));
  function flow(t){for(let i=0;i<count;i++){const q=s[i],u=((q.t+t*q.speed)%1),x=u*108-54,z=q.z+Math.sin(x*.07+q.z*.1)*1.4,y=Math.max(.3,ground(clamp(x,-50,50),z))+q.y;const fade=Math.sin(u*Math.PI);ps.set([x,y,z,x+q.len*fade,y+.03,z+.05],i*6);}geom.attributes.position.needsUpdate=true;}
  motions.push({update:(_,t)=>flow(t)});flow(0);
  const currentSeeds=[];for(let i=0;i<145;i++){const x=rng()*100-50,z=rng()*DEPTH-DEPTH/2;if(elevation(x,z)<-1)currentSeeds.push({x,z,p:rng()});}
  const cps=new Float32Array(currentSeeds.length*6),cg=new THREE.BufferGeometry();cg.setAttribute('position',new THREE.BufferAttribute(cps,3));g.add(new THREE.LineSegments(cg,material('LineBasicMaterial',{color:0x6de5db,transparent:true,opacity:.38,depthWrite:false,blending:THREE.AdditiveBlending})));
  motions.push({update:(_,t)=>{currentSeeds.forEach((s,i)=>{const phase=t*.15+s.p*6,x=s.x+Math.sin(phase)*1.2,z=s.z+Math.cos(phase*.7)*1.2;if(elevation(x,z)>1){cps.fill(0,i*6,i*6+6);return;}cps.set([x,.15,z,x+.2*Math.cos(phase),.17,z+.7*Math.sin(phase)],i*6);});cg.attributes.position.needsUpdate=true;}});
  // Solar rays travel through the slice. Their angle follows the illustrative day.
  const rays=[];for(let i=0;i<12;i++)rays.push(-43+i*7.5,10,-29,-43+i*7.5,1,-21);
  const sunlight=lines(rays,0xf2d8a1,.1,g);sunlight.userData.sunlight=true;
  motions.push({update:()=>{const daylight=Math.max(0,Math.sin((state.time-6)/24*Math.PI*2));sunlight.material.userData.dynamicGain=daylight;sunlight.rotation.y=Math.sin(state.time/24*Math.PI*2)*.15;}});
  makeClouds(g);
}
function makeClouds(g){
  // Low-density illustrated marine fog, leaving the land and shorelines legible.
  for(let i=0;i<7;i++){
    const m=material('SpriteMaterial',{color:0xb6d3dc,map:GLOW,transparent:true,opacity:.045,depthWrite:false,blending:THREE.AdditiveBlending});
    const cloud=new THREE.Sprite(m);cloud.scale.set(7+i%3*2,.7+i%2*.35,1);g.add(cloud);
    const x=-36+i*5.6,z=-8+Math.sin(i*.8)*4;
    motions.push({update:(_,t)=>{cloud.position.set(x+Math.sin(t*.015+i)*2.4,8.5+Math.sin(i)*.3,z+Math.sin(t*.019+i)*1.2);m.userData.dynamicGain=.65+Math.sin(t*.05+i)*.25;}});
  }
}

function makeLivingSystems(){
  const g=layers[2],positions=[],stems=[],colors=[];
  const green=new THREE.Color();
  // Mapped points: historical municipal street trees, kept separate from forest sketches.
  for(const t of trees){const [x,z]=xy(t[0],t[1]);if(Math.abs(x)>50||Math.abs(z)>DEPTH/2)continue;const y=ground(x,z),h=.16+Math.min(t[2]||10,50)*.006;positions.push(x,y+h,z);green.set(rng()<.12?0xbfd8a4:0x70b9a3);colors.push(green.r,green.g,green.b);if(rng()<.25)stems.push(x,y,z,x,y+h,z);}
  const actualCount=positions.length/3;
  const forest=[];
  // Artistic forest distribution follows hills and known park regions, not a canopy product.
  for(let i=0;i<30000;i++){
    const x=rng()*100-50,z=rng()*DEPTH-DEPTH/2,h=elevation(x,z);
    const [gx,gz]=xy(-122.48,37.77),[px,pz]=xy(-122.465,37.798);
    const park=(Math.abs(x-gx)<8&&Math.abs(z-gz)<1.6)||(Math.abs(x-px)<3.6&&Math.abs(z-pz)<2.8);
    const south=z>xy(-122.46,37.805)[1];
    if(h>15&&south&&((park&&rng()<.85)||(h>140&&rng()<.12))){forest.push(x,relief(h)+.2+rng()*.45,z);}
  }
  const tp=points(positions,0x9ad8b1,.42,.8,g);tp.geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));tp.material.vertexColors=true;
  const fp=points(forest,0x6ab6a2,.35,.46,g);lines(stems,0x90c7a4,.18,g);
  const slowGlow=fp.material;motions.push({update:(_,t)=>{slowGlow.userData.dynamicGain=.85+Math.sin(t*.3)*.15;}});
  stats.treePoints=actualCount;stats.illustrativeCanopyPoints=forest.length/3;
  // Birds sketch the shape of movement without asserting measured animal tracks.
  const birds=30,bp=new Float32Array(birds*12),bg=new THREE.BufferGeometry();bg.setAttribute('position',new THREE.BufferAttribute(bp,3));g.add(new THREE.LineSegments(bg,material('LineBasicMaterial',{color:0xd7ebbd,transparent:true,opacity:.65,depthWrite:false})));
  const seeds=Array.from({length:birds},()=>({r:2+rng()*8,x:-22+rng()*35,z:-29+rng()*40,y:1+rng()*3,p:rng()*Math.PI*2,s:.06+rng()*.08}));
  motions.push({update:(_,t)=>{seeds.forEach((s,i)=>{const a=s.p+t*s.s,x=s.x+Math.sin(a)*s.r,z=s.z+Math.cos(a)*s.r*.6,y=ground(x,z)+s.y,wing=Math.sin(t*5+s.p)*.12;bp.set([x-.22,y+wing,z,x,y,z+.06,x,y,z+.06,x+.22,y+wing,z],i*12);});bg.attributes.position.needsUpdate=true;}});
  const fish=[];for(let i=0;i<130;i++){const x=-8+rng()*35,z=-19+rng()*57;if(elevation(x,z)<-2)fish.push(x,.2,z);}
  const fishPoints=points(fish,0xaadacc,.23,.5,g);motions.push({update:(_,t)=>{fishPoints.rotation.y=Math.sin(t*.06)*.016;}});
  makeWhale(g);
}

function makeVegetation(data){
  const groups=[null,[],[],[]],stems=[],n=data.grid;
  // Jitter the sampled patches within their cells; these are not individual tree locations.
  for(const [i,j,kind,h] of data.points){
    const x=((i+.5+(rng()-.5)*.6)/n-.5)*WIDTH,z=((j+.5+(rng()-.5)*.6)/n-.5)*DEPTH;
    if(elevation(x,z)<1)continue;
    const y=ground(x,z),height=kind===1?Math.max(.13,Math.min(h/4,35)*.0105):kind===2?.10:.035;
    groups[kind].push(x,y+height,z);
    if(kind===1&&rng()<.15)stems.push(x,y+.02,z,x,y+height,z);
  }
  points(groups[1],0x99dfb5,.43,.73,layers[2]);
  points(groups[2],0x79bfa6,.25,.42,layers[2]);
  points(groups[3],0xbbcf91,.19,.28,layers[2]);
  lines(stems,0x80c9ad,.28,layers[2]);
  stats.mappedWoodlandPatches=groups[1].length/3;stats.mappedScrubPatches=groups[2].length/3;stats.mappedHerbaceousPatches=groups[3].length/3;
}

function makeBuiltWorld(){
  const g=layers[3];
  const city=new THREE.Mesh(packedGeometry(packedCity),material('MeshBasicMaterial',{color:0xbca078,transparent:true,opacity:.07,side:THREE.DoubleSide,depthWrite:false}));city.scale.setScalar(1/512);g.add(city);
  const buildingWire=packedLines(packedEdges,0xe7b471,.42,g);buildingWire.material.blending=THREE.NormalBlending;buildingWire.material.userData.cityLights=true;
  stats.buildings=buildings.length;
  makeBuildingLights(g);
  const roadPositions=[],routes=[];
  for(const path of streets){const pts=path.map(c=>world(c[0],c[1],.07));for(let i=1;i<pts.length;i++){if(pts[i].distanceTo(pts[i-1])>8)continue;roadPositions.push(...pts[i-1].toArray(),...pts[i].toArray());if(pts[i].distanceTo(pts[i-1])>.12)routes.push([pts[i-1],pts[i]]);}}
  const road=lines(roadPositions,0xe2bb88,.17,g);road.material.userData.cityLights=true;stats.streetSegments=streets.length;
  const carCount=760,cpos=new Float32Array(carCount*3),car=points(cpos,0xffe2ae,.42,.9,g),seeds=Array.from({length:carCount},()=>({route:routes[Math.floor(rng()*routes.length)],p:rng(),s:.09+rng()*.17,reverse:rng()<.5}));
  const carStreaks=new Float32Array(carCount*6),carLines=lines(carStreaks,0xffd39b,.48,g);
  car.material.userData.cityLights=true;
  motions.push({update:(_,t)=>{seeds.forEach((s,i)=>{if(!s.route)return;const u=(s.p+t*s.s)%1,at=s.reverse?1-u:u,behind=clamp(at+(s.reverse?.07:-.07),0,1);tmp.lerpVectors(s.route[0],s.route[1],at);tmp.y+=.06;cpos.set(tmp.toArray(),i*3);const tail=s.route[0].clone().lerp(s.route[1],behind);tail.y+=.06;carStreaks.set([...tail.toArray(),...tmp.toArray()],i*6);});car.geometry.attributes.position.needsUpdate=true;carLines.geometry.attributes.position.needsUpdate=true;}});
  stats.animatedCityCars=carCount;
  makeBridge([-122.47445,37.80855],[-122.4822,37.8329],0xf1a979,true,g);
  makeBridge([-122.3897,37.789],[-122.365,37.813],0xe6cda3,false,g);
  makeBridge([-122.365,37.813],[-122.300,37.8245],0xe6cda3,false,g);
  // Simplified geographic landmark silhouettes (not survey-quality building models).
  landmarkTower(-122.3965,37.7898,3.2,.30,.41,'salesforce',g);
  landmarkTower(-122.4034,37.7952,2.7,.32,.32,'pyramid',g);
  makeBeacons(g);
  makeFlight(g);
  makeVessels(g);
  makeTransbayTube(g);
  // Utility relationships are schematic: moving signals, not an underground utility map.
  const utility=[[-122.511,37.776],[-122.471,37.77],[-122.447,37.775],[-122.418,37.779],[-122.398,37.791]];
  const up=utility.map(p=>world(...p,.1));trail(up.map(p=>[p.x,p.y-.3,p.z]),0x77b5c1,.33,g);
  const packet=points([0,0,0],0xa6f3e7,.65,.85,g);
  motions.push({update:(_,t)=>{if(!Number.isFinite(t))return;const f=((t*.08)%1+1)%1,k=f*(up.length-1),i=Math.min(up.length-2,Math.floor(k));tmp.lerpVectors(up[i],up[i+1],k-i);packet.position.copy(tmp);packet.position.y-=.3;}});
}
function makeBeacons(g){
  // Artistic placements on sampled tall buildings and modeled bridge towers, not surveyed lamps.
  const sites=[],cells=new Set();
  for(const b of [...buildings].sort((a,b)=>b.h-a.h)){
    if(b.h<65||sites.length>=48)continue;
    const [x,z]=xy(...b.c),key=`${Math.floor(x/1.3)},${Math.floor(z/1.3)}`;
    if(cells.has(key))continue;cells.add(key);sites.push([x,ground(x,z)+b.h*.0105+.08,z]);
  }
  for(const [a,b,h] of [[[-122.47445,37.80855],[-122.4822,37.8329],2.5],[[-122.3897,37.789],[-122.365,37.813],1.8],[[-122.365,37.813],[-122.300,37.8245],1.8]]){
    const start=world(...a),end=world(...b);
    for(const f of [.25,.75]){const v=start.clone().lerp(end,f);sites.push([v.x,h,v.z]);}
  }
  const lamps=points(sites.flat(),0xff453b,.52,.95,g),colors=new Float32Array(sites.length*3);
  lamps.geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));lamps.material.vertexColors=true;
  motions.push({update:(_,t)=>{
    const daylight=Math.max(0,Math.sin((state.time-6)/24*Math.PI*2));
    for(let i=0;i<sites.length;i++){
      const phase=(t/2.8+(i%7)/7)%1,pulse=Math.pow(Math.max(0,Math.sin(phase*Math.PI*2)),10);
      const gain=(.1+.9*pulse)*(1-daylight*.72);colors.set([gain,gain,gain],i*3);
    }
    lamps.geometry.attributes.color.needsUpdate=true;
  }});stats.illustrativeBeacons=sites.length;
}

const activeEvents=[];
function removeEvent(e){e.group.removeFromParent();e.ring.geometry.dispose();e.ring.material.dispose();e.label.remove();}
function showEvent(input){
  if(!state.ready||!input||typeof input!=='object')return false;
  const {longitude:lon,latitude:lat}=input;
  if(!Number.isFinite(lon)||!Number.isFinite(lat)||lon<BOUNDS[0]||lon>BOUNDS[2]||lat<BOUNDS[1]||lat>BOUNDS[3]||typeof input.title!=='string'||!input.title.trim())return false;
  if(activeEvents.length>=12)removeEvent(activeEvents.shift());
  const duration=clamp(Number.isFinite(input.duration)?input.duration:8,2,30);
  const color=typeof input.color==='string'&&/^#[0-9a-f]{6}$/i.test(input.color)?input.color:'#9ef3db';
  const group=new THREE.Group(),p=world(lon,lat,.24);group.position.copy(p);layers[3].add(group);
  const ring=new THREE.Mesh(new THREE.RingGeometry(.43,.48,48),new THREE.MeshBasicMaterial({color,transparent:true,opacity:0,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending}));
  ring.rotation.x=-Math.PI/2;group.add(ring);
  const label=document.createElement('div');label.className='location-event';label.style.color=color;label.textContent=input.title.trim().slice(0,140);$('#bay-hero').appendChild(label);
  activeEvents.push({group,ring,label,duration,age:0});$('#scene').dataset.activeEvents=String(activeEvents.length);return true;
}
function updateEvents(dt){
  const w=$('#bay-hero').clientWidth,h=$('#bay-hero').clientHeight;
  for(let i=activeEvents.length-1;i>=0;i--){
    const e=activeEvents[i];e.age+=dt;
    if(e.age>=e.duration){removeEvent(e);activeEvents.splice(i,1);continue;}
    const fade=Math.min(1,e.age/.7,(e.duration-e.age)/1.5),pulse=(e.age%2.8)/2.8;
    e.ring.scale.setScalar(reducedMotion?1:1+pulse*4);e.ring.material.opacity=fade*(reducedMotion?.6:1-pulse)*(state.focus<0||state.focus===3?1:.09);
    const p=e.group.getWorldPosition(new THREE.Vector3()).project(camera),x=(p.x*.5+.5)*w,y=(-p.y*.5+.5)*h;
    const visible=p.z>=-1&&p.z<=1&&x>0&&x<w&&y>0&&y<h&&(state.focus<0||state.focus===3);
    e.label.style.transform=`translate(${x}px,${y-14}px) translate(-50%,-100%)`;e.label.style.opacity=visible?String(fade):'0';
  }
  $('#scene').dataset.activeEvents=String(activeEvents.length);
}
function landmarkTower(lon,lat,height,w,d,type,g){
  const p=world(lon,lat);let geom;if(type==='pyramid'){geom=new THREE.ConeGeometry(w,height,4);geom.rotateY(Math.PI/4);}else geom=new THREE.CylinderGeometry(w*.8,w,height,8);
  geom.translate(p.x,p.y+height*.5,p.z);const edges=new THREE.EdgesGeometry(geom);const obj=new THREE.LineSegments(edges,material('LineBasicMaterial',{color:0xf6dbac,transparent:true,opacity:.9,depthWrite:false}));g.add(obj);
}
function makeBridge(start,end,color,gate,g){
  const a=world(...start),b=world(...end);a.y=b.y=.65;const v=new THREE.Vector3().subVectors(b,a),side=new THREE.Vector3(v.z,0,-v.x).normalize().multiplyScalar(gate?.15:.11),ps=[],decks=[];
  for(const s of [-1,1]){const aa=a.clone().addScaledVector(side,s),bb=b.clone().addScaledVector(side,s);ps.push(...aa.toArray(),...bb.toArray());}
  const height=gate?1.8:1.1;
  for(const f of [.25,.75]){const p=a.clone().lerp(b,f);for(const s of [-1,1]){const q=p.clone().addScaledVector(side,s);ps.push(q.x,.35,q.z,q.x,height+.65,q.z);}for(const y of [height*.35+.65,height*.75+.65])ps.push(p.x-side.x,y,p.z-side.z,p.x+side.x,y,p.z+side.z);}
  for(const s of [-1,1]){
    let prev;
    for(let i=0;i<=70;i++){const t=i/70,p=a.clone().lerp(b,t).addScaledVector(side,s);let y;if(t<.25)y=mix(.66,height+.65,t/.25);else if(t>.75)y=mix(height+.65,.66,(t-.75)/.25);else y=.85+(height-.2)*Math.pow((t-.5)/.25,2);p.y=y;if(prev)ps.push(...prev.toArray(),...p.toArray());if(i%3===0)ps.push(p.x,.65,p.z,p.x,y,p.z);prev=p;}
  }
  lines(ps,color,.9,g);
  const cars=gate?38:32,dots=points(new Float32Array(cars*3),0xffe5b1,.43,.95,g),streaks=lines(new Float32Array(cars*6),0xffd39b,.74,g);
  const phase=gate?.14:.39;
  motions.push({update:(_,t)=>{const p=dots.geometry.attributes.position,q=streaks.geometry.attributes.position;for(let i=0;i<cars;i++){const reverse=i%2===0,u=(i/cars+t*(gate?.036:.043)+phase)%1,f=reverse?1-u:u,lane=reverse?-.34:.34;tmp.lerpVectors(a,b,f).addScaledVector(side,lane);p.setXYZ(i,tmp.x,.72,tmp.z);q.setXYZ(i*2,tmp.x,.72,tmp.z);const back=clamp(f+(reverse?.005:-.005),0,1);tmp.lerpVectors(a,b,back).addScaledVector(side,lane);q.setXYZ(i*2+1,tmp.x,.72,tmp.z);}p.needsUpdate=true;q.needsUpdate=true;}});
}
function makeFlight(g){
  const paths=[[[18,9,48],[32,13,10],[9,16,-37]],[[-39,12,28],[-12,16,9],[31,18,-40]]];
  for(const coords of paths){const curve=new THREE.CatmullRomCurve3(coords.map(c=>new THREE.Vector3(...c)));const pts=curve.getPoints(100);trail(pts.map(p=>p.toArray()),0x9fc2c2,.07,g);
    const planeG=new THREE.BufferGeometry();const planeArray=new Float32Array(12);planeG.setAttribute('position',new THREE.BufferAttribute(planeArray,3));g.add(new THREE.LineSegments(planeG,material('LineBasicMaterial',{color:0xe8dfc7,transparent:true,opacity:.9,depthWrite:false})));
    const lead=points([0,0,0],0xcee9df,.44,.7,g);const seed=rng();
    motions.push({update:(_,t)=>{const u=(seed+t*.012)%1,p=curve.getPoint(u),v=curve.getTangent(u),s=new THREE.Vector3(v.z,0,-v.x).multiplyScalar(.3);planeArray.set([p.x-s.x,p.y,p.z-s.z,p.x+s.x,p.y,p.z+s.z,p.x-v.x*.25,p.y,p.z-v.z*.25,p.x+v.x*.38,p.y,p.z+v.z*.38]);planeG.attributes.position.needsUpdate=true;lead.position.copy(p);}});
  }
}
function makeVessels(g){
  const routes=[[[-122.411,37.824],[-122.394,37.842],[-122.375,37.851]],[[-122.397,37.808],[-122.372,37.827],[-122.353,37.843]],[[-122.437,37.816],[-122.417,37.831],[-122.402,37.847]]];
  for(let i=0;i<3;i++){
    const path=new THREE.CatmullRomCurve3(routes[i].map(c=>{const [x,z]=xy(...c);return new THREE.Vector3(x,.26,z);}));
    const boat=new THREE.Group();g.add(boat);
    const hull=[0,0,-.45,-.17,0,.27,-.17,0,.27,.17,0,.27,.17,0,.27,0,0,-.45,0,0,.05,0,.95,.05,0,.95,.05,-.03,.1,-.30,-.03,.1,-.30,0,.12,.23,0,.12,.23,0,.95,.05,0,.82,.05,.27,.1,.22,.27,.1,.22,0,.12,.20];
    lines(hull,0xe3e1c5,.72,boat);
    const sail=new THREE.BufferGeometry();sail.setAttribute('position',new THREE.Float32BufferAttribute([0,.93,.05,-.03,.12,-.30,0,.12,.23,0,.80,.05,.27,.12,.22,0,.12,.20],3));
    boat.add(new THREE.Mesh(sail,material('MeshBasicMaterial',{color:0xcde5ce,transparent:true,opacity:.13,side:THREE.DoubleSide,depthWrite:false})));
    const wake=lines([-.1,0,.32,-.22,0,1.45,.1,0,.32,.22,0,1.45],0x9fc5c2,.14,boat);
    motions.push({update:(_,t)=>{const phase=t*.026+i*1.7,u=.5-.5*Math.cos(phase),p=path.getPoint(u),v=path.getTangent(u);boat.position.copy(p);boat.visible=elevation(p.x,p.z)<-1;boat.rotation.y=Math.atan2(-v.x,-v.z)+(Math.sin(phase)<0?Math.PI:0);boat.rotation.z=Math.sin(t*.8+i)*.045;wake.material.userData.dynamicGain=.7+Math.sin(t*.6+i)*.3;}});
  }
  stats.sailboats=3;
}
function makeTransbayTube(g){
  // Approximate diagram anchored to Embarcadero and West Oakland, not surveyed alignment/depth.
  const route=[[-122.397,37.7929],[-122.389,37.7917],[-122.374,37.7898],[-122.348,37.7938],[-122.326,37.8008],[-122.304,37.8043],[-122.2946,37.8049]];
  const center=new THREE.CatmullRomCurve3(route.map(c=>{const [x,z]=xy(...c);return new THREE.Vector3(x,Math.min(-.45,relief(elevation(x,z))-.25),z);}));
  const rails=[],rings=[];
  for(const bore of [-1,1])for(let i=0;i<150;i++){
    const p=center.getPoint(i/150),q=center.getPoint((i+1)/150),v=center.getTangent(i/150),s=new THREE.Vector3(v.z,0,-v.x).normalize().multiplyScalar(.085*bore);p.add(s);q.add(s);rails.push(...p.toArray(),...q.toArray());
    if(i%8===0)for(let j=0;j<8;j++){const a=j/8*Math.PI*2,b=(j+1)/8*Math.PI*2;for(const angle of [a,b])rings.push(p.x+s.x*Math.cos(angle)*.65,p.y+Math.sin(angle)*.06,p.z+s.z*Math.cos(angle)*.65);}
  }
  const tube=lines(rails,0x96bedf,.25,g),ribs=lines(rings,0x96bedf,.15,g);
  const trainPositions=new Float32Array(2*5*6),train=lines(trainPositions,0xc2ecff,.86,g),heads=points(new Float32Array(6),0xc3f1ff,.65,.9,g);
  const stations=route.filter((_,i)=>i===0||i===route.length-1).map(c=>{const [x,z]=xy(...c);return[x,.13,z];});points(stations.flat(),0xbcdbe9,.7,.6,g);
  motions.push({update:(_,t)=>{
    const gain=state.focus===3?1.55:.7;tube.material.userData.dynamicGain=gain;ribs.material.userData.dynamicGain=gain;
    for(let i=0;i<2;i++){
      const u=(t*.017+i*.53+.18)%1,reverse=i===1,at=reverse?1-u:u,v=center.getTangent(at),side=new THREE.Vector3(v.z,0,-v.x).normalize().multiplyScalar(reverse?.085:-.085);
      const p=center.getPoint(at).add(side);heads.geometry.attributes.position.setXYZ(i,p.x,p.y+.03,p.z);
      for(let car=0;car<5;car++)for(let end=0;end<2;end++){const f=clamp(at+(reverse?1:-1)*(car*.0032+end*.0025),0,1),q=center.getPoint(f).add(side);trainPositions.set([q.x,q.y+.02,q.z],(i*10+car*2+end)*3);}
    }train.geometry.attributes.position.needsUpdate=true;heads.geometry.attributes.position.needsUpdate=true;
  }});
  stats.transbayTrains=2;
}
function makeBuildingLights(g){
  const positions=[],seeds=[];
  for(let i=0;i<buildings.length;i+=3){const b=buildings[i];if(b.h<12)continue;const [x,z]=xy(...b.c),y=ground(x,z),h=b.h*.0105;for(let j=0;j<3;j++){positions.push(x+(j-1)*.045,y+h*(.3+j*.22),z+.04);seeds.push((i%23)/23);}}
  const light=points(positions,0xffcc86,.22,.8,g),color=new Float32Array(positions.length),warm=new THREE.Color(0xffcc86);
  light.material.vertexColors=true;light.geometry.setAttribute('color',new THREE.BufferAttribute(color,3));
  let previous=-1;
  motions.push({update:()=>{if(Math.abs(state.time-previous)<.025)return;previous=state.time;const hour=state.time<7?state.time+24:state.time;for(let i=0;i<seeds.length;i++){const dusk=17.2+seeds[i]*2.4,dawn=28.6+seeds[i]*1.3;const on=THREE.MathUtils.smoothstep(hour,dusk,dusk+1)*(1-THREE.MathUtils.smoothstep(hour,dawn,dawn+.9));color.set([warm.r*on,warm.g*on,warm.b*on],i*3);}light.geometry.attributes.color.needsUpdate=true;}});
  stats.illustrativeWindowLights=seeds.length;
}
function makeWhale(g){
  // A quiet, occasional illustrative visitor. It is not an animal-location feed.
  const whale=new THREE.Group();g.add(whale);
  const outline=[0,.025,-.8,-.18,.02,-.55,-.18,.02,-.55,-.23,.01,-.12,-.23,.01,-.12,-.16,0,.38,-.16,0,.38,0,0,.63,0,0,.63,.16,0,.38,.16,0,.38,.23,.01,-.12,.23,.01,-.12,.18,.02,-.55,.18,.02,-.55,0,.025,-.8,-.18,.02,-.3,-.44,0,.10,.18,.02,-.3,.44,0,.10,0,0,.63,-.38,.02,.86,-.38,.02,.86,-.08,0,.81,0,0,.63,.38,.02,.86,.38,.02,.86,.08,0,.81];
  const shape=lines(outline,0xb1d9c5,.58,whale),ripple=lines(new Float32Array(64*6),0x86baa9,.2,whale),spout=lines([0,.05,-.52,-.06,.3,-.52,-.06,.3,-.52,-.13,.4,-.50,0,.05,-.52,.05,.32,-.52,.05,.32,-.52,.12,.41,-.5],0xd0ebdb,.30,whale);
  const path=new THREE.CatmullRomCurve3([[-122.454,37.826],[-122.434,37.834],[-122.416,37.844]].map(c=>{const [x,z]=xy(...c);return new THREE.Vector3(x,.18,z);}));
  motions.push({update:(_,t)=>{const cycle=((t+11)%85)/85,reveal=Math.sin(Math.PI*clamp(cycle/.25,0,1)),u=(t*.0022+.3)%1,p=path.getPoint(u),v=path.getTangent(u);whale.position.copy(p);whale.rotation.y=Math.atan2(-v.x,-v.z);whale.visible=cycle<.25&&elevation(p.x,p.z)<-1;shape.material.userData.dynamicGain=Math.max(0,reveal);spout.material.userData.dynamicGain=Math.max(0,Math.sin(cycle/.25*Math.PI*3))*reveal;
    const ps=ripple.geometry.attributes.position;for(let i=0;i<64;i++){const radius=.5+cycle*4,a=i/64*Math.PI*2,b=(i+1)/64*Math.PI*2;ps.setXYZ(i*2,Math.cos(a)*radius,.015,Math.sin(a)*radius*.55);ps.setXYZ(i*2+1,Math.cos(b)*radius,.015,Math.sin(b)*radius*.55);}ps.needsUpdate=true;ripple.material.userData.dynamicGain=reveal;}});
  stats.illustrativeWhales=1;
}
function makeConnections(){
  const anchors=[[-122.478,37.819],[-122.44,37.77],[-122.4,37.79]],positions=[];
  for(const p of anchors){const [x,z]=xy(...p);positions.push(x,0,z,x,60,z);}
  const link=lines(positions,0x95c5b6,.06,root);
  motions.push({update:()=>{const p=link.geometry.attributes.position;for(let i=0;i<anchors.length;i++){const [x,z]=xy(...anchors[i]);p.setXYZ(i*2,x,ground(x,z)+.1,z);p.setXYZ(i*2+1,x,ground(x,z)+layers[3].position.y+.1,z);}p.needsUpdate=true;link.material.opacity=.045*state.spread;}});
  const dust=[];for(let i=0;i<280;i++)dust.push((rng()-.5)*190,rng()*100-12,(rng()-.5)*140);points(dust,0x4d899b,.13,.18,root);
}

function updateAnnotations(){
  const w=$('#bay-hero').clientWidth,h=$('#bay-hero').clientHeight;
  for(const [id,lon,lat,level,dx,dy] of [['transamerica',-122.4034,37.7952,3,10,-14],['treasure',-122.371,37.824,3,10,-12],['gate',-122.478,37.820,3,12,-14],['sf',-122.43,37.758,3,-12,18],['marin',-122.53,37.868,0,-20,-12],['bart',-122.342,37.796,3,8,16],['alcatraz',-122.423,37.827,0,7,-9],['angel',-122.4326,37.862,2,10,-8],['baybridge',-122.376,37.801,3,8,-15],['presidio',-122.466,37.798,2,-14,15]]){
    const p=world(lon,lat);p.y+=layers[level].position.y+.8;p.applyMatrix4(root.matrixWorld).project(camera);
    const el=$('#landmark-'+id),x=(p.x*.5+.5)*w+dx,y=(-p.y*.5+.5)*h+dy;
    el.style.transform=`translate(${x}px,${y}px)`;el.style.opacity=(id==='bart'?state.focus===3:state.focus<0||state.focus===level)&&p.z>=-1&&p.z<=1&&x>15&&x<w-110&&y>88&&y<h-150?'.82':'0';
  }
}
function setupUI(){
  $('#sources-open').addEventListener('click',()=>$('#sources-dialog').showModal());
  $('#sources-dialog').addEventListener('click',e=>{if(e.target===$('#sources-dialog'))$('#sources-dialog').close();});
  const setPlay=()=>{$('#play').setAttribute('aria-pressed',state.playing);$('#play').setAttribute('aria-label',state.playing?'Pause motion':'Play motion');$('#play span').textContent=state.playing?'Ⅱ':'▶';};
  $('#play').addEventListener('click',()=>{state.playing=!state.playing;setPlay();});setPlay();
  $('#time').addEventListener('input',e=>state.time=+e.target.value);
  $('#separation').addEventListener('input',e=>{state.spreadTarget=+e.target.value;updateAssemble();});
  function updateAssemble(){$('#assemble').innerHTML=state.spreadTarget<.1?'Unfold the layers <span>↗</span>':'Bring together <span>↘</span>';}
  $('#assemble').addEventListener('click',()=>{state.spreadTarget=state.spreadTarget<.1?.82:0;$('#separation').value=state.spreadTarget;updateAssemble();});
  $('#view-reset').addEventListener('click',()=>{resetView();setFocus(-1);});
  $('#auto-orbit').setAttribute('aria-pressed',state.orbit);$('#auto-orbit').addEventListener('click',()=>{state.orbit=!state.orbit;if(state.orbit&&state.cameraMode==='static')state.cameraMode='orbit';$('#auto-orbit').setAttribute('aria-pressed',state.orbit);});
  document.querySelectorAll('[data-layer]').forEach(el=>el.addEventListener('click',()=>setFocus(state.focus===+el.dataset.layer?-1:+el.dataset.layer)));
  window.addEventListener('keydown',e=>{if(e.target.matches('input,button,a')||$('#sources-dialog').open)return;if(e.code==='Space'){e.preventDefault();state.playing=!state.playing;setPlay();}if(e.code==='Escape')setFocus(-1);if(['Digit1','Digit2','Digit3','Digit4'].includes(e.code))setFocus(+e.code.at(-1)-1);});
}
const captions=[
  'Earth & seabed / NOAA mapped relief reveals the shape beneath both land and water. Vertical scale is exaggerated.',
  'Natural forces / Light, wind and water move through a shared geography. These flows are illustrative.',
  'Living systems / Historical mapped street trees meet illustrative forest cover, birds and an occasional whale.',
  'The built world / Headlights, sailboats and BART reveal life above and below the water. Routes and movement are illustrative.'
];
function setFocus(level){state.focus=level;document.querySelectorAll('[data-layer]').forEach(el=>{el.classList.toggle('selected',+el.dataset.layer===level);el.classList.toggle('dimmed',level>=0&&+el.dataset.layer!==level);el.setAttribute('aria-pressed',+el.dataset.layer===level);});$('#caption').textContent=level<0?'A digital twin connects observations, models and feedback—so we can explore what a change might mean.':captions[level];}
function renderLoop(){
  let last=performance.now(),lastStats=last,lastPaint=0;
  function frame(now){
    requestAnimationFrame(frame);
    if(document.hidden||!sceneInView){last=now;return;}
    if(now-lastPaint<(isBackdrop?1000/30:1000/60)-.5)return;
    lastPaint=now;const dt=clamp((now-last)/1000,0,.05);last=now;
    if(state.playing){state.elapsed+=dt;state.time=(state.time+dt*.065)%24;if(now-lastStats>100)$('#time').value=state.time;}
    state.spread=mix(state.spread,state.spreadTarget,1-Math.exp(-dt*4));
    layers.forEach((g,i)=>{g.position.y=i*(.18+state.spread*18.5);g.userData.reveal=Math.min(1,(g.userData.reveal??1)+dt*1.4);const fade=(state.focus<0||state.focus===i?1:.09)*g.userData.reveal;g.userData.fade=mix(g.userData.fade,fade,1-Math.exp(-dt*4));g.traverse(o=>{if(!o.material)return;const m=o.material;if(m.userData.originalOpacity===undefined)return;const daylight=Math.max(0,Math.sin((state.time-6)/24*Math.PI*2));const night=m.userData.cityLights?1.15-daylight*.3:1;m.opacity=clamp(m.userData.originalOpacity*g.userData.fade*m.userData.dynamicGain*night,0,1);});});
    for(let i=motions.length-1;i>=0;i--){const m=motions[i];if(m.update(dt,state.elapsed)&&m.once)motions.splice(i,1);}
    moveCamera(dt,now);
    controls.update(dt);if(Math.abs(cameraBank)>.00001)camera.rotateZ(cameraBank);scene.updateMatrixWorld();
    const hours=Math.floor(state.time),minutes=Math.floor((state.time-hours)*60);const timeLabel=`${String(hours).padStart(2,'0')}:${String(minutes).padStart(2,'0')}`;if($('#clock').textContent!==timeLabel)$('#clock').textContent=timeLabel;
    const daylight=Math.max(0,Math.sin((state.time-6)/24*Math.PI*2));scene.children.find(o=>o.isHemisphereLight).intensity=.55+daylight*.8;
    updateAnnotations();updateEvents(dt);renderer.render(scene,camera);
    if(now-lastStats>2000){window.bayLayers.stats={...stats,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,points:renderer.info.render.points,frameMs:Math.round(dt*1000),cameraPosition:camera.position.toArray().map(x=>+x.toFixed(2))};$('#scene').dataset.renderStats=JSON.stringify(window.bayLayers.stats);lastStats=now;}
  }requestAnimationFrame(frame);
}
async function fetchAsset(name,type='json'){
  const compressed=typeof DecompressionStream!=='undefined';
  const r=await fetch(`./assets/${name}${compressed?'.gz':''}`);if(!r.ok)throw new Error(`Could not load ${name} (${r.status}).`);
  const response=compressed?new Response(r.body.pipeThrough(new DecompressionStream('gzip'))):r;
  return type==='json'?response.json():response.arrayBuffer();
}
async function boot(){
  try{
    initRenderer();setupUI();
    new IntersectionObserver(entries=>{sceneInView=entries[0].isIntersecting;},{threshold:0}).observe($('#bay-hero'));
    const regionalResult=fetchAsset('regional.json').then(value=>({value}),error=>({error}));
    const vegetationResult=fetchAsset('vegetation.json').then(value=>({value}),error=>({error}));
    const hydroResult=fetchAsset('hydrography.geojson').then(value=>({value}),error=>({error}));
    const cityLoad=Promise.all([fetchAsset('buildings.lite.json'),fetchAsset('trees.json'),fetchAsset('streets.json'),fetchAsset('city.mesh.i16','binary'),fetchAsset('city.edges.i16','binary')]);
    const terrainLoad=Promise.all([fetchAsset('elevation.f32','binary'),fetchAsset('terrain.contours.i16','binary'),fetchAsset('terrain.coast.i16','binary')]);
    // Observe both immediately so an asset failure never becomes an unhandled rejection.
    const cityResult=cityLoad.then(value=>({status:'fulfilled',value}),reason=>({status:'rejected',reason}));
    const [height,contours,coast]=await terrainLoad;heightGrid=new Float32Array(height);packedContours=new Int16Array(contours);packedCoast=new Int16Array(coast);
    makeTerrain();makeForces();makeConnections();
    window.bayLayers={state,stats,renderer,scene,camera,controls,focus:setFocus,reset:resetView,showEvent};
    renderLoop();$('#loading').classList.add('finished');setTimeout(()=>$('#loading')?.remove(),700);
    $('#scene').dataset.firstLandscapeMs=String(Math.round(performance.now()-startupAt));
    await new Promise(requestAnimationFrame);
    const result=await cityResult;if(result.status==='rejected')throw result.reason;
    const [b,t,s,c,e]=result.value;buildings=b;trees=t;streets=s;packedCity=new Int16Array(c);packedEdges=new Int16Array(e);
    makeLivingSystems();await new Promise(requestAnimationFrame);
    const regional=await regionalResult;
    if(regional.value){
      const major=[];
      for(const r of regional.value.roads){
        const pieces=[];let current=[];
        for(const p of r.p){if(p[0]>=BOUNDS[0]&&p[0]<=BOUNDS[2]&&p[1]>=BOUNDS[1]&&p[1]<=BOUNDS[3])current.push(p);else{if(current.length>1)pieces.push(current);current=[];}}if(current.length>1)pieces.push(current);
        for(const path of pieces){const outside=path.some(p=>p[1]>37.815||p[0]>-122.35);if(outside)streets.push(path);if(r.major){const pts=path.map(p=>world(...p,.09));for(let i=1;i<pts.length;i++)major.push(...pts[i-1].toArray(),...pts[i].toArray());}}
      }
      lines(major,0xeacb93,.35,layers[3]);stats.regionalRoads=regional.value.roads.length;stats.regionalBuildings=regional.value.source.buildingCount;
    }
    makeBuiltWorld();
    const vegetation=await vegetationResult;if(vegetation.value)makeVegetation(vegetation.value);else console.warn('Vegetation unavailable',vegetation.error);
    const hydro=await hydroResult;if(hydro.value)makeHydrography(hydro.value);else console.warn('Hydrography unavailable',hydro.error);
    layers[2].userData.reveal=0;layers[3].userData.reveal=0;state.ready=true;
    if(window.parent!==window)window.parent.postMessage({type:'bay-layers:ready',version:1,bounds:BOUNDS},params.get('parentOrigin')||'*');
    $('#scene').dataset.fullSceneMs=String(Math.round(performance.now()-startupAt));
    $('#mapped-data-copy').textContent=`${buildings.length.toLocaleString()} simplified building footprints across the visible Bay slice, ${streets.length.toLocaleString()} sampled street segments, and ${trees.length.toLocaleString()} mapped points from a historical street-tree inventory. These are partial source snapshots, not a present-day census. Marin vegetation patches follow a historical mapped lifeform classification. Missing regional building heights use an illustrative two-storey default. Crown sizes, SF park sketches and landmark meshes are illustrative.`;
  }catch(error){console.error(error);const loader=$('#loading');if(loader)loader.style.display='none';$('#error-copy').textContent=error.message;$('#error-panel').hidden=false;}
}boot();

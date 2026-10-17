"""Bounded static OSM snapshot for regional roads and buildings outside SF."""
import json,urllib.request,urllib.parse,gzip,math
from pathlib import Path
root=Path(__file__).resolve().parent.parent;cache=root/'scripts/cache/regional-osm.json'
query='[out:json][timeout:180];(way["highway"~"^(motorway|trunk|primary|secondary|tertiary|residential|unclassified|motorway_link|trunk_link|primary_link|secondary_link)$"](37.67,-122.65,37.95,-122.27);way["building"](37.815,-122.65,37.95,-122.27);way["building"](37.67,-122.35,37.815,-122.27););out tags geom;'
if cache.exists():d=json.loads(cache.read_text())
else:
 import concurrent.futures
 queries=['way["highway"~"^(motorway|trunk|primary|secondary|tertiary|residential|unclassified|motorway_link|trunk_link|primary_link|secondary_link)$"](37.67,-122.65,37.95,-122.27);']
 queries += ['way["building"]'+b+';' for b in ['(37.815,-122.65,37.88,-122.27)','(37.88,-122.65,37.95,-122.27)','(37.67,-122.35,37.815,-122.27)']]
 def fetch(item):
  i,q=item;p=root/'scripts/cache'/f'regional-osm-part-{i}.json'
  if p.exists():return json.loads(p.read_text())['elements']
  q='[out:json][timeout:100];'+q+'out tags geom;'
  u='https://overpass.private.coffee/api/interpreter?'+urllib.parse.urlencode({'data':q})
  with urllib.request.urlopen(u,timeout=130) as r:part=json.load(r)
  if part.get('remark'):raise RuntimeError(part['remark'])
  p.write_text(json.dumps(part));print('part',i,len(part['elements']),flush=True);return part['elements']
 with concurrent.futures.ThreadPoolExecutor(2) as pool:parts=list(pool.map(fetch,enumerate(queries)))
 d={'elements':[e for part in parts for e in part]};cache.write_text(json.dumps(d))
roads=[];buildings=[];seen=set();bins={}
road_cache=root/'scripts/cache/regional-roads.json'
if road_cache.exists():d['elements'].extend(json.loads(road_cache.read_text())['elements'])
for e in d['elements']:
 if e['id'] in seen:continue
 seen.add(e['id']);t=e.get('tags',{});p=[[v['lon'],v['lat']] for v in e.get('geometry',[])];
 if not p:continue
 if 'highway' in t:
  major=t['highway'] in ['motorway','trunk','primary','secondary','motorway_link','trunk_link','primary_link','secondary_link'];roads.append({'p':p,'major':major,'id':e['id'],'name':t.get('name')})
 if 'building' in t and len(p)>3:
  p=p[:-1] if p[0]==p[-1] else p;c=[sum(v[k] for v in p)/len(p) for k in [0,1]]
  if not(-122.65<c[0]<-122.27 and 37.67<c[1]<37.95):continue
  try:h=float(t['height'].replace(' m','')) if 'height' in t else float(t.get('building:levels',2))*3.1
  except ValueError:h=6.2
  if len(p)>32:p=p[::math.ceil(len(p)/32)]
  b={'id':'osm/'+str(e['id']),'c':c,'h':max(3,min(200,h)),'p':p,'heightSource':'osm' if 'height' in t or 'building:levels' in t else 'illustrative default'}
  key=(int((c[0]+122.65)*800),int((c[1]-37.67)*800));bins.setdefault(key,[]).append(b)
for bucket in bins.values():
 bucket.sort(key=lambda b:b['h'],reverse=True);buildings.extend(bucket[:1])
base=json.loads((root/'dist/assets/buildings.json').read_text());base=[b for b in base if not b['id'].startswith('osm/')];base.extend(buildings);(root/'dist/assets/buildings.json').write_text(json.dumps(base,separators=(',',':')))
out={'roads':roads,'source':{'url':'https://www.openstreetmap.org/copyright','license':'ODbL 1.0','query':query,'mirrorSources':['https://services6.arcgis.com/Do88DoK2xjTUCXd1/ArcGIS/rest/services/OSM_NA_Buildings/FeatureServer/0','https://services6.arcgis.com/Do88DoK2xjTUCXd1/ArcGIS/rest/services/OSM_NA_Highways/FeatureServer/0'],'buildingCount':len(buildings),'note':'Mapped footprints outside SF, spatially sampled; missing heights use illustrative 6.2m. Roads are OSM centerlines, not live traffic.'}}
b=json.dumps(out,separators=(',',':')).encode();(root/'dist/assets/regional.json').write_bytes(b);(root/'dist/assets/regional.json.gz').write_bytes(gzip.compress(b,mtime=0));print(len(roads),'roads;',len(buildings),'regional buildings',flush=True)

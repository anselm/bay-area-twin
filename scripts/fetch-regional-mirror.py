"""Fallback static regional footprint acquisition from Esri's public OSM mirror."""
import json,urllib.request,urllib.parse,concurrent.futures
from pathlib import Path
root=Path(__file__).resolve().parent.parent;base='https://services6.arcgis.com/Do88DoK2xjTUCXd1/ArcGIS/rest/services/OSM_NA_Buildings/FeatureServer/0/query'
def fetch(box):
 out=[]
 for offset in range(0,100000,2000):
  q=dict(where='1=1',geometry=box,geometryType='esriGeometryEnvelope',inSR=4326,outSR=4326,spatialRel='esriSpatialRelIntersects',outFields='osm_id,height,building_levels,building',returnGeometry='true',geometryPrecision=6,resultOffset=offset,resultRecordCount=2000,orderByFields='OBJECTID',f='geojson')
  u=base+'?'+urllib.parse.urlencode(q);cache=root/'scripts/cache'/('osm-mirror-'+box.replace(',','_')+'-'+str(offset)+'.json')
  if cache.exists():d=json.loads(cache.read_text())
  else:
   with urllib.request.urlopen(u,timeout=90) as r:d=json.load(r)
   if 'error' in d:raise RuntimeError(str(d))
   cache.write_text(json.dumps(d))
  fs=d.get('features',[]);out.extend(fs);print(box,offset,len(fs),flush=True)
  if len(fs)<2000:break
 return out
with concurrent.futures.ThreadPoolExecutor(2) as pool:parts=list(pool.map(fetch,['-122.65,37.815,-122.27,37.95','-122.35,37.67,-122.27,37.815']))
elements=[]
for f in [f for part in parts for f in part]:
 p=f['properties'];g=f['geometry'];polys=g['coordinates'] if g['type']=='MultiPolygon' else [g['coordinates']]
 tags={'building':p.get('building') or 'yes'}
 if p.get('height'):tags['height']=str(p['height'])
 if p.get('building_levels'):tags['building:levels']=str(p['building_levels'])
 for i,poly in enumerate(polys):elements.append({'id':str(p['osm_id'])+'/'+str(i),'tags':tags,'geometry':[{'lon':x,'lat':y} for x,y,*_ in poly[0]]})
(root/'scripts/cache/regional-osm.json').write_text(json.dumps({'elements':elements}))
print('saved',len(elements),'footprints')

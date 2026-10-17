import urllib.request,urllib.parse,json
from pathlib import Path
root=Path(__file__).resolve().parent.parent;base='https://services6.arcgis.com/Do88DoK2xjTUCXd1/ArcGIS/rest/services/OSM_NA_Highways/FeatureServer/0/query';elements=[]
for offset in range(0,100000,2000):
 q=dict(where="highway IN ('motorway','trunk','primary','secondary','tertiary','residential','unclassified','motorway_link','trunk_link','primary_link','secondary_link')",geometry='-122.65,37.67,-122.27,37.95',geometryType='esriGeometryEnvelope',inSR=4326,outSR=4326,spatialRel='esriSpatialRelIntersects',outFields='OBJECTID,highway,name',returnGeometry='true',geometryPrecision=6,resultOffset=offset,resultRecordCount=2000,orderByFields='OBJECTID',f='geojson')
 u=base+'?'+urllib.parse.urlencode(q);p=root/'scripts/cache'/f'osm-roads-{offset}.json'
 if p.exists():d=json.loads(p.read_text())
 else:
  with urllib.request.urlopen(u,timeout=90) as r:d=json.load(r)
  if 'error' in d:raise RuntimeError(str(d))
  p.write_text(json.dumps(d))
 fs=d.get('features',[]);print(offset,len(fs),flush=True)
 for f in fs:
  g=f['geometry'];paths=g['coordinates'] if g['type']=='MultiLineString' else [g['coordinates']]
  for i,path in enumerate(paths):elements.append(dict(id='road/'+str(f['properties']['OBJECTID'])+'/'+str(i),tags=f['properties'],geometry=[dict(lon=x,lat=y) for x,y,*_ in path]))
 if len(fs)<2000:break
(root/'scripts/cache/regional-roads.json').write_text(json.dumps(dict(elements=elements,source=base)))

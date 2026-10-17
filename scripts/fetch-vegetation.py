"""Prepare a compact classified Marin vegetation grid from public mapped polygons."""
import urllib.request,urllib.parse,json,gzip
from pathlib import Path
from PIL import Image,ImageDraw
root=Path(__file__).resolve().parent.parent
base='https://services2.arcgis.com/Uq9r85Potqm3MfRV/ArcGIS/rest/services/biosds2960_fpu/FeatureServer/0'
features=[];urls=[]
for offset in range(0,100000,2000):
 q=dict(where='1=1',geometry=json.dumps(dict(xmin=-122.65,ymin=37.80,xmax=-122.27,ymax=37.95,spatialReference=dict(wkid=4326))),geometryType='esriGeometryEnvelope',inSR=4326,spatialRel='esriSpatialRelIntersects',outFields='OBJECTID,LIFEFORM_18,FOREST_LIFEFORM_18,ABS_COVER_19,STAND_HT_MN_19',returnGeometry='true',outSR=4326,maxAllowableOffset=.00010,geometryPrecision=5,resultOffset=offset,resultRecordCount=2000,orderByFields='OBJECTID',f='geojson')
 u=base+'/query?'+urllib.parse.urlencode(q);urls.append(u)
 cache=root/'scripts/cache'/f'vegetation-c-{offset}.json'
 if cache.exists():d=json.loads(cache.read_text())
 else:
  with urllib.request.urlopen(u,timeout=90) as r:d=json.load(r)
  if 'error' in d:raise RuntimeError(str(d))
  cache.write_text(json.dumps(d))
 fs=d.get('features',[]);features.extend(fs);print(offset,len(fs),flush=True)
 if len(fs)<2000:break
if not features:raise RuntimeError('No vegetation polygons returned; retaining previous prepared assets')
print(sorted(set(f['properties']['LIFEFORM_18'] for f in features)),flush=True)
(root/'scripts/cache/vegetation-urls.json').write_text(json.dumps(urls))
# Class values 1 woodland, 2 scrub, 3 herbaceous. A point is a sampled patch, not an individual tree.
n=512;im=Image.new('L',(n,n));height=Image.new('L',(n,n))
counts={};unknown=set()
for f in features:
 p=f['properties'];name=(p.get('LIFEFORM_18') or '').lower();counts[name]=counts.get(name,0)+1
 if any(t in name for t in ['forest','woodland','tree']):kind=1
 elif any(t in name for t in ['shrub','scrub','chaparral']):kind=2
 elif any(t in name for t in ['herbaceous','grass']):kind=3
 else:kind=0;unknown.add(name)
 g=f['geometry'];polys=g['coordinates'] if g['type']=='MultiPolygon' else [g['coordinates']]
 h=max(0,min(255,round((p.get('STAND_HT_MN_19') or 0)*.3048*4)))
 for poly in polys:
  for i,ring in enumerate(poly):
   pts=[((x+122.65)/.38*n,(37.95-y)/.28*n) for x,y,*_ in ring]
   if len(pts)>2:
    ImageDraw.Draw(im).polygon(pts,fill=kind if i==0 else 0);ImageDraw.Draw(height).polygon(pts,fill=h if i==0 else 0)
print(counts,flush=True)
# Dense regular patch sampling with deterministic jitter applied only by the renderer.
land=im.tobytes();heights=height.tobytes();points=[]
for j in range(n):
 for i in range(n):
  k=land[j*n+i]
  if k:points.append([i,j,k,heights[j*n+i]])
out=dict(grid=n,bounds=[-122.65,37.67,-122.27,37.95],points=points,source=dict(url=base,polygonCount=len(features),lifeformCounts=counts,landscapeYear=2018,lidarYear=2019,note='512-cell rasterization of generalized mapped polygons; point positions are display samples, not surveyed trees. Heights resampled from polygon mean stand height.'))
b=json.dumps(out,separators=(',',':')).encode();(root/'dist/assets/vegetation.json').write_bytes(b);(root/'dist/assets/vegetation.json.gz').write_bytes(gzip.compress(b,mtime=0));print(len(points),'patches',len(gzip.compress(b)),'compressed bytes')

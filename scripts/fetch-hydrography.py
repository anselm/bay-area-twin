"""Save a bounded NHDPlus V2 stream snapshot; never runs in the visitor's browser."""
import json, gzip, urllib.request, urllib.parse
from pathlib import Path
root=Path(__file__).resolve().parent.parent
q=dict(where="ftype = 460",geometry='-122.65,37.67,-122.27,37.95',geometryType='esriGeometryEnvelope',inSR=4326,spatialRel='esriSpatialRelIntersects',outFields='comid,gnis_name,streamorder,ftype',returnGeometry='true',outSR=4326,resultRecordCount=2000,geometryPrecision=5,f='geojson')
u='https://watersgeo.epa.gov/arcgis/rest/services/NHDPlus/NHDPlus/MapServer/2/query?'+urllib.parse.urlencode(q)
with urllib.request.urlopen(u,timeout=60) as r:d=json.load(r)
if 'error' in d or not d.get('features'):raise RuntimeError(str(d)[:400])
if d.get('exceededTransferLimit'):raise RuntimeError('Snapshot needs pagination')
d['source']={'url':u,'dataset':'EPA WATERS NHDPlus V2, medium resolution','note':'Mapped stream centerlines, including intermittent streams; not observed water or discharge. Adapted from the Water Atlas source query, without its order >= 4 filter.'}
d['features']=[f for f in d['features'] if f['properties'].get('ftype') in (460,'StreamRiver')]
b=json.dumps(d,separators=(',',':')).encode()
p=root/'dist/assets/hydrography.geojson';p.write_bytes(b);p.with_suffix('.geojson.gz').write_bytes(gzip.compress(b,mtime=0))
print(len(d['features']),'stream features',len(b),'bytes')

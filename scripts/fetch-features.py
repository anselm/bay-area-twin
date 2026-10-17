from pathlib import Path
from urllib.request import Request,urlopen
from urllib.parse import urlencode
import json,concurrent.futures
ROOT=Path(__file__).resolve().parents[1];CACHE=ROOT/'scripts/cache';CACHE.mkdir(exist_ok=True)
mirror='https://services5.arcgis.com/wXYNaciObHUosEnt/ArcGIS/rest/services/Rooftop_Solar_Power_Potential_San_Francisco_WFL1/FeatureServer/9/query'
tasks=[]
for i in range(10):
    q={'where':'1=1','geometry':'-122.52,37.70,-122.35,37.82','geometryType':'esriGeometryEnvelope','inSR':4326,'outSR':4326,'outFields':'sf16_BldgID,gnd_Min_m,hgt_Median_m,peak_1st_m','returnGeometry':'true','returnZ':'false','resultRecordCount':2000,'resultOffset':i*2000,'orderByFields':'OBJECTID','f':'geojson'}
    tasks.append((mirror+'?'+urlencode(q),CACHE/f'buildings-{i:02}.geojson'))
for kind,base,fields,order,pages in [('streets','https://services3.arcgis.com/O2D69KF7KJAcdYlc/arcgis/rest/services/Transit_Stops/FeatureServer/9','cnn,streetname,classcode','OBJECTID',6),('trees','https://services.arcgis.com/V6ZHFr6zdgNZuVG0/arcgis/rest/services/Street_Trees/FeatureServer/0','TreeID,qSpecies,DBH,Latitude,Longitude','FID',4)]:
    for i in range(pages):
        q={'where':'1=1','geometry':'-122.52,37.70,-122.35,37.82','geometryType':'esriGeometryEnvelope','inSR':4326,'outSR':4326,'outFields':fields,'returnGeometry':'true','returnZ':'false','resultRecordCount':2000,'resultOffset':i*2000,'f':'geojson'}
        tasks.append((base+'/query?'+urlencode(q),CACHE/f'{kind}-{i:02}.geojson'))
def fetch(item):
    url,p=item
    if p.exists():return p.name,len(p.read_bytes()),'cached'
    try:
        b=urlopen(Request(url,headers={'User-Agent':'BayLayers educational prototype'}),timeout=90).read();p.write_bytes(b)
        return p.name,len(b),'ok'
    except Exception as e:return p.name,type(e).__name__,str(e)
with concurrent.futures.ThreadPoolExecutor(4) as pool:
    for r in pool.map(fetch,tasks):print(*r,flush=True)
(CACHE/'feature-urls.json').write_text(json.dumps({p.name:u for u,p in tasks},indent=2))

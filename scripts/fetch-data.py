"""Download a bounded public NOAA DEM and San Francisco building subset.
Run with a Python runtime containing Pillow, numpy and tifffile.
All fetched source URLs and metadata are retained alongside derived data.
"""
from pathlib import Path
from urllib.request import urlopen, Request
from urllib.parse import urlencode
import json, concurrent.futures

ROOT=Path(__file__).resolve().parents[1];CACHE=ROOT/'scripts/cache';CACHE.mkdir(exist_ok=True)
def get(url,path):
    if path.exists():return path.read_bytes()
    data=urlopen(Request(url,headers={'User-Agent':'BayLayers/0.1 educational browser visualization'}),timeout=100).read()
    path.write_bytes(data);return data
noaa='https://gis.ngdc.noaa.gov/arcgis/rest/services/DEM_mosaics/DEM_all/ImageServer'
params={'bbox':'-122.65,37.67,-122.27,37.95','bboxSR':4326,'imageSR':4326,'size':'513,513','format':'tiff','pixelType':'F32','interpolation':'RSP_BilinearInterpolation','renderingRule':json.dumps({'rasterFunction':'None'}),'f':'image','noDataInterpretation':'esriNoDataMatchAny','adjustAspectRatio':'false'}
tasks=[(noaa+'/exportImage?'+urlencode(params),CACHE/'elevation.tiff'),('https://data.sfgov.org/resource/ynuv-fyni.json?'+urlencode({'$limit':1}),CACHE/'sf-sample.json'),(noaa+'?f=pjson',CACHE/'noaa-service.json')]
with concurrent.futures.ThreadPoolExecutor(3) as pool:
    futures=[pool.submit(get,u,p) for u,p in tasks]
    for (u,p),f in zip(tasks,futures):
        try:print(p.name,len(f.result()),'bytes')
        except Exception as e:print(p.name,type(e).__name__,str(e))
(CACHE/'request-urls.json').write_text(json.dumps({p.name:u for u,p in tasks},indent=2))
if (CACHE/'sf-sample.json').exists():print((CACHE/'sf-sample.json').read_text()[:2600])

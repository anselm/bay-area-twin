from pathlib import Path
import json, math, hashlib
from PIL import Image
import numpy as np

ROOT=Path(__file__).resolve().parents[1];CACHE=ROOT/'scripts/cache';OUT=ROOT/'dist/assets';OUT.mkdir(exist_ok=True)
a=np.asarray(Image.open(CACHE/'elevation.tiff'),dtype=np.float32)
assert a.shape==(513,513) and -1000<float(np.min(a))<0 and float(np.max(a))>300
# Keep the 513-square observed grid; rendering chooses its own coarser mesh.
a.astype('<f4').tofile(OUT/'elevation.f32')
buildings=[];seen=set()
for f in sorted(CACHE.glob('buildings-*.geojson')):
    for feature in json.loads(f.read_text()).get('features',[]):
        p=feature['properties'];ident=p.get('sf16_BldgID')
        if ident in seen:continue
        seen.add(ident); geom=feature['geometry']
        if geom['type']=='Polygon':ring=geom['coordinates'][0]
        elif geom['type']=='MultiPolygon':ring=max(geom['coordinates'],key=lambda p:len(p[0]))[0]
        else:continue
        # Douglas-Peucker-like simplification using segment perpendicular distance.
        def simplify(points,eps=.000014):
            if len(points)<3:return points
            start,end=np.array(points[0][:2]),np.array(points[-1][:2]);v=end-start
            distances=[abs(np.cross(v,np.array(p[:2])-start))/(np.linalg.norm(v) or 1) for p in points]
            i=int(np.argmax(distances))
            if distances[i]>eps:return simplify(points[:i+1],eps)[:-1]+simplify(points[i:],eps)
            return [points[0],points[-1]]
        ring=simplify(ring[:-1])
        if len(ring)<3:continue
        ring=ring+[ring[0]]
        if len(ring)>33:ring=ring[::math.ceil(len(ring)/32)]+[ring[0]]
        height=float(p.get('hgt_Median_m') or 7)
        if not math.isfinite(height) or height<1:height=5
        center=np.mean(np.array(ring),axis=0)
        buildings.append({'id':str(ident),'c':[round(float(center[0]),6),round(float(center[1]),6)],'h':round(min(height,330),1),'p':[[round(float(c[0]),6),round(float(c[1]),6)] for c in ring[:-1]]})
def spatial_key(b):
    return (math.floor((b['c'][0]+122.52)*1000),math.floor((b['c'][1]-37.70)*1000))
bins={}
for b in buildings:bins.setdefault(spatial_key(b),[]).append(b)
selected=[]
for bucket in bins.values():
    bucket.sort(key=lambda b:b['h'],reverse=True)
    selected.extend(bucket[:12])
selected.sort(key=lambda b:b['id']);
if len(selected)>14000:selected=selected[::math.ceil(len(selected)/14000)]
(OUT/'buildings.json').write_text(json.dumps(selected,separators=(',',':')))
trees=[];tree_ids=set()
for f in sorted(CACHE.glob('trees-*.geojson')):
    for t in json.loads(f.read_text()).get('features',[]):
        prop=t['properties'];key=prop.get('TreeID')
        if key in tree_ids:continue
        tree_ids.add(key);c=t['geometry']['coordinates']
        trees.append([round(c[0],6),round(c[1],6),prop.get('DBH') or 10])
(OUT/'trees.json').write_text(json.dumps(trees,separators=(',',':')))
streets=[];road_ids=set()
for f in sorted(CACHE.glob('streets-*.geojson')):
    for s in json.loads(f.read_text()).get('features',[]):
        key=s.get('properties',{}).get('cnn')
        if key in road_ids:continue
        road_ids.add(key);g=s['geometry'];coords=[g['coordinates']] if g['type']=='LineString' else g['coordinates']
        for c in coords:
            if len(c)>1:streets.append([[round(p[0],6),round(p[1],6)] for p in c])
(OUT/'streets.json').write_text(json.dumps(streets,separators=(',',':')))
manifest={'title':'Bay Layers source snapshot','bounds':[-122.65,37.67,-122.27,37.95],'grid':513,'height_min_m':float(a.min()),'height_max_m':float(a.max()),'raw_building_count':len(buildings),'rendered_building_count':len(selected),'retrieved':'2026-10-17','sources':[{'id':'noaa','title':'NOAA NCEI topographic/bathymetric DEM mosaic','url':'https://gis.ngdc.noaa.gov/arcgis/rest/services/DEM_mosaics/DEM_all/ImageServer','kind':'observed_derived','notes':'F32 grid resampled to 513×513. Mosaic combines historical surveys and vertical datums; not current marine navigation or a tidal model. Land and seabed exaggeration are visual.'},{'id':'sf-buildings','title':'City and County of San Francisco building footprints, via public ArcGIS mirror','url':'https://data.sf.gov/Geographic-Locations-and-Boundaries/Building-Footprints/ynuv-fyni','mirror':'https://services5.arcgis.com/wXYNaciObHUosEnt/ArcGIS/rest/services/Rooftop_Solar_Power_Potential_San_Francisco_WFL1/FeatureServer/9','kind':'observed_derived','license':'Open Data Commons PDDL (official source)','notes':'20,000-source-feature bounded sample. Simplified footprints and median height; historical city records, not current full Bay Area coverage. Source identifiers retained.'},{'id':'motion','title':'Illustrative processes and animated agents','kind':'illustrative','notes':'Wind, currents, solar cycle, wildlife, vessels, cars, flight paths, utility lines and vegetation sketches are designed illustrations, not observed live feeds or a calibrated simulation. Bridge and landmark meshes are stylized, geographically positioned illustrations.'}]}
(OUT/'sources.json').write_text(json.dumps(manifest,indent=2))
manifest['street_segments']=len(streets);manifest['mapped_street_trees']=len(trees)
manifest['sources'] += [{'id':'sf-streets','title':'SF Public Works street centerlines (2022 mirror snapshot)','url':'https://data.sf.gov/d/3psu-pn9h','mirror':'https://services3.arcgis.com/O2D69KF7KJAcdYlc/arcgis/rest/services/Transit_Stops/FeatureServer/9','kind':'observed_derived','notes':'Partial sampled centerline network; public mirror, historical snapshot. Not current road traffic.'},{'id':'sf-trees','title':'SF municipal street-tree inventory (Esri sample mirror, last edited 2018)','url':'https://services.arcgis.com/V6ZHFr6zdgNZuVG0/arcgis/rest/services/Street_Trees/FeatureServer/0','kind':'observed_derived','notes':'8000-point historical sample with mapped locations. Not all trees, not a current inventory, crown sizes stylized.'}]
(OUT/'sources.json').write_text(json.dumps(manifest,indent=2))
print(json.dumps({'grid':a.shape,'range_m':[float(a.min()),float(a.max())],'source_buildings':len(buildings),'rendered_buildings':len(selected),'building_bytes':(OUT/'buildings.json').stat().st_size},indent=2))

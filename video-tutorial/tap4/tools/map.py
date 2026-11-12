import json, math, numpy as np, networkx as nx
from PIL import Image, ImageDraw, ImageFilter
from scipy import ndimage
b=json.load(open('buildings.json')); T=json.load(open('trips-v7.json'))
# đồ thị đường
G=nx.Graph()
for tr in T:
    p=[(round(x,5),round(y,5)) for x,y in tr['path']]
    for a,c in zip(p,p[1:]):
        if a!=c: G.add_edge(a,c,w=math.hypot((a[0]-c[0])*0.758,a[1]-c[1]))
nodes=np.array(list(G.nodes))
def near(lon,lat):
    d=((nodes[:,0]-lon)*0.758)**2+(nodes[:,1]-lat)**2; return tuple(nodes[d.argmin()])
P={'start':(-74.0106,40.7098),'trinity':(-74.0121,40.7081),'bull':(-74.0134,40.7056),'stone':(-74.0104,40.7043),'memorial':(-74.0134,40.7115)}
for a,c in list(G.edges):
    if all(-74.0165<q[0]<-74.0138 and 40.7030<q[1]<40.7075 for q in (a,c)): G.remove_edge(a,c)
nodes=np.array([n for n in G.nodes if G.degree(n)>=3])
r1=nx.shortest_path(G,near(*P['start']),near(*P['bull']),weight='w'); r2=nx.shortest_path(G,near(*P['bull']),near(*P['stone']),weight='w')
route=r1+r2[1:]
L=sum(G[a][c]['w'] for a,c in zip(route,route[1:]))*111320
print('route m',round(L), len(route))
# khung bản đồ
lon0,lon1=-74.0200,-74.0020; lat1=40.7160
W=2400; H=3600; k=W/((lon1-lon0)*0.758); lat0=lat1-H/k
f=lambda q:((q[0]-lon0)*0.758*k,(lat1-q[1])*k)
S=W/1500  # px trên mét ~
mask=Image.new('L',(W,H),0); md=ImageDraw.Draw(mask)
for tr in T:
    pts=[f(q) for q in tr['path']]
    md.line(pts,fill=255,width=30)
for x in b: md.polygon([f(q) for q in x['polygon']],fill=255)
m=np.array(mask.resize((W//8,H//8),Image.BILINEAR))>20
r=14
yy,xx=np.ogrid[-r:r+1,-r:r+1]; disk=(xx*xx+yy*yy)<=r*r
land=ndimage.binary_closing(np.pad(m,r,mode='edge'),structure=disk)[r:-r,r:-r]
land=ndimage.binary_fill_holes(land)
land=Image.fromarray((land*255).astype('uint8')).resize((W,H),Image.BILINEAR).filter(ImageFilter.GaussianBlur(10)).point(lambda v:255 if v>128 else 0)
im=Image.new('RGB',(W,H),'#A9D3F2'); im.paste(Image.new('RGB',(W,H),'#F3F1EC'),mask=land)
dist=ndimage.distance_transform_edt(~m)
park=Image.fromarray(((dist>5)*255).astype('uint8')).resize((W,H),Image.BILINEAR).filter(ImageFilter.GaussianBlur(14)).point(lambda v:255 if v>128 else 0)
park=Image.fromarray((np.array(park)>0)&(np.array(land)>0)).convert('L').point(lambda v:255 if v else 0)
im.paste(Image.new('RGB',(W,H),'#CFE8C4'),mask=park)
d=ImageDraw.Draw(im)
for x in b: d.polygon([f(q) for q in x['polygon']],fill='#E3DFD6',outline='#D6D1C6')
segs=set()
for tr in T:
    p=[(round(x,5),round(y,5)) for x,y in tr['path']]
    for a,c in zip(p,p[1:]): segs.add((a,c) if a<c else (c,a))
deg=dict(G.degree())
for a,c in segs: d.line([f(a),f(c)],fill='#DAD6CE',width=30)
for a,c in segs: d.line([f(a),f(c)],fill='#FFFFFF',width=24)
for a,c in segs:
    for q in (a,c): x,y=f(q); d.ellipse([x-12,y-12,x+12,y+12],fill='#FFFFFF')
im.save('nyc_map.png')
json.dump({'lon0':lon0,'lat1':lat1,'k':k,'W':W,'H':H,'route':[f(q) for q in route],'P':{n:f(q) for n,q in P.items()},'L':L*111320/111320},open('nyc_map.json','w'))
pv=im.copy(); dd=ImageDraw.Draw(pv); dd.line([f(q) for q in route],fill='#1A73E8',width=26)
for n,q in P.items(): x,y=f(q); dd.ellipse([x-30,y-30,x+30,y+30],fill='#EA4335')
pv.resize((600,900)).save('nyc_prev.png')

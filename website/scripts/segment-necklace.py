import numpy as np, math, json, sys
from PIL import Image, ImageFilter
from scipy import ndimage as ndi
from scipy.signal import argrelmin
src=sys.argv[1]; out=sys.argv[2]
RGB=np.array(Image.open(src).convert('RGB')).astype(float)
H,W=RGB.shape[:2]
d=RGB[...,0]-RGB[...,2]
hard=ndi.binary_closing(d>22,iterations=3)
filled=ndi.binary_fill_holes(hard); holes=filled&~hard
hl,hn=ndi.label(holes); hs=ndi.sum(holes,hl,range(1,hn+1))
small=np.isin(hl,[i+1 for i,s in enumerate(hs) if s<5000])
small[:275,:]=False  # keep clasp/chain ring interiors open
hard=hard|small
lab,n=ndi.label(hard); sizes=ndi.sum(hard,lab,range(1,n+1))
keep=np.isin(lab,[i+1 for i,s in enumerate(sizes) if s>400])
soft=np.clip((d-8)/20,0,1)
alpha=np.where(ndi.binary_erosion(keep,iterations=2),1.0,soft*ndi.binary_dilation(keep,iterations=2))
alpha=np.array(Image.fromarray((alpha*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.6)))
# drop pale, desaturated background spill inside a 12px band along the edge
band=keep & ~ndi.binary_erosion(keep,iterations=12)
spill=np.clip((d-16)/20,0,1)
alpha=np.where(band, alpha*spill, alpha).astype(np.uint8)
alpha=np.array(Image.fromarray(alpha).filter(ImageFilter.GaussianBlur(0.5)))
# de-fringe: edge pixels take the colour of the nearest solid gold pixel and the
# soft edge is tightened, so no grey/white halo shows on dark backgrounds
solid=alpha>=250
_, (iy, ix) = ndi.distance_transform_edt(~solid, return_indices=True)
RGBc=RGB[iy, ix]
alpha=np.clip((alpha.astype(float)-40)*255/215,0,255).astype(np.uint8)
cut=np.dstack([RGBc.astype(np.uint8),alpha])
bb=Image.fromarray(alpha).getbbox()
Image.fromarray(cut).crop(bb).save(f'{out}/fino-necklace-cutout.png',optimize=True)
A=alpha>128
cx,cy=528,615; N=1440; OPEN=1423
P=[]
for k in range(N):
    th=-math.pi/2+2*math.pi*k/N
    rs=np.arange(80,700,0.5)
    xs=(cx+rs*math.cos(th)).astype(int); ys=(cy+rs*math.sin(th)).astype(int)
    ok=(xs>=0)&(xs<W)&(ys>=0)&(ys<H)
    v=np.zeros_like(rs,bool); v[ok]=A[ys[ok],xs[ok]]
    idx=np.where(v)[0]
    if len(idx)==0: P.append([np.nan,np.nan,0]); continue
    runs=np.split(idx,np.where(np.diff(idx)>4)[0]+1); run=max(runs,key=len)
    r0,r1=rs[run[0]],rs[run[-1]]; rm=(r0+r1)/2
    P.append([cx+rm*math.cos(th),cy+rm*math.sin(th),r1-r0])
P=np.array(P)
order=np.r_[np.arange(OPEN,N),np.arange(0,OPEN)]
xy=P[order,:2].copy(); w=P[order,2]
for c in range(2):
    v=xy[:,c]; bad=np.isnan(v)
    if bad.any(): v[bad]=np.interp(np.where(bad)[0],np.where(~bad)[0],v[~bad])
sm=np.stack([ndi.gaussian_filter1d(xy[:,c],6,mode='nearest') for c in range(2)],1)
ws=ndi.gaussian_filter1d(w,3,mode='nearest')
seg=np.r_[0,np.cumsum(np.hypot(*np.diff(sm,axis=0).T))]
isbead=ndi.gaussian_filter1d((w>40).astype(float),8)>0.5
bi=np.where(isbead)[0]; b0,b1=bi[0],bi[-1]
mins=[i for i in argrelmin(ws,order=14)[0] if b0+10<i<b1-10]
cuts=[]
for i in mins:
    if not cuts or seg[i]-seg[cuts[-1]]>45: cuts.append(i)
    elif ws[i]<ws[cuts[-1]]: cuts[-1]=i
# split the first bead segment (holds two beads in this photo)
a,b=b0,cuts[0]; lo=a+(b-a)//4; hi=b-(b-a)//4
cuts.insert(0,lo+int(np.argmin(ws[lo:hi])))
bounds=[0]
for i in range(1,b0):
    if seg[i]-seg[bounds[-1]]>22: bounds.append(i)
bounds+= [b0]+cuts+[b1]
for i in range(b1+1,len(order)):
    if seg[i]-seg[bounds[-1]]>22: bounds.append(i)
bounds.append(len(order)-1); bounds=sorted(set(bounds))
yy,xx=np.nonzero(cut[...,3]>0)
ang=np.arctan2(yy-cy,xx-cx)
k=np.round(((ang+math.pi/2)%(2*math.pi))/(2*math.pi)*N).astype(int)%N
pos=(k-OPEN)%N
segid=np.clip(np.searchsorted(bounds,pos,side='right')-1,0,len(bounds)-2)
seglab=np.full((H,W),-1,np.int32); seglab[yy,xx]=segid
anyA=cut[...,3]>0
sprites=[]
for sidx in range(len(bounds)-1):
    if (segid==sidx).sum()<30: continue
    # overlap each piece 3px into its neighbours so no seams open while it bends
    mi=ndi.binary_dilation(seglab==sidx,iterations=3)&anyA
    ys,xs=np.nonzero(mi); x0,x1,y0,y1=xs.min(),xs.max()+1,ys.min(),ys.max()+1
    tile=np.zeros((y1-y0,x1-x0,4),np.uint8); tile[ys-y0,xs-x0]=cut[ys,xs]
    mid=(bounds[sidx]+bounds[sidx+1])//2
    ax,ay=sm[mid]; t=sm[min(mid+4,len(sm)-1)]-sm[max(mid-4,0)]
    sprites.append(dict(img=tile,s=float(seg[mid]),ax=float(ax-x0),ay=float(ay-y0),ox=float(ax),oy=float(ay),th=float(math.atan2(t[1],t[0])),bead=bool(isbead[mid])))
x=y=0;rowh=0;AW=1024;place=[]
for sp in sprites:
    h,w_=sp['img'].shape[:2]
    if x+w_+2>AW: x=0;y+=rowh+2;rowh=0
    place.append((x,y)); x+=w_+2; rowh=max(rowh,h)
atlas=np.zeros((y+rowh,AW,4),np.uint8); meta=[]
for sp,(px,py) in zip(sprites,place):
    h,w_=sp['img'].shape[:2]; atlas[py:py+h,px:px+w_]=sp['img']
    meta.append(dict(sx=px,sy=py,w=w_,h=h,ax=round(sp['ax'],1),ay=round(sp['ay'],1),s=round(sp['s'],1),th=round(sp['th'],4),ox=round(sp['ox']-bb[0],1),oy=round(sp['oy']-bb[1],1),bead=sp['bead']))
Image.fromarray(atlas).save(f'{out}/fino-necklace-beads.png',optimize=True)
cl=[[round(float(a_-bb[0]),1),round(float(b_-bb[1]),1)] for a_,b_ in sm[::8]]
json.dump(dict(length=round(float(seg[-1]),1),width=bb[2]-bb[0],height=bb[3]-bb[1],sprites=meta,centerline=cl),open(f'{out}/necklace-data.json','w'))
print('sprites',len(meta),'beads',sum(m['bead'] for m in meta),'size',bb)

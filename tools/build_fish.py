"""Author the 35 cm sea-bream, texture maps, rig and GLB using Blender's Python API.
Run: blender --background --factory-startup --python tools/build_fish.py
No external meshes/textures and no Python packages outside Blender are needed.
"""
import bpy, bmesh, math, json, sys
from pathlib import Path
from mathutils import Vector, Quaternion
import numpy as np

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'public/assets/models'; SOURCE=ROOT/'assets/fish-source'
OUT.mkdir(parents=True,exist_ok=True); SOURCE.mkdir(parents=True,exist_ok=True)
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
scene=bpy.context.scene; scene.render.fps=30; scene.unit_settings.system='METRIC'
FISH_SCALE=1.3

def image(name,pixels,noncolor=False):
    h,w=pixels.shape[:2]; im=bpy.data.images.new(name,w,h,alpha=True)
    im.colorspace_settings.name='Non-Color' if noncolor else 'sRGB'
    rgba=np.ones((h,w,4),dtype=np.float32); rgba[:,:,:3]=pixels
    im.pixels.foreach_set(rgba.ravel()); im.filepath_raw=str(SOURCE/(name+'.png')); im.file_format='PNG'; im.save(); im.pack()
    return im

# High resolution UV maps: overlapping scales, lateral line, pigmentation and pores.
W,H=4096,2048
u=np.arange(W,dtype=np.float32)[None,:]/W; v=np.arange(H,dtype=np.float32)[:,None]/H
theta=v*2*math.pi; dorsal=(np.cos(theta)+1)/2
base=np.zeros((H,W,3),dtype=np.float32)
for k,(belly,back) in enumerate(zip((.83,.79,.74),(.23,.29,.32))): base[:,:,k]=belly+(back-belly)*dorsal**1.7
pink=np.exp(-((v-.25)/.13)**2)+np.exp(-((v-.75)/.13)**2)
base[:,:,0]+=.12*pink*(.4+.6*np.sin(math.pi*u)); base[:,:,1]+=.022*pink;base[:,:,2]+=.028*pink
row=np.floor(v*56); xx=(u*83+(row%2)*.5)%1; yy=(v*56)%1
ellipse=((xx-.5)/.52)**2+((yy-.20)/.82)**2
edge=np.exp(-((ellipse-1)/.07)**2)
ridge=np.exp(-((ellipse-.90)/.10)**2)
mask=(u>.17)&(u<.92)
rng=np.random.default_rng(20261014); noise=rng.random((H,W),dtype=np.float32)
base*= (1-.16*edge*mask)[:,:,None]; base+= (.06*ridge*mask)[:,:,None]; base+=(noise-.5)[:,:,None]*.018
line=np.exp(-((v-.25)/.0022)**2)+np.exp(-((v-.75)/.0022)**2)
base*= (1-.10*line*mask)[:,:,None]
spots=(np.sin(u*math.pi*73)*np.cos(v*math.pi*42)>.92)&(dorsal>.32)&(u>.25)
base+=spots[:,:,None]*np.array([-.04,.025,.045],np.float32)
base=np.clip(base,0,1);base=np.where(base<=.04045,base/12.92,((base+.055)/1.055)**2.4)
color=image('madai_basecolor_4k',base); del base
height=(ridge*.55-edge*.22)*mask+(noise-.5)*.12
dy,dx=np.gradient(height); normals=np.stack((-dx*2.8,-dy*2.8,np.ones_like(height)),axis=2); normals/=np.linalg.norm(normals,axis=2,keepdims=True)
normal=image('madai_normal_4k',normals*.5+.5,True)
rough=np.clip(.29+edge*.075+(noise-.5)*.035,.23,.40); roughness=image('madai_roughness_4k',np.repeat(rough[:,:,None],3,axis=2),True)
del normals,height,noise,rough,edge,ridge

def material(name,color,rough=.3,metal=0,coat=.85):
    m=bpy.data.materials.new(name); m.use_nodes=True; p=m.node_tree.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value=(*color,1); p.inputs['Roughness'].default_value=rough; p.inputs['Metallic'].default_value=metal
    p.inputs['Coat Weight'].default_value=coat; p.inputs['Coat Roughness'].default_value=.1
    return m
skin=material('Wet silver / rose madai skin',(1,1,1),.29,.04,1)
nodes=skin.node_tree.nodes; links=skin.node_tree.links; bsdf=nodes.get('Principled BSDF')
for im,socket in [(color,'Base Color'),(roughness,'Roughness')]:
    n=nodes.new('ShaderNodeTexImage'); n.image=im; links.new(n.outputs['Color'],bsdf.inputs[socket])
n=nodes.new('ShaderNodeTexImage'); n.image=normal; nm=nodes.new('ShaderNodeNormalMap'); nm.inputs['Strength'].default_value=.45; links.new(n.outputs['Color'],nm.inputs['Color']); links.new(nm.outputs['Normal'],bsdf.inputs['Normal'])
finmat=material('Translucent rosy fin membrane',(.50,.42,.37),.30,0,.9)
finmat.node_tree.nodes.get('Principled BSDF').inputs['Subsurface Weight'].default_value=.07
raymat=material('Fin rays',(.67,.58,.48),.35,0,.5)
gillmat=material('Operculum crease',(.20,.25,.25),.4,0,.5)
lipmat=material('Soft pearly lips',(.61,.64,.58),.3,0,1)
iris=material('Bronze olive iris',(.44,.36,.15),.2,.16,1)
pupil=material('Glossy pupil',(.006,.012,.014),.09,0,1)
white=material('Eye silver surround',(.70,.75,.64),.2,.05,1)

fish_objects=[]
def mesh(name,verts,faces,mat,uv=None):
    me=bpy.data.meshes.new(name); me.from_pydata(verts,[],faces); me.update(); ob=bpy.data.objects.new(name,me); scene.collection.objects.link(ob); ob.data.materials.append(mat)
    for p in me.polygons:p.use_smooth=True
    if uv:
        layer=me.uv_layers.new(name='UVMap')
        for polygon in me.polygons:
            for li in polygon.loop_indices:layer.data[li].uv=uv[me.loops[li].vertex_index]
    fish_objects.append(ob); return ob
knots=np.array([0,.035,.09,.18,.30,.46,.62,.77,.88,.96,1])
heights=np.array([.006,.020,.035,.052,.062,.064,.054,.033,.016,.009,.007])
widths=np.array([.007,.015,.025,.036,.043,.043,.036,.023,.012,.0065,.005])
def profile(t,values):
    i=int(np.clip(np.searchsorted(knots,t)-1,0,len(knots)-2)); d=knots[i+1]-knots[i]; a=(t-knots[i])/d
    def slope(j):
        if j==0:return (values[1]-values[0])/(knots[1]-knots[0])
        if j==len(knots)-1:return (values[-1]-values[-2])/(knots[-1]-knots[-2])
        left=(values[j]-values[j-1])/(knots[j]-knots[j-1]);right=(values[j+1]-values[j])/(knots[j+1]-knots[j])
        return 0 if left*right<=0 else 2*left*right/(left+right)
    return (2*a**3-3*a*a+1)*values[i]+(a**3-2*a*a+a)*d*slope(i)+(-2*a**3+3*a*a)*values[i+1]+(a**3-a*a)*d*slope(i+1)
verts=[]; faces=[]; uv=[]; NX=180; NT=112
for i in range(NX+1):
    t=i/NX; y=.16-.285*t; h=profile(t,heights); w=profile(t,widths)
    for j in range(NT+1):
        a=j/NT*2*math.pi; x=math.sin(a)*w; z=math.cos(a)*h+.005*math.sin(math.pi*t)
        # An anatomical forehead and a softer belly rather than an ellipsoid.
        if t<.22 and math.cos(a)>0:z+=.004*math.sin(math.pi*t/.22)*math.cos(a)**2
        verts.append((x,y,z)); uv.append((t,j/NT))
        if i<NX and j<NT:
            n=i*(NT+1)+j; faces.append((n,n+1,n+NT+2,n+NT+1))
faces.append(tuple(range(NT,-1,-1))); faces.append(tuple(NX*(NT+1)+j for j in range(NT+1)))
body=mesh('Madai continuous anatomical body',verts,faces,skin,uv)

def curve(name,points,radius,mat):
    cu=bpy.data.curves.new(name,'CURVE'); cu.dimensions='3D'; cu.resolution_u=14; cu.bevel_depth=radius; cu.bevel_resolution=3
    spline=cu.splines.new('BEZIER'); spline.bezier_points.add(len(points)-1)
    for b,p in zip(spline.bezier_points,points): b.co=p;b.handle_left_type='AUTO';b.handle_right_type='AUTO'
    ob=bpy.data.objects.new(name,cu);scene.collection.objects.link(ob);ob.data.materials.append(mat)
    bpy.context.view_layer.objects.active=ob;ob.select_set(True);bpy.ops.object.convert(target='MESH');ob.select_set(False)
    fish_objects.append(ob);return ob

# Real mouth opening, paired lips, operculum plates, paired eyes and nostrils.
mouthmat=material('Mouth interior',(.045,.04,.035),.45,0,.2)
mesh('Mouth cavity',[(0,.161,-.001),(-.008,.161,.004),(0,.161,.008),(.008,.161,.004)],[(0,1,2,3)],mouthmat)
curve('Upper lip',[(-.010,.159,.003),(-.006,.164,.007),(0,.165,.008),(.006,.164,.007),(.010,.159,.003)],.0015,lipmat)
curve('Lower lip',[(-.009,.159,.001),(0,.164,-.004),(.009,.159,.001)],.0014,lipmat)
mesh('Lower jaw',[(-.009,.141,-.008),(.009,.141,-.008),(.010,.163,-.004),(-.010,.163,-.004),(-.007,.156,-.014),(.007,.156,-.014)],[(0,1,2,3),(0,4,5,1),(3,2,5,4),(0,3,4),(1,5,2)],lipmat)
mesh('Oral lining',[(-.008,.142,-.006),(.008,.142,-.006),(.009,.162,-.004),(-.009,.162,-.004)],[(0,1,2,3)],mouthmat)
def ellipsoid(name,location,scale,mat,segments=48,rings=32):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments,ring_count=rings,location=location);ob=bpy.context.object;ob.name=name;ob.scale=scale;ob.data.materials.append(mat)
    for p in ob.data.polygons:p.use_smooth=True
    fish_objects.append(ob);return ob
for s in [-1,1]:
    curve('Operculum crease '+str(s),[(s*.027,.092,.044),(s*.038,.073,.030),(s*.043,.066,.003),(s*.035,.071,-.029),(s*.019,.083,-.041)],.0010,gillmat)
    curve('Gill cover highlight '+str(s),[(s*.029,.096,.04),(s*.040,.077,.02),(s*.044,.071,-.001),(s*.034,.077,-.026)],.0006,lipmat)
    ellipsoid('Eye surround '+str(s),(s*.027,.122,.024),(.0038,.0115,.0115),white)
    ellipsoid('Iris '+str(s),(s*.030,.122,.024),(.0025,.0085,.0085),iris)
    ellipsoid('Pupil '+str(s),(s*.032,.122,.024),(.0015,.0058,.0058),pupil)
    ellipsoid('Nostril '+str(s),(s*.018,.145,.020),(.0009,.0017,.0011),gillmat,24,16)

# Thin, double-sided grid surfaces, gently curved membranes and individual rays.
def membrane(name,bases,edges):
    vs=[];fs=[];uvs=[];rows=12;n=len(bases)
    for i,(b,e) in enumerate(zip(bases,edges)):
        b=Vector(b); e=Vector(e)
        for j in range(rows+1):
            t=j/rows;p=b.lerp(e,t);p.x+=.0008*math.sin(math.pi*t)*math.sin(i*.75)
            vs.append(tuple(p));uvs.append((i/(n-1),t))
            if i<n-1 and j<rows:
                a=i*(rows+1)+j;fs.append((a,a+1,a+rows+2,a+rows+1))
    ob=mesh(name,vs,fs,finmat,uvs)
    solid=ob.modifiers.new('Membrane thickness','SOLIDIFY');solid.thickness=.00045
    bpy.context.view_layer.objects.active=ob;bpy.ops.object.modifier_apply(modifier=solid.name)
    for i in range(0,n,2):curve(name+' ray %02d'%i,[bases[i],tuple(Vector(bases[i]).lerp(Vector(edges[i]),.5)),edges[i]],.00030,raymat)
    return ob
bases=[];edges=[]
for i in range(37):
    t=i/36;y=.065-.175*t;z=.006+profile((.16-y)/.285,heights)
    envelope=math.sin(math.pi*t)**.48;spines=(.006 if i%2==0 else -.001)*math.sin(math.pi*t)
    bases.append((0,y,z));edges.append((0,y-.002,z+.030*envelope+spines))
membrane('Spined dorsal fin',bases,edges)
for s in [-1,1]:
    bases=[];edges=[]
    for i in range(21):
        t=i/20;b=(s*.039,.078-.018*t,-.012-.012*t);bases.append(b);edges.append((s*(.040+.043*math.sin(math.pi*t)**.45),.07-.073*t,-.015-.013*math.sin(math.pi*t)))
    membrane('Pectoral fin '+str(s),bases,edges)
    bases=[];edges=[]
    for i in range(15):
        t=i/14;b=(s*.020,.036-.024*t,-.052);bases.append(b);edges.append((s*(.021+.012*math.sin(math.pi*t)),.027-.046*t,-.052-.023*math.sin(math.pi*t)))
    membrane('Pelvic fin '+str(s),bases,edges)
bases=[];edges=[]
for i in range(29):
    t=i/28;y=-.015-.075*t;z=-profile((.16-y)/.285,heights)+.005;bases.append((0,y,z));edges.append((0,y-.01,z-.024*math.sin(math.pi*t)))
membrane('Anal fin',bases,edges)
bases=[];edges=[]
for i in range(45):
    a=i/44*2-1;bases.append((0,-.121,.007*a));edges.append((0,-.159-.026*abs(a)**.65,.060*a))
membrane('Forked caudal fin',bases,edges)

# Apply object transforms before creating smooth anatomical vertex weights.
bpy.ops.object.select_all(action='DESELECT')
for ob in fish_objects:
    ob.select_set(True);bpy.context.view_layer.objects.active=ob;bpy.ops.object.transform_apply(location=True,rotation=True,scale=True);ob.select_set(False)
    bm=bmesh.new();bm.from_mesh(ob.data);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(ob.data);bm.free()
armdata=bpy.data.armatures.new('Madai skeletal rig');arm=bpy.data.objects.new('MadaiRig',armdata);scene.collection.objects.link(arm);bpy.context.view_layer.objects.active=arm;arm.select_set(True);bpy.ops.object.mode_set(mode='EDIT')
root=armdata.edit_bones.new('root');root.head=(0,0,0);root.tail=(0,.04,0)
bone_defs=[('head',.060,.16,'root'),('spine_front',.060,-.015,'root'),('spine_rear',-.015,-.065,'spine_front'),('tail_base',-.065,-.115,'spine_rear'),('tail_tip',-.115,-.185,'tail_base')]
for name,y1,y2,parent in bone_defs:
    b=armdata.edit_bones.new(name);b.head=(0,y1,0);b.tail=(0,y2,0);b.parent=armdata.edit_bones[parent]
    if parent not in ('root',):b.use_connect=True
jaw=armdata.edit_bones.new('jaw');jaw.head=(0,.139,-.006);jaw.tail=(0,.164,-.004);jaw.parent=armdata.edit_bones['head']
bpy.ops.object.mode_set(mode='OBJECT');arm.select_set(False)
centres=np.array([.11,.023,-.040,-.09,-.15]);names=[b[0] for b in bone_defs]+['jaw']
for ob in fish_objects:
    ob.parent=arm
    groups=[ob.vertex_groups.new(name=n) for n in names]
    for vert in ob.data.vertices:
        y=vert.co.y
        if ob.name.startswith(('Lower lip','Lower jaw','Oral lining')) or (ob==body and y>.144 and vert.co.z<-.003):groups[-1].add([vert.index],1,'REPLACE');continue
        if y>=centres[0]:groups[0].add([vert.index],1,'REPLACE');continue
        if y<=centres[-1]:groups[4].add([vert.index],1,'REPLACE');continue
        for i in range(len(centres)-1):
            if centres[i]>=y>=centres[i+1]:
                w=(centres[i]-y)/(centres[i]-centres[i+1]);w=w*w*(3-2*w)
                if 1-w>0:groups[i].add([vert.index],float(1-w),'REPLACE')
                if w>0:groups[i+1].add([vert.index],float(w),'REPLACE')
                break
    mod=ob.modifiers.new('Madai skin deformation','ARMATURE');mod.object=arm

# Join weighted parts into one skinned mesh with material groups. This reduces draw
# calls without reducing polygon count or texture resolution.
bpy.ops.object.select_all(action='DESELECT')
for ob in fish_objects:ob.select_set(True)
bpy.context.view_layer.objects.active=body;bpy.ops.object.join();body.name='Madai_Skinned';fish_objects=[body]

clips=[('TailBeat_A',14,1),('TailBeat_D',14,-1),('Airborne',30,0),('FeignDeath',30,0),('Landing',12,0),('Captured',30,0),('Dry',30,0)]
arm.animation_data_create()
for clip,frames,side in clips:
    arm.animation_data.action=None
    for f in range(1,frames+1):
        t=(f-1)/(frames-1)
        for i,name in enumerate(names):
            p=arm.pose.bones[name];p.rotation_mode='XYZ';p.rotation_euler=(0,0,0)
            if name=='jaw':
                angle=-(.80*math.sin(math.pi*t)**.65 if side else .15*math.sin(t*math.pi)**2 if clip=='Airborne' else .3*math.sin(t*math.pi*4)*(1-t) if clip=='Captured' else .06 if clip=='Dry' else 0)
                q=p.bone.matrix_local.to_quaternion();p.rotation_euler=(q.inverted()@Quaternion((1,0,0),angle)@q).to_euler()
            elif side:p.rotation_euler.z=side*math.sin(math.pi*t)**.7*[.38,-.58,-.70,-.85,-.60][i]
            elif clip=='Airborne':p.rotation_euler.z=math.sin(t*math.pi*2+i*.5)*.08*(i+1)/5
            elif clip=='Landing':p.rotation_euler.z=math.sin(max(0,t-.055*i)*math.pi*3)*.22*(1-t)*i/4
            elif clip=='Captured':p.rotation_euler.z=math.sin(t*math.pi*4)*.20*(1-t)*i/4
            elif clip=='Dry':p.rotation_euler.z=.07*i/4
            p.keyframe_insert(data_path='rotation_euler',frame=f,group=name)
    action=arm.animation_data.action;action.name=clip;action.use_fake_user=True
    track=arm.animation_data.nla_tracks.new();track.name=clip;strip=track.strips.new(clip,1,action);strip.action_slot=arm.animation_data.action_slot
    arm.animation_data.action=None
# Save native editable source, and export meshes + bone animation to a self-contained GLB.
for p in arm.pose.bones:p.rotation_euler=(0,0,0)
arm.scale=(FISH_SCALE,)*3
scene.frame_set(1);bpy.ops.object.select_all(action='DESELECT');arm.select_set(True)
for o in fish_objects:o.select_set(True)
bpy.context.view_layer.objects.active=arm
bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE/'madai.blend'))
bpy.ops.export_scene.gltf(filepath=str(OUT/'madai.glb'),export_format='GLB',use_selection=True,export_animations=True,export_animation_mode='NLA_TRACKS',export_force_sampling=True,export_frame_range=False,export_skins=True,export_yup=True,export_copyright='Original model generated for Sabakarenuna. No third-party model assets.')
metadata={'length_m':.35*FISH_SCALE,'body_sections':NX,'circumference_segments':NT,'texture_resolution':[W,H],'bones':['root']+names,'animations':[c[0] for c in clips],'vertices':sum(len(o.data.vertices) for o in fish_objects),'triangles':sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in fish_objects),'blender':bpy.app.version_string,'glb_bytes':(OUT/'madai.glb').stat().st_size}
(SOURCE/'metadata.json').write_text(json.dumps(metadata,ensure_ascii=False,indent=2),encoding='utf-8'); print('FISH_BUILD_COMPLETE '+json.dumps(metadata))

# A separate studio preview is rendered after the export, so no lights/ground enter the GLB.
for tr in arm.animation_data.nla_tracks:tr.mute=True
scene.frame_set(1)
for p in arm.pose.bones:p.rotation_euler=(0,0,0)
world=bpy.data.worlds.new('Studio');scene.world=world;world.use_nodes=True;world.node_tree.nodes['Background'].inputs[0].default_value=(.18,.22,.24,1);world.node_tree.nodes['Background'].inputs[1].default_value=.5
def light(name,pos,energy,size):
    data=bpy.data.lights.new(name,'AREA');data.energy=energy;data.shape='DISK';data.size=size;ob=bpy.data.objects.new(name,data);scene.collection.objects.link(ob);ob.location=pos;ob.rotation_euler=(Vector((0,0,0))-ob.location).to_track_quat('-Z','Y').to_euler()
light('Large softbox',(.2,.15,.55),30,.5);light('Cool side fill',(-.25,-.05,.20),12,.4);light('Rim',(.1,-.4,.25),18,.25)
bpy.ops.object.camera_add(location=(.45,.28,.15));cam=bpy.context.object;cam.rotation_euler=(Vector((0,-.02,0))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=.60;scene.camera=cam
scene.render.engine='CYCLES';scene.cycles.samples=32;scene.view_settings.exposure=-.5;scene.render.resolution_x=1600;scene.render.resolution_y=1000;scene.render.resolution_percentage=100;scene.render.image_settings.file_format='PNG';scene.render.film_transparent=False;scene.render.filepath=str(SOURCE/'preview.png');bpy.ops.render.render(write_still=True)

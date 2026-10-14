"""Original chef: anatomical lofts, sculpted face, cloth, fingers, rig and GLB.
blender --background --factory-startup --python tools/build_chef.py
"""
import bpy, bmesh, math, json
import numpy as np
from pathlib import Path
from mathutils import Vector, Quaternion
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'public/assets/models';SRC=ROOT/'assets/chef-source'
OUT.mkdir(parents=True,exist_ok=True);SRC.mkdir(parents=True,exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
scene=bpy.context.scene;scene.render.fps=30;scene.unit_settings.system='METRIC'
parts=[];weights={}
def mat(name,color,rough=.6,metal=0,coat=0):
 m=bpy.data.materials.new(name);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Roughness'].default_value=rough;p.inputs['Metallic'].default_value=metal;p.inputs['Coat Weight'].default_value=coat;return m
coat=mat('Ivory cotton chef jacket',(.72,.70,.64),.76);pants=mat('Charcoal woven trousers',(.035,.045,.042),.82);apron=mat('Olive canvas apron',(.11,.16,.13),.9);skin=mat('Warm natural skin',(.48,.29,.19),.49,0,.08);hair=mat('Dark brow and hair',(.032,.023,.016),.86);shoe=mat('Worn leather',(.025,.028,.024),.40,0,.2);eyeWhite=mat('Eye sclera',(.58,.59,.51),.3);eyeIris=mat('Brown iris',(.08,.043,.018),.21);eyePupil=mat('Eye pupils',(.005,.009,.011),.13,0,.5);button=mat('Jacket buttons',(.44,.46,.42),.32,.3);blade=mat('KnifeBlade',(.63,.68,.70),.16,.95);handle=mat('KnifeHandle',(.06,.046,.035),.48);mouth=mat('Lip and skin crease',(.23,.075,.043),.58)
# A generated textile normal map gives all clothing a consistent woven surface.
N=1024;u=np.arange(N,dtype=np.float32)[None,:];v=np.arange(N,dtype=np.float32)[:,None]
h=(np.sin(u*math.pi/2)*np.cos(v*math.pi/2))*.25;gy,gx=np.gradient(h);norm=np.stack((-gx*.18,-gy*.18,np.ones_like(h)),2);norm/=np.linalg.norm(norm,axis=2,keepdims=True);rgba=np.ones((N,N,4),np.float32);rgba[:,:,:3]=norm*.5+.5
im=bpy.data.images.new('Original fabric weave',N,N);im.colorspace_settings.name='Non-Color';im.pixels.foreach_set(rgba.ravel());im.filepath_raw=str(SRC/'fabric_normal.png');im.file_format='PNG';im.save();im.pack()
for m in [coat,pants,apron]:
 n=m.node_tree.nodes.new('ShaderNodeTexImage');n.image=im;nm=m.node_tree.nodes.new('ShaderNodeNormalMap');nm.inputs['Strength'].default_value=.35;m.node_tree.links.new(n.outputs['Color'],nm.inputs['Color']);m.node_tree.links.new(nm.outputs['Normal'],m.node_tree.nodes['Principled BSDF'].inputs['Normal'])
def mesh(name,vs,fs,material,bone,uv=None):
 me=bpy.data.meshes.new(name);me.from_pydata(vs,[],fs);me.update();o=bpy.data.objects.new(name,me);scene.collection.objects.link(o);me.materials.append(material)
 for p in me.polygons:p.use_smooth=True
 if uv:
  layer=me.uv_layers.new()
  for p in me.polygons:
   for li in p.loop_indices:layer.data[li].uv=uv[me.loops[li].vertex_index]
 parts.append(o);weights[o.name]=bone;return o
def loft(name,rings,material,bone,segments=48,wrinkle=0):
 vs=[];fs=[];uv=[]
 for i,(x,y,z,rx,ry) in enumerate(rings):
  for j in range(segments+1):
   a=j/segments*math.pi*2;w=1+wrinkle*math.sin(a*7+i*1.7)*math.sin(i*.9);vs.append((x+math.sin(a)*rx*w,y+math.cos(a)*ry*w,z));uv.append((j/segments,i/max(1,len(rings)-1)))
   if i<len(rings)-1 and j<segments:n=i*(segments+1)+j;fs.append((n,n+1,n+segments+2,n+segments+1))
 fs.append(tuple(range(segments,-1,-1)));fs.append(tuple((len(rings)-1)*(segments+1)+j for j in range(segments+1)))
 return mesh(name,vs,fs,material,bone,uv)
def tube(name,points,radii,material,bone,segments=16):
 vs=[];fs=[];uv=[]
 for i,point in enumerate(points):
  p=Vector(point);tangent=Vector(points[min(i+1,len(points)-1)])-Vector(points[max(0,i-1)]);tangent.normalize();axis=tangent.cross(Vector((0,1,0)))
  if axis.length<.1:axis=tangent.cross(Vector((1,0,0)))
  axis.normalize();b=tangent.cross(axis).normalized()
  for j in range(segments+1):
   a=j/segments*math.pi*2;vs.append(tuple(p+radii[i]*(axis*math.cos(a)+b*math.sin(a))));uv.append((j/segments,i/max(1,len(points)-1)))
   if i<len(points)-1 and j<segments:n=i*(segments+1)+j;fs.append((n,n+segments+1,n+segments+2,n+1))
 fs.append(tuple(range(segments,-1,-1)));fs.append(tuple((len(points)-1)*(segments+1)+j for j in range(segments+1)))
 return mesh(name,vs,fs,material,bone,uv)
def ellipsoid(name,p,r,material,bone):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=40,ring_count=24,location=p);o=bpy.context.object;o.name=name;o.scale=r;o.data.materials.append(material)
 for f in o.data.polygons:f.use_smooth=True
 parts.append(o);weights[o.name]=bone;return o

# Coat with shoulder slope, waist taper, seams, asymmetric front fold, cuffs.
loft('Tailored jacket',[(0,0,.79,.19,.105),(0,0,.85,.205,.12),(0,0,.95,.22,.135),(0,0,1.08,.235,.145),(0,0,1.22,.245,.15),(0,0,1.34,.24,.132),(0,0,1.40,.205,.105),(0,0,1.43,.09,.075)],coat,'chest',64,.018)
loft('Neck',[(0,0,1.40,.073,.061),(0,0,1.49,.067,.062)],skin,'neck')
loft('Collar',[(0,0,1.40,.10,.084),(0,0,1.445,.092,.078)],coat,'chest',48)
for x in [-.067,.067]:
 for z in [.95,1.055,1.16,1.265]:ellipsoid('Double breasted button',(x,.145,z),(.013,.007,.013),button,'chest')
tube('Jacket seam',[(.10,.145,.84),(.092,.151,1.04),(.087,.148,1.22),(.065,.116,1.39)],[.0018]*4,button,'chest')
# Apron is an actual deformed cloth grid, not a rigid box.
vs=[];fs=[];uv=[];cols=30;rows=40
for i in range(rows+1):
 t=i/rows;z=.54+.71*t;half=.21+.015*math.sin(t*math.pi)
 for j in range(cols+1):
  x=(j/cols*2-1)*half;y=.163+.022*math.cos(x/half*math.pi/2)+.006*math.sin(x*50+t*11)*(1-t*.6);vs.append((x,y,z));uv.append((j/cols,t))
  if i<rows and j<cols:n=i*(cols+1)+j;fs.append((n,n+1,n+cols+2,n+cols+1))
cloth=mesh('Draped apron',vs,fs,apron,'pelvis',uv)
solid=cloth.modifiers.new('Apron fabric thickness','SOLIDIFY');solid.thickness=.002;bpy.context.view_layer.objects.active=cloth;bpy.ops.object.modifier_apply(modifier=solid.name)
for x in [-.15,.15]:tube('Apron strap',[(x,.142,1.2),(x*.68,.104,1.40),(x*.52,.022,1.46)],[.016]*3,apron,'chest')
loft('Apron belt',[(0,0,.91,.222,.152),(0,0,.94,.222,.152)],apron,'pelvis')

# Face is a sculpted parametric head with jaw, cheekbones, brow ridge and nose.
vs=[];fs=[];uv=[];nr=60;ns=96
for i in range(nr+1):
 phi=i/nr*math.pi;z=1.585+.145*math.cos(phi);width=.109*math.sin(phi)*(1-.13*max(0,-math.cos(phi)));depth=.092*math.sin(phi)
 for j in range(ns+1):
  a=j/ns*2*math.pi;x=math.sin(a)*width;y=math.cos(a)*depth
  if math.cos(a)>0:
   nose=.048*math.exp(-(x/.021)**2-((z-1.575)/.035)**2);brow=.012*math.exp(-((z-1.625)/.015)**2)*(math.exp(-((x-.047)/.026)**2)+math.exp(-((x+.047)/.026)**2));cheek=.008*math.exp(-((z-1.565)/.030)**2)*math.exp(-((abs(x)-.06)/.025)**2);y+=nose+brow+cheek
  vs.append((x,y,z));uv.append((j/ns,i/nr))
  if i<nr and j<ns:n=i*(ns+1)+j;fs.append((n,n+1,n+ns+2,n+ns+1))
head=mesh('Sculpted chef face',vs,fs,skin,'head',uv)
for side in [-1,1]:
 x=side*.046
 ellipsoid('Eyelid',(x,.088,1.611),(.026,.008,.0125),skin,'head');ellipsoid('Eye white',(x,.094,1.611),(.019,.0048,.0083),eyeWhite,'head');ellipsoid('Iris',(x,.099,1.611),(.0065,.002,.0068),eyeIris,'head');ellipsoid('Pupil',(x,.101,1.611),(.003,.0015,.0044),eyePupil,'head')
 tube('Brow',[(x-side*.023,.096,1.632),(x,.107,1.637),(x+side*.021,.092,1.632)],[.0038,.005,.003],hair,'head')
 ellipsoid('Ear',(side*.108,-.006,1.58),(.019,.026,.040),skin,'head');ellipsoid('Ear inner',(side*.12,.003,1.58),(.004,.014,.024),mouth,'head')
 ellipsoid('Nostril',(side*.011,.123,1.557),(.0045,.004,.0024),mouth,'head')
tube('Mouth contour',[(-.029,.092,1.532),(-.013,.101,1.534),(0,.104,1.533),(.014,.101,1.534),(.029,.092,1.532)],[.0016,.002,.002,.002,.0016],mouth,'head')
tube('Lower lip',[(-.024,.094,1.528),(0,.107,1.527),(.024,.094,1.528)],[.002,.003,.002],skin,'head')
for side in [-1,1]:tube('Nasolabial crease',[(side*.022,.104,1.558),(side*.028,.094,1.541),(side*.032,.085,1.529)],[.0009]*3,mouth,'head')
# Pleated toque: a lofted fabric crown with folds, not spheres stacked together.
loft('Toque band',[(0,0,1.714,.112,.092),(0,0,1.767,.119,.099)],coat,'head',64,.008)
rings=[]
for i in range(20):
 t=i/19;r=.12+.018*math.sin(t*math.pi)-.04*t**6;rings.append((0,0,1.758+.145*t,r,r*.87))
loft('Pleated toque crown',rings,coat,'head',96,.06)
for side in [-1,1]:
 x=side*.12
 loft('Trouser thigh',[(x,0,.86,.105,.092),(x,0,.73,.103,.093),(x,.006,.57,.085,.083),(x,.005,.44,.075,.073)],pants,'thigh_'+str(side),48,.025)
 loft('Trouser calf',[(x,.005,.45,.077,.075),(x,0,.31,.074,.070),(x,-.007,.14,.060,.060),(x,-.006,.095,.055,.053)],pants,'shin_'+str(side),48,.025)
 loft('Leather shoe',[(x,.05,0,.078,.145),(x,.05,.075,.079,.147),(x,.04,.10,.070,.132),(x,-.01,.135,.056,.069)],shoe,'foot_'+str(side),48,.003)
 tube('Shoe seam',[(x-.061,.116,.09),(x,.181,.088),(x+.061,.116,.09)],[.0018]*3,button,'foot_'+str(side))
 # Sleeves follow real shoulder/elbow/wrist proportions.
 tube('Upper sleeve',[(side*.235,0,1.365),(side*.29,.013,1.27),(side*.335,.025,1.10)],[.086,.078,.067],coat,'arm_'+str(side),32)
 tube('Lower sleeve',[(side*.335,.025,1.10),(side*.34,.055,.985),(side*.33,.10,.88)],[.069,.058,.052],coat,'forearm_'+str(side),32)
 tube('Cuff',[(side*.33,.095,.895),(side*.33,.11,.855)],[.056,.054],coat,'forearm_'+str(side),32)
 loft('Palm',[(side*.33,.11,.87,.043,.030),(side*.33,.123,.82,.044,.032),(side*.33,.132,.79,.035,.027)],skin,'hand_'+str(side),32)
 for k in range(4):
  fx=side*.33+(k-1.5)*.018;length=.054-(abs(k-1.5))*.007
  tube('Curved finger',[(fx,.13,.80),(fx,.155,.80-length*.45),(fx,.175,.80-length),(fx,.159,.80-length-.009)],[.009,.0095,.008,.0055],skin,'hand_'+str(side),12)
 tube('Thumb',[(side*.37,.125,.836),(side*.383,.154,.812),(side*.36,.177,.794)],[.014,.013,.008],skin,'hand_'+str(side),16)

# Tang, blade edge, handle and rivets form a knife seated inside the right fist.
mesh('Knife blade',[(.325,.166,.79),(.325,.166,.51),(.325,.208,.50),(.325,.222,.56),(.325,.218,.79),(.330,.166,.79),(.330,.166,.51),(.330,.208,.50),(.330,.222,.56),(.330,.218,.79)],[(0,1,2,3,4),(9,8,7,6,5),(0,5,6,1),(1,6,7,2),(2,7,8,3),(3,8,9,4),(4,9,5,0)],blade,'hand_1')
tube('Knife handle',[(.327,.184,.80),(.327,.184,.89)],[.014,.014],handle,'hand_1',16)
for z in [.82,.865]:ellipsoid('Handle rivet',(.34,.184,z),(.003,.003,.003),blade,'hand_1')

# Transform meshes into one coordinate system and attach a complete articulated rig.
bpy.ops.object.select_all(action='DESELECT')
for o in parts:
 o.select_set(True);bpy.context.view_layer.objects.active=o;bpy.ops.object.transform_apply(location=True,rotation=True,scale=True);o.select_set(False)
 bm=bmesh.new();bm.from_mesh(o.data);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(o.data);bm.free()
data=bpy.data.armatures.new('Chef anatomical rig');rig=bpy.data.objects.new('ChefRig',data);scene.collection.objects.link(rig);bpy.context.view_layer.objects.active=rig;rig.select_set(True);bpy.ops.object.mode_set(mode='EDIT')
defs=[('root',(0,0,0),(0,0,.2),None),('pelvis',(0,0,.80),(0,0,.95),'root'),('chest',(0,0,.95),(0,0,1.38),'pelvis'),('neck',(0,0,1.38),(0,0,1.49),'chest'),('head',(0,0,1.49),(0,0,1.70),'neck')]
for side in [-1,1]:defs += [(f'arm_{side}',(side*.235,0,1.365),(side*.335,.025,1.10),'chest'),(f'forearm_{side}',(side*.335,.025,1.10),(side*.33,.10,.87),f'arm_{side}'),(f'hand_{side}',(side*.33,.10,.87),(side*.33,.15,.79),f'forearm_{side}'),(f'thigh_{side}',(side*.12,0,.84),(side*.12,0,.44),'pelvis'),(f'shin_{side}',(side*.12,0,.44),(side*.12,-.006,.10),f'thigh_{side}'),(f'foot_{side}',(side*.12,-.006,.10),(side*.12,.16,.07),f'shin_{side}')]
for name,h,t,parent in defs:
 b=data.edit_bones.new(name);b.head=h;b.tail=t
 if parent:b.parent=data.edit_bones[parent]
bpy.ops.object.mode_set(mode='OBJECT');rig.select_set(False)
for o in parts:
 o.parent=rig;g=o.vertex_groups.new(name=weights[o.name]);g.add(list(range(len(o.data.vertices))),1,'REPLACE');mod=o.modifiers.new('Chef joint skin','ARMATURE');mod.object=rig
 # Blend the jacket across pelvis/chest so bending produces cloth deformation.
 if o.name in ['Tailored jacket','Draped apron']:
  g.remove(list(range(len(o.data.vertices))));gc=g if weights[o.name]=='chest' else o.vertex_groups.new(name='chest');gp=g if weights[o.name]=='pelvis' else o.vertex_groups.new(name='pelvis')
  for v in o.data.vertices:
   w=max(0,min(1,(v.co.z-.88)/.30));gc.add([v.index],w,'REPLACE');gp.add([v.index],1-w,'REPLACE')
bpy.ops.object.select_all(action='DESELECT')
for o in parts:o.select_set(True)
bpy.context.view_layer.objects.active=head;bpy.ops.object.join();body=bpy.context.object;body.name='Chef_Skinned'
clips=[('Idle',60),('Walk',30),('Windup',18),('Throw',12),('Inspect',54),('Stunned',90),('Capture',30),('IntroChop',54)]
rig.animation_data_create()
def rotate(name,x=0,y=0,z=0):
 p=rig.pose.bones[name];q=p.bone.matrix_local.to_quaternion();r=Quaternion((1,0,0),x)@Quaternion((0,1,0),y)@Quaternion((0,0,1),z);p.rotation_quaternion=q.inverted()@r@q
for clip,frames in clips:
 rig.animation_data.action=None
 for f in range(1,frames+1):
  t=(f-1)/(frames-1);pulse=math.sin(t*math.pi)
  for p in rig.pose.bones:p.rotation_mode='QUATERNION';p.rotation_quaternion=(1,0,0,0);p.location=(0,0,0)
  rotate('head',-.16)
  if clip=='Idle':rotate('chest',.01*math.sin(t*2*math.pi));rotate('head',-.12)
  if clip=='Walk':
   for side in [-1,1]:rotate(f'thigh_{side}',math.sin(t*math.pi*2)*side*.38);rotate(f'shin_{side}',max(0,math.sin(t*math.pi*2)*side)*-.38);rotate(f'arm_{side}',-math.sin(t*math.pi*2)*side*.20)
  if clip=='Windup':rotate('arm_1',2.0*t);rotate('forearm_1',.55*t);rotate('chest',0,0,-.08*t)
  if clip=='Throw':rotate('arm_1',2.0-1.55*t);rotate('forearm_1',.55-.65*t);rotate('chest',.08*pulse)
  if clip=='Inspect':
   reach=min(1,t*2);rotate('chest',-.42*reach);rotate('head',-.28);rotate('arm_1',.35*reach);rotate('arm_-1',.35*reach);rotate('forearm_1',-.12*reach);rotate('forearm_-1',-.12*reach)
  if clip=='Capture':
   for side in [-1,1]:rotate(f'arm_{side}',1.05,z=-side*.30);rotate(f'forearm_{side}',.52)
  if clip=='Stunned':
   rotate('chest',.12+math.sin(t*math.pi*12)*.07);rotate('head',.15,z=math.sin(t*math.pi*15)*.12)
   for side in [-1,1]:rotate(f'arm_{side}',2.0,z=-side*.28);rotate(f'forearm_{side}',.35)
  if clip=='IntroChop':
   angle=1.75 if t<.35 else 1.75-1.40*min(1,(t-.35)/.3);rotate('arm_1',angle);rotate('forearm_1',.30);rotate('head',-.28);rotate('chest',-.12)
  for p in rig.pose.bones:p.keyframe_insert(data_path='rotation_quaternion',frame=f,group=p.name)
 action=rig.animation_data.action;action.name=clip;action.use_fake_user=True;track=rig.animation_data.nla_tracks.new();track.name=clip;strip=track.strips.new(clip,1,action);strip.action_slot=rig.animation_data.action_slot;rig.animation_data.action=None
for p in rig.pose.bones:p.rotation_quaternion=(1,0,0,0)
scene.frame_set(1);bpy.ops.object.select_all(action='DESELECT');rig.select_set(True);body.select_set(True);bpy.context.view_layer.objects.active=rig
bpy.ops.wm.save_as_mainfile(filepath=str(SRC/'chef.blend'))
bpy.ops.export_scene.gltf(filepath=str(OUT/'chef.glb'),export_format='GLB',use_selection=True,export_animations=True,export_animation_mode='NLA_TRACKS',export_force_sampling=True,export_skins=True,export_yup=True,export_copyright='Original chef generated with Blender Python for Sabakarenuna')
meta={'bones':[d[0] for d in defs],'animations':[c[0] for c in clips],'vertices':len(body.data.vertices),'triangles':sum(len(p.vertices)-2 for p in body.data.polygons),'height_m':1.90,'glb_bytes':(OUT/'chef.glb').stat().st_size,'blender':bpy.app.version_string};(SRC/'metadata.json').write_text(json.dumps(meta,indent=2),encoding='utf8');print('CHEF_BUILD_COMPLETE',json.dumps(meta))
for track in rig.animation_data.nla_tracks:track.mute=True
for p in rig.pose.bones:p.rotation_quaternion=(1,0,0,0)
scene.frame_set(1);world=bpy.data.worlds.new('Studio');scene.world=world;world.use_nodes=True;world.node_tree.nodes['Background'].inputs[0].default_value=(.18,.20,.20,1);world.node_tree.nodes['Background'].inputs[1].default_value=.5
for pos,energy,size in [((2,3,4),350,3),((-2,1,2),160,2),((0,-2,3),220,2)]:
 d=bpy.data.lights.new('Studio softbox','AREA');d.energy=energy;d.size=size;o=bpy.data.objects.new('Studio softbox',d);scene.collection.objects.link(o);o.location=pos;o.rotation_euler=(Vector((0,0,1))-o.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add(location=(2.3,4,2.1));cam=bpy.context.object;cam.rotation_euler=(Vector((0,0,1))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=2.5;scene.camera=cam;scene.render.engine='CYCLES';scene.cycles.samples=32;scene.render.resolution_x=1000;scene.render.resolution_y=1200;scene.render.resolution_percentage=100;scene.render.filepath=str(SRC/'preview.png');bpy.ops.render.render(write_still=True)

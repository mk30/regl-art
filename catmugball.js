var glsl = require('glslify')
var regl = require('regl')()
var camera = require('./libraries/camera.js')(regl, {
  distance: 3, 
  far: 5000,
  center: [0, 0, 0]
})
var mat4 = require('gl-mat4')
var vec3 = require('gl-vec3')
var icosphere = require('icosphere')
var feedback = require('regl-feedback')
var anormals = require('angle-normals')
var feedback = require('./libraries/feedbackeffect.js')
var tex = regl.texture()
var drawfb = feedback(regl, `
  vec3 sample (vec2 uv, sampler2D tex) {
    return 0.99*texture2D(tex,(0.99*(2.0*uv-1.0)+1.0)*0.5).rgb;
  }
`)
const feedBackTexture = regl.texture({})
function makecatmug (regl) {
  var catmug = require('./libraries/catmug.json')
  var model = []
  return regl({
    frag: glsl`
      precision mediump float;
      #pragma glslify: snoise = require('glsl-noise/simplex/3d')
      varying vec3 vpos, vnorm;
      uniform float time, timeoffset;
      void main () {
        float c = snoise((sin(vnorm*3.5+vpos+snoise(vpos))+0.5)/0.5)+snoise(vpos);
        float d =
        vpos.y*vpos.x*vpos.y+pow(abs(sin(time+15.0)), 5.0);
        float e = step(c, d)*(time+c)*c*c; 
        gl_FragColor =
        vec4(vec3(snoise(vec3((cos(time)+0.9)/0.5,(sin(time)+0.9)/0.5,c)),0,sin(time))*e,1.0);
      }
    `,
    vert: glsl`
      precision mediump float;
      #pragma glslify: snoise = require('glsl-noise/simplex/3d')
      uniform mat4 projection, view, model;
      uniform vec3 offset;
      uniform float time, timeoffset;
      attribute vec3 position, normal;
      varying vec3 vnorm, vpos, dvpos;
      void main () {
        vnorm = normal;
        //set ripplespeed low for faster ripples.
        float dxripplespeed = sin(time)*15.0;
        float dzripplespeed = cos(time/5.0)*5.0;
        float dx = snoise(position+2.0*
          pow(abs(sin(time/dxripplespeed)), 8.4))*0.1;
        float dz = snoise(position+
          pow(abs(cos(time/dzripplespeed)), 6.4))*0.1;
        vpos = position;
        dvpos = position +
          (vec3(dx,0,dz)
          + vec3(0,position.y/2.0-0.03*sin(time*2.0),position.z/12.0
          + 0.3*sin(time)));
        gl_Position = projection * view * (model *
        vec4(dvpos,1)+vec4(vnorm,1));
      }
    `,
    attributes: {
      position: catmug.positions,
      normal: anormals(catmug.cells, catmug.positions)
    },
    uniforms: {
      texture: feedBackTexture,
      model: function (context, props) {
        var theta = context.time
        mat4.identity(model)
        mat4.rotateY(model, model, Math.cos(theta)+props.timeoffset)
        mat4.rotateX(model, model, Math.sin(theta)+props.timeoffset)
        return model
      },
      time: regl.context('time'),
      offset: regl.prop('offset'),
      timeoffset: regl.prop('timeoffset')
    },
    primitive: "triangles",
    blend: {
      enable: true,
      func: {
        src: 'src alpha',
        dst: 'one minus src alpha'
      }
    },
    cull: {
      enable: true 
    },
    elements: catmug.cells
  })
}
function bg (regl) {
  return regl({
    frag: glsl`
      precision mediump float;
      #pragma glslify: snoise = require('glsl-noise/simplex/3d')
      varying vec2 uv;
      uniform float time, aspect;
      void main () {
        vec2 spos = (-4.0*uv)*vec2(aspect, 1);
        float y =
        pow(abs(snoise(vec3(spos*3.0-vec2(0,time*0.3),time*0.05))),
        16.0);
        gl_FragColor = vec4(vec3(0.6,0.7,1)*y,0.6);
          //modify last item in above expression to make
          //snow brighter/darker. 0.03 makes a faint snow.
      }
    `,
    vert: `
      precision mediump float;
      uniform mat4 projection, view;
      uniform float time;
      attribute vec2 position;
      varying vec2 uv;
      void main () {
        uv = position;
        gl_Position = vec4(position,0,1);
      }
    `,
    attributes: {
      position: [-4,4,-4,-4,4,0]
    },
    count: 3,
    uniforms: {
      time: regl.context('time'),
      aspect: function(context){
        return context.viewportWidth/context.viewportHeight
      }
    },
    blend: {
      enable: true,
      func: { src: 'src alpha', dst: 'one minus src alpha' }
    },
    depth: { mask: false }
  })
}
var draw = {
  bg: bg(regl),
  catmug: makecatmug(regl)
}
var batch = []
for (var i=0; i<5; i++){
  var x = (Math.random()*2-1)*2.0
  var y = (Math.random()*2-1)*2.0
  var z = (Math.random()*2-1)*2.0
  var z = i*5
  batch.push({offset: [x,y,z], timeoffset: z})
}
regl.frame(function (context) {
  regl.clear({ color: [0,0,0,1], depth: true })
  drawfb({ texture: tex })
  camera(function () {
    draw.catmug(batch)
    tex({ copy: true, min: 'linear', mag: 'linear' })
    draw.bg()
  })
})

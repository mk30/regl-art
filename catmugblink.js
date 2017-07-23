var regl = require('regl')()
var camera = require('./libraries/camera.js')(regl, {
  center: [0,0,0],
  distance: 4 
})
var anormals = require('angle-normals')
var mat4 = require('gl-mat4')
var glsl = require('glslify')
var feedback = require('./libraries/feedbackeffect.js')
var drawfeedback = feedback(regl, `
  vec3 sample (vec2 uv, sampler2D tex) {
    return 0.9*texture2D(tex, (0.98*(2.0*uv-1.0)+1.0)*0.5).rgb;
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
      #pragma glslify: cnoise = require('glsl-curl-noise')
      varying vec3 vpos, vnorm;
      uniform float time;
      void main () {
        float c = snoise(cnoise(sin(vnorm)));
        float z = sin(time);
        float y = 0.8;
        float x = 0.4;
        float d = vpos.y*2.0-5.0*
          pow(abs(sin(time)), 0.5);
        float e = step(c, d); 
        gl_FragColor = vec4(vec3(x,y,z)*e,1.0);
      }
    `,
    vert: glsl`
      precision mediump float;
      #pragma glslify: snoise = require('glsl-noise/simplex/3d')
      uniform mat4 projection, view, model;
      uniform float time;
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
          + vec3(0,position.y/12.0-0.03*sin(time*2.0),position.z/12.0
          + 0.03*sin(time)));
        gl_Position = projection * view * model *
        vec4(dvpos,1);
      }
    `,
    attributes: {
      position: catmug.positions,
      normal: anormals(catmug.cells, catmug.positions)
    },
    uniforms: {
      texture: feedBackTexture,
      model: function (context) {
        var theta = context.time
        mat4.rotateY(model, mat4.identity(model),
        Math.sin(theta)/2)
        return model
      },
      time: regl.context('time')
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
var draw = {
  catmug: makecatmug(regl)
}
regl.frame(function () {
  regl.clear({ color: [0,0,0,1], depth: true })
  drawfeedback({texture: feedBackTexture})    
  camera(function () {
    draw.catmug()
    feedBackTexture({    
      copy: true,
      min: 'linear',
      mag: 'linear'
    })
  })
})

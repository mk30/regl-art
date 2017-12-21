var regl = require('regl')()
var camera = require('../libraries/camera.js')(regl, {
  center: [0,0,0],
  distance: 100 
})
var pyramid = require('./pyramid.json')
var anormals = require('angle-normals')
var mat4 = require('gl-mat4')
var glsl = require('glslify')
var feedback = require('../libraries/feedbackeffect.js')
var drawfeedback = feedback(regl, `
  vec3 sample (vec2 uv, sampler2D tex) {
    return 0.9*texture2D(tex, (0.98*(2.0*uv-1.0)+1.0)*0.5).rgb;
  }
`)
const feedBackTexture = regl.texture({})
function makepyramid () {
  var model = []
  return regl({
    frag: `
      precision mediump float;
      void main () {
        gl_FragColor = vec4(0,1,1,1);
      }
    `,
    vert: `
      precision mediump float;
      uniform mat4 projection, view, model;
      attribute vec3 position;
      void main () {
        gl_Position = projection * view * model * vec4(position,1);
      }
    `,
    attributes: {
      position: pyramid.positions
    },
    uniforms: {
      model: function (context) {
        mat4.identity(model)
        mat4.rotateY(model, model, context.time)
        return model
      }
    },
    elements: pyramid.cells
  })
}
var draw = {
  pyramid: makepyramid(regl)
}
regl.frame(function () {
  regl.clear({ color: [0,0,0,1], depth: true })
  drawfeedback({texture: feedBackTexture})    
  camera(function () {
    draw.pyramid()
    feedBackTexture({    
      copy: true,
      min: 'linear',
      mag: 'linear'
    })
  })
})

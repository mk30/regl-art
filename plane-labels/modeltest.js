var regl = require('regl')()
var mat4 = require('gl-mat4')
var glsl = require('glslify')
var normals = require('angle-normals')
var htext = require('./htext.json')
var haxis = require('./phaxis.json')
var text = require('./text.json')
var axis = require('./paxis.json')
var meshCombine = require('mesh-combine')

var mesh = meshCombine([axis,text]) 

var camera = require('regl-camera')(regl, {
  center: [0, 0, 0],
  distance: 20,
  far: 1000,
  theta: 0.3,
  phi: 0.4
})
var rmat = []
function phone (regl){
  return regl({
    frag: glsl`
      precision mediump float;
      varying vec3 vnormal, vpos;
      uniform float t;
      void main () {
        gl_FragColor = vec4(1,1,1, 1);
      }`,
    vert: glsl`
      precision mediump float;
      uniform mat4 model, projection, view;
      attribute vec3 position, normal;
      varying vec3 vnormal, vpos;
      uniform float t;
      void main () {
        vnormal = normal;
        vpos = position;
        gl_Position = projection * view * model *
        vec4(position, 1.0);
      }`,
    attributes: {
      position: mesh.positions,
      normal: normals(mesh.cells, mesh.positions)
    },
    elements: mesh.cells,
    uniforms: {
      t: function(context, props){
           return context.time
         },
      model: function(context, props){
        mat4.identity(rmat)
        return rmat
      }
    },
    primitive: "triangles",
    blend: {
      enable: true,
      func: { src: 'src alpha', dst: 'one minus src alpha' }
    },
    cull: { enable: false }
  })
}
var draw = {
  phone: phone(regl)
}
regl.frame(function() {
  regl.clear({
    color: [0, 0, 0, 1]
  })
  camera(function() {
    draw.phone()
  })
})

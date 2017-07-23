var regl = require('regl')()
var mat4 = require('gl-mat4')
var glsl = require('glslify')
var normals = require('angle-normals')
var mesh = require('./iphonefiles/phone.json')

var camera = require('regl-camera')(regl, {
  center: [0, 6, 0],
  distance: 20,
  theta: 0.3,
  phi: 0.4
})
var rmat = []
function phone (regl){
  return regl({
    frag: glsl`
      precision mediump float;
      #pragma glslify: snoise = require('glsl-noise/simplex/4d')
      varying vec3 vnormal, vpos;
      uniform float t;
      void main () {
        vec3 p = vnormal+0.2/(snoise(vec4(vpos*0.01,sin(t)+20.5))*0.5+0.3);
        float cross = abs(max(
          max(sin(p.z*10.0+p.y), sin(p.y*01.0)),
          sin(p.x*10.0)
          ));
        gl_FragColor = vec4(p*cross, 1);
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
        gl_PointSize = 10.0*sin(t);
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
        var t = context.time
        mat4.identity(rmat)
        mat4.scale(rmat, rmat,[0.1,0.1,0.1])
        mat4.rotateY(rmat, rmat, -t)
        mat4.rotateX(rmat, rmat, -t/2.0)
        mat4.rotateZ(rmat, rmat, t)
        return rmat
      }
    },
    primitive: "triangles",
    blend: {
      enable: true,
      func: { src: 'src alpha', dst: 'one minus src alpha' }
    },
    cull: { enable: true }
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

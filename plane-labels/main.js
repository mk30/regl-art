var regl = require('regl')()
var mat4 = require('gl-mat4')
var glsl = require('glslify')
var normals = require('angle-normals')
var mesh = require('./box.json')
var vectorizeText = require('vectorize-text')
var textMesh = vectorizeText('left', {
  triangles: true,
  width: 4,
  textAlign: 'center',
  textBaseline: 'middle'
})

var camera = require('regl-camera')(regl, {
  center: [0, 0, 0],
  distance: 20,
  theta: 0.3,
  phi: 0.4
})
var rmat = []
function box (regl){
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
        //mat4.rotateY(rmat, rmat, -t)
        //mat4.rotateX(rmat, rmat, -t/2.0)
        //mat4.rotateZ(rmat, rmat, t)
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
function text (regl){
  var rmat = []
  var mesh = textMesh
  return regl({
    frag: `
      precision mediump float;
      uniform float t;
      void main () {
        gl_FragColor = vec4(0.2, 1.0, 0, 0);
      }`,
    vert: `
      precision mediump float;
      uniform mat4 model, projection, view;
      attribute vec2 position;
      uniform float t;
      void main () {
        gl_Position = projection * view * model *
        vec4(position.x, -position.y, 0, 1.0);

      }`,
    attributes: {
      position: mesh.positions
    },
    elements: mesh.cells,
    uniforms: {
      t: function(context, props){
           return context.tick/1000
         },
      model: function(context, props){
        var theta = context.tick/60
        mat4.translate(rmat, mat4.identity(rmat), [1,0,0])
        mat4.rotateY(rmat, rmat, Math.PI/2)
        mat4.translate(rmat, rmat,
          [0,Math.sin(context.time)*0.1,Math.sin(context.time*0.1)*0.1])
        return rmat
      }
    },
    primitive: "triangles"
  })
}
var draw = {
  box: box(regl),
  text: text(regl)
}
regl.frame(function() {
  regl.clear({
    color: [0, 0, 0, 1]
  })
  camera(function() {
    draw.box()
    draw.text()
  })
})

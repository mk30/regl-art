var regl = require('regl')()
var mat4 = require('gl-mat4')
var glsl = require('glslify')
var normals = require('angle-normals')
var mesh = require('./box.json')
var vectorizeText = require('vectorize-text')
var meshCombine = require('mesh-combine')
var leftTextMesh = vectorizeText('left', {
  triangles: true,
  width: 4,
  textAlign: 'center',
  textBaseline: 'middle'
})
var rightTextMeshSrc = vectorizeText('right', {
  triangles: true,
  width: 6,
  textAlign: 'center',
  textBaseline: 'middle'
})
var rightTextMesh = {positions: [], cells: rightTextMeshSrc.cells}
for (var i=0; i<rightTextMeshSrc.positions.length; i++) {
  rightTextMesh.positions.push([
    rightTextMeshSrc.positions[i][0]+6,
    rightTextMeshSrc.positions[i][1],
    0
  ])
}
for (var i=0; i<leftTextMesh.positions.length; i++) {
  leftTextMesh.positions[i].push(0)
  leftTextMesh.positions[i][0] = leftTextMesh.positions[i][0] - 4 
}
var textMesh = meshCombine([rightTextMesh, leftTextMesh])
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
      attribute vec3 position;
      uniform float t;
      void main () {
        gl_Position = projection * view * model *
        vec4(position.z, -position.y, -position.x, 1.0);

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
        mat4.translate(rmat, mat4.identity(rmat), [0,0,2])
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

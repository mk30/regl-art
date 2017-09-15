var regl = require('regl')()
var mat4 = require('gl-mat4')
var glsl = require('glslify')
var mesh = require('./axis.json')
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
var frontTextMeshSrc = vectorizeText('front', {
  triangles: true,
  width: 6,
  textAlign: 'center',
  textBaseline: 'middle'
})
var backTextMeshSrc = vectorizeText('back', {
  triangles: true,
  width: 6,
  textAlign: 'center',
  textBaseline: 'middle'
})
var rightTextMesh = {positions: [], cells: rightTextMeshSrc.cells}
for (var i=0; i<rightTextMeshSrc.positions.length; i++) {
  rightTextMesh.positions.push([
    rightTextMeshSrc.positions[i][0]+7,
    rightTextMeshSrc.positions[i][1],
    0
  ])
}
var frontTextMesh = {positions: [], cells: frontTextMeshSrc.cells}
for (var i=0; i<frontTextMeshSrc.positions.length; i++) {
  frontTextMesh.positions.push([
    0+2,
    frontTextMeshSrc.positions[i][1],
    frontTextMeshSrc.positions[i][0]-6
  ])
}
var backTextMesh = {positions: [], cells: backTextMeshSrc.cells}
for (var i=0; i<backTextMeshSrc.positions.length; i++) {
  backTextMesh.positions.push([
    0+2,
    backTextMeshSrc.positions[i][1],
    backTextMeshSrc.positions[i][0]+6
  ])
}
for (var i=0; i<leftTextMesh.positions.length; i++) {
  leftTextMesh.positions[i].push(0)
  leftTextMesh.positions[i][0] = leftTextMesh.positions[i][0] - 3 
}
var textMesh = meshCombine([rightTextMesh, leftTextMesh, backTextMesh, frontTextMesh])
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
      void main () {
        gl_FragColor = vec4(0.125,0.192, 0.27, 1.0);
      }`,
    vert: glsl`
      precision mediump float;
      uniform mat4 model, projection, view;
      attribute vec2 position;
      attribute vec3 normal;
      uniform float t;
      void main () {
        gl_Position = projection * view * model *
        vec4(vec3(position.x,0,position.y)+normal, 1.0);
      }`,
    attributes: {
      position: mesh.positions,
      normal: mesh.normals
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
    }
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

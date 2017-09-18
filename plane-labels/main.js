var regl = require('regl')()
var mat4 = require('gl-mat4')
var glsl = require('glslify')
var axisSrc = require('./axis.json')
var vectorizeText = require('vectorize-text')
var meshCombine = require('mesh-combine')
var rightTextMeshSrc = vectorizeText('right', {
  font: 'arial',
  triangles: true,
  width: 6,
  textAlign: 'center'
})
var backTextMeshSrc = vectorizeText('back', {
  font: 'arial',
  triangles: true,
  width: 6,
  textAlign: 'center'
})
var rightTextMesh = {positions: [], cells: rightTextMeshSrc.cells}
for (var i=0; i<rightTextMeshSrc.positions.length; i++) {
  rightTextMesh.positions.push([
    -rightTextMeshSrc.positions[i][0]-6,
    -rightTextMeshSrc.positions[i][1]-4,
    0
  ])
}
var backTextMesh = {positions: [], cells: backTextMeshSrc.cells}
for (var i=0; i<backTextMeshSrc.positions.length; i++) {
  backTextMesh.positions.push([
    0,
    -backTextMeshSrc.positions[i][1]-4,
    backTextMeshSrc.positions[i][0]+6
  ])
}
var textMesh = meshCombine([rightTextMesh, backTextMesh])
//console.log(JSON.stringify(textMesh))

var axis = {positions: [], cells: axisSrc.cells, normals:
axisSrc.normals}
for (var i=0; i<axisSrc.positions.length; i++){
  axis.positions.push([
    2*axisSrc.positions[i][0],
    0,
    2*axisSrc.positions[i][1]
  ])
}

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
        gl_FragColor = vec4(0.125,0.192, 0.27, 0.9);
      }`,
    vert: glsl`
      precision mediump float;
      uniform mat4 model, projection, view;
      attribute vec3 position;
      attribute vec3 normal;
      uniform float t;
      void main () {
        gl_Position = projection * view * model *
        vec4(vec3(position.x,position.y,position.z)-normal*0.3, 1.0);
      }`,
    attributes: {
      position: axis.positions,
      normal: axis.normals
    },
    elements: axis.cells,
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
  return regl({
    frag: `
      precision mediump float;
      uniform float t;
      void main () {
        gl_FragColor = vec4(0.125,0.192, 0.27, 1.0);
      }`,
    vert: `
      precision mediump float;
      uniform mat4 model, projection, view;
      attribute vec3 position;
      uniform float t;
      void main () {
        gl_Position = projection * view * model *
        vec4(position.z, position.y, position.x, 1.0);

      }`,
    attributes: {
      position: textMesh.positions
    },
    elements: textMesh.cells,
    uniforms: {
      t: function(context, props){
           return context.tick/1000
         },
      model: function(context, props){
        var theta = context.tick/60
        mat4.identity(rmat, rmat)
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
    color: [0.9, 0.9, 0.9, 1]
  })
  camera(function() {
    draw.box()
    draw.text()
  })
})
process.exit()

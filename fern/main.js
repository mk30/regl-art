var regl = require('regl')()
var mat4 = require('gl-mat4')
var camera = require('regl-camera')(regl, {
  distance: 50,
  theta: 1.9,
  phi: 0.9
})
var leaf = {
  positions: [
    [0,7,0],
    [1,1,0],
    [0,0,0],
    [-1,1,0]
  ],
  cells: [
    [0,1,2],
    [0,2,3]
  ]
}
function makeleaf () {
  var model = []
  return regl({
    frag: `
      precision mediump float;
      void main () {
        gl_FragColor = vec4(0,0.9,0.6,1);
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
      position: leaf.positions
    },
    uniforms: {
      model: function (context) {
        mat4.identity(model)
        return model
      }
    },
    elements: leaf.cells
  })
}
var draw = {
  leaf: makeleaf(regl)
}
regl.frame(function () {
  regl.clear({ color: [0,0,0,1], depth: true })
  camera(function () {
    draw.leaf()
  })
})

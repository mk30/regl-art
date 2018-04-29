var regl = require('regl')()
var mat4 = require('gl-mat4')
var camera = require('regl-camera')(regl, {
  distance: 50,
  theta: 1.9,
  phi: 0.9
})
var leaf = {
  positions: [
  /*
    [0,7,0],
    [1,1,0],
    [0,0,0],
    [-1,1,0]
  */
  ],
  cells: [
  /*
    [0,1,2],
    [0,2,3]
  */
  ]
}
for (var i = 0; i < 10; i++) {
  var x = i*3
  leaf.positions.push(
    [x,7,0],
    [1+x,1,0],
    [x,0,0],
    [-1+x,1,0]
  )
  var k = i*4
  leaf.cells.push(
    [0+k,1+k,2+k],
    [0+k,2+k,3+k]
  )
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

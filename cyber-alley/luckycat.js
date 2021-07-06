var extrudeByPath = require('extrude-by-path')
var regl = require('regl')({
  extensions: ['oes_standard_derivatives']
})
var camera = require('regl-camera')(regl, {
  distance: 10,
  theta: 1.2
})
var draw = {
  neon: neon(regl)
}
var props = {
  neon: extrude(require('./luckycat.json'))
}
regl.frame(() => {
  regl.clear({ color: [0,0,0,1], depth: true })
  camera(() => {
    draw.neon(props.neon)
  })
})

function extrude(lines) {
  var meshes = []
  for (var i = 0; i < lines.length; i++) {
    var path = []
    var s = 0.01
    for (var j = 0; j < lines[i].length; j++) {
      path.push([
        lines[i][j][0]*s*2-2,
        3-2*lines[i][j][1]*s,
        0
      ])
    }
    var positions = [], cells = [], edges = []
    var n = 6
    for (var j = 0; j < n; j++) {
      var theta = j/(n-1)*2*Math.PI
      var r = 0.04
      positions.push([Math.cos(theta)*r,Math.sin(theta)*r])
    }
    for (var j = 0; j < positions.length-1; j++) {
      edges.push([j,j+1])
    }
    meshes.push(extrudeByPath({
      positions,
      cells,
      edges,
      path
    }))
  }
  var mesh = { positions: [], cells: [], lines: [] }
  for (var i = 0; i < meshes.length; i++) {
    var k = mesh.positions.length
    var m = meshes[i]
    for (var j = 0; j < m.positions.length; j++) {
      mesh.positions.push(m.positions[j])
      mesh.lines.push(i)
    }
    for (var j = 0; j < m.cells.length; j++) {
      mesh.cells.push([
        k+m.cells[j][0],
        k+m.cells[j][1],
        k+m.cells[j][2]
      ])
    }
  }
  return mesh
}

function neon(regl) {
  return regl({
    frag: `
      precision highp float;
      varying vec3 vpos;
      varying float vline;
      uniform float time;
      void main() {
        float v = vline + 0.5;
        float x = step(1.0,v) * step(v,2.0);
        x = max(x, step(8.0,v) * step(v,9.0));
        float y = step(3.0,v) * step(v,4.0);
        y = max(y, step(9.0,v) * step(v,10.0));
        float m = mix(x,y,floor(mod(time*2.0,2.0)));
        gl_FragColor = vec4(1.0-m*0.8,0,0,1);
      }
    `,
    vert: `
      precision highp float;
      uniform mat4 projection, view;
      attribute vec3 position;
      attribute float line;
      varying vec3 vpos;
      varying float vline;
      void main() {
        vpos = position;
        vline = line;
        gl_Position = projection * view * vec4(vpos,1);
      }
    `,
    attributes: {
      position: regl.prop('positions'),
      line: regl.prop('lines')
    },
    elements: regl.prop('cells'),
    uniforms: {
      time: regl.context('time')
    }
  })
}

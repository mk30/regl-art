var glsl = require('glslify')
var normals = require('angle-normals')
var gridMesh = require('grid-mesh')(50, 50)
var mat4 = require('gl-mat4')

var regl = require('regl')({
  extensions: [
    'oes_element_index_uint',
    'ext_blend_minmax'
  ]
})
var camera = require('regl-camera')(regl, {
  distance: 4,
  phi: 0.6,
  theta: 0.8
})

var planes = {
  positions: [],
  cells: []
}

var N = 10 
for (var i=0; i<N; i++) {
  var n = planes.positions.length/3
  var y = ((i/N)*2-1)*0.2 + 0.5
  planes.positions.push(
    -1, y, -1,
    -1, y, +1,
    +1, y, +1,
    +1, y, -1
  )
  planes.cells.push(n+0, n+1, n+2, n+0, n+2, n+3)
}

var gridModel = new Float32Array(16)
mat4.identity(gridModel)

var gridProps = [
  {
    location: [0,0,0],
    model: gridModel
  }
]

var draw = {
  plane: plane(regl),
  grid: createGrid(regl)
}
regl.frame(() => {
  regl.clear({ color: [0.8,0.7,0.4,1], depth: true })
  camera(() => {
    //draw.plane(planes)
    draw.grid(gridProps)
  })
})


function plane (regl) {
  return regl({
    frag: glsl`
      precision highp float;
			#pragma glslify: snoise = require('glsl-noise/simplex/3d')
      uniform float time;
      varying vec3 vpos, vnormal;
      void main () {
        float r = 0.9*(snoise(vec3(vpos.xz*10.0,time*0.3)));
        float g = snoise(vec3(vpos.yz,time*0.5));
        float a = vpos.y + (snoise(vec3(vpos.zy,time*0.5)));
        //float y = vpos.y + (0.5*snoise(vec3(vpos.xz,time*0.2))+0.5);
        //if (y>0.9) discard;
        if (r>0.1) discard;
        if (g>0.9) discard;
        gl_FragColor = vec4(0.6+r, 0.3+g, 0.7, a);
      }
    `,
    vert: `
      precision highp float;
      uniform mat4 projection, view;
      attribute vec3 position, normal;
      varying vec3 vpos, vnormal;
      void main () {
        vpos = position;
        vnormal = normal;
        gl_Position = projection * view * vec4(position,1);
      }
    `,
    uniforms: {
      time: regl.context('time')
    },
    attributes: {
      position: regl.prop('positions')
    },
    elements: regl.prop('cells'),
    blend: {
      enable: true,
      func: { src: 'src alpha', dst: 'one minus src alpha' },
      equation: { rgb: 'add', alpha: 'max' }
    }
  })
}

function createGrid (regl) {
  return regl({
    frag: glsl`
      precision highp float;
			#pragma glslify: snoise = require('glsl-noise/simplex/3d')
      uniform float time;
      varying vec2 vpos;
      void main () {
        float x = step(mod(vpos.x, 1.0),0.5);
        float y = step(mod(vpos.y, 1.0),0.5);
        gl_FragColor = vec4(mod(x+y, 2.0), 0, 0, 1.0);
      }
    `,
    vert: glsl`
      precision highp float;
      attribute vec2 position;
      uniform vec3 location;
      uniform mat4 projection, view, model;
      varying vec2 vpos;
      void main () {
        vpos = position;
        float x = position.x + location.x;
        float y = 0.0 + location.y;
        float z = position.y + location.z;
        gl_Position = projection * view * model * vec4(x,y,z,1.0);
      }
    `,
    uniforms: {
      time: regl.context('time'),
      model: regl.prop('model'),
      location: regl.prop('location')
    },
    attributes: {
      position: gridMesh.positions
    },
    elements: gridMesh.cells,
    primitive: "triangles"
  })
}

var glsl = require('glslify')
var normals = require('angle-normals')

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

var N = 20 
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

var draw = {
  plane: plane(regl)
}
regl.frame(() => {
  //regl.clear({ color: [0.8,0.7,0.4,1], depth: true })
  regl.clear({ color: [0.0,0.0,0.0,1], depth: true })
  camera(() => {
    draw.plane(planes)
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
        //float r = 0.9*(snoise(vec3(vpos.xz*10.0,time*0.3)));
        //float g = snoise(vec3(vpos.yz,time*0.5));
        float a = vpos.y * 0.5*(snoise(vec3(vpos.xz*100.0,time*0.5)));
        //float y = vpos.y + (0.5*snoise(vec3(vpos.xz,time*0.2))+0.5);
        //if (y>0.9) discard;
        //if (r>0.1) discard;
        //if (g>0.9) discard;
        gl_FragColor = vec4(0.3, 0.7, 0.3, a);
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

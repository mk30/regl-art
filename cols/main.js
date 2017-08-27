var column = require('column-mesh')
var regl = require('regl')()
var glsl = require('glslify')
var normals = require('angle-normals')
var camera = require('regl-camera')(regl, {
  center: [-400,0,0],
  eye: [0,0,1],
  distance: 400
})
var mat4 = require('gl-mat4')
var vec3 = require('gl-vec3')
var mat0 = [], v0 = [], pmat = []
var mesh = column({ radius: 2, height: 20 })
var col = fromMesh(mesh)

var batch = []
for (var i = 0; i < 10; i++) {
  batch.push(
    { location: [-i*20,0,20] },
    { location: [-i*20,0,-20] }
  )
}
for (var i = 0; i < 10; i++) {
  batch.push(
    { location: [-400,0,i*30+60] },
    { location: [-400,0,-i*30-60] }
  )
}
var planeMesh = {
  positions: [[-1,0,1],[1,0,1],[1,0,-1],[-1,0,-1]],
  cells: [[0,1,2],[2,3,0]]
}
function plane (regl) {
  return regl({
    frag: `
      precision mediump float;
      varying vec3 vnormal, vpos;
      varying float vtime;
      vec3 hsl2rgb(in vec3 hsl) {
        vec3 rgb = clamp(abs(mod(hsl.x*6.0+vec3(0.0,4.0,2.0),6.0)-3.0)-1.0,0.0,1.0);
        return hsl.z+hsl.y*(rgb-0.5)*(1.0-abs(2.0*hsl.z-1.0));
      }
      void main () {
        vec3 c = vec3 (0,0,1); 
        gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
      }
    `,
    vert: `
      precision mediump float;
      uniform mat4 projection, view;
      uniform float time;
      uniform vec3 location;
      attribute vec3 position, normal;
      varying vec3 vnormal, vpos;
      varying float vtime;
      void main () {
        vnormal = normal;
        vtime = time;
        vpos = vec3 (position.x*500.0, position.y*30.0-11.0, position.z*25.0);
        gl_Position = projection * view * vec4(vpos + location, 1.0);
      }
    `,
    attributes: {
      position: planeMesh.positions,
      normal: normals(planeMesh.cells, planeMesh.positions)
    },
    uniforms: {
      time: regl.context('time'),
      location: regl.prop('location')
    },
    elements: planeMesh.cells
  })
}

var pyramid = fromPyramid({
  positions: [[100,0,-100],[100,0,100],[-100,0,100],[-100,0,-100],[0,100,0]],
  cells: [[0,1,4],[1,2,4],[2,3,4],[0,3,4],[0,1,2],[2,3,0]]
})

function fromMesh (mesh) {
  return regl({
    frag: `
      precision mediump float;
      varying vec3 vnormal, vpos;
      varying float vtime;
      vec3 hsl2rgb(in vec3 hsl) {
        vec3 rgb = clamp(abs(mod(hsl.x*6.0+vec3(0.0,4.0,2.0),6.0)-3.0)-1.0,0.0,1.0);
        return hsl.z+hsl.y*(rgb-0.5)*(1.0-abs(2.0*hsl.z-1.0));
      }
      void main () {
        vec3 c = abs(vnormal) * 0.3
          + vec3(0.2 + sin(vtime + vpos.x/200.0 + vpos.z/300.0),1,1) * 0.6
        ;
        c.y = 1.0;
        gl_FragColor = vec4(hsl2rgb(c), 1.0);
      }
    `,
    vert: `
      precision mediump float;
      uniform mat4 projection, view, model;
      uniform float time;
      attribute vec3 position, normal;
      varying vec3 vnormal, vpos;
      varying float vtime;
      void main () {
        vnormal = normal;
        vtime = time;
        gl_Position = projection * view * model * vec4(position, 1.0);
        vpos = vec3(gl_Position);
      }
    `,
    attributes: {
      position: mesh.positions,
      normal: normals(mesh.cells, mesh.positions)
    },
    uniforms: {
      model: (context, props) => {
        var theta = context.time*0.25
        mat4.identity(mat0)
        mat4.translate(mat0, mat0, props.location)
        mat4.rotateY(mat0, mat0, theta)
        return mat0
      },
      time: regl.context('time'),
      location: regl.prop('location')
    },
    elements: mesh.cells
  })
}

function fromPyramid (mesh) {
  return regl({
    frag: `
      precision mediump float;
      varying vec3 vnormal, vpos;
      varying float vtime;
      vec3 hsl2rgb(in vec3 hsl) {
        vec3 rgb = clamp(abs(mod(hsl.x*6.0+vec3(0.0,4.0,2.0),6.0)-3.0)-1.0,0.0,1.0);
        return hsl.z+hsl.y*(rgb-0.5)*(1.0-abs(2.0*hsl.z-1.0));
      }
      void main () {
        vec3 c = vec3(abs(
          sin(vtime/20.0 + sin(vnormal * 6.2))
          + sin(vtime + vpos.x/200.0 + vpos.z/300.0)
        ) + vec3(0,0,2));
        c.y = 0.5;
        c.z = sin(length(vpos)/4.0) * 0.5;
        gl_FragColor = vec4(hsl2rgb(c), 1.0);
      }
    `,
    vert: `
      precision mediump float;
      uniform mat4 projection, view, model;
      uniform float time;
      attribute vec3 position, normal;
      varying vec3 vnormal, vpos;
      varying float vtime;
      void main () {
        vnormal = normal;
        vtime = time;
        gl_Position = projection * view * model * vec4(position, 1.0);
        vpos = vec3(gl_Position);
      }
    `,
    attributes: {
      position: mesh.positions,
      normal: normals(mesh.cells, mesh.positions)
    },
    uniforms: {
      model: (context, props) => {
        var speed = (1+Math.sin(context.time/8 + 16))/2
        var elev = Math.pow(speed, 4) * 200
        var theta = context.time * speed * 10
        mat4.identity(mat0)
        mat4.translate(mat0, mat0, props.location)
        vec3.set(v0,0,elev,0)
        mat4.translate(mat0, mat0, v0)
        mat4.rotateY(mat0, mat0, theta)
        return mat0
      },
      time: (context) => context.time,
      location: regl.prop('location')
    },
    elements: mesh.cells
  })
}
function bg (regl) {
  return regl({
    frag: glsl`
      precision highp float;
      #pragma glslify: snoise = require('glsl-noise/simplex/3d')
      #pragma glslify: hsl2rgb = require('glsl-hsl2rgb')
      uniform float time;
      void main () {
        vec2 uv = gl_FragCoord.xy;
        float n0 = snoise(vec3(uv*0.01,time*0.04))*0.5+0.5;
        float n1 = snoise(vec3(uv*0.001,time*0.2))*0.5+0.5;
        float n2 = snoise(vec3(uv*0.05,time*0.5))*0.5+0.5;
        float h = n0*0.3+0.4;
        float l = pow(n1*0.2+n2*0.5+0.5,0.8);
        float s = n0*0.2+n2*0.5+0.2;
        vec3 c = hsl2rgb(h,s,l);
        gl_FragColor = vec4(c,1);
      }
    `,
    vert: `
      precision highp float;
      attribute vec2 position;
      void main () {
        gl_Position = vec4(position,0,1);
      }
    `,
    uniforms: {
      time: regl.context('time')
    },
    attributes: {
      position: [-4,-4,-4,4,4,0]
    },
    elements: [0,1,2],
    count: 3,
    depth: { enable: false, mask: false }
  })
}
var draw = {
  bg: bg(regl),
  col: col,
  pyramid: pyramid,
  plane: plane(regl)
}
regl.frame(function () {
  regl.clear({ color: [0.9,0.9,0.9,1] })
  camera(function () {
    draw.bg()
    draw.col(batch)
    //draw.pyramid({ location: [-500,0,0] })
    draw.plane({ location: [-500,0,0] })
  })
})

const regl = require('regl')()
const ball = require('icosphere')(3)
const normals = require('angle-normals')
const glsl = require('glslify')
const mat4 = require('gl-mat4')
const model = [] 
const camera = require('regl-camera')(regl, {
  center: [0, 0, 0],
  distance: 7,
  theta: 1.0,
  phi: 0.7 
})
const drawBall = regl({
  frag: glsl`
    precision mediump float;
    #pragma glslify: snoise = require('glsl-noise/simplex/3d')
    #pragma glslify: cnoise = require('glsl-curl-noise')
    #pragma glslify: hsl2rgb = require('glsl-hsl2rgb')
    varying vec3 vnormal, vpos;
    uniform float t;
    void main () {
      gl_FragColor = vec4(abs(cnoise(hsl2rgb(vnormal*vnormal+vpos*sin(t)))), 1.0);
    }`,
  vert: glsl`
    precision mediump float;
    #pragma glslify: snoise = require('glsl-noise/simplex/3d')
    #pragma glslify: cnoise = require('glsl-curl-noise')
    uniform mat4 projection, view, model;
    uniform float t;
    attribute vec3 position, normal;
    varying vec3 vnormal, vpos, dvpos;
    void main () {
      vnormal = normal;
      vpos = position;
      float divline = min(position.y, 10.0);
      vpos.z = vpos.z + divline;
      vpos.y = vpos.z*vpos.z;
      dvpos = vpos + sin(0.3*cnoise(sin(vnormal+t))) ;
      gl_Position = projection * view * model * vec4(dvpos, 1.0);
    }`,
  attributes: {
    position: ball.positions,
    normal: normals(ball.cells, ball.positions)
  },
  elements: ball.cells,
  uniforms: {
    t: function(context, props){
      return context.time
    },
    model: function (context) {
      var theta = context.time
      mat4.rotateY(model, mat4.identity(model), theta*Math.PI/2)
      return model
    }
  },
  blend: {
    enable: true,
    func: { src: 'src alpha', dst: 'one minus src alpha' }
  },
  cull: { enable: true }
})
regl.frame(() => {
  regl.clear({ color: [0, 0, 0, 1] })
  var batch = []
  for (var i=0; i<20; i++){
    batch.push({foo: i/10*Math.PI, offset: i/20})
  }
  camera(() => {
    drawBall(batch)
  })
})

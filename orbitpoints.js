var regl = require('regl')()
var mat4 = require('gl-mat4')
var rmat = []
var cyl = require('./implicitcyl.js')
var cone = require('./implicitcone.js')
var normals = require('angle-normals')
var camera = require('regl-camera')(regl, {
  center: [0, 0, 0],
  distance: 10 
})
var drawcyl = regl({
  frag: `
    precision mediump float;
    uniform float t;
    varying vec3 vnormal;
    vec3 hsl2rgb(vec3 hsl) {
      vec3 rgb = clamp( abs(mod(hsl.x*5.0+vec3(0.0,4.0,2.0),6.0)-3.0)-1.0, 0.1, 0.9 );
      return sin(t+hsl.x) + hsl.y *
      (hsl-0.7)*(3.0-abs(2.0*hsl.y*sin(t)-1.0));
    }
    void main () {
      gl_FragColor = vec4(hsl2rgb(abs(vnormal-sin(t+13.0))), 1.0);
    }`,
  vert: `
    precision mediump float;
    uniform mat4 model, projection, view;
    attribute vec3 position, normal;
    varying vec3 vnormal;
    uniform float t;
    vec3 warp (vec3 p){
      float r = length(p.z*sin(t*p.yz));
      float theta = atan(p.z, p.x);
      return vec3 (r*cos(theta)+vnormal.x*sin(t), vnormal.y+p.y+theta, r*sin(theta));
    }
    void main () {
      vnormal = normal;
      gl_Position = projection * view * model * vec4(warp(position+vnormal), 1.0);
      gl_PointSize =
      (64.0*(1.0+sin(t*20.0+length(position))))/gl_Position.w;
    }`,
  attributes: {
    position: cyl.positions,
    normal: normals(cyl.cells, cyl.positions)
  },
  elements: cyl.cells,
  uniforms: {
    t: function(context, props){
         return context.tick/1000
       },
    model: function(context, props){
      var theta = context.tick/60
      mat4.rotateY(rmat, mat4.identity(rmat), theta)
      mat4.rotateX(rmat, rmat, -Math.sin(theta))
      return rmat
    }
  },
  primitive: "points"
})
regl.frame(function () {
  regl.clear({
    color: [0, 0, 0, 1]
  })
  camera(function () { drawcyl() })
})

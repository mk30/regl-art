var mat4 = require('gl-mat4')
var vec3 = require('gl-vec3')
var defined = require('defined')
var EventEmitter = require('events').EventEmitter
var m0 = new Float32Array(16)

module.exports = Camera

function Camera (opts) {
  if (!(this instanceof Camera)) return new Camera(opts)
  EventEmitter.call(this)
  if (!opts) opts = {}
  this.props = {
    projection: new Float32Array(16),
    view: new Float32Array(16),
    eye: new Float32Array([0,0,-5]),
    center: new Float32Array([0,0,0]),
    up: new Float32Array([0,1,0]),
    theta: defined(opts.theta, 0),
    phi: defined(opts.phi, 0),
    distance: defined(opts.distance, 0),
    fovy: defined(opts.fovy, Math.PI/4),
    near: defined(opts.near, 0.01),
    far: defined(opts.far, 1000.0),
    width: defined(opts.width, 1),
    height: defined(opts.height, 1)
  }
  this.delta = {
    theta: 0,
    phi: 0,
    distance: 0,
    center: [0,0]
  }
  this.idle = true
  this.update(0)
}
Camera.prototype = Object.create(EventEmitter.prototype)

Camera.prototype.resize = function (width, height) {
  this.props.width = width
  this.props.height = height
}

Camera.prototype.onmouse = function (ev) {
  if ((ev.buttons & 1) && ev.type === 'mousemove') {
    this.delta.theta -= ev.movementX * 0.05
    this.delta.phi += ev.movementY * 0.08
    if (Math.abs(this.delta.theta) > 1e-9
    || Math.abs(this.delta.phi) > 1e-9) {
      this.emit('frame')
    }
  }
}
Camera.prototype.onwheel = function (ev) {
  this.delta.distance += ev.deltaY / this.props.height * 20.0
  if (Math.abs(this.delta.distance) > 1e-9) this.emit('frame')
}
Camera.prototype.onkeydown = function (ev) {
  console.log(ev)
  if (ev.key === 'w') {}
}

Camera.prototype.update = function (dt) {
  this.props.theta += this.delta.theta * dt
  this.props.phi = Math.min(Math.PI/2-0.001,Math.max(-Math.PI/2+0.001,
    this.props.phi + this.delta.phi * dt))
  this.props.distance = Math.max(0.01,
    this.props.distance + this.delta.distance * dt)
  this.delta.theta *= 0.7
  this.delta.phi *= 0.7
  this.delta.distance *= 0.5
  this.idle = Math.abs(this.delta.theta) <= 1e-9
    && Math.abs(this.delta.phi) <= 1e-9
    && Math.abs(this.delta.distance) <= 1e-9
  var aspect = this.props.width / this.props.height
  mat4.perspective(this.props.projection, this.props.fovy,
    aspect, this.props.near, this.props.far)
  this.props.eye[0] = 0
  this.props.eye[1] = 0
  this.props.eye[2] = -this.props.distance
  mat4.identity(m0)
  mat4.rotateY(m0, m0, this.props.theta)
  mat4.rotateX(m0, m0, this.props.phi)
  vec3.transformMat4(this.props.eye, this.props.eye, m0)
  mat4.lookAt(this.props.view,
    this.props.eye, this.props.center, this.props.up)
}

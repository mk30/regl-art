var mat4 = require('gl-mat4')
var vec3 = require('gl-vec3')
module.exports = Camera

var tmpv0 = [0,0,0]

function Camera (opts) {
  if (!(this instanceof Camera)) return new Camera(opts)
  this.projection = new Float32Array(16)
  this.view = new Float32Array(16)
  this.eye = [0,0,0]
  this.center = [0,0,0]
  this.up = [0,1,0]
  this.fov = Math.PI/4
  this.aspect = opts.width / opts.height
  this.near = 1
  this.far = 5000
  this.position = [30,-4,-8]
  this.rotation = mat4.identity(new Float32Array(16))
  this.rotation = mat4.rotateY(this.rotation, this.rotation, Math.PI-1.4)
  this.delta = {
    position: [0,0,0],
    rotation: mat4.identity(new Float32Array(16))
  }
  this.update()
}

Camera.prototype.resize = function (width, height) {
  this.aspect = width / height
}

Camera.prototype.move = function (x,y,z) {
  vec3.set(this.delta.position, x, y, z)
}

Camera.prototype.rotate = function (x,y,z,r) {
  mat4.identity(this.delta.rotation)
  vec3.set(tmpv0,x,y,z)
  mat4.rotate(this.delta.rotation, this.delta.rotation, r, tmpv0)
}

Camera.prototype.update = function (dt) {
  vec3.transformMat4(tmpv0, this.delta.position, this.rotation)
  vec3.add(this.position, this.position, tmpv0)
  mat4.multiply(this.rotation, this.rotation, this.delta.rotation)
  vec3.copy(this.center, this.position)
  this.center[1] += 1.2
  vec3.set(this.eye, 0, 0, 1)
  vec3.transformMat4(this.eye, this.eye, this.rotation)
  vec3.add(this.eye, this.center, this.eye)

  mat4.perspective(this.projection, this.fov, this.aspect, this.near, this.far)
  mat4.lookAt(this.view, this.eye, this.center, this.up)
}

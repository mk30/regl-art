var mat4 = require('gl-mat4')
var defined = require('defined')

module.exports = Camera

function Camera (opts) {
  if (!(this instanceof Camera)) return new Camera(opts)
  if (!opts) opts = {}
  this.props = {
    projection: new Float32Array(16),
    view: new Float32Array(16),
    fovy: defined(opts.fovy, Math.PI/4),
    near: defined(opts.near, 0.01),
    far: defined(opts.far, 1000.0),
    width: defined(opts.width, 1),
    height: defined(opts.height, 1)
 
  }
}
Camera.prototype.update = function (dt) {
  var aspect = this.props.width / this.props.height
  mat4.perspective(this.props.projection, this.props.fovy,
    aspect, this.props.near, this.props.far)
  mat4.identity(this.props.view)
}


//camera's job is to propagate the projection & view matrices
//for projection matrix, copy the existing lib/camera (fov, aspect, near, far)
//for view matrix, first set an identity matrix. then do translation & rotation.
//might have to unset a translation by subtracting the previous translation from
//the matrix.

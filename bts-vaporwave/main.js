var column = require('column-mesh')
var regl = require('regl')({ extensions: ['oes_element_index_uint'] })
var glsl = require('glslify')
var normals = require('angle-normals')
var planeMesh = require("grid-mesh")(300, 60)
/*
var camera = require('./lib/camera.js')({ distance: 25, theta: -1.57, phi: 0,
  width: window.innerWidth, height: window.innerHeight
})
*/
var camera = require('./lib/james-cam.js')({
  width: window.innerWidth,
  height: window.innerHeight
})
var mat4 = require('gl-mat4')
var vec3 = require('gl-vec3')
var mat0 = [], v0 = [], pmat = [], rmat = []
var mesh = column({ radius: 2, height: 25 })
var col = fromMesh(mesh)
var boy1 = require('./assets/singersmsimplified1.json')
var dolphin1 = require('./assets/golf.json')

require('./lib/keys.js')(camera, document.body)

var cameraUniforms = regl({
  uniforms: {
    projection: () => camera.projection,
    view: () => camera.view
  }
})

var batch = []
for (var i = 0; i < 10; i++) {
  batch.push(
    Object.assign({}, { location: [i*20-180,5,20] }, camera.props),
    Object.assign({}, { location: [i*20-180,5,-20] }, camera.props)
  )
}
for (var i = 0; i < 10; i++) {
  batch.push(
    Object.assign({}, { location: [-180,0,i*10+40] }, camera.props),
    Object.assign({}, { location: [-180,0,-i*10-40] }, camera.props)
  )
}
function roof (regl) {
  return regl({
    frag: glsl`
      precision highp float;
      uniform float time;
      varying vec2 vpos;
      vec3 hsl2rgb(in vec3 hsl) {
        vec3 rgb = clamp(abs(mod(hsl.x*6.0+vec3(0.0,4.0,2.0),6.0)-3.0)-1.0,0.0,1.0);
        return hsl.z+hsl.y*(rgb-0.5)*(1.0-abs(2.0*hsl.z-1.0));
      }
      void main () {
        vec3 c = hsl2rgb(vec3 (0.2+sin(time/20.0)+cos(vpos.x),0.6,0.5)); 
        gl_FragColor = vec4(c, 0.7);
      }
    `,
    vert: glsl`
      #pragma glslify: snoise = require('glsl-noise/simplex/3d')
      precision highp float;
      uniform mat4 projection, view;
      uniform float time;
      uniform vec3 location;
      attribute vec2 position, normal;
      varying vec2 vnormal, vpos, dvpos;
      varying float vtime;
      void main () {
        vnormal = normal;
        vpos = position;
        //float dx = snoise(vec3(vpos+(cos(time)+0.5)/0.5, sin(time + vpos.y)));
        float dx = snoise(vec3(vpos, 0.25*sin(time + vpos.y)));
        float x = position.x + location.x;
        float y = 0.0 + location.y+dx;
        float z = position.y + location.z;
        gl_Position = projection * view * vec4(x, y, z, 1.0);
      }
    `,
    attributes: {
      position: planeMesh.positions,
      normal: normals(planeMesh.cells, planeMesh.positions)
    },
    uniforms: {
      time: regl.context('time'),
      location: regl.prop('location'),
      //projection: regl.prop('projection'),
      //view: regl.prop('view')
    },
    elements: planeMesh.cells
  })
}

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
      location: regl.prop('location'),
      //projection: regl.prop('projection'),
      //view: regl.prop('view')
    },
    elements: mesh.cells
  })
}
function floor (regl) {
  return regl({
    frag: glsl`
      precision highp float;
      uniform float time;
      varying vec2 vpos;
      vec3 hsl2rgb(in vec3 hsl) {
        vec3 rgb = clamp(abs(mod(hsl.x*6.0+vec3(0.0,4.0,2.0),6.0)-3.0)-1.0,0.0,1.0);
        return hsl.z+hsl.y*(rgb-0.5)*(1.0-abs(2.0*hsl.z-1.0));
      }
      void main () {
        vec3 c = hsl2rgb(vec3 (0.2+sin(time/5.0)+cos(vpos.x),0.1,0.5)); 
        gl_FragColor = vec4(c, 0.7);
      }
    `,
    vert: glsl`
      #pragma glslify: snoise = require('glsl-noise/simplex/3d')
      precision highp float;
      uniform mat4 projection, view;
      uniform float time;
      uniform vec3 location;
      attribute vec2 position, normal;
      varying vec2 vnormal, vpos, dvpos;
      varying float vtime;
      void main () {
        vnormal = normal;
        vpos = position;
        //float dx = snoise(vec3(vpos+(cos(time/2.0)+0.5)/0.5, sin(time + vpos.y)));
        float dx = snoise(vec3(vpos*0.1, 0.1*sin(time*2.0 + vpos.y)));
        float x = position.x + location.x;
        float y = 0.0 + location.y+dx;
        float z = position.y + location.z;
        gl_Position = projection * view * vec4(x, y, z, 1.0);
      }
    `,
    attributes: {
      position: planeMesh.positions,
      normal: normals(planeMesh.cells, planeMesh.positions)
    },
    uniforms: {
      time: regl.context('time'),
      location: regl.prop('location'),
      //projection: regl.prop('projection'),
      //view: regl.prop('view')
    },
    elements: planeMesh.cells
  })
}
function dolphin (regl){
  return regl({
    frag: glsl`
      precision mediump float;
      #pragma glslify: snoise = require('glsl-noise/simplex/4d')
      varying vec3 vnormal, vpos;
      uniform float t;
      void main () {
        vec3 p = vnormal+0.2/(snoise(vec4(vpos*0.01,sin(t)+20.5))*0.5+0.3);
        float cross = abs(max(
          max(sin(p.z*10.0+p.y), sin(p.y*01.0)),
          sin(p.x*10.0)
          ));
        gl_FragColor = vec4(p*cross, 1);
      }`,
    vert: glsl`
      precision mediump float;
      uniform mat4 model, projection, view;
      attribute vec3 position, normal;
      varying vec3 vnormal, vpos;
      uniform float t;
      void main () {
        vnormal = normal;
        vpos = position;
        gl_Position = projection * view * model *
        vec4(position, 1.0);
      }`,
    attributes: {
      position: dolphin1.positions,
      normal: normals(dolphin1.cells, dolphin1.positions)
    },
    elements: dolphin1.cells,
    uniforms: {
      t: function(context, props){
           return context.time
         },
      model: function(context, props){
        var t = context.time
        mat4.identity(rmat)
        //mat4.rotateY(rmat, rmat, t/5.0)
        mat4.translate(rmat, rmat, [-50, 11, 20])
        mat4.scale(rmat, rmat,[0.7,0.7,0.7])
        mat4.rotateX(rmat, rmat, -t/2.0)
        mat4.rotateZ(rmat, rmat, t)
        //mat4.translate(rmat, rmat, [0, 0, 12 + Math.cos(t/5)/2])
        return rmat
      },
      //projection: regl.prop('projection'),
      //view: regl.prop('view')
    },
    primitive: "triangles",
    blend: {
      enable: true,
      func: { src: 'src alpha', dst: 'one minus src alpha' }
    },
    cull: { enable: true }
  })
}
function boy (regl, mesh){
  return regl({
    frag: glsl`
      precision mediump float;
      #pragma glslify: snoise = require('glsl-noise/simplex/4d')
      varying vec3 vnormal, vpos;
      uniform float t;
      void main () {
        vec3 p = vnormal+(snoise(vec4(vpos*0.01,sin(t/20.0)))*0.1+0.7);
        //vec3 p = vnormal+0.5/(snoise(vec4(vpos*0.01,sin(t)+20.5))*0.5-0.3);
        float cross = abs(max(
          max(sin(p.z*10.0+p.y), sin(p.y*01.0)),
          sin(p.x*10.0)
          ));
        gl_FragColor = vec4(p*cross, 0.5+sin(t));
      }`,
    vert: glsl`
      precision mediump float;
      uniform mat4 model, projection, view;
      attribute vec3 position, normal;
      varying vec3 vnormal, vpos;
      uniform float t;
      void main () {
        vnormal = normal;
        vpos = position;
        gl_Position = projection * view * model *
        vec4(position, 1.0);
        //gl_PointSize = 10.0*sin(t);
        gl_PointSize = 1.0*sin(t);
      }`,
    attributes: {
      position: mesh.positions,
      normal: normals(mesh.cells, mesh.positions)
    },
    elements: mesh.cells,
    uniforms: {
      t: function(context, props){
           return context.time
         },
      model: function(context, props){
        var t = context.time
        mat4.identity(rmat)
        mat4.scale(rmat, rmat,[0.9,0.9,0.9])
        mat4.rotateY(rmat, rmat, 2.0)
        //mat4.rotateY(rmat, rmat, t/5.0)
        //mat4.rotateX(rmat, rmat, -t/2.0)
        //mat4.rotateZ(rmat, rmat, t)
        mat4.translate(rmat, rmat, [0, -12, 12 + Math.cos(t/5)/2])
        return rmat
      },
      //projection: regl.prop('projection'),
      //view: regl.prop('view')
    },
    primitive: "triangles",
    blend: {
      enable: true,
      func: { src: 'src alpha', dst: 'one minus src alpha' }
    },
    cull: { enable: true }
  })
}
function boyPoints (regl, mesh){
  return regl({
    frag: glsl`
      precision mediump float;
      #pragma glslify: snoise = require('glsl-noise/simplex/4d')
      varying vec3 vnormal, vpos;
      uniform float t;
      void main () {
        //vec3 p = vnormal+0.2/(snoise(vec4(vpos*0.01,sin(t)+20.5))*0.5+0.3);
        vec3 p = vnormal+0.1/(snoise(vec4(vpos*0.01,sin(t)+20.5))*0.5-0.3);
        float cross = abs(max(
          max(sin(p.z*10.0+p.y), sin(p.y*01.0)),
          sin(p.x*10.0)
          ));
        gl_FragColor = vec4(p, 1.0);
      }`,
    vert: glsl`
      precision mediump float;
      uniform mat4 model, projection, view;
      attribute vec3 position, normal;
      varying vec3 vnormal, vpos;
      uniform float t;
      void main () {
        vnormal = normal;
        vpos = position;
        gl_Position = projection * view * model *
        vec4(position, 1.0);
        //gl_PointSize = 10.0*sin(t);
        gl_PointSize = 1.0+abs((sin(t)+0.1));
      }`,
    attributes: {
      position: mesh.positions,
      normal: normals(mesh.cells, mesh.positions)
    },
    elements: mesh.cells,
    uniforms: {
      t: function(context, props){
           return context.time
         },
      model: function(context, props){
        var t = context.time
        mat4.identity(rmat)
        mat4.scale(rmat, rmat,[0.9,0.9,0.9])
        mat4.rotateY(rmat, rmat, 2.0)
        //mat4.rotateY(rmat, rmat, t/5.0)
        //mat4.rotateX(rmat, rmat, -t/2.0)
        //mat4.rotateZ(rmat, rmat, t)
        mat4.translate(rmat, rmat, [0, -12, 12 + Math.cos(t/5)/2])
        return rmat
      },
      //projection: regl.prop('projection'),
      //view: regl.prop('view')
    },
    primitive: "points",
    blend: {
      enable: true,
      func: { src: 'src alpha', dst: 'one minus src alpha' }
    },
    cull: { enable: true }
  })
}
function crown (regl, mesh){
  return regl({
    frag: glsl`
      precision mediump float;
      #pragma glslify: snoise = require('glsl-noise/simplex/4d')
      varying vec3 vnormal, vpos;
      uniform float t;
      void main () {
        vec3 p = vnormal+0.2/(snoise(vec4(vpos*0.01,sin(t)+20.5))*0.5+0.3);
        float cross = abs(max(
          max(sin(p.z*10.0+p.y), sin(p.y*01.0)),
          sin(p.x*10.0)
          ));
        gl_FragColor = vec4(p*cross, 1);
      }`,
    vert: glsl`
      precision mediump float;
      uniform mat4 model, projection, view;
      attribute vec3 position, normal;
      varying vec3 vnormal, vpos;
      uniform float t;
      void main () {
        vnormal = normal;
        vpos = position;
        gl_Position = projection * view * model *
        vec4(position, 1.0);
      }`,
    attributes: {
      position: mesh.positions,
      normal: normals(mesh.cells, mesh.positions)
    },
    elements: mesh.cells,
    uniforms: {
      t: function(context, props){
           return context.time
         },
      model: function(context, props){
        var t = context.time
        mat4.identity(rmat)
        //mat4.rotateY(rmat, rmat, t/5.0)
        mat4.translate(rmat, rmat, [-50, 11, 20])
        mat4.scale(rmat, rmat,[0.7,0.7,0.7])
        mat4.rotateX(rmat, rmat, -t/2.0)
        mat4.rotateZ(rmat, rmat, t)
        //mat4.translate(rmat, rmat, [0, 0, 12 + Math.cos(t/5)/2])
        return rmat
      },
      //projection: regl.prop('projection'),
      //view: regl.prop('view')
    },
    primitive: "triangles",
    blend: {
      enable: true,
      func: { src: 'src alpha', dst: 'one minus src alpha' }
    },
    cull: { enable: true }
  })
}
function crownSuga (regl, mesh){
  return regl({
    frag: glsl`
      precision mediump float;
      #pragma glslify: snoise = require('glsl-noise/simplex/4d')
      varying vec3 vnormal, vpos;
      uniform float t;
      void main () {
        vec3 p = vnormal+0.2/(snoise(vec4(vpos*0.01,sin(t)+20.5))*0.5+0.3);
        float cross = abs(max(
          max(sin(p.z*10.0+p.y), sin(p.y*01.0)),
          sin(p.x*10.0)
          ));
        gl_FragColor = vec4(p*cross, 1);
      }`,
    vert: glsl`
      precision mediump float;
      uniform mat4 model, projection, view;
      attribute vec3 position, normal;
      varying vec3 vnormal, vpos;
      uniform float t;
      void main () {
        vnormal = normal;
        vpos = position;
        gl_Position = projection * view * model *
        vec4(position, 1.0);
      }`,
    attributes: {
      position: mesh.positions,
      normal: normals(mesh.cells, mesh.positions)
    },
    elements: mesh.cells,
    uniforms: {
      t: function(context, props){
           return context.time
         },
      model: function(context, props){
        var t = context.time
        mat4.identity(rmat)
        //mat4.rotateY(rmat, rmat, t/5.0)
        mat4.translate(rmat, rmat, [-70, 9, -20])
        mat4.scale(rmat, rmat,[0.7,0.7,0.7])
        mat4.rotateY(rmat, rmat, t)
        mat4.rotateX(rmat, rmat, -Math.PI/2)
        //mat4.translate(rmat, rmat, [0, 0, 12 + Math.cos(t/5)/2])
        return rmat
      },
      //projection: regl.prop('projection'),
      //view: regl.prop('view')
    },
    primitive: "triangles",
    blend: {
      enable: true,
      func: { src: 'src alpha', dst: 'one minus src alpha' }
    },
    cull: { enable: true }
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
function vidwindow (regl) {
  return regl({
    frag: glsl`
      precision highp float;
      varying vec2 vuv;
      uniform sampler2D tex;
      void main () {
        gl_FragColor = texture2D(tex, vuv);
      }
    `,
    vert: glsl`
      precision highp float;
      uniform mat4 projection, view, model;
      attribute vec3 position;
      attribute vec2 uv;
      varying vec3 vpos;
      varying vec2 vuv;
      void main () {
        vpos = position;
        vuv = uv;
        gl_Position = projection * view * model * vec4(position,1);
      }
    `,
    uniforms: {
      time: regl.context('time'),
      tex: regl.prop('texture'),
      model: regl.prop('model')
    },
    attributes: {
      position: [
        [0,+10,-7],
        [0,-10,-7],
        [0,-10,+7],
        [0,+10,+7]
      ],
      uv: [
        [1.0, 0.0],
        [1.0, 1.0],
        [0.0, 1.0],
        [0.0, 0.0]
      ],
    },
    elements: [[0,1,2],[0,2,3]]
  })
}
var roofprops = Object.assign({}, { location: [-250,20, -30] }, camera.props)
var floorprops = Object.assign({}, { location: [-250,-10, -30] }, camera.props)

require('resl')({
  manifest: {
    singer: {
      type: 'text',
      src: './assets/singersmsimplified1.json',
      parser: JSON.parse
    },
    crown: {
      type: 'text',
      src: './assets/crownsim.json',
      parser: JSON.parse
    },
    crownSuga: {
      type: 'text',
      src: './assets/crownsim.json',
      parser: JSON.parse
    },
    texture0: {
      type: 'image',
      src: './assets/vidwindowrm.png',
      parser: (data) => regl.texture({
        data: data,
        mag: 'linear',
        min: 'linear'
      })
    },
    texture1: {
      type: 'image',
      src: './assets/vidwindowjimin.png',
      parser: (data) => regl.texture({
        data: data,
        mag: 'linear',
        min: 'linear'
      })
    },
    texture2: {
      type: 'image',
      src: './assets/vidwindowjhope.png',
      parser: (data) => regl.texture({
        data: data,
        mag: 'linear',
        min: 'linear'
      })
    },
    texture3: {
      type: 'image',
      src: './assets/vidwindowjinv.png',
      parser: (data) => regl.texture({
        data: data,
        mag: 'linear',
        min: 'linear'
      })
    },
    texture4: {
      type: 'image',
      src: './assets/vidwindowjinv.png',
      parser: (data) => regl.texture({
        data: data,
        mag: 'linear',
        min: 'linear'
      })
    },
    texture5: {
      type: 'image',
      src: './assets/vidwindowjk.png',
      parser: (data) => regl.texture({
        data: data,
        mag: 'linear',
        min: 'linear'
      })
    },
    texture6: {
      type: 'image',
      src: './assets/vidwindowsuga.png',
      parser: (data) => regl.texture({
        data: data,
        mag: 'linear',
        min: 'linear'
      })
    }
  },
  onDone: (assets) => {
		var draw = {
			bg: bg(regl),
			col: col,
			roof: roof(regl),
			floor: floor(regl),
			boy: boy(regl, assets.singer),
			boyPoints: boyPoints(regl, assets.singer),
			dolphin: dolphin(regl),
      crown: crown(regl, assets.crown),
      crownSuga: crownSuga(regl, assets.crown),
			vidwindow: vidwindow(regl)
		}
    var vidProps = [
      {
        texture: assets.texture0,
        model: new Float32Array(16)
      },
      {
        texture: assets.texture1,
        model: new Float32Array(16)
      },
      {
        texture: assets.texture2,
        model: new Float32Array(16)
      },
      {
        texture: assets.texture3,
        model: new Float32Array(16)
      },
      {
        texture: assets.texture4,
        model: new Float32Array(16)
      },
      {
        texture: assets.texture5,
        model: new Float32Array(16)
      },
      {
        texture: assets.texture6,
        model: new Float32Array(16)
      },
      //{ texture: assets.texture1 },
    ]
    regl.frame(function ({ time }) {
			regl.clear({ color: [0.9,0.9,0.9,1] })
      cameraUniforms(() => {
        draw.bg()
        draw.col(batch)
        draw.roof(roofprops)
        draw.floor(floorprops)
        draw.boy(camera.props)
        draw.boyPoints(camera.props)
        draw.dolphin(camera.props)
        draw.crown(camera.props)
        draw.crownSuga(camera.props)
        var m = vidProps[0].model
        mat4.identity(m)
        mat4.rotateY(m, m, time/2-3)
        mat4.translate(m, m, [-40, 0, 0])
        m = vidProps[1].model
        mat4.identity(m)
        mat4.rotateY(m, m, time/2-1.5)
        mat4.translate(m, m, [-40, 0, 0])
        m = vidProps[2].model
        mat4.identity(m)
        mat4.scale(m, m, [0.7, 0.7, 0.7])
        mat4.translate(m, m, [-1.5-0.5*Math.cos(time), 0.2*Math.sin(time*2), 30])
        mat4.translate(m, m, [-70, 0, 0])
        mat4.rotateY(m, m, Math.PI/2)
        m = vidProps[3].model
        mat4.identity(m)
        mat4.translate(m, m, [-40, 0, 0])
        mat4.translate(m, m, [-72, 0, 12])
        mat4.rotateY(m, m, -Math.PI/2)
        mat4.rotateY(m, m, time)
        m = vidProps[4].model
        mat4.identity(m)
        mat4.translate(m, m, [-40, 0, 0])
        mat4.translate(m, m, [-72, 0, 12])
        mat4.rotateY(m, m, -Math.PI/2)
        mat4.rotateY(m, m, time+1.5)
        m = vidProps[5].model
        mat4.identity(m)
        mat4.translate(m, m, [-45, 0, -3])
        //mat4.translate(m, m, [-82, 0, 0])
        mat4.scale(m, m, [1.0-Math.sin(time), 1.0-Math.sin(time), 0.8+0.5*Math.sin(time)])
        //mat4.rotateY(m, m, -Math.PI/2)
        //mat4.rotateY(m, m, time+1.5)
        m = vidProps[6].model
        mat4.identity(m)
        mat4.translate(m, m, [-0.5*Math.cos(time), 0.2*Math.sin(time*2), 0])
        mat4.translate(m, m, [-40, 0, 0])
        mat4.translate(m, m, [-30, 0, -20])
        mat4.rotateY(m, m, -Math.PI/2)
        mat4.scale(m, m, [0.8, 0.8, 0.8])
        draw.vidwindow(vidProps)
      })
      camera.update()
    })
  }
})


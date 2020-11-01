var regl = require('regl')()
/*
var camera = require('regl-camera')(regl,
  { distance: 32, theta: 1.6, phi: 0.2 })
*/
var camera = require('./lib/james-cam.js')({
  width: window.innerWidth,
  height: window.innerHeight
})
var sphere = require('icosphere')(5)
var glsl = require('glslify')
var anormals = require('angle-normals')
var mat4 = require('gl-mat4')

var feedback = require('regl-feedback')
var fbtex = regl.texture()
var teapot = require('teapot')

require('./lib/keys.js')(camera, document.body)

var cameraUniforms = regl({
  uniforms: {
    projection: () => camera.projection,
    view: () => camera.view
  }
})

function drawGrid () {
  var mesh = {
    positions: [[-1,-1],[+1,-1],[+1,+1],[-1,+1]],
    cells: [[0,1,2],[0,2,3]]
  }
  return regl({
    frag: glsl `
			precision highp float;
      #pragma glslify: snoise = require('glsl-noise/simplex/3d') 
      #pragma glslify: hsl2rgb = require('glsl-hsl2rgb')
			varying vec2 vpos;
			uniform float time;
			void main () {
				float h = 0.7 + 0.5*(snoise(vec3(vpos,time*0.3))*0.5);
				float l = pow(max(
					sin(vpos.x*128.0)*0.7+0.5,
					sin(vpos.y*128.0)*0.7+0.5
				),4.0);
				vec3 c = hsl2rgb(h,1.0,l*0.5);
				gl_FragColor = vec4(c,l);
			}
		`,
    vert: glsl `
			attribute vec2 position;
			uniform mat4 projection, view;
			uniform float time;
			varying vec2 vpos;
			void main () {
				vpos = position;
				vec3 p = vec3(position.x,-0.2,position.y)*30.0;
				gl_Position = projection * view * vec4(p,1);
			}
		`,
    uniforms: {
      time: regl.context('time')
    },
    attributes: {
      position: mesh.positions
    },
    elements: mesh.cells,
    blend: {
      enable: true,
      func: { src: 'src alpha', dst: 'one minus src alpha' }
    }
  })
}

function drawTeapot () {
  var mesh = teapot
  return regl({
    frag: glsl `
			precision highp float;
      #pragma glslify: snoise = require('glsl-noise/simplex/4d') 
      #pragma glslify: hsl2rgb = require('glsl-hsl2rgb')
      uniform float time;
      varying vec3 vpos, vnorm;
      void main () {
        vec3 p = floor(vpos*2.0+0.5)/2.0;
        float h = snoise(vec4(p*2.0,time))*0.5+0.5;
        float l0 = max(
          snoise(vec4(p*8.0,time*1.0))*0.5+0.5,
          snoise(vec4(p*4.0,time*8.0))*0.5+0.5);
        float q = 2.0;
        float l1 = max(
          max(sin(vpos.x*q)*0.5+0.5,sin(vpos.y*q)*0.5+0.5),
          sin(vpos.z*q)*0.5+0.5
        );
        float l = max(l0,l1);
        vec3 c = hsl2rgb(h,1.0,pow(l,8.0));
        gl_FragColor = vec4(c,l);
			}
	`,
    vert: glsl `
			precision highp float;
      #pragma glslify: snoise = require('glsl-noise/simplex/4d') 
      uniform mat4 projection, view;
      uniform float time, iobj;
      uniform vec3 offset;
      attribute vec3 position, normal;
      varying vec3 vpos, vnorm;
      void main () {
        float t = time * sin(time*0.1);
        vpos = position*0.03*pow(sin(t+iobj*13.0)*0.5+0.5,4.0)*20.0
          + normal * snoise(vec4(position,floor(time*4.0))) * 0.05;
        gl_Position = projection * view * vec4(vpos+offset,1);
      }
		`,
    uniforms: {
      offset: regl.prop('offset'),
      iobj: regl.prop('iobj'),
      time: regl.context('time')
    },
    attributes: {
      position: mesh.positions,
      normal: anormals(mesh.cells, mesh.positions)
    },
    elements: mesh.cells,
    blend: {
      enable: true,
      func: { src: 'src alpha', dst: 'one minus src alpha' }
    }
  })
}

function drawBlob () {
  var mesh = sphere
  var model = []
  return regl({
    frag: glsl `
			precision highp float;
      #pragma glslify: snoise = require('glsl-noise/simplex/4d') 
      #pragma glslify: hsl2rgb = require('glsl-hsl2rgb')
      uniform float time;
      varying vec3 vpos;
      void main () {
        float h = snoise(vec4(vpos,time))*0.5+0.5;
        float s = 1.0;
        float x = snoise(vec4(vpos*4.0,time*4.0))*0.5+0.5;
        float l = pow(
          max(max(sin(vpos.x*8.0),sin(vpos.y*8.0))*0.5+0.5,
          sin(vpos.z*8.0)),
          256.0);
        vec3 c = hsl2rgb(h,s,l);
        gl_FragColor = vec4(c,l);
      }
		`,
    vert: glsl `
			precision highp float;
      #pragma glslify: snoise = require('glsl-noise/simplex/4d') 
      attribute vec3 position, normal;
      varying vec3 vpos;
      uniform float time, iobj;
      uniform vec3 offset;
      uniform mat4 projection, view, model;
      void main () {
        float n0 = snoise(vec4(position,time));
        vpos = position + normal * n0;
        vec3 p = vec3(
          sin(time*0.1+iobj*6.0)*10.0,
          sin(time*0.1+13.0+iobj*4.0)*10.0,
          sin(time*0.1-17.0+iobj*5.0)*10.0
        );
        gl_Position = projection * view
          * (model * vec4(vpos,1) + vec4(p+offset,0));
      }
		`,
    uniforms: {
      time: regl.context('time'),
      offset: regl.prop('offset'),
      iobj: regl.prop('iobj'),
      model: function (context, props) {
        var t = context.time
        mat4.identity(model)
        mat4.rotateY(model,model,t + Math.sin(t)/2)
        return model
      },
      offset: regl.prop('offset')
    },
    attributes: {
      position: mesh.positions,
      normal: anormals(mesh.cells, mesh.positions)
    },
    elements: mesh.cells,
    blend: {
      enable: true,
      func: { src: 'src alpha', dst: 'one minus src alpha' }
    }
  })
}
/*
function bg () {
  return regl({
    frag: glsl `
      precision highp float;
      #pragma glslify: snoise = require('glsl-noise/simplex/3d') 
      #pragma glslify: hsl2rgb = require('glsl-hsl2rgb')
      varying vec2 uv;
      uniform float time;
      void main () {
        float h = snoise(vec3(uv,time*0.5)) * 0.5 - 
        0.5*snoise(vec3(1.0/uv, time*0.2));
        float l0 = pow(
          (snoise(vec3(uv*32.0,time*0.2))*0.5+0.5), 16.0);
        vec3 c = hsl2rgb(h,1.0,l0);
        gl_FragColor = vec4(c,length(c));
      }

		`,
    vert: `
      precision highp float;
      attribute vec2 position;
      varying vec2 uv;
      void main () {
        uv = position;
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
    depth: { enable: false, mask: false },
    blend: {
      enable: true,
      func: { src: 'src alpha', dst: 'one minus src alpha' }
    }
  })
}
*/
function bg () {
  return regl({
    frag: glsl `
      precision highp float;
      #pragma glslify: snoise = require('glsl-noise/simplex/3d') 
      #pragma glslify: hsl2rgb = require('glsl-hsl2rgb')
      varying vec2 uv;
      uniform float time;
      void main () {
        float h = 0.2*(snoise(vec3(uv,time*0.9))-1.5);
        float l0 = pow(
          (snoise(vec3(uv*32.0,time*0.2)+vec3(-time,0,0))*0.5+0.5), 16.0);
        vec3 c = hsl2rgb(h,1.0,l0);
        gl_FragColor = vec4(c,length(c));
      }

		`,
    vert: `
      precision highp float;
      attribute vec2 position;
      varying vec2 uv;
      void main () {
        uv = position;
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
    depth: { enable: false, mask: false },
    blend: {
      enable: true,
      func: { src: 'src alpha', dst: 'one minus src alpha' }
    }
  })
}
function drawCreature () {
  var mesh = sphere
  return regl({
    frag: glsl `
			precision highp float;
      #pragma glslify: snoise = require('glsl-noise/simplex/4d') 
      #pragma glslify: hsl2rgb = require('glsl-hsl2rgb')
      varying vec3 vpos;
      uniform float time, iobj;
      void main () {
        float h = snoise(vec4(vpos,time))*0.2
          + (sin(floor(time*8.0+iobj)*0.1)*0.5+0.5);
        float l = pow(max(
          snoise(vec4(vpos,time))*0.5+0.5,
          max(max(sin(vpos.x*8.0)*0.5+0.5,sin(vpos.y*8.0))*0.5+0.5,
            sin(vpos.z*8.0)*0.5+0.5)
        ),32.0);
        vec3 c = hsl2rgb(h,1.0,l);
        gl_FragColor = vec4(c,pow(length(c),2.0));
      }
		`,
    vert: glsl `
			precision highp float;
      #pragma glslify: snoise = require('glsl-noise/simplex/4d') 
      uniform mat4 projection, view;
      uniform vec3 offset;
      attribute vec3 position, normal;
      varying vec3 vpos;
      uniform float time, iobj;
      void main () {
        vec3 p = position;
        float g = max(sin(p.x*8.0)*0.5+0.5,sin(p.z*8.0)*0.5+0.5);
        float y = (1.0-p.y)*0.5+0.5
          * (snoise(vec4(p,time))*0.5+0.5);
        vpos = position + normal*g*y*4.0 + offset;
        gl_Position = projection * view * vec4(vpos,1);
      }
		`,
    uniforms: {
      offset: regl.prop('offset'),
      iobj: regl.prop('iobj'),
      time: regl.context('time')
    },
    attributes: {
      position: mesh.positions,
      normal: anormals(mesh.cells, mesh.positions)
    },
    elements: mesh.cells,
    blend: {
      enable: true,
      func: { src: 'src alpha', dst: 'one minus src alpha' }
    }
  })
}

var draw = {
  blob: drawBlob(),
  creature: drawCreature(),
  bg: bg(),
  teapot: drawTeapot(),
  grid: drawGrid(),
  fb: feedback(regl, glsl `
		#pragma glslify: snoise = require('glsl-noise/simplex/3d') 
    uniform float time;
    vec3 sample (vec2 uv, sampler2D tex) {
      vec2 xy = uv + uv*snoise(vec3(uv,time*8.0))*0.04;
      float q = 256.0;
      xy = floor(xy*q+0.5)/q;
      //  + mod(floor(time),2.0)*floor(uv*32.0+0.5)/32.0;
      vec3 c = 0.97*texture2D(tex, (0.99*(2.0*xy-1.0)+1.0)*0.5).rgb;
      return c;
    }
	`)
}
var setFB = regl({
  uniforms: {
    time: regl.context('time')
  }
})
var blobs = []
for (var i = 0; i < 20; i++) {
  var x = (Math.random()*2-1)*10
  var y = (Math.random()*2-1)*10
  var z = (Math.random()*2-1)*10
  blobs.push({ offset: [x,y,z], iobj: i })
}
var teapots = []
teapots.push({ offset: [0,0,0], iobj: 0 })
for (var i = 0; i < 50; i++) {
  var x = (Math.random()*2-1)*50
  var y = (Math.random()*2-1)*50
  var z = (Math.random()*2-1)*50
  teapots.push({ offset: [x,y,z], iobj: i+1 })
}
var creatures = []
creatures.push({ offset: [0,0,0], iobj: 0 })
for (var i = 0; i < 50; i++) {
  var x = (Math.random()*2-1)*100
  var y = (Math.random()*2-1)*100
  var z = (Math.random()*2-1)*100
  creatures.push({ offset: [x,y,z], iobj: i+1 })
}
regl.frame(function () {
  regl.clear({ color: [0,0,0,1], depth: true })
  /*
  setFB(function () {
    draw.fb({ texture: fbtex })
  })
  */
  draw.bg()
  cameraUniforms(function () {
    //draw.blob(blobs)
    //draw.creature(creatures)
    //draw.teapot(teapots)
    draw.grid()
  })
  camera.update()
})

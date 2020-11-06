var regl = require('regl')()
var camera = require('./lib/james-cam.js')({
  width: window.innerWidth,
  height: window.innerHeight
})
var sphere = require('icosphere')(5)
var glsl = require('glslify')
var anormals = require('angle-normals')
var mat4 = require('gl-mat4')
var teapot = require('teapot')
var extrudeByPath = require('extrude-by-path')

require('./lib/keys.js')(camera, document.body)

var cameraUniforms = regl({
  uniforms: {
    projection: () => camera.projection,
    view: () => camera.view
  }
})

require('resl')({
  manifest: {
    seagull: {
      type: 'text',
      src: './assets/seagull.json',
      parser: JSON.parse
    },
    cube: {
      type: 'text',
      src: './assets/cube.json',
      parser: JSON.parse
    },
    texture0: {
      type: 'image',
      src: './assets/bamboo.png',
      stream: true,
      parser: (data) => regl.texture({
        data: data,
        mag: 'linear',
        min: 'linear'
      })
    },
    texture1: {
      type: 'image',
      src: './assets/wall.jpg',
      stream: true,
      parser: (data) => regl.texture({
        data: data,
        mag: 'linear',
        min: 'linear'
      })
    },
    texturecw: {
      type: 'image',
      src: './assets/concretewall.jpg',
      stream: true,
      parser: (data) => regl.texture({
        data: data,
        mag: 'linear',
        min: 'linear'
      })
    },
    texturebrick: {
      type: 'image',
      src: './assets/brickwall.jpg',
      stream: true,
      parser: (data) => regl.texture({
        data: data,
        mag: 'linear',
        min: 'linear'
      })
    }
  },
  onDone: (assets) => {
    var draw = {
      blob: drawBlob(),
      creature: drawCreature(),
      bg: bg(),
      teapot: drawTeapot(),
      neon: neon(regl),
      seagull: seagull(regl, assets.seagull),
      cube: cube(regl, assets.cube),
      wall: wall(regl),
      grid: drawGrid(),
      vidwindow: vidwindow(regl)
    }
    var vidProps = [
      {
        texture: assets.texture0,
        model: new Float32Array(16)
      }
    ]
    var wallProps = [
      {
        texture: assets.texturecw,
        model: new Float32Array(16)
      },
      {
        texture: assets.texturecw,
        model: new Float32Array(16)
      },
      {
        texture: assets.texturebrick,
        model: new Float32Array(16)
      }
    ]
    /*
    var neonProps = extrude(require('./assets/luckycat.json'))
    neonProps.model = new Float32Array(16)
    */
    var neonProps = Object.assign(
      extrude(require('./assets/luckycat.json')),
      { model: new Float32Array(16) }
    )
    var seagullProps = [
      {
        model: new Float32Array(16)
      },
      {
        model: new Float32Array(16)
      }
    ]
    var cubeProps = [
      {
        texture: assets.texture1,
        model: new Float32Array(16)
      }
    ]
    regl.frame(function ({ time }) {
      regl.clear({ color: [0,0,0,1], depth: true })
      draw.bg()
      cameraUniforms(function () {
        //draw.blob(blobs)
        //draw.creature(creatures)
        //draw.teapot(teapots)
        var n = neonProps.model
        mat4.identity(n)
        mat4.rotateY(n, n, Math.PI/2)
        mat4.translate(n, n, [18, 16, -15])
        mat4.scale(n, n, [5,5,5])
        draw.neon(neonProps)
        var s = seagullProps[0].model
        mat4.identity(s)
        mat4.scale(s, s,[5,5,5])
        mat4.rotateY(s, s, -time)
        mat4.rotateZ(s, s, 0.3*Math.sin(time*2))
        mat4.translate(s, s, [0, 0.4*Math.sin(time*2),0])
        s = seagullProps[1].model
        mat4.identity(s)
        mat4.scale(s, s,[5,5,5])
        mat4.rotateY(s, s, Math.PI)
        mat4.translate(s, s, [2, 0, 0])
        mat4.rotateY(s, s, -time)
        mat4.rotateZ(s, s, 0.4*Math.sin(time))
        //mat4.translate(s, s, [0, 0.4*Math.sin(time*2),0])
        draw.seagull(seagullProps)
        var c = cubeProps[0].model
        mat4.identity(c)
        mat4.translate(c, c, [-20, -1, -20])
        //mat4.rotateY(c, c, Math.PI/6)
        mat4.scale(c, c, [15,10,20])
        draw.cube(cubeProps)
        draw.grid()
        var cw = wallProps[0].model
        mat4.identity(cw)
        mat4.scale(cw, cw, [0.8, 0.8, 0.8])
        mat4.rotateY(cw, cw, Math.PI/2)
        mat4.translate(cw, cw, [-35,2,-20])
        cw = wallProps[2].model
        mat4.identity(cw)
        mat4.scale(cw, cw, [2.5, 2.0, 2.0])
        mat4.translate(cw, cw, [-12,3,-8])
        cw = wallProps[1].model
        mat4.identity(cw)
        mat4.scale(cw, cw, [2.0, 2.0, 2.0])
        mat4.translate(cw, cw, [-8,3,-15])
        mat4.rotateY(cw, cw, Math.PI/2)
        draw.wall(wallProps)
        var m = vidProps[0].model
        mat4.identity(m)
        mat4.scale(m, m, [0.8, 0.8, 0.8])
        mat4.rotateY(m, m, Math.PI/2)
        mat4.translate(m, m, [-35,2,-20])
        draw.vidwindow(vidProps)
      })
      camera.update()
    })
  }
})

function extrude(lines) {
  var meshes = []
  for (var i = 0; i < lines.length; i++) {
    var path = []
    var s = 0.01
    for (var j = 0; j < lines[i].length; j++) {
      path.push([
        lines[i][j][0]*s*2-2,
        3-2*lines[i][j][1]*s,
        0
      ])
    }
    var positions = [], cells = [], edges = []
    var n = 6
    for (var j = 0; j < n; j++) {
      var theta = j/(n-1)*2*Math.PI
      var r = 0.04
      positions.push([Math.cos(theta)*r,Math.sin(theta)*r])
    }
    for (var j = 0; j < positions.length-1; j++) {
      edges.push([j,j+1])
    }
    meshes.push(extrudeByPath({
      positions,
      cells,
      edges,
      path
    }))
  }
  var mesh = { positions: [], cells: [], lines: [] }
  for (var i = 0; i < meshes.length; i++) {
    var k = mesh.positions.length
    var m = meshes[i]
    for (var j = 0; j < m.positions.length; j++) {
      mesh.positions.push(m.positions[j])
      mesh.lines.push(i)
    }
    for (var j = 0; j < m.cells.length; j++) {
      mesh.cells.push([
        k+m.cells[j][0],
        k+m.cells[j][1],
        k+m.cells[j][2]
      ])
    }
  }
  return mesh
}

function neon(regl) {
  return regl({
    frag: `
      precision highp float;
      varying vec3 vpos;
      varying float vline;
      uniform float time;
      void main() {
        float v = vline + 0.5;
        float x = step(1.0,v) * step(v,2.0);
        x = max(x, step(8.0,v) * step(v,9.0));
        float y = step(3.0,v) * step(v,4.0);
        y = max(y, step(9.0,v) * step(v,10.0));
        float m = mix(x,y,floor(mod(time*2.0,2.0)));
        //gl_FragColor = vec4(1.0-m*0.8,0.5-m*0.5,0.5-m*0.5,1);
        gl_FragColor = vec4(1.0-m*0.8,0,0,1);
      }
    `,
    vert: `
      precision highp float;
      uniform mat4 projection, view, model;
      attribute vec3 position;
      attribute float line;
      varying vec3 vpos;
      varying float vline;
      void main() {
        vpos = position;
        vline = line;
        gl_Position = projection * view * model * vec4(vpos,1);
      }
    `,
    attributes: {
      position: regl.prop('positions'),
      line: regl.prop('lines')
    },
    elements: regl.prop('cells'),
    uniforms: {
      time: regl.context('time'),
      model: regl.prop('model')
    }
  })
}

function seagull (regl, mesh){
  return regl({
    frag: glsl`
      precision mediump float;
      #pragma glslify: snoise = require('glsl-noise/simplex/4d')
      varying vec3 vnormal, vpos;
      uniform float t;
      void main () {
        vec3 p = vnormal+(snoise(vec4(vpos*0.01,sin(t/20.0)))+0.7);
        float c = abs(max(
          max(sin(p.z*10.0+p.y), sin(p.y*01.0)),
          sin(p.x*10.0)
          ));
        gl_FragColor = vec4(p*c, abs(sin(t*4.0)));
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
      normal: anormals(mesh.cells, mesh.positions)
    },
    elements: mesh.cells,
    uniforms: {
      t: function(context, props){
           return context.time
         },
      model: regl.prop('model')
    },
    primitive: "triangles",
    blend: {
      enable: true,
      func: { src: 'src alpha', dst: 'one minus src alpha' }
    },
    cull: { enable: true }
  })
}

function cube (regl, mesh){
  return regl({
    frag: glsl`
      precision mediump float;
      varying vec2 vuv;
      uniform sampler2D texture;
      varying vec3 vnormal, vpos;
      uniform float t;
      void main () {
        //gl_FragColor = vec4(p*c, abs(sin(t*4.0)));
        gl_FragColor = texture2D(texture, vuv);
      }`,
    vert: glsl`
      precision mediump float;
      uniform mat4 model, projection, view;
      attribute vec2 uv;
      varying vec2 vuv;
      attribute vec3 position, normal;
      varying vec3 vnormal, vpos;
      uniform float t;
      void main () {
        vnormal = normal;
        vpos = position;
        vuv = uv;
        gl_Position = projection * view * model *
        vec4(position, 1.0);
      }`,
    attributes: {
      position: mesh.positions,
      normal: anormals(mesh.cells, mesh.positions),
      uv: mesh.uv
    },
    elements: mesh.cells,
    uniforms: {
      t: function(context, props){
           return context.time
         },
      model: regl.prop('model'),
      texture: regl.prop('texture'),
    },
    primitive: "triangles",
    blend: {
      enable: true,
      func: { src: 'src alpha', dst: 'one minus src alpha' }
    },
    cull: { enable: true }
  })
}

function wall (regl) {
  return regl({
    frag: glsl`
      precision highp float;
      varying vec2 vuv;
      varying vec3 vpos;
      uniform float time;
      uniform sampler2D texture;
      void main () {
        float y = floor(mod(vuv.y*50.0, 2.0));
        float x = floor(mod(vuv.x*50.0+y, 2.0));
        vec4 t = texture2D(texture, vuv);
        t += 0.5*vec4(1,0,0,1)*(1.0-smoothstep(0.0, 12.0, length(vpos + vec3(0.0,-5.0,0.0))));
        //gl_FragColor = glow;
        gl_FragColor = t;
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
      texture: regl.prop('texture'),
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
    elements: [[0,1,2],[0,2,3]],
    blend: {
      enable: true,
      func: { src: 'src alpha', dst: 'one minus src alpha' }
    },
    depth: {
      mask: false
    }
  })
}

function vidwindow (regl) {
  return regl({
    frag: glsl`
      precision highp float;
      varying vec2 vuv;
      uniform float time;
      uniform sampler2D tex;
      void main () {
        float y = floor(mod(vuv.y*50.0, 2.0));
        float x = floor(mod(vuv.x*50.0+y, 2.0));
        vec4 t = texture2D(tex, vuv);
        vec4 bg = mix(vec4(0,0,1,1), vec4(0,1,0,1), x);
        float flick = 0.5*0.4*sin(time*32.0) + 0.5*sin(time*2.0) + 1.0;
        vec4 flickmix = mix(bg, t, step(flick, 0.8));
        gl_FragColor = mix(t, flickmix, t.w);
        //gl_FragColor = texture2D(tex, vuv);
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
    elements: [[0,1,2],[0,2,3]],
    blend: {
      enable: true,
      func: { src: 'src alpha', dst: 'one minus src alpha' }
    },
    depth: {
      mask: false
    }
  })
}

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
					sin(vpos.x*128.0)*0.7+0.2*cos(time),
					sin(vpos.y*128.0)*0.7+0.2*cos(time)
				),4.0);
        float flick = 0.5*0.4*sin(time*32.0) + 0.5*sin(time*2.0) + 1.0;
        flick = step(0.8, flick);
				vec4 c = vec4(hsl2rgb(h,1.0,l*0.5), l);
        c += vec4(1,0,0,1)*(1.0-smoothstep(0.0, 0.9, length(vpos + vec2(0.5, 0.6))));
        c += vec4(0,1,1,1)*(1.0-smoothstep(0.0, 0.4,
        length(vpos-vec2(-0.5,0.9))))*flick;
				gl_FragColor = c;
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
    },
    depth: {
      mask: false
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

var glsl = require('glslify')
var regl = require('regl')({
  attributes: { premultipliedAlpha: false }
})
var gmesh = require('grid-mesh')(32,120)
var cylinder = require('primitive-cylinder')
var mat4 = require('gl-mat4')
var vec3 = require('gl-vec3')
var quat = require('gl-quat')
var anormals = require('angle-normals')
var origin = [0,0,0]

var camera = require('regl-camera')(regl, {
  distance: 10, minDistance: 2, maxDistance: 15,
  theta: Math.PI/2,
  phi: 0.8, maxPhi: 0.9, minPhi: 0
})

var draw = {
  fire: fire(regl),
  barrel: barrel(regl)
}

regl.frame(function () {
  regl.clear({ color: [0,0,0,1], depth: true })
  camera(function () {
    draw.barrel()
    draw.fire()
  })
})

function barrel (regl) {
  var mesh = { positions: [], cells: [] }
  var radialSegments = 64
  var heightSegments = 32
  var n = radialSegments*2
  for (var j = 0; j < heightSegments; j++) {
    var k = mesh.positions.length
    for (var i = 0; i < radialSegments; i++) {
      var theta = i/radialSegments*2*Math.PI
      mesh.positions.push([Math.cos(theta),(j+1)/hs,Math.sin(theta)])
      mesh.positions.push([Math.cos(theta),j/hs,Math.sin(theta)])
      var hs = heightSegments
      mesh.cells.push([k+i*2+0,k+i*2+1,k+(i+1)*2%n])
      mesh.cells.push([k+i*2+1,k+((i+1)*2+1)%n,k+(i+1)*2%n])
    }
  }
  mesh.normals = anormals(mesh.cells, mesh.positions)
  return regl({
    frag: glsl`
      precision highp float;
      #pragma glslify: snoise = require('glsl-noise/simplex/3d')
      varying vec3 vpos, vopos, vnorm;
      void main () {
        float s0 = snoise(vpos*1.0);
        float s1 = snoise(vpos*8.0);
        if (pow((s0+s1)*0.5,2.0) > 0.4) discard;
        vec3 N = normalize(vnorm);
        vec3 L0 = vec3(0,-1.5,0);
        vec3 c = vec3(1,0.5,0)*pow(1.0/length(vpos-L0),4.0)
          * (gl_FrontFacing ? 1.0 : 0.0)
          + (snoise(vpos*32.0)*0.02
            + s0*0.02 + s1*0.01
          ) * min(1.0,pow(vopos.y*2.0,8.0));
        gl_FragColor = vec4(c,1);
      }
    `,
    vert: glsl`
      precision highp float;
      #pragma glslify: snoise = require('glsl-noise/simplex/3d')
      uniform mat4 projection, view;
      attribute vec3 position, normal;
      varying vec3 vpos, vopos, vnorm;
      void main () {
        vopos = position;
        vpos = position*vec3(1.0,2.5,1.0) + vec3(0,-2.0,0)
          - normal * (0.5+snoise(position))*0.07;
        vnorm = normal;
        gl_Position = projection * view * vec4(vpos,1);
      }
    `,
    attributes: {
      position: mesh.positions,
      normal: mesh.normals
    },
    elements: mesh.cells
  })
}

function fire (regl) {
  var model = new Float32Array(16)
  var tmpv = new Float32Array(3)
  var tmpq = new Float32Array(4)
  return regl({
    frag: glsl`
      precision highp float;
      #pragma glslify: snoise = require('glsl-noise/simplex/3d')
      #pragma glslify: hsl2rgb = require('glsl-hsl2rgb')
      uniform float time, theta;
      varying vec2 vpos;
      void main () {
        float cx = cos(vpos.x*1.57);
        float vy = pow(cx,0.8) * vpos.y;
        float band = max(0.0,snoise(vec3(vpos.x*6.0,vy,time*2.0)))+0.5;
        float s0 = snoise(vec3(vpos*1.0-vec2(theta,time*3.1),time*0.1+23.0));
        float s1 = snoise(vec3(vpos*1.5-vec2(theta,time*3.0),time*0.1));
        float s2 = snoise(vec3(vpos*3.0-vec2(theta,time*2.5),time*0.5));
        float s3 = snoise(vec3(vpos*8.0-vec2(theta,time*16.0),time*0.1));
        float l = smoothstep(0.1,0.3,
          pow(max(0.0,band*0.2 + max(0.0,s1)*0.5),
            (vy+0.5)*4.0)
          + pow(max(0.0,s1+s2)*0.5,(vy+1.1)*8.0)
          //+ pow(max(0.0,s2-0.1),(vy+1.0)*8.0)
          + pow(max(0.0,s3),15.0)*pow((1.0-vy)*0.1,0.25)
        ) * max(0.0,pow(cx,max(0.2,pow(-vpos.y,1.2))));
        vec3 c = hsl2rgb(0.02+l*0.1,1.0,l-0.1)
          + vec3(0.3)*pow(s0*0.5+0.5,0.2)*pow(cx,0.3)
        //+ vec3(1,0,1)*pow(max(0.0,max(sin(vpos.x*32.0),sin(vy*32.0))),64.0)
        ;
        float alpha = smoothstep(0.1,0.4,length(c)/3.0);
        gl_FragColor = vec4(c,alpha);
      }
    `,
    vert: glsl`
      precision highp float;
      #pragma glslify: snoise = require('glsl-noise/simplex/3d')
      uniform mat4 projection, view;
      attribute vec2 position;
      varying vec2 vpos;
      uniform float time;
      void main () {
        vpos = (position-vec2(0,17.0))/32.0*2.0-1.0;
        float yscale = pow((1.0+vpos.y)*0.2,1.5);
        float dx = snoise(vec3(vpos*0.5,time*0.4+23.0)) * yscale * 4.0;
        float dy = snoise(vec3(vpos*0.5,time*0.5-40.0)) * yscale;
        float dz = snoise(vec3(vpos*0.5,time*0.45+11.0)) * yscale * 2.0;
        vec3 p = vec3(vpos+vec2(dx,dy)*0.4,dz);
        gl_Position = projection * view * vec4(p,1);
      }
    `,
    attributes: {
      position: gmesh.positions
      //[-1,-1,-1,+1,+1,+1,+1,-1]
    },
    //elements: [0,1,2,0,2,3],
    elements: gmesh.cells,
    uniforms: {
      time: regl.context('time'),
      view: function (context) {
        tmpv[0] = 0
        tmpv[1] = vec3.length(context.eye)
          * Math.sin(Math.atan2(context.eye[1],context.eye[2]))*0.5
        tmpv[2] = vec3.length(context.eye)
        mat4.lookAt(model, tmpv, origin, context.up)
        return model
      }
    },
    blend: {
      enable: true,
      func: { src: 'src alpha', dst: 'one minus src alpha' }
    },
    depth: { mask: false }
  })
}

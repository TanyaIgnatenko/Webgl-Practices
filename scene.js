import { makeCubeCreator } from './cube';
import { makeSphereCreator } from './sphere';

main();

function main() {
  const gl = getWebGLContext();

  if (!gl) return;

  const [vsSource, fsSource] = createShaders();
  const shaderProgram = createShaderProgram(gl, vsSource, fsSource);

  const programInfo = {
    program: shaderProgram,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
      textureCoord: gl.getAttribLocation(shaderProgram, 'aTextureCoord'),
      vertexNormal: gl.getAttribLocation(shaderProgram, 'aVertexNormal'),
    },
    uniformLocations: {
      projectionMatrix: gl.getUniformLocation(
        shaderProgram,
        'uProjectionMatrix'
      ),
      sampler: gl.getUniformLocation(shaderProgram, 'uSampler'),
      modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
      normalMatrix: gl.getUniformLocation(shaderProgram, 'uNormalMatrix'),
    }
  };


  const objectCreator = makeSphereCreator(gl);
  let then = 0;
  function render(now) {
    now *= 0.001; // convert to seconds
    const deltaTime = now - then;
    then = now;

    clearScene(gl);
    drawObject(objectCreator, gl, programInfo, deltaTime);

    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
}

function getWebGLContext() {
  const canvas = document.querySelector('#glCanvas');
  const gl = canvas.getContext('webgl');

  if (gl === null) {
    alert(
      'Unable to initialize WebGL. Your browser or machine may not support it.'
    );
    return null;
  }

  return gl;
}

function clearScene(gl) {
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clearDepth(1.0);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LESS);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}

function drawObject(object, gl, programInfo, deltaTime) {
    object.drawObject(gl, programInfo, object.buffers, deltaTime);
}

function createShaders() {
  const vsSource = `
    attribute vec4 aVertexPosition;
    attribute vec3 aVertexNormal;
    attribute vec2 aTextureCoord;

    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;
    uniform mat4 uNormalMatrix;
    
    varying mediump vec4 vTransformedNormal;
    varying mediump vec2 vTextureCoord;

    void main() {
      gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
      
      vTransformedNormal = uNormalMatrix * vec4(aVertexNormal, 1.0);
      vTextureCoord = aTextureCoord;
    }
  `;

  const fsSource = `
    uniform sampler2D uSampler;
  
    varying mediump vec4 vTransformedNormal;
    varying mediump vec2 vTextureCoord;

    void main(void) {
      mediump vec3 ambientLight =  vec3(0.3, 0.3, 0.3);
      mediump vec3 directionalLightColor = vec3(1, 1, 1);
      mediump vec3 directionalVector = normalize(vec3(0.85, 0.8, 0.75));

      mediump float directional = max(dot(vTransformedNormal.xyz, directionalVector), 0.0);
      mediump vec3 vLighting = ambientLight + (directionalLightColor * directional);
    
      gl_FragColor = texture2D(uSampler, vTextureCoord) * vec4(vLighting, 1);
    }
  `;

  return [vsSource, fsSource];
}

function createShaderProgram(gl, vsSource, fsSource) {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert(
      'Unable to initialize the shader program: ' +
      gl.getProgramInfoLog(shaderProgram)
    );
    return null;
  }

  return shaderProgram;
}

function loadShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(
      'An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader)
    );
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

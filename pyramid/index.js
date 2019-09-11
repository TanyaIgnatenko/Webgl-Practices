import { compileShader } from '../utils/compileShader.js';
import { createProgram } from '../utils/createProgram.js';

export function makePyramid(gl) {
  let rotation = 0;

  const vertexShaderSource = `
    attribute vec4 aVertexPosition;
    attribute vec4 aVertexColor;

    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;

    varying mediump vec4 vColor;

    void main(void) {
      gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
      vColor = aVertexColor;
    }`;
  const fragmentShaderSource = `
    precision mediump float;
    varying vec4 vColor;

    void main(void) {
      gl_FragColor = vColor;
    }`;

  const attributes = [
    {
      name: 'aVertexPosition',
      setValues: setVertexPositions,
    },
    {
      name: 'aVertexColor',
      setValues: setVertexColors,
    },
  ];
  const uniforms = [
    {
      name: 'uModelViewMatrix',
      setValue: setModelViewMatrix,
    },
    {
      name: 'uProjectionMatrix',
      setValue: setProjectionMatrix,
    },
  ];

  const buffers = createBuffers(gl);

  const compiledVertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
  const compiledFragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
  const program = createProgram(gl, compiledVertexShader, compiledFragmentShader);

  gl.useProgram(program);
  const attributesSetters = attributes.map(attribute => {
    const location = gl.getAttribLocation(program, attribute.name);
    return attribute.setValues.bind(null, location);
  });
  const uniformsSetters = uniforms.map(uniform => {
    const location = gl.getUniformLocation(program, uniform.name);
    return uniform.setValue.bind(null, location);
  });

  let modelViewMatrix;
  const projectionMatrix = createProjectionMatrix();

  return {
    draw,
  };

  function draw(gl, deltaTime) {
    gl.useProgram(program);

    attributesSetters.forEach(setter => {
      setter();
    });

    rotation += deltaTime;
    modelViewMatrix = createModelViewMatrix();
    uniformsSetters.forEach(setter => {
      setter();
    });

    const vertexCount = 9;
    const offset = 0;
    gl.drawArrays(gl.TRIANGLES, offset, vertexCount);
  }

  function setVertexPositions(location) {
    const numComponents = 3;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;

    const offset = 0;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
    gl.vertexAttribPointer(
      location,
      numComponents,
      type,
      normalize,
      stride,
      offset
    );
    gl.enableVertexAttribArray(location);
  }

  function setVertexColors(location) {
    const numComponents = 4;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color);
    gl.vertexAttribPointer(
      location,
      numComponents,
      type,
      normalize,
      stride,
      offset
    );
    gl.enableVertexAttribArray(location);
  }

  function setModelViewMatrix(location) {
    gl.uniformMatrix4fv(
      location,
      false,
      modelViewMatrix
    );
  }

  function setProjectionMatrix(location) {
    gl.uniformMatrix4fv(
      location,
      false,
      projectionMatrix
    );
  }

  function createProjectionMatrix() {
    const fieldOfView = (45 * Math.PI) / 180;
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const zNear = 0.1;
    const zFar = 100;

    const projectionMatrix = mat4.create();
    mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);

    return projectionMatrix;
  }

  function createModelViewMatrix() {
    const modelViewMatrix = mat4.create();

    mat4.translate(modelViewMatrix, modelViewMatrix, [-0, 0, -6]);
    mat4.rotate(modelViewMatrix, modelViewMatrix, rotation * 0.7, [0, 0, 1]);
    mat4.rotate(modelViewMatrix, modelViewMatrix, rotation * 0.7, [0, 1, 0]);

    return modelViewMatrix;
  }

  function createBuffers(gl) {
    const positions = [
      // Back face
      -1, -1, -1,
      1, -1, -1,
      0, 1, 0,

      // Left face
      -1, -1, -1,
      0, -1, 1,
      0, 1, 0,

      // Right face
      1, -1, -1,
      0, -1, 1,
      0, 1, 0,
    ];
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    const faceColors = [
      [1.0, 0.0, 0.0, 1.0],    // Back face: red
      [0.0, 1.0, 0.0, 1.0],    // Left face: green
      [0.0, 0.0, 1.0, 1.0],    // Right face: blue
    ];

    let colors = [];
    for (let j = 0; j < faceColors.length; ++j) {
      const c = faceColors[j];
      colors = colors.concat(c, c, c);
    }

    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

    return {
      position: positionBuffer,
      color: colorBuffer,
    };
  }
}


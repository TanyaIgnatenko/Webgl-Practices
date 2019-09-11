import { compileShader } from '../utils/compileShader.js';
import { createProgram } from '../utils/createProgram.js';

export function makeCube(gl) {
  let rotation = 0;

  const vertexShaderSource = `
    attribute vec4 aVertexPosition;
    attribute vec4 aVertexColor;
    attribute vec3 aVertexNormal;

    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;
    uniform mat4 uNormalMatrix;
    
    varying mediump vec4 vTransformedNormal;
    varying mediump vec4 vColor;

    void main(void) {
      gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
      vColor = aVertexColor;
    }`;
  const fragmentShaderSource = `
    precision mediump float;
    
    varying vec4 vColor;
    varying vec4 vTransformedNormal;

    void main(void) {
      vec3 ambientLight =  vec3(0.3, 0.3, 0.3);
      vec3 directionalLightColor = vec3(1, 1, 1);
      vec3 directionalVector = normalize(vec3(0.85, 0.8, 0.75));

      float directional = max(dot(vTransformedNormal.xyz, directionalVector), 0.0);
      vec3 vLighting = ambientLight + (directionalLightColor * directional);
      
      gl_FragColor = vColor * vec4(vLighting, 1);
    }`;

  const attributes = [
    {
      name: 'aVertexPosition',
      setValues: setVertexPositions,
    },
    {
      name: 'aVertexNormal',
      setValues: setVertexNormals,
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
      name: 'uNormalMatrix',
      setValue: setNormalMatrix,
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

  let modelViewMatrix, normalMatrix;
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
    normalMatrix = createNormalMatrix(modelViewMatrix);
    uniformsSetters.forEach(setter => {
      setter();
    });

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);
    const vertexCount = 36;
    const type = gl.UNSIGNED_SHORT;
    const offset = 0;
    gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
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

  function setVertexNormals(location) {
    const numComponents = 3;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normal);
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

  function setNormalMatrix(location) {
    gl.uniformMatrix4fv(
      location,
      false,
      normalMatrix
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

  function createNormalMatrix(modelViewMatrix) {
    const normalMatrix = mat4.create();
    mat4.invert(normalMatrix, modelViewMatrix);
    mat4.transpose(normalMatrix, normalMatrix);
    return normalMatrix;
  }

  function createBuffers(gl) {
    // POSITIONS
    const positions = [
      // Front face
      -1, -1, 1,
      1, -1, 1,
      1, 1, 1,
      -1, 1, 1,

      // Back face
      -1, -1, -1,
      -1, 1, -1,
      1, 1, -1,
      1, -1, -1,

      // Top face
      -1, 1, -1,
      -1, 1, 1,
      1, 1, 1,
      1, 1, -1,

      // Bottom face
      -1, -1, -1,
      1, -1, -1,
      1, -1, 1,
      -1, -1, 1,

      // Right face
      1, -1, -1,
      1, 1, -1,
      1, 1, 1,
      1, -1, 1,

      // Left face
      -1, -1, -1,
      -1, -1, 1,
      -1, 1, 1,
      -1, 1, -1,
    ];
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    // COLORS
    const faceColors = [
      [1, 1, 1, 1],    // Front face: white
      [1, 0, 0, 1],    // Back face: red
      [0, 1, 0, 1],    // Top face: green
      [0, 0, 1, 1],    // Bottom face: blue
      [1, 1, 0, 1],    // Right face: yellow
      [1, 0, 1, 1],    // Left face: purple
    ];

    let colors = [];
    for (let j = 0; j < faceColors.length; ++j) {
      const c = faceColors[j];
      colors = colors.concat(c, c, c, c);
    }

    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

    // This array defines each face as two triangles, using the
    // indices into the vertex array to specify each triangle's
    // position.

    const indices = [
      0, 1, 2, 0, 2, 3,    // front
      4, 5, 6, 4, 6, 7,    // back
      8, 9, 10, 8, 10, 11,   // top
      12, 13, 14, 12, 14, 15,   // bottom
      16, 17, 18, 16, 18, 19,   // right
      20, 21, 22, 20, 22, 23,   // left
    ];

    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
      new Uint16Array(indices), gl.STATIC_DRAW);

    // NORMALS
    const vertexNormals = [
      // Front
      0, 0, 1,
      0, 0, 1,
      0, 0, 1,
      0, 0, 1,

      // Back
      0, 0, -1,
      0, 0, -1,
      0, 0, -1,
      0, 0, -1,

      // Top
      0, 1, 0,
      0, 1, 0,
      0, 1, 0,
      0, 1, 0,

      // Bottom
      0, -1, 0,
      0, -1, 0,
      0, -1, 0,
      0, -1, 0,

      // Right
      1, 0, 0,
      1, 0, 0,
      1, 0, 0,
      1, 0, 0,

      // Left
      -1, 0, 0,
      -1, 0, 0,
      -1, 0, 0,
      -1, 0, 0
    ];
    const normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexNormals),
      gl.STATIC_DRAW);


    return {
      position: positionBuffer,
      indices: indexBuffer,
      color: colorBuffer,
      normal: normalBuffer,
    };
  }
}


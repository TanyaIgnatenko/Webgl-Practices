import { loadTexture } from '../utils/loadTexture.js';
import { compileShader } from '../utils/compileShader.js';
import { createProgram } from '../utils/createProgram.js';

export function makeSphere(gl) {
  let rotation = 0;
  const CIRCLE_COUNTS = 20;
  const TEXTURE_URL = 'assets/textures/earth.jpg';

  const vertexShaderSource = `
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
    }`;
  const fragmentShaderSource = `
    precision mediump float;
    
    uniform sampler2D uSampler;
  
    varying vec4 vTransformedNormal;
    varying vec2 vTextureCoord;

    void main(void) {
      vec3 ambientLight =  vec3(0.3, 0.3, 0.3);
      vec3 directionalLightColor = vec3(1, 1, 1);
      vec3 directionalVector = normalize(vec3(0.85, 0.8, 0.75));

      float directional = max(dot(vTransformedNormal.xyz, directionalVector), 0.0);
      vec3 vLighting = ambientLight + (directionalLightColor * directional);
    
      gl_FragColor = texture2D(uSampler, vTextureCoord) * vec4(vLighting, 1);
    }`;

  const attributes =  [
    {
      name: 'aVertexPosition',
      setValues: setVertexPositions,
    },
    {
      name: 'aVertexNormal',
      setValues: setVertexNormals,
    },
    {
      name: 'aTextureCoord',
      setValues: setTextureCoords,
    },
  ];
  const uniforms =  [
    {
      name: 'uModelViewMatrix',
      setValue: setModelViewMatrix,
    },
    {
      name: 'uProjectionMatrix',
      setValue: setProjectionMatrix,
    },
    {
      name: 'uNormalMatrix',
      setValue: setNormalMatrix,
    },
    {
      name: 'uSampler',
      setValue: setTexture,
    },
  ];

  const texture = loadTexture(gl, TEXTURE_URL);
  const buffers = createBuffers(gl, CIRCLE_COUNTS);

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

    const vertexCount = buffers.indicesCount;
    const type = gl.UNSIGNED_SHORT;
    const offset = 0;
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);
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

  function setTextureCoords(location) {
    const numComponents = 2;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;

    const offset = 0;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.uv);
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

  function setTexture(location) {
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(location, 0);
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

  function createBuffers(gl, n) {
    // POSITIONS
    const meridianPositions = [];
    const angleDelta = (2 * Math.PI) / (n - 1);
    for (let j = 0; j < n; ++j) {
      meridianPositions.push([
        Math.sin(j * angleDelta),
        0,
        Math.cos(j * angleDelta)
      ]);
    }

    let positions = [];
    const verticalAngleDelta = (Math.PI) / (n - 1);
    for (let j = 0; j < n; ++j) {
      const radius = Math.sin(j * verticalAngleDelta);
      const height = Math.cos(j * verticalAngleDelta);
      meridianPositions.forEach(([x, _, z]) => {
        positions.push([
          x * radius,
          height,
          z * radius
        ]);
      });
    }

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array(positions.flat()),
      gl.STATIC_DRAW
    );

    // TEXTURE COORDS
    let step = 1 / (n - 1);
    const uvs = [];
    for(let y = 0; y <= 1; y += step) {
      for (let x = 0; x <= 1; x += step) {
        uvs.push(x, y);
      }
    }

    const uvBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uvs), gl.STATIC_DRAW);

    // INDICES
    let indices = [];
    // 1.rings
    for (let ring = 0; ring < n - 1; ++ring) {
      for (let v = 0; v < n; ++v) {
        const topVertex = ring * n + v;
        const bottomVertex = (ring + 1) * n + v;
        const nextTopVertex = ring * n + ((v + 1) % n);
        const nextBottomVertex = (ring + 1) * n + ((v + 1) % n);

        indices.push(topVertex, nextTopVertex, bottomVertex);
        indices.push(bottomVertex, nextTopVertex, nextBottomVertex);
      }
    }
    // 2.north cap
    const northPoleIdx = (n - 2) * n;
    const southPoleIdx = northPoleIdx + 1;
    for (let i = 0; i < n; ++i) {
      indices.push(i, northPoleIdx, (i + 1) % n);
    }
    // 3.south cap
    for (let i = 0; i < n; ++i) {
      const lastRingStart = northPoleIdx - n;
      indices.push(lastRingStart + i, lastRingStart + ((i + 1) % n), southPoleIdx);
    }

    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(
      gl.ELEMENT_ARRAY_BUFFER,
      new Uint16Array(indices),
      gl.STATIC_DRAW
    );

    // NORMALS
    const normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array(positions.flat()),
      gl.STATIC_DRAW
    );

    return {
      uv: uvBuffer,
      position: positionBuffer,
      indices: indexBuffer,
      indicesCount: indices.length,
      normal: normalBuffer
    };
  }
}

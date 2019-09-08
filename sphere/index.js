const CIRCLE_COUNTS = 20;
const TEXTURE_URL = 'assets/textures/earth.jpg';

export function makeSphereCreator(gl) {
  const buffers = createSphereBuffers(gl, CIRCLE_COUNTS);
  const texture = loadTexture(gl, TEXTURE_URL);
  return {
    buffers,
    texture,
    drawObject: drawSphere
  };
}

function loadTexture(gl, url) {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);

  const level = 0;
  const internalFormat = gl.RGBA;
  const width = 1;
  const height = 1;
  const border = 0;
  const srcFormat = gl.RGBA;
  const srcType = gl.UNSIGNED_BYTE;
  const pixel = new Uint8Array([0, 0, 255, 255]);  // opaque blue
  gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
    width, height, border, srcFormat, srcType,
    pixel);

  const image = new Image();
  image.onload = function () {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
      srcFormat, srcType, image);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  };
  image.src = url;

  return texture;
}

function isPowerOf2(value) {
  return (value & (value - 1)) === 0;
}

function createSphereBuffers(gl, n) {
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

let sphereRotation = 0;

function drawSphere(gl, programInfo, buffers, deltaTime) {
  gl.useProgram(programInfo.program);

  const fieldOfView = (45 * Math.PI) / 180;
  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  const zNear = 0.1;
  const zFar = 100;
  const projectionMatrix = mat4.create();
  mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);

  const modelViewMatrix = mat4.create();
  mat4.translate(modelViewMatrix, modelViewMatrix, [-0, 0, -6]);

  sphereRotation += deltaTime;
  mat4.rotate(modelViewMatrix, modelViewMatrix, sphereRotation * 0.7, [0, 0, 1]);
  mat4.rotate(modelViewMatrix, modelViewMatrix, sphereRotation * 0.7, [0, 1, 0]);

  // SET POSITION BUFFER
  {
    const numComponents = 3;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;

    const offset = 0;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
    gl.vertexAttribPointer(
      programInfo.attribLocations.vertexPosition,
      numComponents,
      type,
      normalize,
      stride,
      offset
    );
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
  }

  // SET UV BUFFER
  {
    const numComponents = 2;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;

    const offset = 0;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.uv);
    gl.vertexAttribPointer(
      programInfo.attribLocations.textureCoord,
      numComponents,
      type,
      normalize,
      stride,
      offset
    );
    gl.enableVertexAttribArray(programInfo.attribLocations.textureCoord);
  }
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, this.texture);
  gl.uniform1i(programInfo.uniformLocations.sampler, 0);

  // SET NORMAL BUFFER
  {
    const numComponents = 3;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normal);
    gl.vertexAttribPointer(
      programInfo.attribLocations.vertexNormal,
      numComponents,
      type,
      normalize,
      stride,
      offset
    );
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexNormal);
  }

  gl.uniformMatrix4fv(
    programInfo.uniformLocations.projectionMatrix,
    false,
    projectionMatrix
  );
  gl.uniformMatrix4fv(
    programInfo.uniformLocations.modelViewMatrix,
    false,
    modelViewMatrix
  );

  const normalMatrix = mat4.create();
  mat4.invert(normalMatrix, modelViewMatrix);
  mat4.transpose(normalMatrix, normalMatrix);

  gl.uniformMatrix4fv(
    programInfo.uniformLocations.normalMatrix,
    false,
    normalMatrix
  );

  {
    const vertexCount = buffers.indicesCount;
    const type = gl.UNSIGNED_SHORT;
    const offset = 0;
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);
    gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
  }
}

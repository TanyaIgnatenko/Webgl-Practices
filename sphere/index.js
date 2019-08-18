const CIRCLE_COUNTS = 20;

export function makeSphereCreator(gl) {
  const buffers = createSphereBuffers(gl, CIRCLE_COUNTS);
  return {
    buffers: buffers,
    drawObject: drawSphere
  };
}

function createSphereBuffers(gl, n) {
  // POSITIONS
  const meridianPositions = [];
  const angleDelta = (2 * Math.PI) / n;
  for (let j = 0; j < n; ++j) {
    meridianPositions.push([
      Math.sin(j * angleDelta),
      0,
      Math.cos(j * angleDelta)
    ]);
  }

  let positions = [];
  meridianPositions.slice(1, n - 1).forEach(([radius, _, height]) => {
    meridianPositions.forEach(meredianPos => {
      positions.push([
        meredianPos[0] * radius,
        height,
        meredianPos[2] * radius
      ]);
    });
  });
  const northPole = [0, 1, 0];
  const southPole = [0, -1, 0];
  positions.push(northPole, southPole);

  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array(positions.flat()),
    gl.STATIC_DRAW
  );

  // COLORS
  const sphereColor = [0, 0, 1, 1];
  const colors = positions.map(() => sphereColor).flat();

  const colorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

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
    position: positionBuffer,
    indices: indexBuffer,
    indicesCount: indices.length,
    color: colorBuffer,
    normal: normalBuffer
  };
}

let sphereRotation = 0;
function drawSphere(gl, programInfo, buffers, deltaTime) {
  const fieldOfView = (45 * Math.PI) / 180;
  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  const zNear = 0.1;
  const zFar = 100;
  const projectionMatrix = mat4.create();
  mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);

  const modelViewMatrix = mat4.create();
  mat4.translate(modelViewMatrix, modelViewMatrix, [-0, 0, -6]);

  sphereRotation += deltaTime;
  mat4.rotate(modelViewMatrix, modelViewMatrix, sphereRotation * 0.7, [
    0,
    0,
    1
  ]);
  mat4.rotate(modelViewMatrix, modelViewMatrix, sphereRotation * 0.7, [
    0,
    1,
    0
  ]);

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

  // SET COLOR BUFFER
  {
    const numComponents = 4;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color);
    gl.vertexAttribPointer(
      programInfo.attribLocations.vertexColor,
      numComponents,
      type,
      normalize,
      stride,
      offset
    );
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexColor);
  }

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

  gl.useProgram(programInfo.program);

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

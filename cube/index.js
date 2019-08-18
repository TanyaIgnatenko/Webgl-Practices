export function makeCubeCreator() {
  return {
    createBuffers: createCubeBuffers,
    drawObject: drawCube,
  };
}

function createCubeBuffers(gl) {
  // POSITIONS
  const positions = [
    // Front face
    -1, -1,  1,
    1, -1,  1,
    1,  1,  1,
    -1,  1,  1,

    // Back face
    -1, -1, -1,
    -1,  1, -1,
    1,  1, -1,
    1, -1, -1,

    // Top face
    -1,  1, -1,
    -1,  1,  1,
    1,  1,  1,
    1,  1, -1,

    // Bottom face
    -1, -1, -1,
    1, -1, -1,
    1, -1,  1,
    -1, -1,  1,

    // Right face
    1, -1, -1,
    1,  1, -1,
    1,  1,  1,
    1, -1,  1,

    // Left face
    -1, -1, -1,
    -1, -1,  1,
    -1,  1,  1,
    -1,  1, -1,
  ];
  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

  // COLORS
  const faceColors = [
    [1,  1,  1,  1],    // Front face: white
    [1,  0,  0,  1],    // Back face: red
    [0,  1,  0,  1],    // Top face: green
    [0,  0,  1,  1],    // Bottom face: blue
    [1,  1,  0,  1],    // Right face: yellow
    [1,  0,  1,  1],    // Left face: purple
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
    0,  1,  2,      0,  2,  3,    // front
    4,  5,  6,      4,  6,  7,    // back
    8,  9,  10,     8,  10, 11,   // top
    12, 13, 14,     12, 14, 15,   // bottom
    16, 17, 18,     16, 18, 19,   // right
    20, 21, 22,     20, 22, 23,   // left
  ];

  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
    new Uint16Array(indices), gl.STATIC_DRAW);

  // NORMALS
  const vertexNormals = [
    // Front
    0,  0,  1,
    0,  0,  1,
    0,  0,  1,
    0,  0,  1,

    // Back
    0,  0, -1,
    0,  0, -1,
    0,  0, -1,
    0,  0, -1,

    // Top
    0,  1,  0,
    0,  1,  0,
    0,  1,  0,
    0,  1,  0,

    // Bottom
    0, -1,  0,
    0, -1,  0,
    0, -1,  0,
    0, -1,  0,

    // Right
    1,  0,  0,
    1,  0,  0,
    1,  0,  0,
    1,  0,  0,

    // Left
    -1,  0,  0,
    -1,  0,  0,
    -1,  0,  0,
    -1,  0,  0
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

let cubeRotation = 0;
function drawCube(gl, programInfo, buffers, deltaTime) {
  const fieldOfView = (45 * Math.PI) / 180;
  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  const zNear = 0.1;
  const zFar = 100;
  const projectionMatrix = mat4.create();
  mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);

  const modelViewMatrix = mat4.create();
  mat4.translate(modelViewMatrix, modelViewMatrix, [-0, 0, -6]);

  cubeRotation += deltaTime;
  mat4.rotate(modelViewMatrix, modelViewMatrix, cubeRotation * .7, [0, 0, 1]);
  mat4.rotate(modelViewMatrix, modelViewMatrix, cubeRotation * .7, [0, 1, 0]);

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
      offset);
    gl.enableVertexAttribArray(
      programInfo.attribLocations.vertexNormal);
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
    normalMatrix);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);

  {
    const vertexCount = 36;
    const type = gl.UNSIGNED_SHORT;
    const offset = 0;
    gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
  }
}
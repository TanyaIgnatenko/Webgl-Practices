export function makePyramidCreator() {
  return {
    createBuffers: createPyramidBuffers,
    drawObject: drawPyramid,
  };
}

function createPyramidBuffers(gl) {
  const positions = [
    // Back face
    -1, -1,  -1,
     1, -1,  -1,
     0,  1,   0,

    // Left face
    -1, -1, -1,
     0, -1,  1,
     0,  1,  0,

    // Right face
    1,  -1, -1,
    0,  -1,  1,
    0,   1,  0,
  ];
  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

  const faceColors = [
    [1.0,  0.0,  0.0,  1.0],    // Back face: red
    [0.0,  1.0,  0.0,  1.0],    // Left face: green
    [0.0,  0.0,  1.0,  1.0],    // Right face: blue
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

let pyramidRotation = 0.0;
function drawPyramid(gl, programInfo, buffers, deltaTime) {
  const fieldOfView = (45 * Math.PI) / 180;
  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  const zNear = 0.1;
  const zFar = 100.0;
  const projectionMatrix = mat4.create();
  mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);

  const modelViewMatrix = mat4.create();
  mat4.translate(modelViewMatrix, modelViewMatrix, [-0.0, 0.0, -6.0]);

  pyramidRotation += deltaTime;
  mat4.rotate(modelViewMatrix, modelViewMatrix, pyramidRotation * .7, [0, 0, 1]);
  mat4.rotate(modelViewMatrix, modelViewMatrix, pyramidRotation * .7, [0, 1, 0]);

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


  {
    const vertexCount = 9;
    const offset = 0;
    gl.drawArrays(gl.TRIANGLES, offset, vertexCount);
  }
}
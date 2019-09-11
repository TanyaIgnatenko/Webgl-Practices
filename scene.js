import { makeSphere } from './sphere';

main();

function main() {
  const gl = getWebGLContext();

  if (!gl) return;

  const sceneObjects = [
    makeSphere(gl),
  ];

  let then = 0;

  function render(now) {
    now *= 0.001; // convert to seconds
    const deltaTime = now - then;
    then = now;

    clearScene(gl);
    sceneObjects.forEach(object => {
      object.draw(gl, deltaTime);
    });
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
  gl.depthFunc(gl.LEQUAL);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}


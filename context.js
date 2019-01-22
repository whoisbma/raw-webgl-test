'use strict';

const canvas = document.getElementById('glCanvas');

const gl = canvas.getContext('webgl');
if (!gl) {
  console.log("webGL not supported");
}
resize(canvas);

const program = createProgramFromScripts(gl, ['2d-vertex-shader', '2d-fragment-shader'])
const programLocations = {
  attributes: {
    position: gl.getAttribLocation(program, 'a_position'),
    vertexColor: gl.getAttribLocation(program, 'a_vertexColor'),
  },
  uniforms: {
    matrix: gl.getUniformLocation(program, 'u_matrix'),
    resolution: gl.getUniformLocation(program, 'u_resolution'),
    time: gl.getUniformLocation(program, 'u_time'),
    // fudgeFactor: gl.getUniformLocation(program, 'u_fudgeFactor'),
  },
};

const setRectangle = (gl, x, y, w, h) => {
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    x,     y,
    x + w, y,
    x,     y + h,
    x,     y + h,
    x + w, y,
    x + w, y + h,
  ]), gl.STATIC_DRAW);
};

const setGeometry = (gl, w, h, d) => {
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    // left column
    0,   0,   0,
    0,   h,   0,
    w/3, 0,   0,
    0,   h,   0,
    w/3, h,   0,
    w/3, 0,   0,

    // top rung
    w,   0,   0,
    w/3, 0,   0,
    w/3, h/5, 0,
    w,   0,   0,
    w/3, h/5, 0,
    w,   h/5, 0,

    // middle rung
    w/3, 2*h/5, 0,
    w/3, 3*h/5, 0,
    w,   2*h/5, 0,
    w/3, 3*h/5, 0,
    w,   3*h/5, 0,
    w,   2*h/5, 0,

    // bottom rung
    w/3, 4*h/5, 0,
    w/3, h,     0,
    w,   4*h/5, 0,
    w/3, h,     0,
    w,   h,     0,
    w,   4*h/5, 0,

    // right top side
    2*w/3, h/5,   0,
    2*w/3, 2*h/5, 0,
    w,     h/5,   0,
    2*w/3, 2*h/5, 0,
    w,     2*h/5, 0,
    w,     h/5,   0,

    // right bottom side
    2*w/3, 3*h/5, 0,
    2*w/3, 4*h/5, 0,
    w,     3*h/5, 0,
    2*w/3, 4*h/5, 0,
    w,     4*h/5, 0,
    w,     3*h/5, 0,

    //back faces
    0,   0, d,
    0,   h, d,
    w/3, 0, d,
    0,   h, d,
    w/3, h, d,
    w/3, 0, d,

    w/3, 0,   d,
    w/3, h/5, d,
    w,   0,   d,
    w/3, h/5, d,
    w,   h/5, d,
    w,   0,   d,

    w/3, 2*h/5, d,
    w/3, 3*h/5, d,
    w,   2*h/5, d,
    w/3, 3*h/5, d,
    w,   3*h/5, d,
    w,   2*h/5, d,

    w/3, 4*h/5, d,
    w/3, h,     d,
    w,   4*h/5, d,
    w/3, h,     d,
    w,   h,     d,
    w,   4*h/5, d,

    2*w/3, h/5,   d,
    2*w/3, 2*h/5, d,
    w,     h/5,   d,
    2*w/3, 2*h/5, d,
    w,     2*h/5, d,
    w,     h/5,   d,

    2*w/3, 3*h/5, d,
    2*w/3, 4*h/5, d,
    w,     3*h/5, d,
    2*w/3, 4*h/5, d,
    w,     4*h/5, d,
    w,     3*h/5, d,

    // sides
    0, 0, 0,
    w, 0, d,
    w, 0, 0,
    0, 0, 0,
    0, 0, d,
    w, 0, d,

    w, 0, 0,
    w, 0, d,
    w, h, 0,
    w, 0, d,
    w, h, d, 
    w, h, 0,

    0, 0, 0,
    0, h, d,
    0, h, 0,
    0, 0, 0,
    0, 0, d,
    0, h, d,

    0, h, 0,
    w, h, 0,
    w, h, d,
    0, h, 0,
    0, h, d,
    w, h, d,

  ]), gl.STATIC_DRAW);
};

const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
// setRectangle(gl, 0, 0, 30, 150);
const w = 200;
const h = 300;
const d = -60;
setGeometry(gl, w, h, d);

const colorBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
const colors = [];
for (let i = 0; i < 384; i+=4) {
  for (let j = 0; j < 3; j++) {
    colors.push(Math.random() * 255);
  }
  colors.push(255);
}
  
gl.bufferData(gl.ARRAY_BUFFER, new Uint8Array(colors), gl.STATIC_DRAW);

let then = 0;
let time = 0;
const numGeo = 65;
const radius = 600;
const up = [0, 1, 0];

const drawScene = (deltaTime) => {
  time += deltaTime;

  resize(canvas);
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  // gl.enable(gl.CULL_FACE);
  gl.enable(gl.DEPTH_TEST);
  gl.useProgram(program);

  let projectionMatrix = m4.perspective(degToRad(60), canvas.clientWidth/canvas.clientHeight, 1, 2000);
  // projectionMatrix = m4.translate(projectionMatrix, 0, 0, -500);
  // projectionMatrix = m4.xRotate(projectionMatrix, 0. * Math.PI);
  // projectionMatrix = m4.yRotate(projectionMatrix, 0.1 * time * Math.PI);
  // projectionMatrix = m4.zRotate(projectionMatrix, 0.25 * Math.PI);
  projectionMatrix = m4.translate(projectionMatrix, 0, -h/2, 0);
  // let matrix = m4.orthographic(0, canvas.clientWidth, canvas.clientHeight, 0, 1400, -1400);

  const cameraTarget = [0, 0, 0];
  // use matrix math to compute a position on a circle where the camera is:
  let cameraMatrix = m4.yRotation(degToRad(time * 0.0005));
  cameraMatrix = m4.translate(cameraMatrix, 0, 0, radius * 2);

  const cameraPosition = [
    cameraMatrix[12],
    cameraMatrix[13],
    cameraMatrix[14],
  ];

  cameraMatrix = m4.lookAt(cameraPosition, cameraTarget, up);
  const viewMatrix = m4.inverse(cameraMatrix);
  const viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix);

  gl.enableVertexAttribArray(programLocations.attributes.position);
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.vertexAttribPointer(programLocations.attributes.position, 3, gl.FLOAT, false, 0, 0);

  gl.enableVertexAttribArray(programLocations.attributes.vertexColor);
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.vertexAttribPointer(programLocations.attributes.vertexColor, 4, gl.UNSIGNED_BYTE, true, 0, 0);

  for (let i = 0; i < numGeo; ++i) {
    const angle = i * Math.PI * 2 / numGeo;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;

    // starting with the view projection matrix
    // compute a matrix for the geometry
    let matrix = m4.translate(viewProjectionMatrix, x, 0, y);
    matrix = m4.yRotate(matrix, -angle);
    matrix = m4.scale(matrix, 1, 1, 1);
    // set the matrix
    gl.uniformMatrix4fv(programLocations.uniforms.matrix, false, matrix);
    gl.uniform2fv(programLocations.uniforms.resolution, [canvas.clientWidth, canvas.clientHeight]);
    gl.uniform1f(programLocations.uniforms.time, time);
    // draw the geometry
    gl.drawArrays(gl.TRIANGLES, 0, 96);
  }

};

const render = (now) => {
  now *= 0.001;
  const deltaTime = now - then;
  then = now;
  drawScene(deltaTime);
  requestAnimationFrame(render);
};

requestAnimationFrame(render);



class Cube {
  constructor(segments) {
    this.type = "cube";
    this.color = [1.0, 1.0, 1.0, 1.0];
    this.matrix = new Matrix4();
  }

  render() {
    var rgba = this.color;

    // Apply the transformation matrix to the cube
    gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

    // Front face (xy-plane, z = 0)
    gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
    // drawTriangle3DUV(
    //   [0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 0.0, 0.0, 0.0],
    //   [0, 0, 1, 0, 1, 1]
    // );
    drawTriangle3D([0.0, 0.0, 0.0, 1.0, 1.0, 0.0, 0.0, 1.0, 0.0]);
    drawTriangle3D([0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 1.0, 0.0]);

    // Back face (xy-plane, z = 1)
    gl.uniform4f(
      u_FragColor,
      rgba[0] * 0.9,
      rgba[1] * 0.9,
      rgba[2] * 0.9,
      rgba[3]
    );
    drawTriangle3D([1.0, 1.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0]);
    drawTriangle3D([1.0, 0.0, 1.0, 0.0, 0.0, 1.0, 1.0, 1.0, 1.0]);

    // Left face (yz-plane, x = 0)
    gl.uniform4f(
      u_FragColor,
      rgba[0] * 0.8,
      rgba[1] * 0.8,
      rgba[2] * 0.8,
      rgba[3]
    );
    drawTriangle3D([0.0, 1.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0]);
    drawTriangle3D([0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 1.0]);

    // Right face (yz-plane, x = 1)
    gl.uniform4f(
      u_FragColor,
      rgba[0] * 0.7,
      rgba[1] * 0.7,
      rgba[2] * 0.7,
      rgba[3]
    );
    drawTriangle3D([1.0, 0.0, 0.0, 1.0, 1.0, 1.0, 1.0, 1.0, 0.0]);
    drawTriangle3D([1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 1.0, 1.0]);

    // Bottom face (xz-plane, y = 0)
    gl.uniform4f(
      u_FragColor,
      rgba[0] * 0.6,
      rgba[1] * 0.6,
      rgba[2] * 0.6,
      rgba[3]
    );
    drawTriangle3D([1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 1.0]);
    drawTriangle3D([0.0, 0.0, 0.0, 0.0, 0.0, 1.0, 1.0, 0.0, 1.0]);

    // Top face (xz-plane, y = 1)
    gl.uniform4f(
      u_FragColor,
      rgba[0] * 0.7,
      rgba[1] * 0.7,
      rgba[2] * 0.7,
      rgba[3]
    );
    drawTriangle3D([0.0, 1.0, 1.0, 0.0, 1.0, 0.0, 1.0, 1.0, 1.0]);
    drawTriangle3D([1.0, 1.0, 1.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0]);
  }
}

class TrianglePrism {
  constructor(segments) {
    this.type = "trianglePrism";
    this.color = [1.0, 1.0, 1.0, 1.0];
    this.matrix = new Matrix4();
  }

  render() {
    var rgba = this.color;

    // Apply the transformation matrix to the triangular prism
    gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

    // Base triangle (xy-plane, z = 0)
    gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
    drawTriangle3D([0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.5, 1.0, 0.0]);

    // Top triangle (xy-plane, z = 1)
    gl.uniform4f(
      u_FragColor,
      rgba[0] * 0.9,
      rgba[1] * 0.9,
      rgba[2] * 0.9,
      rgba[3]
    );
    drawTriangle3D([0.0, 0.0, 1.0, 1.0, 0.0, 1.0, 0.5, 1.0, 1.0]);

    // Side face 1 (connecting edge 1)
    gl.uniform4f(
      u_FragColor,
      rgba[0] * 0.8,
      rgba[1] * 0.8,
      rgba[2] * 0.8,
      rgba[3]
    );
    drawTriangle3D([0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0]);
    drawTriangle3D([1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 0.0, 0.0, 1.0]);

    // Side face 2 (connecting edge 2)
    gl.uniform4f(
      u_FragColor,
      rgba[0] * 0.7,
      rgba[1] * 0.7,
      rgba[2] * 0.7,
      rgba[3]
    );
    drawTriangle3D([1.0, 0.0, 0.0, 0.5, 1.0, 0.0, 1.0, 0.0, 1.0]);
    drawTriangle3D([0.5, 1.0, 0.0, 0.5, 1.0, 1.0, 1.0, 0.0, 1.0]);

    // Side face 3 (connecting edge 3)
    gl.uniform4f(
      u_FragColor,
      rgba[0] * 0.6,
      rgba[1] * 0.6,
      rgba[2] * 0.6,
      rgba[3]
    );
    drawTriangle3D([0.5, 1.0, 0.0, 0.0, 0.0, 0.0, 0.5, 1.0, 1.0]);
    drawTriangle3D([0.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.5, 1.0, 1.0]);
  }
}

/**
 * Cube class for rendering a textured 3D cube with adjustable color and transformations.
 */
class Cube {
  constructor() {
    // Cube properties
    this.type = "cube";
    this.color = [0.5, 0.5, 0.5, 1.0];
    this.matrix = new Matrix4();
    this.textureNum = -2;

    // Vertex coordinates for all 6 faces (two triangles per face)
    this.vertices = new Float32Array([
      // Front face (XY plane at Z=0)
      0, 0, 0, 1, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1, 1, 0,

      // Back face (XY plane at Z=1)
      1, 1, 1, 0, 0, 1, 0, 1, 1, 1, 0, 1, 0, 0, 1, 1, 1, 1,

      // Left face (YZ plane at X=0)
      0, 1, 1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1, 1,

      // Right face (YZ plane at X=1)
      1, 0, 0, 1, 1, 1, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 1, 1,

      // Bottom face (XZ plane at Y=0)
      1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 1, 0, 1,

      // Top face (XZ plane at Y=1)
      0, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 0,
    ]);

    // UV texture coordinates matching the above vertices
    this.uvs = new Float32Array([
      // Front
      0, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1,

      // Back
      1, 1, 0, 0, 0, 1, 1, 0, 0, 0, 1, 1,

      // Left
      1, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 1,

      // Right
      0, 0, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1,

      // Bottom
      1, 0, 0, 0, 1, 1, 0, 0, 0, 1, 1, 1,

      // Top
      0, 1, 0, 0, 1, 1, 1, 1, 0, 0, 1, 0,
    ]);
  }

  /**
   * Render the cube face-by-face with shading based on face direction.
   */
  render() {
    // Pass in texture and transformation matrix
    gl.uniform1i(u_whichTexture, this.textureNum);
    gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

    const rgba = this.color;

    // Define color shades for different faces
    const shades = [1.0, 0.9, 0.8, 0.7, 0.6, 0.7];

    const drawFace = (vertices, uvs, shade) => {
      gl.uniform4f(
        u_FragColor,
        rgba[0] * shade,
        rgba[1] * shade,
        rgba[2] * shade,
        rgba[3]
      );
      drawTriangle3DUV(vertices, uvs);
    };

    // Draw all 6 faces manually
    drawFace([0, 0, 0, 1, 1, 0, 0, 1, 0], [0, 0, 1, 1, 0, 1], shades[0]);
    drawFace([0, 0, 0, 1, 0, 0, 1, 1, 0], [0, 0, 1, 0, 1, 1], shades[0]);

    drawFace([1, 1, 1, 0, 0, 1, 0, 1, 1], [1, 1, 0, 0, 0, 1], shades[1]);
    drawFace([1, 0, 1, 0, 0, 1, 1, 1, 1], [1, 0, 0, 0, 1, 1], shades[1]);

    drawFace([0, 1, 1, 0, 0, 0, 0, 1, 0], [1, 1, 0, 0, 1, 0], shades[2]);
    drawFace([0, 0, 1, 0, 0, 0, 0, 1, 1], [0, 1, 0, 0, 1, 1], shades[2]);

    drawFace([1, 0, 0, 1, 1, 1, 1, 1, 0], [0, 0, 1, 1, 1, 0], shades[3]);
    drawFace([1, 0, 0, 1, 0, 1, 1, 1, 1], [0, 0, 0, 1, 1, 1], shades[3]);

    drawFace([1, 0, 0, 0, 0, 0, 1, 0, 1], [1, 0, 0, 0, 1, 1], shades[4]);
    drawFace([0, 0, 0, 0, 0, 1, 1, 0, 1], [0, 0, 0, 1, 1, 1], shades[4]);

    drawFace([0, 1, 1, 0, 1, 0, 1, 1, 1], [0, 1, 0, 0, 1, 1], shades[5]);
    drawFace([1, 1, 1, 0, 1, 0, 1, 1, 0], [1, 1, 0, 0, 1, 0], shades[5]);
  }

  /**
   * Faster rendering using pre-stored vertex and UV arrays.
   * (Recommended for high-performance cases)
   */
  renderFast() {
    gl.uniform1i(u_whichTexture, this.textureNum);
    gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);
    gl.uniform4f(
      u_FragColor,
      this.color[0],
      this.color[1],
      this.color[2],
      this.color[3]
    );
    drawTriangle3DUV(this.vertices, this.uvs);
  }
}

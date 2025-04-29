class Cube {
  constructor(segments) {
    // Basic cube properties
    this.type = "cube";
    this.color = [1.0, 1.0, 1.0, 1.0]; // Default color (white)
    this.matrix = new Matrix4(); // Model transformation matrix
    this.normalMatrix = new Matrix4(); // Matrix for transforming normals
    this.textureNum = -2; // Default texture (-2 = solid color)

    // Vertex positions (XYZ) for each face of the cube
    this.cubeVertsXYZ = new Float32Array([
      // Front face (xy0 plane)
      0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 1.0, 0.0,
      1.0, 0.0, 0.0,

      // Back face (xy1 plane)
      1.0, 1.0, 1.0, 0.0, 1.0, 1.0, 0.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0, 1.0, 1.0,
      0.0, 0.0, 1.0,

      // Left face (0yz plane)
      0.0, 1.0, 1.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0,
      0.0, 0.0, 0.0,

      // Right face (1yz plane)
      1.0, 0.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, 0.0, 1.0, 1.0, 1.0,
      1.0, 0.0, 1.0,

      // Bottom face (x0z plane)
      1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 1.0,
      0.0, 0.0, 1.0,

      // Top face (x1z plane)
      0.0, 1.0, 1.0, 1.0, 1.0, 1.0, 0.0, 1.0, 0.0, 1.0, 1.0, 1.0, 1.0, 1.0, 0.0,
      0.0, 1.0, 0.0,
    ]);

    // UV texture coordinates for each face
    this.cubeVertsUV = new Float32Array([
      // Front face (xy0)
      0, 0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0,

      // Back face (xy1)
      1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 0,

      // Left face (0yz)
      1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 0, 0,

      // Right face (1yz)
      0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1,

      // Bottom face (x0z)
      1, 0, 1, 1, 0, 0, 0, 0, 1, 1, 0, 1,

      // Top face (x1z)
      0, 1, 1, 1, 0, 0, 1, 1, 1, 0, 0, 0,
    ]);

    // Normals for each face (used for lighting calculations)
    this.cubeVertsNormal = new Float32Array([
      // Front face normals (+Z)
      0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0,
      0.0, 0.0, 1.0,

      // Back face normals (-Z)
      0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0,
      -1.0, 0.0, 0.0, -1.0,

      // Left face normals (+X)
      1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0,
      1.0, 0.0, 0.0,

      // Right face normals (-X)
      -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0,
      0.0, -1.0, 0.0, 0.0,

      // Bottom face normals (+Y)
      0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0,
      0.0, 1.0, 0.0,

      // Top face normals (-Y)
      0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0,
      0.0, 0.0, -1.0, 0.0,
    ]);
  }

  render() {
    // Update normal matrix (required for correct lighting)
    this.normalMatrix.setInverseOf(this.matrix).transpose();

    // Set shader uniforms
    gl.uniform1i(u_whichTexture, this.textureNum);
    gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);
    gl.uniformMatrix4fv(u_NormalMatrix, false, this.normalMatrix.elements);

    // Set fragment color (only used if solid color is active)
    const rgba = this.color;
    gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);

    // Draw the cube
    drawTriangle3DUVNormal(
      this.cubeVertsXYZ,
      this.cubeVertsUV,
      this.cubeVertsNormal
    );
  }
}

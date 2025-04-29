// ===============================
// Triangle Class
// ===============================
class Triangle {
  constructor() {
    this.type = "triangle";

    // Position [x, y, z, extra]
    this.position = [0.0, 0.0, 0.0, 0.0];

    // Default color (white)
    this.color = [1.0, 1.0, 1.0, 1.0];

    // Size of the triangle (used for scaling)
    this.size = 5.0;

    // Number of segments (unused for basic triangle)
    this.segments = 0;
  }
}

// ===============================
// Global Buffers
// ===============================
var g_vertexBuffer = null; // Vertex positions
var g_uvBuffer = null; // Texture coordinates (UVs)
var g_normalBuffer = null; // Normals for lighting

// ===============================
// Buffer Initialization Function
// ===============================
function initTriangle3DUVNormal() {
  // Create and set up the vertex position buffer
  g_vertexBuffer = gl.createBuffer();
  if (!g_vertexBuffer) {
    console.log("Failed to create the vertex buffer object");
    return -1;
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, g_vertexBuffer);
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);

  // Create and set up the UV coordinate buffer
  g_uvBuffer = gl.createBuffer();
  if (!g_uvBuffer) {
    console.log("Failed to create the UV buffer object");
    return -1;
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, g_uvBuffer);
  gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_UV);

  // Create and set up the normal vector buffer
  g_normalBuffer = gl.createBuffer();
  if (!g_normalBuffer) {
    console.log("Failed to create the normal buffer object");
    return -1;
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, g_normalBuffer);
  gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Normal);
}

// ===============================
// Triangle Drawing Function
// ===============================
function drawTriangle3DUVNormal(vertices, uv, normals) {
  var n = vertices.length / 3; // Number of vertices

  // Initialize buffers if they have not been created yet
  if (g_vertexBuffer == null) {
    initTriangle3DUVNormal();
  }

  // Upload vertex positions to GPU
  gl.bindBuffer(gl.ARRAY_BUFFER, g_vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.DYNAMIC_DRAW);

  // Upload UV coordinates to GPU
  gl.bindBuffer(gl.ARRAY_BUFFER, g_uvBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, uv, gl.DYNAMIC_DRAW);

  // Upload normals to GPU
  gl.bindBuffer(gl.ARRAY_BUFFER, g_normalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, normals, gl.DYNAMIC_DRAW);

  // Draw the triangle(s)
  gl.drawArrays(gl.TRIANGLES, 0, n);
}

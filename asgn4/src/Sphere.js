function cos(x) {
  return Math.cos(x);
}

function sin(x) {
  return Math.sin(x);
}

class Sphere {
  constructor() {
    this.color = [1.0, 1.0, 1.0, 1.0]; // Default color (white)
    this.matrix = new Matrix4(); // Transformation matrix
    this.textureNum = -2; // Default texture number
    this.verts32 = new Float32Array([]); // Placeholder for vertices
  }

  render() {
    var rgba = this.color;

    gl.uniform1i(u_whichTexture, this.textureNum);
    gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
    gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

    var d = Math.PI / 10;
    var dd = Math.PI / 10;

    for (var t = 0; t < Math.PI; t += d) {
      for (var r = 0; r < 2 * Math.PI; r += dd) {
        var p1 = [sin(t) * cos(r), sin(t) * sin(r), cos(t)];
        var p2 = [sin(t + dd) * cos(r), sin(t + dd) * sin(r), cos(t + dd)];
        var p3 = [sin(t) * cos(r + dd), sin(t) * sin(r + dd), cos(t)];
        var p4 = [
          sin(t + dd) * cos(r + dd),
          sin(t + dd) * sin(r + dd),
          cos(t + dd),
        ];

        let v1 = [].concat(p1, p2, p4);
        let v2 = [].concat(p1, p4, p3);

        // Normals = flipped (negated) positions
        let n1 = v1.map((n) => -n);
        let n2 = v2.map((n) => -n);

        let uv = [0, 0, 0, 0, 0, 0]; // placeholder UVs

        gl.uniform4f(u_FragColor, 1, 1, 1, 1);
        drawTriangle3DUVNormal(
          new Float32Array(v1),
          new Float32Array(uv),
          new Float32Array(n1)
        );

        gl.uniform4f(u_FragColor, 1, 0, 0, 1);
        drawTriangle3DUVNormal(
          new Float32Array(v2),
          new Float32Array(uv),
          new Float32Array(n2)
        );
      }
    }
  }
}

class Camera {
  constructor() {
    console.log("Camera constructor");
    this.at = new Vector3([0, 0, -100]);
    this.eye = new Vector3([0, 0, 3]);
    this.up = new Vector3([0, 1, 0]);
  }

  forward() {
    let f = new Vector3(this.at.elements); // clone
    f.sub(this.eye); // direction vector
    f.normalize(); // unit vector

    // Move both at and eye forward
    this.at.add(new Vector3(f.elements));
    this.eye.add(new Vector3(f.elements));
  }

  back() {
    let f = new Vector3(this.eye.elements); // clone
    f.sub(this.at);
    f.normalize();

    // Move both at and eye backward
    this.at.add(new Vector3(f.elements));
    this.eye.add(new Vector3(f.elements));
  }

  left() {
    let f = new Vector3(this.at.elements);
    f.sub(this.eye);
    f.normalize();

    let s = Vector3.cross(f, this.up); // sideways
    s.normalize();

    this.at.sub(new Vector3(s.elements));
    this.eye.sub(new Vector3(s.elements));
  }

  right() {
    let f = new Vector3(this.at.elements);
    f.sub(this.eye);
    f.normalize();

    let s = Vector3.cross(f, this.up);
    s.normalize();

    this.at.add(new Vector3(s.elements));
    this.eye.add(new Vector3(s.elements));
  }
}

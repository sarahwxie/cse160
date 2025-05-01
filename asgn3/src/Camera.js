class Camera {
  constructor() {
    console.log("Camera constructor");
    this.at = new Vector3([0, 0, -100]);
    this.eye = new Vector3([0, 0, 3]);
    this.up = new Vector3([0, 1, 0]);
    this.step = 0.2; // movement step size
  }

  forward() {
    let f = new Vector3(this.at.elements); // clone
    f.sub(this.eye);
    f.normalize();
    f.mul(this.step); // move by 0.2

    this.at.add(f);
    this.eye.add(f);
  }

  back() {
    let f = new Vector3(this.eye.elements);
    f.sub(this.at);
    f.normalize();
    f.mul(this.step); // move by 0.2

    this.at.add(f);
    this.eye.add(f);
  }

  left() {
    let f = new Vector3(this.at.elements);
    f.sub(this.eye);
    f.normalize();

    let s = Vector3.cross(f, this.up);
    s.normalize();
    s.mul(this.step);

    this.at.sub(s);
    this.eye.sub(s);
  }

  right() {
    let f = new Vector3(this.at.elements);
    f.sub(this.eye);
    f.normalize();

    let s = Vector3.cross(f, this.up);
    s.normalize();
    s.mul(this.step);

    this.at.add(s);
    this.eye.add(s);
  }
}

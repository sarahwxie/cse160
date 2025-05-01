class Camera {
  constructor() {
    console.log("Camera constructor");
    this.at = new Vector3([0, 2, -100]);
    this.eye = new Vector3([0, 2, 3]);
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

  rotate(yaw, pitch) {
    // Calculate current look direction
    let look = new Vector3(this.at.elements);
    look.sub(this.eye);

    // Convert to spherical coordinates
    let r = look.magnitude();
    let theta = Math.atan2(look.elements[2], look.elements[0]); // yaw
    let phi = Math.acos(look.elements[1] / r); // pitch

    // Apply mouse deltas (in radians)
    theta += (yaw * Math.PI) / 180;
    phi += (pitch * Math.PI) / 180;

    // Clamp pitch to prevent flip
    const eps = 0.1;
    phi = Math.max(eps, Math.min(Math.PI - eps, phi));

    // Convert back to Cartesian coordinates
    look.elements[0] = r * Math.sin(phi) * Math.cos(theta);
    look.elements[1] = r * Math.cos(phi);
    look.elements[2] = r * Math.sin(phi) * Math.sin(theta);

    // Update at = eye + look
    this.at = new Vector3(this.eye.elements);
    this.at.add(look);
  }
}

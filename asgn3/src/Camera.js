class Camera {
  constructor() {
    //this.type="cube"
    //this.position=[0,0,0,0,0,0,0]
    //this.color=[1.0,1.0,1.0,1.0]
    this.at = new Vector3(0, 0, 3);
    this.eye = new Vector3(0, 0, -100);
    this.up = new Vector3(0, 1, 0);
  }

  forward() {
    var f = this.at.sub(this.eye);
    f = f.div(f.magnitude());
    this.at = this.at.add(f);
    this.eye = this.eye.add(f);
  }

  back() {
    var f = this.eye.sub(this.at);
    f = f.div(f.magnitude());
    this.at = this.at.add(f);
    this.eye = this.eye.add(f);
  }

  left() {
    var f = this.eye.sub(this.at);
    f = f.div(f.magnitude());
    var s = f.cross(this.up);
    s = s.div(s.magnitude());
    this.at = this.at.add(s);
    this.eye = this.eye.add(s);
  }

  right() {
    var f = this.eye.sub(this.at);
    f = f.div(f.magnitude());
    var s = f.cross(this.up);
    s = s.div(s.magnitude());
    this.at = this.at.sub(s);
    this.eye = this.eye.sub(s);
  }
}

class Camera {
  constructor() {
    this.fov   = 60;
    this.eye = new Vector3([12, 1.7, 13]);
    this.at  = new Vector3([13, 1.7, 13]);
    this.up    = new Vector3([0, 1, 0]);
    this.speed = 0.15;

    this.viewMatrix       = new Matrix4();
    this.projectionMatrix = new Matrix4();
    this._updateView();
    this._updateProj();
  }

  _updateView() {
    this.viewMatrix.setLookAt(
      this.eye.elements[0], this.eye.elements[1], this.eye.elements[2],
      this.at.elements[0],  this.at.elements[1],  this.at.elements[2],
      this.up.elements[0],  this.up.elements[1],  this.up.elements[2]
    );
  }

  _updateProj() {
    this.projectionMatrix.setPerspective(this.fov, canvas.width / canvas.height, 0.1, 1000);
  }

  _forward() {
    let fx = this.at.elements[0] - this.eye.elements[0];
    let fy = this.at.elements[1] - this.eye.elements[1];
    let fz = this.at.elements[2] - this.eye.elements[2];
    let len = Math.sqrt(fx*fx + fy*fy + fz*fz);
    return [fx/len, fy/len, fz/len];
  }

  _right() {
    let [fx, fy, fz] = this._forward();
    let ux = this.up.elements[0];
    let uy = this.up.elements[1];
    let uz = this.up.elements[2];
    let rx = fy*uz - fz*uy;
    let ry = fz*ux - fx*uz;
    let rz = fx*uy - fy*ux;
    let len = Math.sqrt(rx*rx + ry*ry + rz*rz);
    return [rx/len, ry/len, rz/len];
  }

  moveForward() {
    let [fx, fy, fz] = this._forward();
    fy = 0;  // lock to ground plane
    let len = Math.sqrt(fx*fx + fz*fz);  // renormalize without Y
    fx /= len; fz /= len;
    let s = this.speed;
    this.eye.elements[0] += fx*s; this.eye.elements[2] += fz*s;
    this.at.elements[0]  += fx*s; this.at.elements[2]  += fz*s;
    this._updateView();
  }

  moveBackwards() {
    let [fx, fy, fz] = this._forward();
    fy = 0;
    let len = Math.sqrt(fx*fx + fz*fz);
    fx /= len; fz /= len;
    let s = this.speed;
    this.eye.elements[0] -= fx*s; this.eye.elements[2] -= fz*s;
    this.at.elements[0]  -= fx*s; this.at.elements[2]  -= fz*s;
    this._updateView();
  }

  moveLeft() {
    let [rx, ry, rz] = this._right();
    let s = this.speed;
    this.eye.elements[0] -= rx*s; this.eye.elements[1] -= ry*s; this.eye.elements[2] -= rz*s;
    this.at.elements[0]  -= rx*s; this.at.elements[1]  -= ry*s; this.at.elements[2]  -= rz*s;
    this._updateView();
  }

  moveRight() {
    let [rx, ry, rz] = this._right();
    let s = this.speed;
    this.eye.elements[0] += rx*s; this.eye.elements[1] += ry*s; this.eye.elements[2] += rz*s;
    this.at.elements[0]  += rx*s; this.at.elements[1]  += ry*s; this.at.elements[2]  += rz*s;
    this._updateView();
  }

  panLeft(alpha) {
    alpha = alpha || 5;
    let [fx, fy, fz] = this._forward();
    let fv = new Vector3([fx, fy, fz]);
    let rot = new Matrix4();
    rot.setRotate(alpha, this.up.elements[0], this.up.elements[1], this.up.elements[2]);
    let fp = rot.multiplyVector3(fv);
    this.at.elements[0] = this.eye.elements[0] + fp.elements[0];
    this.at.elements[1] = this.eye.elements[1] + fp.elements[1];
    this.at.elements[2] = this.eye.elements[2] + fp.elements[2];
    this._updateView();
  }

  panRight(alpha) {
    this.panLeft(-(alpha || 5));
  }

  mouseLook(dx, dy) {
    if (dx !== 0) this.panLeft(-dx * 0.3);
    if (dy !== 0) {
      let [fx, fy, fz] = this._forward();
      let fv = new Vector3([fx, fy, fz]);
      let [rx, ry, rz] = this._right();
      let rot = new Matrix4();
      rot.setRotate(-dy * 0.3, rx, ry, rz);
      let fp = rot.multiplyVector3(fv);
      if (Math.abs(fp.elements[1]) > 0.99) return;
      this.at.elements[0] = this.eye.elements[0] + fp.elements[0];
      this.at.elements[1] = this.eye.elements[1] + fp.elements[1];
      this.at.elements[2] = this.eye.elements[2] + fp.elements[2];
      this._updateView();
    }
  }
}
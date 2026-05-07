class Camera {
  constructor() {
    this.fov   = 60;
    this.eye = new Vector3([12, 1.7, 13]);
    this.at  = new Vector3([13, 1.7, 13]);
    this.up    = new Vector3([0, 1, 0]);
    this.speed = 0.12;
    this.velY = 0;
    this.onGround = false;

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
    fy = 0;
    let len = Math.sqrt(fx*fx + fz*fz);
    fx /= len; fz /= len;
    let s = this.speed;
    let nx = this.eye.elements[0] + fx*s;
    let nz = this.eye.elements[2] + fz*s;
    if (!this._isBlocked(nx, nz)) {
      this.eye.elements[0] = nx; this.eye.elements[2] = nz;
      this.at.elements[0]  += fx*s; this.at.elements[2] += fz*s;
      this._updateView();
    }
  }

  moveBackwards() {
    let [fx, fy, fz] = this._forward();
    fy = 0;
    let len = Math.sqrt(fx*fx + fz*fz);
    fx /= len; fz /= len;
    let s = this.speed;
    let nx = this.eye.elements[0] - fx*s;
    let nz = this.eye.elements[2] - fz*s;
    if (!this._isBlocked(nx, nz)) {
      this.eye.elements[0] = nx; this.eye.elements[2] = nz;
      this.at.elements[0]  -= fx*s; this.at.elements[2]  -= fz*s;
      this._updateView();
    }
  }

  moveLeft() {
    let [rx, ry, rz] = this._right();
    let s = this.speed;
    let nx = this.eye.elements[0] - rx*s;
    let nz = this.eye.elements[2] - rz*s;
    if (!this._isBlocked(nx, nz)) {
      this.eye.elements[0] = nx; this.eye.elements[2] = nz;
      this.at.elements[0]  -= rx*s; this.at.elements[2]  -= rz*s;
      this._updateView();
    }
  }

  moveRight() {
    let [rx, ry, rz] = this._right();
    let s = this.speed;
    let nx = this.eye.elements[0] + rx*s;
    let nz = this.eye.elements[2] + rz*s;
    if (!this._isBlocked(nx, nz)) {
      this.eye.elements[0] = nx; this.eye.elements[2] = nz;
      this.at.elements[0]  += rx*s; this.at.elements[2]  += rz*s;
      this._updateView();
    }
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
  moveDir(fx, fz, delta) {
    var s = this.speed * (delta || 1);
    var nx = this.eye.elements[0] + fx*s;
    var nz = this.eye.elements[2] + fz*s;
    if (!this._isBlocked(nx, nz)) {
      this.eye.elements[0] = nx; this.eye.elements[2] = nz;
      this.at.elements[0]  += fx*s; this.at.elements[2] += fz*s;
      this._updateView();
    }
  }
  _isBlocked(x, z) {
    var pad = 0.3;
    var mx1 = Math.floor(x - pad);
    var mx2 = Math.floor(x + pad);
    var mz1 = Math.floor(z - pad);
    var mz2 = Math.floor(z + pad);
    if (mx1 < 0 || mx2 >= 32 || mz1 < 0 || mz2 >= 32) return true;

    var feetY = this.eye.elements[1] - 1.7;

    var wallBlocks = (mx, mz) => {
      if (mx < 0 || mx >= 32 || mz < 0 || mz >= 32) return true;
      var h = g_map[mz][mx];
      // Only block if wall height is above feet (can't walk through it)
      return h > 0 && h > feetY + 0.1;
    };

    if (wallBlocks(mx1,mz1) || wallBlocks(mx1,mz2) ||
        wallBlocks(mx2,mz1) || wallBlocks(mx2,mz2)) return true;

    for (var i = 0; i < g_treePositions.length; i++) {
      var tx = g_treePositions[i][0];
      var tz = g_treePositions[i][1];
      if (x + pad > tx && x - pad < tx + 1 &&
          z + pad > tz && z - pad < tz + 1) return true;
    }
    return false;
  }

  jump() {
    if (this.onGround) {
      this.velY = 0.18;
      this.onGround = false;
    }
  }

  applyGravity() {
    var GRAVITY = -0.012;
    var GROUND_Y = 1.7;

    this.velY += GRAVITY;
    var newY = this.eye.elements[1] + this.velY;

    // Check standing on a wall block
    var mx = Math.floor(this.eye.elements[0]);
    var mz = Math.floor(this.eye.elements[2]);
    if (mx >= 0 && mx < 32 && mz >= 0 && mz < 32) {
      var blockHeight = g_map[mz][mx];
      var standY = blockHeight + GROUND_Y;
      if (newY <= standY && this.velY <= 0) {
        newY = standY;
        this.velY = 0;
        this.onGround = true;
      }
    }

    // Check flat ground
    if (newY <= GROUND_Y) {
      newY = GROUND_Y;
      this.velY = 0;
      this.onGround = true;
    }

    var dy = newY - this.eye.elements[1];
    this.eye.elements[1] = newY;
    this.at.elements[1] += dy;
    this._updateView();
  }

}
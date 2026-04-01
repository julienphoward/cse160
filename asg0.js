let ctx;
function main() {
  let canvas = document.getElementById('example');
    if (!canvas) {
        console.log('Failed to retrieve the canvas element');
        return;
    }
    ctx = canvas.getContext('2d');
  
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, 400, 400);
  let v1 = new Vector3([2.25, 2.25, 0]);
  drawVector(v1, "red");
}

function drawVector(v, color) {
  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.moveTo(200, 200);
  ctx.lineTo(200 + v.elements[0] * 20, 200 - v.elements[1] * 20);
  ctx.stroke();
}

function handleDrawOperationEvent() {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, 400, 400);

    let x1 = parseFloat(document.getElementById('v1x').value);
    let y1 = parseFloat(document.getElementById('v1y').value);
    let v1 = new Vector3([x1, y1, 0]);
    drawVector(v1, "red");

    let x2 = parseFloat(document.getElementById('v2x').value);
    let y2 = parseFloat(document.getElementById('v2y').value);
    let v2 = new Vector3([x2, y2, 0]);
    drawVector(v2, "blue");

    let op = document.getElementById('operation').value;
    let scalar = parseFloat(document.getElementById('scalar').value);

    if (op === 'add') {
        let v3 = new Vector3([x1, y1, 0]);
        v3.add(v2);
        drawVector(v3, "green");
    } else if (op === 'sub') {
        let v3 = new Vector3([x1, y1, 0]);
        v3.sub(v2);
        drawVector(v3, "green");
    } else if (op === 'mul') {
        let v3 = new Vector3([x1, y1, 0]);
        let v4 = new Vector3([x2, y2, 0]);
        v3.mul(scalar);
        v4.mul(scalar);
        drawVector(v3, "green");
        drawVector(v4, "green");
    } else if (op === 'div') {
        let v3 = new Vector3([x1, y1, 0]);
        let v4 = new Vector3([x2, y2, 0]);
        v3.div(scalar);
        v4.div(scalar);
        drawVector(v3, "green");
        drawVector(v4, "green");
    } else if (op === 'magnitude') {
      console.log("Magnitude v1: " + v1.magnitude());
      console.log("Magnitude v2: " + v2.magnitude());
    } else if (op === 'normalize') {
      let v3 = new Vector3([x1, y1, 0]);
      let v4 = new Vector3([x2, y2, 0]);
      v3.normalize();
      v4.normalize();
      drawVector(v3, "green");
      drawVector(v4, "green");
    } else if (op === 'angle') {
      console.log("Angle: " + angleBetween(v1, v2));
    } else if (op === 'area') {
      console.log("Area of triangle: " + areaTriangle(v1, v2));
    }
}

function angleBetween(v1, v2) {
    let dot = Vector3.dot(v1, v2);
    let angle = Math.acos(dot / (v1.magnitude() * v2.magnitude()));
    return angle * (180 / Math.PI);
}

function areaTriangle(v1, v2) {
    let cross = Vector3.cross(v1, v2);
    return cross.magnitude() / 2;
}
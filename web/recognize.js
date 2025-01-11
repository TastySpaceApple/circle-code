const cv = await window.cv;

const canvas = document.getElementById('canvasOutput');
const ctx = canvas.getContext('2d');

function fillCircle(ctx, x, y, radius) {
  ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
  ctx.fill();
}

class CircleCodedMarker {
  constructor(outerCircle, innerCircle) {
    this.outerCircle = outerCircle;
    this.innerCircle = innerCircle;
    this.findId();
  }

  codeFromCodeLineAngles(codeLineAngles) {
    let numPowerCouples = 0;
    for (let j = 0; j < codeLineAngles.length; ++j) {
      for (let k = j + 1; k < codeLineAngles.length; ++k) {
        const angleDiff = Math.abs(180 - Math.abs(codeLineAngles[j] - codeLineAngles[k]));
        if (angleDiff < 10) {
          numPowerCouples++;
        }
      }
    }
    if(numPowerCouples === 0){
      return -1;
    }
    let numRegularCodeLines = codeLineAngles.length - numPowerCouples * 2;
    const code = numPowerCouples * 4 + numRegularCodeLines - 4;
    return code;
  }

  findId() {
    const contour = this.innerCircle.contour;
    // find concave hull defects
    const hull = new cv.Mat();
    cv.convexHull(contour, hull, false, false);
    const defects = new cv.Mat();
    cv.convexityDefects(contour, hull, defects);
    // draw defects on ctx
    const defectPoints = [];
    for (let j = 0; j < defects.rows; j++) {
      let start = new cv.Point(contour.data32S[defects.data32S[j * 4] * 2], contour.data32S[defects.data32S[j * 4] * 2 + 1]);
      let end = new cv.Point(contour.data32S[defects.data32S[j * 4 + 1] * 2], contour.data32S[defects.data32S[j * 4 + 1] * 2 + 1]);
      const dist = distPoints(start, end);
      let far = new cv.Point(contour.data32S[defects.data32S[j * 4 + 2] * 2], contour.data32S[defects.data32S[j * 4 + 2] * 2 + 1]);
      let depth = defects.data32S[j * 4 + 3] / 256;
      if (depth > dist * 0.3) {
        defectPoints.push(far);
      }
    }
    // for each defect, find the angle from the center
    const center = this.innerCircle.center;
    const codeLineAngles = [];
    for (let j = 0; j < defectPoints.length; j++) {
      const point = defectPoints[j];
      const angle = Math.atan2(point.y - center.y, point.x - center.x) * 180 / Math.PI;
      codeLineAngles.push(Math.floor(angle));
      ctx.strokeStyle = 'blue';
      ctx.beginPath();
      ctx.moveTo(center.x, center.y);
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
    }

    this.code = this.codeFromCodeLineAngles(codeLineAngles);
    console.log('code:', this.code);
  }
}

function distPoints(p1, p2) {
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
}

function getCircleFromContour(contour) {
  const area = cv.contourArea(contour, false);
  if (area < 10 || area > imgElement.width * imgElement.height) {
    return false;
  }

  const approx = contour;
  // cv.approxPolyDP(contour, approx, 0.005 * cv.arcLength(contour, true), true);

  const rect = cv.boundingRect(approx);
  const center = { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
  const { radius } = cv.minEnclosingCircle(approx);
  const unacceptableDistance = radius * 0.25;

  let isCircle = true;
  for (let j = 0; j < approx.rows && isCircle; ++j) {
    const point = { x: approx.data32S[j * 2], y: approx.data32S[j * 2 + 1] };
    let distance = distPoints(center, point);
    if (Math.abs(distance - radius) > unacceptableDistance) {
      isCircle = false;
    }
  }
  if(!isCircle){
    return false;
  }

  return { 
    center, 
    radius,
    contour: approx
  }
}

const isCircleInCircle = (outerCircle, innerCircle) => {
  const distance = distPoints(outerCircle.center, innerCircle.center);
  return distance < outerCircle.radius - innerCircle.radius;
}

let imgElement = new Image();
imgElement.src = './images/10.png';
imgElement.onload = function () {
  ctx.strokeStyle = 'red';
  canvas.width = imgElement.width;
  canvas.height = imgElement.height;
  ctx.drawImage(imgElement, 0, 0, imgElement.width / 2 - 30 , imgElement.height / 2);

  let src = cv.imread(canvas);
  let threshold = new cv.Mat();
  cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY, 0);
  cv.threshold(src, threshold, 177, 255, cv.THRESH_BINARY_INV);

  // color connected components
  let all_contours = new cv.MatVector();
  let hierarchy = new cv.Mat();
  cv.findContours(threshold, all_contours, hierarchy, cv.RETR_LIST, cv.CHAIN_APPROX_SIMPLE);
  // filter contours by area
  const circles = [];
  for (let i = 0; i < all_contours.size(); ++i) {
    let contour = all_contours.get(i);
    const circle = getCircleFromContour(contour);
    if(circle){
      circles.push(circle);
    }
  }

  // fill all cricles
  circles.forEach((circle) => {
    const { center, radius } = circle;
    if(center){
      // fillCircle(ctx, center.x, center.y, radius);
    }
  });

  const markers = [];

  // find circles in circles
  for (let i = 0; i < circles.length; i++) {
    for (let j = 0; j < circles.length; j++) {
      if(i === j){
        continue;
      }
      if(isCircleInCircle(circles[i], circles[j])){
        markers.push(new CircleCodedMarker(circles[i], circles[j]));
      }
    }
  }
  // for (let i = 0; i < contours.size(); ++i) {
  //   let contour = contours.get(i);
  //   let approx = new cv.Mat();
  //   cv.approxPolyDP(contour, approx, 0.005 * cv.arcLength(contour, true), true);
  //   // loop over the approximated polygon

  //   let isCircle = true;
  //   let defectDistance = radius * 0.05;
  //   let unacceptableDistance = radius * 0.2;
  //   let codeLineAngles = [];
  //   let codeLineAngle = null;
  //   for (let j = 0; j < approx.rows && isCircle; ++j) {
  //     let point = {x: approx.data32S[j * 2], y: approx.data32S[j * 2 + 1]};
  //     let distance = distPoints(center, point);
  //     if(Math.abs(distance - radius) > unacceptableDistance){
  //       isCircle = false;
  //       break;
  //     }
  //     else if(Math.abs(distance - radius) > defectDistance){
  //       // isCircle = false;
  //       const angle = Math.atan2(point.y - center.y, point.x - center.x) * 180 / Math.PI;
  //       // add if not too close to orevious line
  //       if(codeLineAngle === null || Math.abs(codeLineAngle - angle) > 10){
  //         codeLineAngle = angle;
  //         codeLineAngles.push(Math.floor(codeLineAngle));
  //         ctx.strokeStyle = 'blue';
  //         ctx.beginPath();
  //         ctx.moveTo(center.x, center.y);
  //         ctx.lineTo(point.x, point.y);
  //         ctx.stroke();
  //       }

  //     }
  //   }

  //   if(isCircle){
  //     console.log(codeLineAngles);
  //     // find how many couples there are that are facing each other across the circle
  //     let numPowerCouples = 0;
  //     for (let j = 0; j < codeLineAngles.length; ++j) {
  //       for (let k = j + 1; k < codeLineAngles.length; ++k) {
  //         const angleDiff = Math.abs(180 - Math.abs(codeLineAngles[j] - codeLineAngles[k]));
  //         if(angleDiff < 10){
  //           numPowerCouples++;
  //         }
  //       }
  //     }
  //     let numRegularCodeLines = codeLineAngles.length - numPowerCouples * 2;
  //     const code = numPowerCouples * 4 + numRegularCodeLines - 4;
  //     console.log('code:', code);
  //     if(code < 0){
  //       console.log('invalid code');
  //     }
  //     else{
  //       fillCircle(ctx, center.x, center.y, radius);
  //     }
  //   }
}

// draw thresholded image
// cv.imshow('canvasOutput', thresh);

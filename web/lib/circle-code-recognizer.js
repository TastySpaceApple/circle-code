import CircleCodedMarker from './circle-code-marker.js';

const cv = await window.cv;

function distPoints(p1, p2) {
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
}

function getCircleFromContour(contour) {
  const area = cv.contourArea(contour, false);
  if (area < 10 || area > 100000) {
    return false;
  }

  const approx = contour;
  cv.approxPolyDP(contour, approx, 0.005 * cv.arcLength(contour, true), true);

  const rect = cv.boundingRect(approx);
  const center = { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
  const { radius } = cv.minEnclosingCircle(approx);
  const deltaRectFromCircle = Math.abs(rect.width / 2 - radius) + Math.abs(rect.height / 2 - radius);
  if (deltaRectFromCircle > 10) {
    return false;
  }
  let maxImperfectionDelta = 0;
  let maxImperfection = 0;

  let isCircle = true;
  for (let j = 0; j < approx.rows && isCircle; ++j) {
    const point = { x: approx.data32S[j * 2], y: approx.data32S[j * 2 + 1] };
    let distance = distPoints(center, point);
    const delta = Math.abs(distance - radius);
    if (delta > maxImperfectionDelta) {
      maxImperfectionDelta = delta;
      maxImperfection = delta / radius;
      if(maxImperfection > 0.3){
        isCircle = false;
      }
    }
  }
  if(!isCircle){
    return false;
  }

  return { 
    center, 
    radius,
    imperfection: maxImperfection,
    contour: approx
  }
}

const isCircleInCircle = (outerCircle, innerCircle) => {
  const distance = distPoints(outerCircle.center, innerCircle.center);
  return distance < outerCircle.radius - innerCircle.radius;
}

class CircleCodeRecognizer {
  constructor() {

  }

  findCircles(src) {
    let threshold = new cv.Mat();
    cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY, 0);
    cv.threshold(src, threshold, 177, 255, cv.THRESH_BINARY_INV);

    let all_contours = new cv.MatVector();
    let hierarchy = new cv.Mat();
    cv.findContours(threshold, all_contours, hierarchy, cv.RETR_LIST, cv.CHAIN_APPROX_SIMPLE);

    const circles = [];
    for (let i = 0; i < all_contours.size(); ++i) {
      let contour = all_contours.get(i);
      const circle = getCircleFromContour(contour);
      if(circle){
        circles.push(circle);
      }
    }

    this.circles = circles;

    return circles;
  }

  read(canvas){
    let src = cv.imread(canvas);
    
    const circles =  this.findCircles(src);

    this.markers = [];

    const intersectsOtherMarker = (marker) => {
      for (let i = 0; i < this.markers.length; i++) {
        if(isCircleInCircle(this.markers[i].outerCircle, marker.outerCircle)){
          return true;
        }
      }
      return false;
    }
    // find circles in circles
    for (let i = 0; i < circles.length; i++) {
      for (let j = 0; j < circles.length; j++) {
        if(i === j){
          continue;
        }
        if(isCircleInCircle(circles[i], circles[j])){
          if(circles[i].imperfection < circles[j].imperfection){  
            const marker = new CircleCodedMarker(circles[i], circles[j]);
            if(!intersectsOtherMarker(marker)){
              this.markers.push(marker);
            }
          }
        }
      }
    }  

    return this.markers;
  }

}

export default CircleCodeRecognizer;
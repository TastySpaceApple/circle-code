const cv = await window.cv;

function distPoints(p1, p2) {
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
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
        if (depth > dist * 0.25) {
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
      }
  
      this.code = this.codeFromCodeLineAngles(codeLineAngles);
      this.codeLineAngles = codeLineAngles;
    }
  }
  
  export default CircleCodedMarker;
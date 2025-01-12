import fs from 'fs';
import { Canvas } from 'canvas';

const size = 400;
const padding = 40;
const lineColor = 'black';
const circleStrokeWidth = 10;
const codeLineWidth = 30;
const codeLineLength = 30;
const numPowerCouplesCodeLines = 4;
const numRegularCodeLines = 6;
const numCodeLines = numPowerCouplesCodeLines + numRegularCodeLines;

const maxCodeableNumber = 4 * numPowerCouplesCodeLines + numRegularCodeLines;
console.log('maxCodeableNumber', maxCodeableNumber);

const LINE_CODES_STYLES = {
  NONE: 0,
  APPEAR: 1,
  POWER_COUPLE: 2,
}

function projectPoint(point, angle, distance) {
  return {
    x: point.x + distance * Math.cos(angle),
    y: point.y + distance * Math.sin(angle)
  };
}

function generate(id) {
  const canvas = new Canvas(size + 2 * padding, size + 2 * padding);
  const ctx = canvas.getContext('2d');

  // white background
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, size + 2 * padding, size + 2 * padding);

  
  const centerPoint = {
    x: size / 2 + padding,
    y: size / 2 + padding
  };

  // draw outer circle
  ctx.beginPath();
  ctx.arc(centerPoint.x, centerPoint.y, size / 2 - circleStrokeWidth / 2, 0, Math.PI * 2, true);
  ctx.closePath();
  ctx.strokeStyle = lineColor;
  ctx.lineWidth = circleStrokeWidth;
  ctx.stroke();

  // draw lines
  const code = {};
  for (let i = 0; i < numCodeLines; i++) {
    code[i] = LINE_CODES_STYLES.NONE;
  }

  
  let sum = id;
  
  let powerCouplesLocations = new Array(numPowerCouplesCodeLines).fill(0).map((_, i) => Math.floor(numCodeLines / numPowerCouplesCodeLines * (i + 1)));
  
  powerCouplesLocations.forEach((location) => {
    if(sum > 4){
      code[location] = LINE_CODES_STYLES.POWER_COUPLE;
      sum -= 4;
    }
  });

  let locations = new Array(numCodeLines - 1).fill(0).map((_, i) => i + 1).filter((i) => code[i] === LINE_CODES_STYLES.NONE);
  // pick random locations
  while (sum > 0) {
    const randomIndex = Math.floor(Math.random() * locations.length);
    code[locations[randomIndex]] = LINE_CODES_STYLES.APPEAR;
    locations = locations.filter((_, index) => index !== randomIndex);
    sum--;
  }

  const drawCodeLine = (angle) => {
    const startPoint = projectPoint(centerPoint, angle, size / 2 - circleStrokeWidth);
    const endPoint = projectPoint(centerPoint, angle, size / 2 - circleStrokeWidth - codeLineLength);

    ctx.beginPath();
    ctx.moveTo(startPoint.x, startPoint.y);
    ctx.lineTo(endPoint.x, endPoint.y);
    ctx.closePath();
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = codeLineWidth;
    ctx.stroke();
  }


  drawCodeLine(0);
  drawCodeLine(Math.PI);

  for (let i = 0; i < numCodeLines; i++) {
    const angle = -Math.PI / (numCodeLines + 1) * i;
    
    if (code[i] === LINE_CODES_STYLES.POWER_COUPLE) {
      console.log("POWER COUPLE");
      drawCodeLine(angle);
      drawCodeLine(angle + Math.PI);
    } else if (code[i] === LINE_CODES_STYLES.APPEAR) {
      drawCodeLine(angle);
    }
  }

  // save
  const out = fs.createWriteStream(`./images/${id}.png`);
  const stream = canvas.createPNGStream();
  stream.pipe(out);
  out.on('finish', () => console.log('The PNG file was created.'));
}

for (let i = 0; i <= maxCodeableNumber; i++) {
  generate(i);
}

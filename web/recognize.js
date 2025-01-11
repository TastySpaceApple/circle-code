import CircleCodeRecognizer from './lib/circle-code-recognizer.js';

const canvas = document.getElementById('canvas');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const ctx = canvas.getContext('2d');

const drawMarkerOnCanvas = async () => {
  const id = Math.floor(Math.random() * 16);
  console.log('id:', id);
  const img = document.createElement('img');
  img.src = `./images/${id}.png`;
  await new Promise((resolve) => {
    img.onload = resolve;
  });
  const scale = Math.random() * 0.5 + 0.3;
  const x = Math.random() * (canvas.width - img.width * scale);
  const y = Math.random() * (canvas.height - img.height * scale);
  ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
}

await drawMarkerOnCanvas();
await drawMarkerOnCanvas();
await drawMarkerOnCanvas();

const recognizer = new CircleCodeRecognizer();
const markers = recognizer.read(canvas, ctx);
console.log('markers:', markers);

const fillCircle = (center, radius) => {
  ctx.beginPath();
  ctx.arc(center.x, center.y, radius, 0, Math.PI * 2, true);
  ctx.closePath();
  ctx.fillStyle = 'rgba(255, 0, 0, 0.1)';
  ctx.fill();
}

const drawLine = (center, angle, length) => {
  angle = angle * Math.PI / 180;
  const endPoint = {
    x: center.x + length * Math.cos(angle),
    y: center.y + length * Math.sin(angle)
  };
  ctx.beginPath();
  ctx.moveTo(center.x, center.y);
  ctx.lineTo(endPoint.x, endPoint.y);
  ctx.closePath();
  ctx.strokeStyle = 'rgba(0, 0, 255, 0.5)';
  ctx.stroke();
}

markers.forEach((marker) => {
  fillCircle(marker.outerCircle.center, marker.innerCircle.radius);
  const angles = marker.codeLineAngles;
  angles.forEach((angle) => {
    drawLine(marker.innerCircle.center, angle, marker.innerCircle.radius);
  });
});
import "./style.css";

document.body.innerHTML = `
`;

// Title
const title = document.createElement("h1");
title.textContent = "Sticker Sketchpad";
document.body.append(title);

// Canvas
const canvas = document.createElement("canvas");
canvas.width = 256;
canvas.height = 256;
document.body.append(canvas);

// Drawing logic
const ctx = canvas.getContext("2d")!;
const cursor = { active: false };

type Point = { x: number; y: number };
let strokes: Point[][] = []; // Array of strokes, each stroke is an array of points
let currentStroke: Point[] = [];

canvas.addEventListener("mousedown", () => {
  cursor.active = true;
  currentStroke = [];
  strokes.push(currentStroke);
});

canvas.addEventListener("mousemove", (e) => {
  if (cursor.active) {
    currentStroke.push({ x: e.offsetX, y: e.offsetY });
    canvas.dispatchEvent(new Event("drawing-changed"));
  }
});

canvas.addEventListener("mouseup", () => {
  cursor.active = false;
});

// Observer for redrawing
canvas.addEventListener("drawing-changed", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (const stroke of strokes) {
    if (stroke.length > 1) {
      ctx.beginPath();
      const { x, y } = stroke[0];
      ctx.moveTo(x, y);
      for (const { x, y } of stroke) {
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }
});

// Clear button
const clearButton = document.createElement("button");
clearButton.textContent = "clear";
document.body.append(clearButton);

clearButton.addEventListener("click", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  strokes = [];
});

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

// Context
const ctx = canvas.getContext("2d")!;
const cursor = { active: false };

// DisplayCommand interface and implementation
interface DisplayCommand {
  drag(x: number, y: number): void;
  display(ctx: CanvasRenderingContext2D): void;
}

// Marker type
interface MarkerType {
  thickness: number;
}

type Point = { x: number; y: number };

// Factory function to create a marker line
function makeMarkerLine(
  initial_x: number,
  initial_y: number,
  tool: MarkerType,
): DisplayCommand {
  const points: Point[] = [{ x: initial_x, y: initial_y }];
  return {
    drag(x: number, y: number) {
      points.push({ x, y });
    },
    display(ctx: CanvasRenderingContext2D) {
      if (points.length > 1) {
        ctx.lineWidth = tool.thickness;
        ctx.beginPath();
        const { x, y } = points[0];
        ctx.moveTo(x, y);
        for (const { x, y } of points) {
          ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    },
  };
}

// Factory function to create a tool preview
function makeToolPreview(
  x: number,
  y: number,
  tool: MarkerType,
): DisplayCommand {
  return {
    drag(_x: number, _y: number) {
      // No drag functionality for preview
    },
    display(ctx: CanvasRenderingContext2D) {
      ctx.beginPath();
      ctx.arc(x, y, tool.thickness, 0, 2 * Math.PI);
      ctx.fill();
    },
  };
}

let strokes: DisplayCommand[] = []; // All strokes represented as DisplayCommands
let currentStroke: DisplayCommand | null = null;
let redoStack: DisplayCommand[] = []; // Stack for redo functionality

let currentMarkerTool: MarkerType = { thickness: 1 }; // Default tool
let toolPreview: boolean = false;
let toolPreviewCommand: DisplayCommand | null = null;

// Mouse events
canvas.addEventListener("mouseout", () => {
  cursor.active = false;
  currentStroke = null;
  toolPreview = false;
  toolPreviewCommand = null;
  canvas.dispatchEvent(new Event("tool-moved"));
});

canvas.addEventListener("mouseenter", (e) => {
  toolPreview = true;
  if (toolPreview) {
    canvas.style.cursor = "none";
  }
  toolPreviewCommand = makeToolPreview(
    e.offsetX,
    e.offsetY,
    currentMarkerTool,
  );
  canvas.dispatchEvent(new Event("tool-moved"));
});

canvas.addEventListener("mousedown", (e) => {
  cursor.active = true;
  toolPreview = false;
  currentStroke = makeMarkerLine(e.offsetX, e.offsetY, currentMarkerTool);
  strokes.push(currentStroke);
});

canvas.addEventListener("mousemove", (e) => {
  if (toolPreview) {
    toolPreviewCommand = makeToolPreview(
      e.offsetX,
      e.offsetY,
      currentMarkerTool,
    );
    canvas.style.cursor = "none";
    canvas.dispatchEvent(new Event("tool-moved"));
  }

  if (cursor.active && currentStroke) {
    currentStroke.drag(e.offsetX, e.offsetY);
    canvas.dispatchEvent(new Event("drawing-changed"));
  }
});

canvas.addEventListener("mouseup", () => {
  cursor.active = false;
  currentStroke = null;
  toolPreview = true;
});

// Redraw function
function redraw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (const stroke of strokes) {
    stroke.display(ctx);
  }
}

// Observer for redrawing
canvas.addEventListener("drawing-changed", () => {
  redraw();
});

// Observer for tool movement (preview)
canvas.addEventListener("tool-moved", () => {
  redraw();
  if (toolPreview && toolPreviewCommand) {
    toolPreviewCommand.display(ctx);
  }
});

document.body.append(document.createElement("br"));

// Clear button
const clearButton = document.createElement("button");
clearButton.textContent = "clear";
document.body.append(clearButton);

clearButton.addEventListener("click", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  strokes = [];
  redoStack = [];
});

// Undo button
const undoButton = document.createElement("button");
undoButton.textContent = "undo";
document.body.append(undoButton);

undoButton.addEventListener("click", () => {
  if (strokes.length > 0) {
    redoStack.push(strokes.pop()!);
    canvas.dispatchEvent(new Event("drawing-changed"));
  }
});

// Redo button
const redoButton = document.createElement("button");
redoButton.textContent = "redo";
document.body.append(redoButton);

redoButton.addEventListener("click", () => {
  if (redoStack.length > 0) {
    strokes.push(redoStack.pop()!);
    canvas.dispatchEvent(new Event("drawing-changed"));
  }
});

// Marker tools
document.body.append(document.createElement("br"));
const markerToolsLabel = document.createElement("div");
markerToolsLabel.textContent = "Marker tools:";
document.body.append(markerToolsLabel);

// Thin
const thinButton = document.createElement("button");
thinButton.textContent = "thin";
document.body.append(thinButton);

// Thick
const thickButton = document.createElement("button");
thickButton.textContent = "thick";
document.body.append(thickButton);

// Tool selection logic
let activeToolButton: HTMLButtonElement | null = thinButton;
thinButton.classList.add("selectedTool");

function setActiveTool(button: HTMLButtonElement, thickness: number) {
  currentMarkerTool = { thickness };
  if (activeToolButton) {
    activeToolButton.classList.remove("selectedTool");
  }
  button.classList.add("selectedTool");
  activeToolButton = button;
}

thinButton.addEventListener("click", () => setActiveTool(thinButton, 1));
thickButton.addEventListener("click", () => setActiveTool(thickButton, 5));

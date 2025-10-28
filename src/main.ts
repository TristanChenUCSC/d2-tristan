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

// Factory function to create a sticker preview
function makeStickerPreview(
  x: number,
  y: number,
  content: string,
): DisplayCommand {
  return {
    drag(_x: number, _y: number) {
      // No drag functionality for preview
    },
    display(ctx: CanvasRenderingContext2D) {
      ctx.font = "24px serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(content, x, y);
    },
  };
}

// Factory function to create a sticker
function makeSticker(
  initial_x: number,
  initial_y: number,
  content: string,
): DisplayCommand {
  let position = { x: initial_x, y: initial_y };
  return {
    drag(x: number, y: number) {
      position = { x, y };
    },
    display(ctx: CanvasRenderingContext2D) {
      ctx.font = "24px serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(content, position.x, position.y);
    },
  };
}

// State variables
let strokes: DisplayCommand[] = []; // All strokes represented as DisplayCommands
let currentStroke: DisplayCommand | null = null;
let redoStack: DisplayCommand[] = []; // Stack for redo functionality

let currentMarkerTool: MarkerType = { thickness: 1 }; // Default tool
let toolPreview: boolean = false;
let toolPreviewCommand: DisplayCommand | null = null;

// mode for stickers
let stickerMode: boolean = false;

interface Sticker {
  content: string;
  name: string;
}

let currentSticker: Sticker | null = null;

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
  if (stickerMode) {
    toolPreviewCommand = makeStickerPreview(
      e.offsetX,
      e.offsetY,
      currentSticker!.content,
    );
  } else {
    toolPreviewCommand = makeToolPreview(
      e.offsetX,
      e.offsetY,
      currentMarkerTool,
    );
  }
  canvas.dispatchEvent(new Event("tool-moved"));
});

canvas.addEventListener("mousedown", (e) => {
  cursor.active = true;
  toolPreview = false;
  if (stickerMode) {
    currentStroke = makeSticker(e.offsetX, e.offsetY, currentSticker!.content);
  } else {
    currentStroke = makeMarkerLine(e.offsetX, e.offsetY, currentMarkerTool);
  }
  strokes.push(currentStroke);
});

canvas.addEventListener("mousemove", (e) => {
  if (toolPreview) {
    if (stickerMode) {
      toolPreviewCommand = makeStickerPreview(
        e.offsetX,
        e.offsetY,
        currentSticker!.content,
      );
    } else {
      toolPreviewCommand = makeToolPreview(
        e.offsetX,
        e.offsetY,
        currentMarkerTool,
      );
    }
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

// Export button
const exportButton = document.createElement("button");
exportButton.textContent = "export";
document.body.append(exportButton);
exportButton.addEventListener("click", () => {
  const newCanvas = document.createElement("canvas");
  newCanvas.width = 1024;
  newCanvas.height = 1024;

  const newCtx = newCanvas.getContext("2d")!;
  newCtx.scale(4, 4); // Scale up for higher resolution

  newCtx.fillStyle = "white";
  newCtx.fillRect(0, 0, newCanvas.width, newCanvas.height);
  for (const stroke of strokes) {
    stroke.display(newCtx);
  }

  const anchor = document.createElement("a");
  anchor.href = newCanvas.toDataURL("image/png");
  anchor.download = "sketchpad.png";
  anchor.click();
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
  stickerMode = false;
  currentMarkerTool = { thickness };
  if (activeToolButton) {
    activeToolButton.classList.remove("selectedTool");
  }
  button.classList.add("selectedTool");
  activeToolButton = button;
}

thinButton.addEventListener("click", () => setActiveTool(thinButton, 1));
thickButton.addEventListener("click", () => setActiveTool(thickButton, 5));

// Emoji Stickers
const stickers: Sticker[] = [
  { content: "💀", name: "skull" },
  { content: "🥀", name: "rose" },
  { content: "💔", name: "heartbreak" },
];

document.body.append(document.createElement("br"));
const stickersLabel = document.createElement("div");
stickersLabel.textContent = "Stickers:";
document.body.append(stickersLabel);

// Make a button for a sticker
function createStickerButton(sticker: Sticker) {
  const button = document.createElement("button");
  button.textContent = sticker.content;
  document.body.append(button);

  button.addEventListener("click", () => {
    currentSticker = sticker;
    stickerMode = true;
    canvas.dispatchEvent(new Event("tool-moved"));
    if (activeToolButton) {
      activeToolButton.classList.remove("selectedTool");
    }
    button.classList.add("selectedTool");
    activeToolButton = button;
  });
}

// Sticker buttons
for (const sticker of stickers) {
  createStickerButton(sticker);
}

// Custom Stickers
document.body.append(document.createElement("br"));
const customStickerLabel = document.createElement("div");
customStickerLabel.textContent = "Add Custom Stickers:";
document.body.append(customStickerLabel);

const addStickerButton = document.createElement("button");
addStickerButton.textContent = "Add Sticker";
document.body.append(addStickerButton);

addStickerButton.addEventListener("click", () => {
  const text = prompt("Custom sticker text", "🧽");
  const customSticker: Sticker = { content: text || "🧽", name: "custom" };
  stickers.push(customSticker);
  createStickerButton(customSticker);
});

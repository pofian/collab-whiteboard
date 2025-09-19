import { Point, Stroke } from "@/components/board/drawing-board-logic";

/**
 * Draw a single point with optional interpolation from a previous point
*/
function drawPoint(
  ctx: CanvasRenderingContext2D,
  p: Point,
  size: number,
  prev: Point | null,
) {
  const canvasHeight = ctx.canvas.height;
  const canvasWidth = ctx.canvas.width;

  const px = p.x * canvasWidth;
  const py = p.y * canvasHeight;

  ctx.beginPath();
  ctx.arc(px, py, size / 2, 0, Math.PI * 2);
  ctx.fill();

  if (!prev) return;

  const prevX = prev.x * canvasWidth;
  const prevY = prev.y * canvasHeight;
  const dx = px - prevX;
  const dy = py - prevY;
  const distance = Math.hypot(dx, dy);
  const step = 0.2 * size / distance;

  for (let t = 0; t < 1; t += step) {
    const x = prevX + dx * t;
    const y = prevY + dy * t;
    ctx.beginPath();
    ctx.arc(x, y, size / 2, 0, Math.PI * 2);
    ctx.fill();
  }
}


/**
 * Draw an entire stroke on the canvas
 */
export function drawStroke(ctx: CanvasRenderingContext2D, stroke: Stroke) {
  ctx.fillStyle = stroke.color;
  if (stroke.points.length === 0) return;

  drawPoint(ctx, stroke.points[0], stroke.size, null);
  for (let i = 1; i < stroke.points.length; i++) {
    drawPoint(ctx, stroke.points[i], stroke.size, stroke.points[i - 1]);
  }
}


/**
 * Draw only the last point of a stroke
 */
export function drawLastPoint(ctx: CanvasRenderingContext2D, stroke: Stroke) {
  const len = stroke.points.length;
  if (len === 0) return;
  const p = stroke.points[len - 1];
  const prev = len > 1 ? stroke.points[len - 2] : null;
  drawPoint(ctx, p, stroke.size, prev);
}


/**
 * Clear and redraw all strokes
 */
export function redrawAll(ctx: CanvasRenderingContext2D, strokes: Stroke[], background: string) {
  drawBackground(ctx, background);
  strokes.forEach(stroke => drawStroke(ctx, stroke));
}


/**
 * Draw the specified background pattern 
 */
const drawBackground = (ctx: CanvasRenderingContext2D, background: string) => {
  const canvas = ctx.canvas;
  const canvasWidth = canvas.width;
  const canvasHeight = canvas.height;

  if (background === "white") {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    return;
  }

  if (background === "black") {
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    return;
  }

  // --- Fixed number of tiles ---
  const tilesX = 20; // number of tiles horizontally
  const tilesY = 15; // number of tiles vertically
  const ratioMultiplier = 9 / 16;

  // Tile size scales with canvas, ratio preserved
  const tileWidth = (canvasWidth / tilesX) * ratioMultiplier;
  const tileHeight = canvasHeight / tilesY;

  // Helper: create a pattern
  const createPatternCanvas = (
    drawTile: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
    w: number,
    h: number
  ) => {
    const tile = document.createElement("canvas");
    tile.width = Math.max(1, w);
    tile.height = Math.max(1, h);
    const tctx = tile.getContext("2d")!;
    drawTile(tctx, w, h);
    return ctx.createPattern(tile, "repeat")!;
  };

  // Symmetric overshoot fill
  const fillWithPattern = (pattern: CanvasPattern) => {
    ctx.fillStyle = pattern;
    ctx.fillRect(-tileWidth, -tileHeight, canvasWidth + 2 * tileWidth, canvasHeight + 2 * tileHeight);
  };

  if (background === "checkers") {
    const pattern = createPatternCanvas((tctx, w, h) => {
      tctx.fillStyle = "#ccc";
      tctx.fillRect(0, 0, w, h);
      tctx.fillStyle = "#fff";
      tctx.fillRect(0, 0, w / 2, h / 2);
      tctx.fillRect(w / 2, h / 2, w / 2, h / 2);
    }, tileWidth, tileHeight);

    fillWithPattern(pattern);
  }

  if (background === "grid") {
    ctx.fillStyle = "#fff"; // base
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    const pattern = createPatternCanvas((tctx, w, h) => {
      tctx.strokeStyle = "#ccc";
      tctx.lineWidth = 1;
      tctx.beginPath();
      tctx.moveTo(0, 0);
      tctx.lineTo(w, 0);
      tctx.moveTo(0, 0);
      tctx.lineTo(0, h);
      tctx.stroke();
    }, tileWidth, tileHeight);

    fillWithPattern(pattern);
  }
};

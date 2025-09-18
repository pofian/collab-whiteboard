"use client";

import { useRef, useState, useEffect } from "react";
import { useWebSocket } from "@/context/websocket-context";

export type Point = {
    x: number;
    y: number
};

export type Stroke = {
  id: string;
  points: Point[];
  color: string;
  size: number;
  userId: string;
  strokeId: string;
};

export function useDrawingBoard() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

  const [penColor, setPenColor] = useState("#000000");
  const [penSize, setPenSize] = useState(5);

  const [userId] = useState(() => crypto.randomUUID());

  const drawingRef = useRef(false);
  const strokesRef = useRef<Stroke[]>([]);
  const currentStrokeRef = useRef<Stroke>({ points: [], color: penColor, size: penSize, userId, strokeId: crypto.randomUUID(), id: userId });

  const myUndoStack = useRef<Stroke[]>([]);
  const myRedoStack = useRef<Stroke[]>([]);

  const { socket, sendMessage: sendWSMessage } = useWebSocket();

  // Canvas setup & socket messages
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctxRef.current = ctx;

    const resizeCanvas = () => {
      const { width, height } = canvas.getBoundingClientRect();
      canvas.width = width;
      canvas.height = height;
      redrawAll();
    };

    resizeCanvas();
    const observer = new ResizeObserver(resizeCanvas);
    observer.observe(canvas.parentElement!);
    window.addEventListener("resize", resizeCanvas);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key.toLowerCase() === "z") {
        e.preventDefault();
        e.shiftKey ? redo() : undo();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    const handleMessage = (event: MessageEvent) => {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case "init":
          strokesRef.current = data.strokes;
          redrawAll();
          break;
        case "drawing":
          strokesRef.current.push(data.stroke);
          drawStroke(ctxRef.current!, data.stroke);
          break;
        case "undo":
          strokesRef.current = strokesRef.current.filter(s => s.strokeId !== data.strokeId);
          redrawAll();
          break;
        case "redo":
          if (data.stroke) {
            strokesRef.current.push(data.stroke);
            redrawAll();
          }
          break;
        case "clear":
          strokesRef.current = strokesRef.current.filter(s => s.userId !== data.userId);
          redrawAll();
          break;
      }
    };

    socket?.addEventListener("message", handleMessage);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("keydown", handleKeyDown);
      socket?.removeEventListener("message", handleMessage);
    };
  }, [socket]);

  // ===== Utility & Drawing functions =====
  const getCoords = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    let clientX: number, clientY: number;
    if ("touches" in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const rect = canvas.getBoundingClientRect();
    return { x: (clientX - rect.left) / canvas.width, y: (clientY - rect.top) / canvas.height };
  };

  const drawPoint = (ctx: CanvasRenderingContext2D, strokeSize: number, p: Point, prev: Point | null) => {
    const canvas = canvasRef.current!;
    const px = p.x * canvas.width;
    const py = p.y * canvas.height;

    ctx.beginPath();
    ctx.arc(px, py, strokeSize / 2, 0, Math.PI * 2);
    ctx.fill();

    if (!prev) return;
    const prevX = prev.x * canvas.width;
    const prevY = prev.y * canvas.height;
    const dx = px - prevX;
    const dy = py - prevY;
    const distance = Math.hypot(dx, dy);
    const step = 0.2 * strokeSize / distance;

    for (let t = 0; t < 1; t += step) {
      const x = prevX + dx * t;
      const y = prevY + dy * t;
      ctx.beginPath();
      ctx.arc(x, y, strokeSize / 2, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const drawStroke = (ctx: CanvasRenderingContext2D, stroke: Stroke) => {
    ctx.fillStyle = stroke.color;
    if (stroke.points.length === 0) return;
    drawPoint(ctx, stroke.size, stroke.points[0], null);
    for (let i = 1; i < stroke.points.length; i++) {
      drawPoint(ctx, stroke.size, stroke.points[i], stroke.points[i - 1]);
    }
  };

  const drawLastPoint = (ctx: CanvasRenderingContext2D, stroke: Stroke) => {
    const len = stroke.points.length;
    if (len === 0) return;
    const p = stroke.points[len - 1];
    const prev = len > 1 ? stroke.points[len - 2] : null;
    drawPoint(ctx, stroke.size, p, prev);
  };

  const redrawAll = () => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    strokesRef.current.forEach(stroke => drawStroke(ctx, stroke));
  };

  // ===== Event handlers =====
  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const coords = getCoords(e);
    if (!ctxRef.current || !coords) return;

    drawingRef.current = true;
    ctxRef.current.fillStyle = penColor;
    currentStrokeRef.current = { points: [], color: penColor, size: penSize, userId, strokeId: crypto.randomUUID(), id: userId };
    draw(e);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawingRef.current || !ctxRef.current) return;
    const coords = getCoords(e);
    if (!coords) return;

    const stroke = currentStrokeRef.current;
    stroke.points.push(coords);
    drawLastPoint(ctxRef.current, stroke);
  };

  const stopDrawing = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;

    const stroke = currentStrokeRef.current;
    if (stroke.points.length === 0) return;

    strokesRef.current.push(stroke);
    myUndoStack.current.push(stroke);
    myRedoStack.current = [];

    currentStrokeRef.current = { points: [], color: penColor, size: penSize, userId, strokeId: crypto.randomUUID(), id: userId };

    sendWSMessage(JSON.stringify({ type: "drawing", stroke }));
  };

  const undo = () => {
    if (myUndoStack.current.length === 0) return;
    const stroke = myUndoStack.current.pop()!;
    strokesRef.current = strokesRef.current.filter(s => s.strokeId !== stroke.strokeId);
    myRedoStack.current.push(stroke);
    redrawAll();
    sendWSMessage(JSON.stringify({ type: "undo", strokeId: stroke.strokeId }));
  };

  const redo = () => {
    if (myRedoStack.current.length === 0) return;
    const stroke = myRedoStack.current.pop()!;
    strokesRef.current.push(stroke);
    myUndoStack.current.push(stroke);
    redrawAll();
    sendWSMessage(JSON.stringify({ type: "redo", strokeId: stroke.strokeId }));
  };

  const clearAll = () => {
    strokesRef.current = [];
    myUndoStack.current = [];
    myRedoStack.current = [];
    redrawAll();
    sendWSMessage(JSON.stringify({ type: "clear", userId }));
  };

  return {
    canvasRef,
    penColor,
    setPenColor,
    penSize,
    setPenSize,
    startDrawing,
    draw,
    stopDrawing,
    undo,
    redo,
    clearAll,
  };
}

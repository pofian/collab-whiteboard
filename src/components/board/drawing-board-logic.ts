"use client";

import { useRef, useState, useEffect } from "react";
import { useWebSocket } from "@/context/websocket-context";
import { drawStroke, drawLastPoint, redrawAll } from "@/components/board/canvas-utils";

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

  const [background, setBackground] = useState("grid");
  const backgroundRef = useRef(background);

  const [penColor, setPenColor] = useState("#000000");
  const [penSize, setPenSize] = useState(5);

  const rand = () => Math.random().toString(36).substring(2, 16);

  const [userId] = useState(rand);

  const drawingRef = useRef(false);
  const strokesRef = useRef<Stroke[]>([]);
  const currentStrokeRef = useRef<Stroke>({ points: [], color: penColor, size: penSize, userId, strokeId: rand(), id: userId });

  const myUndoStack = useRef<Stroke[]>([]);
  const myRedoStack = useRef<Stroke[]>([]);

  const { socket, sendMessage: sendWSMessage } = useWebSocket();

  const [onlineUsersCount, setOnlineUsersCount] = useState(1);
  const [isConnected, setIsConnected] = useState(false);

  // ---- Canvas setup & resize ----
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
      redrawAll(ctx, strokesRef.current, backgroundRef.current);
    };

    resizeCanvas();
    const observer = new ResizeObserver(resizeCanvas);
    observer.observe(canvas.parentElement!);
    window.addEventListener("resize", resizeCanvas);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", resizeCanvas);
    };
  }, []);


  // ---- Trigger redraw on background change ----
  useEffect(() => {
    backgroundRef.current = background
    redrawAll(ctxRef.current!, strokesRef.current, background);
  }, [background]);


  // ---- Undo / Redo ----
  const undo = () => {
    if (myUndoStack.current.length === 0) return;
    const stroke = myUndoStack.current.pop()!;
    strokesRef.current = strokesRef.current.filter(s => s.strokeId !== stroke.strokeId);
    myRedoStack.current.push(stroke);
    redrawAll(ctxRef.current!, strokesRef.current, backgroundRef.current);
    sendWSMessage(JSON.stringify({ type: "undo", strokeId: stroke.strokeId }));
  };

  const redo = () => {
    if (myRedoStack.current.length === 0) return;
    const stroke = myRedoStack.current.pop()!;
    strokesRef.current.push(stroke);
    myUndoStack.current.push(stroke);
    redrawAll(ctxRef.current!, strokesRef.current, backgroundRef.current);
    sendWSMessage(JSON.stringify({ type: "redo", strokeId: stroke.strokeId }));
  };


  // ---- Keyboard shortcuts: undo/redo/save ----
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Undo / Redo
      if (e.ctrlKey && e.key.toLowerCase() === "z") {
        e.preventDefault(); // Prevent browser undo of inputs
        e.shiftKey ? redo() : undo();
      }

      // Save
      if (e.ctrlKey && e.key.toLowerCase() === "s") {
        e.preventDefault(); // Prevent browser save dialog
        saveAsJPEG();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo]);

  // ---- Track socket connection ----
  useEffect(() => {
    if (!socket) {
      setIsConnected(false);
      return;
    }
    setIsConnected(true);

    const handleClose = () => setIsConnected(false);
    const handleOpen = () => setIsConnected(true);

    socket.addEventListener("close", handleClose);
    socket.addEventListener("open", handleOpen);

    return () => {
      socket.removeEventListener("close", handleClose);
      socket.removeEventListener("open", handleOpen);
    };
  }, [socket]);

  // ---- WebSocket messages ----
  useEffect(() => {
    if (!socket) return;

    const handleMessage = (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      console.log("📩 WS Message:", data);

      switch (data.type) {
        case "usersCount":
          setOnlineUsersCount(data.count);
          console.log(`👥 Users online: ${data.count}`);
          break;
        case "init":
          strokesRef.current = data.strokes;
          redrawAll(ctxRef.current!, strokesRef.current, backgroundRef.current);
          break;
        case "drawing":
          strokesRef.current.push(data.stroke);
          drawStroke(ctxRef.current!, data.stroke);
          currentStrokeRef.current = data.stroke;
          break;
        case "undo":
          strokesRef.current = strokesRef.current.filter(s => s.strokeId !== data.strokeId);
          redrawAll(ctxRef.current!, strokesRef.current, backgroundRef.current);
          break;
        case "redo":
          if (data.stroke) {
            strokesRef.current.push(data.stroke);
            redrawAll(ctxRef.current!, strokesRef.current, backgroundRef.current);
          }
          break;
      }
    };

    socket.addEventListener("message", handleMessage);
    return () => socket.removeEventListener("message", handleMessage);
  }, [socket]);


  // ---- Utility function to get coordinates ----
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


  // ---- Event handlers ----
  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const coords = getCoords(e);
    if (!ctxRef.current || !coords) return;

    drawingRef.current = true;
    ctxRef.current.fillStyle = penColor;
    currentStrokeRef.current = { points: [], color: penColor, size: penSize, userId, strokeId: rand(), id: userId };
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

    currentStrokeRef.current = { points: [], color: penColor, size: penSize, userId, strokeId: rand(), id: userId };

    sendWSMessage(JSON.stringify({ type: "drawing", stroke }));
  };


  // ---- Save the current image ----
  const saveAsJPEG = () => {
    if (!strokesRef.current.length) return;
  
    const width = 1920; // desired image width
    const height = 1080; // desired image height
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext("2d")!;
  
    redrawAll(tempCtx, strokesRef.current, backgroundRef.current);
  
    const link = document.createElement("a");
    link.download = "drawing.jpg";
    link.href = tempCanvas.toDataURL("image/jpeg", 1.0);
    link.click();
  };  

  return {
    canvasRef,
    background,
    setBackground,
    penColor,
    setPenColor,
    penSize,
    setPenSize,
    startDrawing,
    draw,
    stopDrawing,
    undo,
    redo,
    saveAsJPEG,
    isConnected,
    onlineUsersCount
  };
}

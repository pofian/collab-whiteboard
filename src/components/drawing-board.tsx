"use client";

import { useRef, useState, useEffect } from "react";

type Point = { x: number; y: number }; // normalized coords (0–1)
type Stroke = Point[];

export default function DrawingBoard() {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

    const [drawing, setDrawing] = useState(false);
    const strokesRef = useRef<Stroke[]>([]);
    const currentStrokeRef = useRef<Stroke>([]);

    // Setup canvas + resize handling
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext("2d");
        if (!context) return;

        context.lineCap = "round";
        context.lineJoin = "round";
        context.lineWidth = 3;
        context.strokeStyle = "#000";
        ctxRef.current = context;

        const resizeCanvas = () => {
            if (!canvas) return;

            // Resize to container size
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;

            // Redraw after clearing
            redrawAll();
        };

        resizeCanvas();
        const observer = new ResizeObserver(resizeCanvas);
        observer.observe(canvas.parentElement!);

        return () => observer.disconnect();
    }, []);

    const getCoords = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return null;
        const rect = canvas.getBoundingClientRect();

        let clientX: number, clientY: number;
        if ("touches" in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }

        return {
            x: (clientX - rect.left) / rect.width,
            y: (clientY - rect.top) / rect.height,
        };
    };

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        const coords = getCoords(e);
        if (!ctxRef.current || !coords) return;

        setDrawing(true);
        currentStrokeRef.current = [coords];
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!drawing || !ctxRef.current) return;
        const coords = getCoords(e);
        if (!coords) return;

        const stroke = currentStrokeRef.current;
        stroke.push(coords);

        const canvas = canvasRef.current!;
        const ctx = ctxRef.current!;

        const prev = stroke[stroke.length - 2];
        if (prev) {
            ctx.beginPath();
            ctx.moveTo(prev.x * canvas.width, prev.y * canvas.height);
            ctx.lineTo(coords.x * canvas.width, coords.y * canvas.height);
            ctx.stroke();
        }
    };

    const stopDrawing = () => {
        if (!drawing) return;
        setDrawing(false);

        if (currentStrokeRef.current.length > 0) {
            strokesRef.current.push(currentStrokeRef.current);
            currentStrokeRef.current = [];
        }
    };

    const redrawAll = () => {
        const canvas = canvasRef.current;
        const ctx = ctxRef.current;
        if (!canvas || !ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        strokesRef.current.forEach((stroke) => {
            if (stroke.length < 2) return;
            ctx.beginPath();
            for (let i = 1; i < stroke.length; i++) {
                const prev = stroke[i - 1];
                const curr = stroke[i];
                ctx.moveTo(prev.x * canvas.width, prev.y * canvas.height);
                ctx.lineTo(curr.x * canvas.width, curr.y * canvas.height);
            }
            ctx.stroke();
        });
    };

    const clearCanvas = () => {
        strokesRef.current = [];
        currentStrokeRef.current = [];
        const canvas = canvasRef.current;
        const ctx = ctxRef.current;
        if (ctx && canvas) ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    return (
        <div className="flex flex-col h-screen p-6 bg-white">
            {/* Header */}
            <h1 className="text-3xl font-bold mb-4 text-black">🎨 Drawing Board</h1>

            {/* Drawing box fills remaining space */}
            <div className="flex-1 border-2 border-gray-300 rounded-lg relative">
                <canvas
                    ref={canvasRef}
                    className="w-full h-full"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                />
                <button
                    onClick={clearCanvas}
                    className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded shadow z-10"
                >
                    Clear
                </button>
            </div>
        </div>
    );
}

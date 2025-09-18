"use client";

import { useWebSocket } from "@/context/websocket-context";
import { useRef, useState, useEffect } from "react";
import { AiOutlineRedo, AiOutlineUndo } from "react-icons/ai";

type Point = { x: number; y: number };
type Stroke = {
	id: string;
	points: Point[];
	color: string;
	size: number
	userId: string;
	strokeId: string;
};

export default function DrawingBoard() {
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

	const [penColor, setPenColor] = useState("#000000");
	const [penSize, setPenSize] = useState(5);
	const [showPenDropdown, setShowPenDropdown] = useState(false);

	const [userId] = useState(() => crypto.randomUUID()); // each client gets a persistent unique ID

	const drawingRef = useRef(false);
	const strokesRef = useRef<Stroke[]>([]);
	const currentStrokeRef = useRef<Stroke>({ points: [], color: penColor, size: penSize, userId: userId, strokeId: crypto.randomUUID(), id: userId });

	// Local undo/redo stacks for this user only
	const myUndoStack = useRef<Stroke[]>([]);
	const myRedoStack = useRef<Stroke[]>([]);

	const { socket, sendMessage: sendWSMessage } = useWebSocket();

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;
		ctx.lineCap = "round";
		ctx.lineJoin = "round";
		ctxRef.current = ctx;

		const resizeCanvas = () => {
			if (!canvas) return;
			const { width, height } = canvas.getBoundingClientRect();
			canvas.width = width;
			canvas.height = height;
			redrawAll();
		};

		resizeCanvas();

		const observer = new ResizeObserver(resizeCanvas);
		observer.observe(canvas.parentElement!);
		window.addEventListener("resize", resizeCanvas);

		// Keyboard undo/redo
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.ctrlKey && e.key.toLowerCase() === "z") {
				e.preventDefault();
				e.shiftKey ? redo() : undo();
			}
		};
		window.addEventListener("keydown", handleKeyDown);

		const handleMessage = (event: MessageEvent) => {
			const data = JSON.parse(event.data);
		
			if (data.type === "drawing") {
				strokesRef.current.push(data.stroke);
				drawStroke(ctxRef.current!, data.stroke);
		
			} else if (data.type === "undo") {
				// Remove the stroke with matching strokeId
				strokesRef.current = strokesRef.current.filter(s => s.strokeId !== data.strokeId);
				redrawAll();
		
			} else if (data.type === "redo") {
				// Add back the stroke
				strokesRef.current.push(data.stroke);
				redrawAll();
		
			} else if (data.type === "clear") {
				strokesRef.current = [];
				redrawAll();
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

	// Utility to get normalized coordinates
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

	// Draw a point with interpolation
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

	const drawLastPoint = (ctx: CanvasRenderingContext2D, stroke: Stroke) => {
		const len = stroke.points.length;
		if (len === 0) return;
		const p = stroke.points[len - 1];
		const prev = len > 1 ? stroke.points[len - 2] : null;
		drawPoint(ctx, stroke.size, p, prev);
	};

	const drawStroke = (ctx: CanvasRenderingContext2D, stroke: Stroke) => {
		ctx.fillStyle = stroke.color;
		if (stroke.points.length === 0) return;
		drawPoint(ctx, stroke.size, stroke.points[0], null);
		for (let i = 1; i < stroke.points.length; i++) {
			drawPoint(ctx, stroke.size, stroke.points[i], stroke.points[i - 1]);
		}
	};

	const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
		const coords = getCoords(e);
		if (!ctxRef.current || !coords) return;

		drawingRef.current = true;
		ctxRef.current.fillStyle = penColor;
		currentStrokeRef.current = { points: [], color: penColor, size: penSize, userId: userId, strokeId: crypto.randomUUID(), id: userId };
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

		strokesRef.current.push(stroke);       // Add globally
		myUndoStack.current.push(stroke);      // Add to local undo
		myRedoStack.current = [];              // Clear redo

		currentStrokeRef.current = { points: [], color: penColor, size: penSize, userId: userId, strokeId: crypto.randomUUID(), id: userId };

		sendWSMessage(JSON.stringify({ type: "drawing", stroke }));
	};

	const redrawAll = () => {
		const canvas = canvasRef.current;
		const ctx = ctxRef.current;
		if (!canvas || !ctx) return;

		ctx.clearRect(0, 0, canvas.width, canvas.height);
		strokesRef.current.forEach((stroke) => drawStroke(ctx, stroke));
	};

	// Undo/Redo
	const undo = () => {
		if (myUndoStack.current.length === 0) return;

		const lastStroke = myUndoStack.current.pop()!;
		// Remove only this stroke from the global strokes list
		strokesRef.current = strokesRef.current.filter(s => s.strokeId !== lastStroke.strokeId);
		// Add to redo stack
		myRedoStack.current.push(lastStroke);

		redrawAll();
		sendWSMessage(JSON.stringify({ type: "undo", strokeId: lastStroke.strokeId }));
	};

	const redo = () => {
		if (myRedoStack.current.length === 0) return;

		const stroke = myRedoStack.current.pop()!;
		// Add back to global strokes list
		strokesRef.current.push(stroke);
		// Add back to undo stack
		myUndoStack.current.push(stroke);

		redrawAll();
		sendWSMessage(JSON.stringify({ type: "redo", strokeId: stroke.strokeId, stroke }));
	};


	return (
		<div className="flex flex-col h-full pl-10 px-6 pt-4 pb-4 box-border min-h-0">
			{/* Header + Buttons */}
			<div className="flex items-center justify-between mb-2">
				<h1 className="text-3xl font-bold text-black">🎨 Drawing Board</h1>

				<div className="flex items-center gap-2">
					<div className="flex items-center gap-2">
						<button onClick={undo} className="relative group bg-gray-300 text-black px-4 py-2 rounded shadow flex items-center justify-center">
							<AiOutlineUndo size={20} />
							<span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-black text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Undo (Ctrl + Z)</span>
						</button>

						<button onClick={redo} className="relative group bg-gray-300 text-black px-4 py-2 rounded shadow flex items-center justify-center">
							<AiOutlineRedo size={20} />
							<span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-black text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Redo (Ctrl + Shift + Z)</span>
						</button>
					</div>

					<div className="relative">
						<button className="text-black px-3 py-1 border-2 border-gray-300 rounded shadow bg-white" onClick={() => setShowPenDropdown(!showPenDropdown)}>
							Size: {penSize}
						</button>
						{showPenDropdown && (
							<div className="absolute mt-1 border-2 border-gray-300 rounded shadow bg-white z-10">
								{[1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20].map(size => (
									<div key={size} onClick={() => { setPenSize(size); setShowPenDropdown(false); }} className={`px-4 py-1 cursor-pointer hover:bg-gray-100 ${penSize === size ? "bg-gray-200" : ""}`}>{size}</div>
								))}
							</div>
						)}
					</div>

					<input type="color" value={penColor} onChange={e => setPenColor(e.target.value)} className="w-10 h-10 p-0 border-2 border-gray-300 rounded shadow cursor-pointer" title="Select Pen Color" />

					<button onClick={() => { strokesRef.current = []; myUndoStack.current = []; myRedoStack.current = []; redrawAll(); sendWSMessage(JSON.stringify({ type: "clear" })); }} className="bg-red-500 text-white px-4 py-2 rounded shadow">
						Clear
					</button>
				</div>
			</div>

			{/* Canvas */}
			<div className="flex-1 border-2 border-gray-300 rounded-lg p-2 box-border min-h-0 overflow-hidden">
				<canvas ref={canvasRef} className="w-full h-full block"
					onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing}
					onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing}
				/>
			</div>
		</div>
	);
}

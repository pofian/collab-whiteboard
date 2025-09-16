"use client";

import { useRef, useState, useEffect } from "react";

type Point = { x: number; y: number }; // absolute pixels
type Stroke = { points: Point[]; color: string; size: number };

export default function DrawingBoard() {
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

	const [drawing, setDrawing] = useState(false);
	const [penColor, setPenColor] = useState("#000000");
	const [penSize, setPenSize] = useState(5);
	const [showPenDropdown, setShowPenDropdown] = useState(false);

	const strokesRef = useRef<Stroke[]>([]);
	const currentStrokeRef = useRef<Stroke>({ points: [], color: penColor, size: penSize });

	// Setup canvas + ResizeObserver
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
			
			const oldWidth = canvas.width;
			const oldHeight = canvas.height;
		
			canvas.width = canvas.offsetWidth;
			canvas.height = canvas.offsetHeight;
		
			const scaleX = canvas.width / oldWidth;
			const scaleY = canvas.height / oldHeight;
		
			// Scale all strokes
			strokesRef.current.forEach(stroke => {
				stroke.points.forEach(p => {
					p.x *= scaleX;
					p.y *= scaleY;
				});
			});
		
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

		return { x: clientX - rect.left, y: clientY - rect.top }; // absolute pixels
	};

	const drawPoint = (ctx: CanvasRenderingContext2D, strokeSize: number, p: Point, prev: Point | null) => {
		// Draw circle at point
		ctx.beginPath();
		ctx.arc(p.x, p.y, strokeSize / 2, 0, Math.PI * 2);
		ctx.fill();

		if (!prev) return;

		// Interpolate between points to fill gaps
		const dx = p.x - prev.x;
		const dy = p.y - prev.y;
		const distance = Math.hypot(dx, dy);
		const step = 0.2 * strokeSize / distance;
		for (let t = 0; t < 1; t += step) {
			const x = prev.x + dx * t;
			const y = prev.y + dy * t;
			ctx.beginPath();
			ctx.arc(x, y, strokeSize / 2, 0, Math.PI * 2);
			ctx.fill();
		}
	}

	const drawLastPoint = (ctx: CanvasRenderingContext2D, stroke: Stroke) => {
		const len = stroke.points.length;
		if (len === 0) return;

		const p = stroke.points[len - 1];
		const prev = len > 1 ? stroke.points[len - 2] : null;
		drawPoint(ctx, stroke.size, p, prev);		
	}

	// Draw a stroke with smooth interpolation
	const drawStroke = (ctx: CanvasRenderingContext2D, stroke: Stroke) => {
		drawPoint(ctx, stroke.size, stroke.points[0], null);
		for (let i = 1; i < stroke.points.length; i++) {
			const prev = stroke.points[i - 1];
			const p = stroke.points[i];
			drawPoint(ctx, stroke.size, p, prev);
		}
	};

	const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
		const coords = getCoords(e);
		if (!ctxRef.current || !coords) return;

		setDrawing(true);
		ctxRef.current.fillStyle = penColor;
		currentStrokeRef.current = { points: [coords], color: penColor, size: penSize };
		draw(e);
	};

	const draw = (e: React.MouseEvent | React.TouchEvent) => {
		if (!drawing || !ctxRef.current) return;
		const coords = getCoords(e);
		if (!coords) return;

		const stroke = currentStrokeRef.current;
		stroke.points.push(coords);

		// drawStroke(ctxRef.current, stroke);
		drawLastPoint(ctxRef.current, stroke);
	};

	const stopDrawing = () => {
		if (!drawing) return;
		setDrawing(false);

		if (currentStrokeRef.current.points.length > 0) {
			strokesRef.current.push(currentStrokeRef.current);
			currentStrokeRef.current = { points: [], color: penColor, size: penSize };
		}
	};

	const redrawAll = () => {
		const canvas = canvasRef.current;
		const ctx = ctxRef.current;
		if (!canvas || !ctx) return;

		ctx.clearRect(0, 0, canvas.width, canvas.height);
		strokesRef.current.forEach((stroke) => drawStroke(ctx, stroke));
	};

	const clearCanvas = () => {
		strokesRef.current = [];
		currentStrokeRef.current = { points: [], color: penColor, size: penSize };
		const canvas = canvasRef.current;
		const ctx = ctxRef.current;
		if (ctx && canvas) ctx.clearRect(0, 0, canvas.width, canvas.height);
	};

	return (
		<div className="flex flex-col h-screen p-6 bg-white">
			{/* Header + Buttons */}
			<div className="flex items-center justify-between mb-4">
				<h1 className="text-3xl font-bold text-black">🎨 Drawing Board</h1>
				<div className="flex items-center gap-2">

					{/* Pen size dropdown */}
					<div className="relative">
						<button
							className="px-3 py-1 border-2 border-gray-300 rounded shadow bg-white"
							onClick={() => setShowPenDropdown(!showPenDropdown)}
						>
							Size: {penSize}
						</button>
						{showPenDropdown && (
							<div className="absolute mt-1 border-2 border-gray-300 rounded shadow bg-white z-10">
								{[1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20].map((size) => (
									<div
										key={size}
										onClick={() => {
											setPenSize(size);
											setShowPenDropdown(false);
										}}
										className={`px-4 py-1 cursor-pointer hover:bg-gray-100 ${penSize === size ? "bg-gray-200 font-bold" : ""}`}
									>
										{size}
									</div>
								))}
							</div>
						)}
					</div>

					{/* Color picker */}
					<input
						type="color"
						value={penColor}
						onChange={(e) => setPenColor(e.target.value)}
						className="w-10 h-10 p-0 border-2 border-gray-300 rounded shadow cursor-pointer"
						title="Select Pen Color"
					/>

					{/* Clear button */}
					<button
						onClick={clearCanvas}
						className="bg-red-500 text-white px-4 py-2 rounded shadow"
					>
						Clear
					</button>
				</div>
			</div>

			{/* Drawing box */}
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
			</div>
		</div>
	);
}

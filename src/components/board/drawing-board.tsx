"use client";

import { AiOutlineRedo, AiOutlineUndo, AiOutlineDownload } from "react-icons/ai";
import { useDrawingBoard } from "@/components/board/drawing-board-logic";
import { useState } from "react";

export default function DrawingBoard() {
  const {
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
    saveAsJPEG
  } = useDrawingBoard();

  const penSizes = [1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 25, 30];
  const [showPenDropdown, setShowPenDropdown] = useState(false);
  const [showBackgroundDropdown, setShowBackgroundDropdown] = useState(false);

  return (
    <div className="flex flex-col h-full pl-10 px-6 pt-4 pb-4 box-border min-h-0">
      {/* Header + Buttons */}
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-3xl font-bold text-black">🎨 Drawing Board</h1>

        <div className="flex items-center gap-2">
          {/* Undo / Redo */}
          <div className="flex items-center gap-2">
            <button
              onClick={undo}
              className="relative group bg-gray-300 text-black px-4 py-2 rounded shadow flex items-center justify-center"
            >
              <AiOutlineUndo size={20} />
              <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-black text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                Undo (Ctrl + Z)
              </span>
            </button>

            <button
              onClick={redo}
              className="relative group bg-gray-300 text-black px-4 py-2 rounded shadow flex items-center justify-center"
            >
              <AiOutlineRedo size={20} />
              <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-black text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                Redo (Ctrl + Shift + Z)
              </span>
            </button>
          </div>

          {/* Pen Size */}
          <div className="relative">
            <button
              className="text-black px-3 py-1 border-2 border-gray-300 rounded shadow bg-white"
              onClick={() => setShowPenDropdown(!showPenDropdown)}
            >
              Size: {penSize}
            </button>

            {showPenDropdown && (
              <div className="absolute mt-1 border-2 border-gray-300 rounded shadow bg-white z-10">
                {penSizes.map((size) => (
                  <div
                    key={size}
                    onClick={() => { setPenSize(size); setShowPenDropdown(false); }}
                    className={`text-black px-4 py-1 cursor-pointer hover:bg-gray-100 ${penSize === size ? "bg-gray-200" : ""}`}
                  >
                    {size}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pen Color */}
          <input
            type="color"
            value={penColor}
            onChange={(e) => setPenColor(e.target.value)}
            onKeyDown={(e) => e.stopPropagation()} // prevents Ctrl+Z undoing color
            className="w-10 h-10 p-0 border-2 border-gray-300 rounded shadow cursor-pointer"
            title="Select Pen Color"
          />

          {/* Background Selector */}
          <div className="relative">
            <button
              className="text-black px-3 py-1 border-2 border-gray-300 rounded shadow bg-white"
              onClick={() => setShowBackgroundDropdown((prev) => !prev)}
            >
              Background: {background.charAt(0).toUpperCase() + background.slice(1)}
            </button>

            {showBackgroundDropdown && (
              <div className="absolute mt-1 border-2 border-gray-300 rounded shadow bg-white z-10">
                {["white", "black", "grid", "checkers"].map((bg) => (
                  <div
                    key={bg}
                    onClick={() => { setBackground(bg as any); setShowBackgroundDropdown(false); }}
                    className={`text-black px-4 py-1 cursor-pointer hover:bg-gray-100 ${background === bg ? "bg-gray-200" : ""
                      }`}
                  >
                    {bg.charAt(0).toUpperCase() + bg.slice(1)}
                  </div>
                ))}
              </div>
            )}
          </div>


          {/* Save as JPEG */}
          <button
            onClick={saveAsJPEG}
            className="relative group flex items-center gap-1 px-4 py-2 bg-gray-300 rounded shadow text-black"
          >
            <AiOutlineDownload size={18} />
            <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-black text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              Save as JPEG
            </span>
          </button>

        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 border-2 border-gray-300 rounded-lg box-border min-h-0 overflow-hidden">
        <canvas
          ref={canvasRef}
          className="w-full h-full block"
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

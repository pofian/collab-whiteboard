"use client";

import { AiOutlineRedo, AiOutlineUndo, AiOutlineDownload } from "react-icons/ai";
import { useDrawingBoard } from "@/components/board/drawing-board-logic";
import { useState } from "react";
import { BsCircleFill } from "react-icons/bs";

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
    saveAsJPEG,
    onlineUsersCount,
  } = useDrawingBoard();

  const penSizes = [1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 25, 30];
  const [showPenDropdown, setShowPenDropdown] = useState(false);
  const [showBackgroundDropdown, setShowBackgroundDropdown] = useState(false);

  const buttonHeight = "h-10"; // 40px vertical size

  return (
    <div className="flex flex-col h-full pl-10 pr-6 pt-4 pb-4 box-border min-h-0">
      {/* Header + Buttons */}
      <div className="flex items-center justify-between mb-2 min-w-0">

        {/* Online Users */}
        <h1 className="text-3xl font-bold text-black flex items-center min-w-0">
          <span className="hidden md:flex items-center gap-2 truncate">
            <BsCircleFill className="text-green-500 text-lg flex-shrink-0" />
            <span className="truncate">Online: {onlineUsersCount}</span>
          </span>

        </h1>

        {/* Toolbar */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Undo / Redo */}
          <div className="flex items-center gap-2">
            <button
              onClick={undo}
              className={`relative group flex items-center justify-center ${buttonHeight} bg-gray-300 text-black px-4 rounded shadow`}
            >
              <AiOutlineUndo size={20} />
              <span className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-black text-white text-xs rounded px-2 py-1 opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-[300ms] whitespace-nowrap">
                Undo (Ctrl + Z)
              </span>
            </button>

            <button
              onClick={redo}
              className={`relative group flex items-center justify-center ${buttonHeight} bg-gray-300 text-black px-4 rounded shadow`}
            >
              <AiOutlineRedo size={20} />
              <span className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-black text-white text-xs rounded px-2 py-1 opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-[300ms] whitespace-nowrap">
                Redo (Ctrl + Shift + Z)
              </span>
            </button>
          </div>

          {/* Pen Color */}
          <label
            style={{ backgroundColor: penColor }}
            className={`flex items-center justify-center ${buttonHeight} w-10 border-2 border-gray-300 rounded shadow cursor-pointer relative group`}
          >
            <input
              type="color"
              value={penColor}
              onChange={(e) => setPenColor(e.target.value)}
              onKeyDown={(e) => e.stopPropagation()}
              className="w-0 h-0 opacity-0"
            />
            <span className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-black text-white text-xs rounded px-2 py-1 opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-[300ms] whitespace-nowrap">
              Change Pen Color
            </span>
          </label>

          {/* Pen Size */}
          <div className="relative group">
            <button
              className={`flex items-center justify-center ${buttonHeight} text-black px-3 border-2 border-gray-300 rounded shadow whitespace-nowrap`}
              onClick={() => setShowPenDropdown(!showPenDropdown)}
            >
              Size: {penSize}
            </button>
            <span className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-black text-white text-xs rounded px-2 py-1 opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-[300ms] whitespace-nowrap">
              Select Pen Size
            </span>
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

          {/* Background */}
          <div className="relative group">
            <button
              className={`flex items-center justify-center ${buttonHeight} text-black px-3 border-2 border-gray-300 rounded shadow whitespace-nowrap`}
              onClick={() => setShowBackgroundDropdown((prev) => !prev)}
            >
              Background: {background.charAt(0).toUpperCase() + background.slice(1)}
            </button>
            {showBackgroundDropdown && (
              <div className="absolute mt-1 border-2 border-gray-300 rounded shadow bg-white z-10">
                {["white", "black", "grid", "checkerboard"].map((bg) => (
                  <div
                    key={bg}
                    onClick={() => { setBackground(bg as any); setShowBackgroundDropdown(false); }}
                    className={`text-black px-4 py-1 cursor-pointer hover:bg-gray-100 ${background === bg ? "bg-gray-200" : ""}`}
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
            className={`relative group flex items-center justify-center ${buttonHeight} px-4 bg-gray-300 rounded shadow text-black`}
          >
            <AiOutlineDownload size={18} />
            <span className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-black text-white text-xs rounded px-2 py-1 opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-[300ms] whitespace-nowrap">
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
          onMouseLeave={(e) => { draw(e); stopDrawing(); }}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
      </div>
    </div>
  );
}

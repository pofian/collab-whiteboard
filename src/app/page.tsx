"use client";

import { useState } from "react";
import PublicChat from "@/components/chat/public-chat";
import DrawingBoard from "@/components/board/drawing-board";
import { WebSocketProvider } from "@/context/websocket-context";

export default function Page() {
  const [open, setOpen] = useState(false);

  return (
    <WebSocketProvider>
      <div className="w-screen h-screen overflow-hidden flex bg-white relative">
        {/* Collapsible Chat Panel */}
        <div
          className={`bg-white border-r shadow-lg h-full flex flex-col relative transition-[width] duration-150 ease-in-out overflow-hidden`}
          style={{ width: open ? "20rem" : "0rem" }}
        >
          <div className={`flex-1 transition-opacity duration-150 ease-in-out ${open ? "opacity-100 p-4" : "opacity-0 p-0"}`}>
            <PublicChat />
          </div>
        </div>

        {/* Toggle Button outside panel */}
        <button
          onClick={() => setOpen(!open)}
          className="absolute top-4 left-0 w-6 h-12 bg-blue-500 text-white rounded-r flex items-center justify-center shadow z-20"
          title={open ? "Hide Chat" : "Show Chat"}
        >
          {open ? "❮" : "❯"}
        </button>

        {/* DrawingBoard fills remaining space */}
        <div className="flex-1 relative min-h-0">
          <DrawingBoard />
        </div>
      </div>
    </WebSocketProvider>
  );
}

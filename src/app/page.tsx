"use client";

import { useState } from "react";
import PublicChat from "@/components/chat/public-chat";
import DrawingBoard from "@/components/board/drawing-board";
import { WebSocketProvider } from "@/context/websocket-context";
import { AiOutlineLeft, AiOutlineRight } from "react-icons/ai";

export default function Page() {
  const [open, setOpen] = useState(false);

  return (
    <WebSocketProvider>
      <div className="w-screen h-screen overflow-hidden flex bg-white relative">

        {/* Collapsible Chat Panel */}
        <div className="flex h-full pt-4 relative"> {/* Added top padding */}
          {/* Chat panel */}
          <div
            className={`bg-white border-r shadow-lg h-full flex flex-col transition-[width] duration-200 ease-in-out overflow-hidden`}
            style={{ width: open ? "20rem" : "0rem" }}
          >
            <div className={`flex-1 transition-opacity duration-200 ease-in-out ${open ? "opacity-100 p-4" : "opacity-0 p-0"}`}>
              <PublicChat />
            </div>
          </div>

          {/* Toggle button docked to panel edge */}
          <button
            onClick={() => setOpen(!open)}
            className="h-12 w-6 bg-blue-500 text-white rounded-r flex items-center justify-center shadow relative z-50 group"
          >
            {open ? <AiOutlineLeft size={20} /> : <AiOutlineRight size={20} />}
          </button>
        </div>

        {/* DrawingBoard fills remaining space */}
        <div className="flex-1 relative min-h-0">
          <DrawingBoard />
        </div>
      </div>
    </WebSocketProvider>
  );
}

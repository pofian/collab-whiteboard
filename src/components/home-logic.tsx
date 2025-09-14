"use client";

import { useEffect, useRef, useState } from "react";
import MessageList from "./message-list";
import MessageInput from "./message-input";

export type Message = {
  id: number;
  text: string;
  timestamp: string;
};

export default function HomeLogic() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const socketRef = useRef<WebSocket | null>(null);
  const idRef = useRef(0);

  useEffect(() => {
    const socket = new WebSocket("ws://localhost:8080");
    socketRef.current = socket;

    socket.onopen = () => console.log("✅ Connected to WebSocket server");

    socket.onmessage = (event) => {
      const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setMessages((prev) => [
        ...prev,
        { id: idRef.current++, text: event.data, timestamp: time },
      ]);
    };

    socket.onclose = () => console.log("❌ Disconnected");

    return () => socket.close();
  }, []);

  const sendMessage = () => {
    if (socketRef.current && input.trim()) {
      socketRef.current.send(input);
      setInput("");
    }
  };

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-black"> Public Chat </h1>
      <MessageList messages={messages} />
      <MessageInput input={input} setInput={setInput} sendMessage={sendMessage} />
    </div>
  );
}

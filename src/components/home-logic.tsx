"use client";

import { useEffect, useRef, useState } from "react";
import MessageList from "./message-list";
import MessageInput from "./message-input";

export type Message = {
  id: number;
  text: string;
  timestamp: string;
  username: string;
};

export default function HomeLogic() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [username, setUsername] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const idRef = useRef(0);

  useEffect(() => {
    if (!isLoggedIn)
      return;

    const socket = new WebSocket("ws://localhost:8080");
    socketRef.current = socket;

    socket.onopen = () => console.log("✅ Connected to WebSocket server");

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data); // { text, username, timestamp }
      setMessages((prev) => [
        ...prev,
        { id: idRef.current++, ...data },
      ]);
    };

    socket.onclose = () => console.log("❌ Disconnected");

    return () => socket.close();
  }, [isLoggedIn]);

  const sendMessage = () => {
    if (socketRef.current && input.trim()) {
      const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const messageData = { text: input, username, timestamp: time };

      socketRef.current.send(JSON.stringify(messageData));

      setInput("");
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="p-4 max-w-lg mx-auto">
        <h1 className="text-2xl font-bold mb-4 text-black placeholder-black">Enter your username</h1>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          // placeholder="Username"
          className="border rounded p-2 mb-2 w-full text-black placeholder-black"
          onKeyDown={(e) => e.key === "Enter" && username.trim() && setIsLoggedIn(true)}
        />
        <button
          onClick={() => username.trim() && setIsLoggedIn(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded w-full"
        >
          Join Chat
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-black">🌐 Public Chat</h1>
      <MessageList messages={messages} />
      <MessageInput input={input} setInput={setInput} sendMessage={sendMessage} />
    </div>
  );
}

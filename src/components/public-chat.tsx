"use client";

import { useEffect, useRef, useState } from "react";
import MessageList from "./message-list";
import MessageInput from "./message-input";
import { useWebSocket } from "@/context/websocket-context";

export type Message = {
  id: number;
  text: string;
  timestamp: string;
  username: string;
};

export default function PublicChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [username, setUsername] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const { socket, sendMessage: sendWSMessage } = useWebSocket(); // consume context
  const idRef = useRef(0); // simple ID counter

  useEffect(() => {
    if (!isLoggedIn || !socket) return;

    const handleMessage = (event: MessageEvent) => {
      const data = JSON.parse(event.data); // { type, ...rest }

      // Only process chat messages
      if (data.type !== "chat") return;

      setMessages((prev) => [
        ...prev,
        { id: idRef.current++, text: data.text, username: data.username, timestamp: data.timestamp },
      ]);
    };

    socket.addEventListener("message", handleMessage);

    return () => socket.removeEventListener("message", handleMessage);
  }, [isLoggedIn, socket]);

  const sendMessage = () => {
    if (!input.trim()) return;

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const messageData = {
      type: "chat", // tag it as a chat message
      text: input,
      username,
      timestamp: time
    };

    sendWSMessage(JSON.stringify(messageData));
    setInput("");
  };

  if (!isLoggedIn) {
    return (
      <div className="p-4 max-w-lg mx-auto">
        <h1 className="text-2xl font-bold mb-4 text-black placeholder-black">Enter your username</h1>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
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

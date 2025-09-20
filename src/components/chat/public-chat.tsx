"use client";

import { useEffect, useRef, useState } from "react";
import MessageList from "@/components/chat/message-list";
import { useWebSocket } from "@/context/websocket-context";
import MessageInput from "@/components/chat/message-input";

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
  const [finalUsername, setFinalUsername] = useState(""); // confirmed username

  const { socket, sendMessage: sendWSMessage } = useWebSocket(); // consume context
  const idRef = useRef(0); // simple ID counter

  useEffect(() => {
    if (!socket) return;

    const handleMessage = (event: MessageEvent) => {
      const data = JSON.parse(event.data);

      // Only process chat messages
      if (data.type !== "chat") return;

      setMessages((prev) => [
        ...prev,
        { id: idRef.current++, text: data.text, username: data.username, timestamp: data.timestamp },
      ]);
    };

    socket.addEventListener("message", handleMessage);
    return () => socket.removeEventListener("message", handleMessage);
  }, [socket]);

  const sendMessage = () => {
    if (!input.trim() || !finalUsername.trim()) return;

    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const messageData = {
      type: "chat", // tag it as a chat message
      text: input,
      username: finalUsername,
      timestamp: time
    };

    sendWSMessage(JSON.stringify(messageData));
    setInput("");
  };

  return (
    <div className="flex flex-col h-[90vh] max-w-lg mx-auto gap-2">
      <h1 className="text-2xl font-bold mb-2 text-black">🌐 Public Chat</h1>
      <MessageList messages={messages} />

      <MessageInput
        input={input}
        setInput={setInput}
        sendMessage={sendMessage}
        username={username}
        setUsername={setUsername}
        finalUsername={finalUsername}
        setFinalUsername={setFinalUsername}
      />
    </div>
  );
}

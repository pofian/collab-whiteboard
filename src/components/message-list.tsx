import { useEffect, useRef } from "react";
import { Message } from "./home-logic";

type Props = {
  messages: Message[];
};

export default function MessageList({ messages }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div
      ref={containerRef}
      className="border rounded p-2 overflow-y-auto mb-2 bg-white text-black resize-y min-h-[200px] max-h-[600px]"
    >
      {messages.map((msg) => (
        <div key={msg.id} className="p-1 flex justify-between text-sm">
          <span className="whitespace-pre-wrap">
            <strong>{msg.username}: </strong>
            {msg.text}
          </span>
          <span className="text-gray-500 ml-2">{msg.timestamp}</span>
        </div>
      ))}
    </div>
  );
}

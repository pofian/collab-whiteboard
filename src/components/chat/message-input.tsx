"use client";

import { FiSend } from "react-icons/fi";

type Props = {
  input: string;
  setInput: (value: string) => void;
  sendMessage: () => void;
  username: string;
  setUsername: (value: string) => void;
  finalUsername: string;
  setFinalUsername: (value: string) => void;
};

export default function MessageInput({
  input,
  setInput,
  sendMessage,
  username,
  setUsername,
  finalUsername,
  setFinalUsername,
}: Props) {
  const buttonBase = "w-10 h-10 flex items-center justify-center rounded"; // 40x40

  // Username entry mode
  if (!finalUsername) {
    return (
      <div className="flex gap-2 items-center w-full">
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (username.trim()) setFinalUsername(username.trim());
            }
          }}
          placeholder="Choose username to chat"
          className="flex-1 h-10 border rounded px-3 py-2 bg-white text-black box-border leading-5"
          style={{ lineHeight: "1.25rem" }}
        />
        <button
          onClick={() => {
            if (username.trim()) setFinalUsername(username.trim());
          }}
          className={`${buttonBase} bg-green-500 text-white`}
          title="Set username"
          aria-label="Set username"
          type="button"
        >
          ✓
        </button>
      </div>
    );
  }

  // Chat input mode
  return (
    <div className="flex gap-2 items-center w-full">
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
          }
        }}
        placeholder="Type your message"
        className="flex-1 h-10 border rounded px-3 py-2 bg-white text-black resize-none box-border leading-5"
        style={{ lineHeight: "1.25rem" }}
      />

      <button
        onClick={sendMessage}
        className={`${buttonBase} bg-blue-500 text-white`}
        title="Send message"
        aria-label="Send message"
        type="button"
      >
        <FiSend size={18} />
      </button>
    </div>
  );
}

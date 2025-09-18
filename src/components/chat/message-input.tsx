type Props = {
  input: string;
  setInput: (value: string) => void;
  sendMessage: () => void;
};

export default function MessageInput({ input, setInput, sendMessage }: Props) {
  return (
    <div className="flex gap-2">
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault(); // stop newline
            sendMessage();
          }
        }}
        placeholder="Type a message..."
        className="flex-1 border rounded p-2 bg-white text-black resize-none"
        rows={1}
      />
      <button
        onClick={sendMessage}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Send
      </button>
    </div>
  );
}

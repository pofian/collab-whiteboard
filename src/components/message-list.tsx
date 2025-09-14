import { Message } from "./home-logic";

type Props = {
  messages: Message[];
};


export default function MessageList({ messages }: Props) {
  return (
    <div className="border rounded p-2 h-80 overflow-y-auto mb-2 bg-white text-black">
      {messages.map((msg) => (
        <div key={msg.id} className="p-1 flex justify-between text-sm">
          <span>{msg.text}</span>
          <span className="text-gray-500 ml-2">{msg.timestamp}</span>
        </div>
      ))}
    </div>
  );
}


import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";

type WSContextType = {
  socket: WebSocket | null;
  sendMessage: (msg: string) => void;
};

const WSContext = createContext<WSContextType | undefined>(undefined);

type WebSocketProviderProps = {
  children: ReactNode;
};

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8080");
    setSocket(ws);

    return () => ws.close();
  }, []);

  const sendMessage = (msg: string) => {
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(msg);
    }
  };

  return <WSContext.Provider value={{ socket, sendMessage }}>{children}</WSContext.Provider>;
};

export const useWebSocket = () => {
  const context = useContext(WSContext);
  if (!context) {
    throw new Error("useWebSocket must be used within a WebSocketProvider");
  }
  return context;
};

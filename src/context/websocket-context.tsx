import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";

type WSContextType = {
  socket: WebSocket | null;
  sendMessage: (msg: string) => void;
};

type WebSocketProviderProps = {
  children: ReactNode;
};

const WSContext = createContext<WSContextType | undefined>(undefined);

const serverStatus: boolean = true;
const localServerUrl = "ws://localhost:8080";
const remoteServerUrl = "https://collab-whiteboard-owtq.onrender.com";
const serverUrl = serverStatus ? localServerUrl : remoteServerUrl;

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket(serverUrl);
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

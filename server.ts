import { WebSocketServer } from "ws";

const wss = new WebSocketServer({ port: 8080 });

wss.on("connection", (ws) => {
  console.log("✅ Client connected");

  ws.on("message", (msg) => {
    console.log("Received:", JSON.parse(msg.toString()).type == "drawing" ? "{\"type\":\"drawing\", ...}" : msg.toString());

    // broadcast to everyone
    wss.clients.forEach((client) => {
      if (client.readyState === ws.OPEN) {
        client.send(msg.toString());
      }
    });
  });

  ws.on("close", () => console.log("❌ Client disconnected"));
});

console.log("🚀 WebSocket server running on ws://localhost:8080");

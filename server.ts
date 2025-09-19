import { WebSocketServer, WebSocket } from "ws";

const wss = new WebSocketServer({ port: 8080 });

let strokes: any[] = [];       // currently active strokes
let allHistory: any[] = [];    // all strokes ever drawn
let connectedClients = 0;

// Helper: safe broadcast
function broadcast(message: string, sender: WebSocket | undefined = undefined) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN && client !== sender) {
      client.send(message);
    }
  });
}

wss.on("connection", (ws) => {
  connectedClients++;
  console.log(`✅ Client connected (total: ${connectedClients})`);

  // Send existing strokes to the new client
  if (strokes.length > 0) {
    ws.send(JSON.stringify({ type: "init", strokes }));
  }

  ws.on("message", (msg) => {
    let data;
    try {
      data = JSON.parse(msg.toString());
    } catch {
      console.error("❌ Invalid JSON:", msg.toString());
      return;
    }

    switch (data.type) {
      case "chat":
        broadcast(JSON.stringify(data));
        break;

      case "drawing":
        if (data.stroke) {
          strokes.push(data.stroke);
          allHistory.push(data.stroke);
          broadcast(JSON.stringify({ type: "drawing", stroke: data.stroke }), ws);
        }
        break;

      case "undo":
        if (data.strokeId) {
          strokes = strokes.filter((s) => s.strokeId !== data.strokeId);
          broadcast(JSON.stringify({ type: "undo", strokeId: data.strokeId }), ws);
        }
        break;

      case "redo":
        if (data.strokeId) {
          const stroke = allHistory.find((s) => s.strokeId === data.strokeId);
          if (stroke) {
            strokes.push(stroke);
            broadcast(JSON.stringify({ type: "redo", stroke }), ws);
          }
        }
        break;

      default:
        console.warn("⚠️ Unknown message type:", data.type);
        return; // don’t broadcast unknown messages
    }
  });

  ws.on("close", () => {
    connectedClients--;
    console.log(`❌ Client disconnected (total: ${connectedClients})`);

    // If no clients remain, wipe the server state
    if (connectedClients === 0) {
      strokes = [];
      allHistory = [];
      console.log("🧹 All clients disconnected — cache cleared");
    }
  });
});

console.log("🚀 WebSocket server running on ws://localhost:8080");

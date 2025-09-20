import { WebSocketServer, WebSocket } from "ws";
import os from "os";
const wss = new WebSocketServer({ host: "0.0.0.0", port: 8080 }); // listen on all interfaces
let strokes = []; // currently active strokes
let allHistory = []; // all strokes ever drawn
let connectedClients = 0;
// Helper: safe broadcast
function broadcast(message, sender = undefined) {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN && client !== sender) {
            client.send(message);
        }
    });
}
function broadcastUserCount() {
    const message = JSON.stringify({ type: "usersCount", count: connectedClients });
    broadcast(message);
}
wss.on("connection", (ws) => {
    connectedClients++;
    console.log(`✅ Client connected (total: ${connectedClients})`);
    broadcastUserCount();
    // Send existing strokes to the new client
    if (strokes.length > 0) {
        ws.send(JSON.stringify({ type: "init", strokes }));
    }
    ws.on("message", (msg) => {
        let data;
        try {
            data = JSON.parse(msg.toString());
        }
        catch {
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
        broadcastUserCount();
        // If no clients remain, wipe the server state
        if (connectedClients === 0) {
            strokes = [];
            allHistory = [];
            console.log("🧹 All clients disconnected — cache cleared");
        }
    });
});
const ip = (() => {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === "IPv4" && !iface.internal) {
                return iface.address;
            }
        }
    }
    return "localhost";
})();
console.log(`🚀 WebSocket server running on ws://${ip}:8080`);

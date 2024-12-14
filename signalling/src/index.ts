import { WebSocketServer, WebSocket } from "ws";

const wss = new WebSocketServer({ port: 8080 });

let senderSocket: WebSocket | null = null;
let receiverSocket: WebSocket[] = [];

wss.on("connection", (ws) => {
    console.log("connected");

    ws.on("message", (data) => {
        const message = JSON.parse(data.toString());

        if (message.type === "sender") {
            console.log("Sender is here");
            senderSocket = ws;
        } else if (message.type === "reciever") {
            console.log("Receiver is here");
            receiverSocket.push(ws);
        } else if (message.type === "createOffer") {
            if (ws !== senderSocket) return;
            console.log("Offer created");
            receiverSocket.forEach((socket) => {
                if (socket) {
                    socket.send(JSON.stringify({ type: "createOffer", sdp: message.sdp }));
                }
            });
        } else if (message.type === "createAnswer") {
            if (!receiverSocket.includes(ws)) return;
            console.log("Answer created");
            senderSocket?.send(JSON.stringify({ type: "createAnswer", sdp: message.sdp }));
        } else if (message.type === "iceCandidate") {
            if (ws === senderSocket) {
                console.log("ICE at sender", message.candidate);
                receiverSocket.forEach((socket) => {
                    if (socket) {
                        socket.send(JSON.stringify({ type: "iceCandidate", candidate: message.candidate }));
                    }
                });
            } else if (receiverSocket.includes(ws)) {
                console.log("ICE at receiver", message.candidate);
                senderSocket?.send(JSON.stringify({ type: "iceCandidate", candidate: message.candidate }));
            }
        }
    });

    ws.on("error", (err) => {
        console.log("error", err);
        ws.close();
    });

    ws.on("close", () => {
        console.log("closed");
        if (ws === senderSocket) {
            senderSocket = null;
        } else {
            receiverSocket = receiverSocket.filter((socket) => socket !== ws);
        }
    });

    ws.send(JSON.stringify({ message: "connected" }));
});

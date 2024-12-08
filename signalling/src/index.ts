import { WebSocketServer, WebSocket } from "ws";

const wss = new WebSocketServer({ port: 8080 });

let senderSocket: null | WebSocket = null
let receiverSocket: null | WebSocket = null

wss.on("connection", (ws) => {
    console.log("connected");
    ws.on("message", (data) => {
        const message = JSON.parse(data.toString());
        if (message.type == "sender") {
            console.log("Sender is here")
            senderSocket = ws;
        } else if (message.type == "reciever") {
            console.log("reciever is here")
            receiverSocket = ws;
        } else if (message.type == "createOffer") {
            if (ws != senderSocket) {
                return;
            }
            console.log("Offer created")
            receiverSocket?.send(JSON.stringify({ type: "createOffer", sdp: message.sdp }))
        } else if (message.type == "createAnswer") {
            if (ws != receiverSocket) {
                return;
            }
            console.log("answer created")
            senderSocket?.send(JSON.stringify({ type: "createAnswer", sdp: message.sdp }))
        } else if (message.type == "iceCandidate") {
            if (ws == senderSocket) {
                console.log("ICE at sender",message.candidate)
                
                receiverSocket?.send(JSON.stringify({ type: "iceCandidate", candidate: message.candidate }))
            } else if (ws == receiverSocket) {
                console.log("ICE at reciever",message.candidate)
                senderSocket?.send(JSON.stringify({ type: "iceCandidate", candidate: message.candidate }))
            }

        }
    })


    ws.on("error", (err) => {
        console.log("error", err);
    })


    ws.on("close", () => {
        console.log("closed");
    })
    ws.send(JSON.stringify({ message: "connected" }))

})



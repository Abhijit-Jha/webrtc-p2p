import { useEffect, useState, useRef } from "react";

const Receiver = () => {
    const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);

    useEffect(() => {
        const receiverSocket = new WebSocket("ws://localhost:8080");

        let pc: RTCPeerConnection | null = null;
        const mediaStream = new MediaStream();

        receiverSocket.onopen = () => {
            console.log("Socket open");
            receiverSocket.send(JSON.stringify({ type: "reciever" }));
        };

        receiverSocket.onerror = (err) => {
            console.error("WebSocket error:", err);
        };

        receiverSocket.onclose = () => {
            console.log("Socket closed");
        };

        const setupPeerConnection = () => {
            pc = new RTCPeerConnection();

            // Handle track events
            pc.ontrack = (event) => {
                console.log("Track received");
                event.streams[0].getTracks().forEach((track) => mediaStream.addTrack(track));
                setVideoStream(mediaStream);
            };

            // Handle ICE candidate generation
            pc.onicecandidate = (event) => {
                if (event.candidate) {
                    console.log("ICE candidate generated:", event.candidate);
                    receiverSocket.send(JSON.stringify({ type: "iceCandidate", candidate: event.candidate }));
                }
            };
        };

        receiverSocket.onmessage = async (event) => {
            const message = JSON.parse(event.data);
            if (!pc) setupPeerConnection();

            // Handle offer
            if (message.type === "createOffer") {
                console.log("Received offer");
                await pc?.setRemoteDescription(new RTCSessionDescription(message.sdp));
                console.log("Remote description set");

                // Create and send answer
                const answer = await pc?.createAnswer();
                await pc?.setLocalDescription(answer);
                receiverSocket.send(JSON.stringify({ type: "createAnswer", sdp: pc?.localDescription }));
                console.log("Answer created and sent:", pc?.localDescription);
            }

            // Handle ICE candidate
            else if (message.type === "iceCandidate") {
                try {
                    await pc?.addIceCandidate(new RTCIceCandidate(message.candidate));
                    console.log("ICE candidate added:", message.candidate);
                } catch (error) {
                    console.error("Error adding ICE candidate:", error);
                }
            }
        };

        return () => {
            pc?.close();
            receiverSocket.close();
            console.log("Cleaned up");
        };
    }, []);

    const playVideo = () => {
        if (videoStream && videoRef.current) {
            videoRef.current.srcObject = videoStream;
            videoRef.current.play().then(() => {
                console.log("Video playback started");
            }).catch((error) => {
                console.error("Video playback failed:", error);
            });
        } else {
            console.log("No video stream available");
        }
    };

    return (
        <div>
            <h1>Receiver</h1>
            <button onClick={playVideo} style={{ padding: "10px", margin: "10px" }}>
                Play Video
            </button>
            <video
                ref={videoRef}
                style={{ width: "100%", maxWidth: "600px", border: "1px solid black" }}
                controls
                playsInline
            />
        </div>
    );
};

export default Receiver;

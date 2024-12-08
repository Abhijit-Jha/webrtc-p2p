import { useEffect, useRef, useState } from 'react'


const Reciever = () => {
    const [socket, setSocket] = useState<WebSocket | null>(null);
    // const [pc, setPC] = useState<RTCPeerConnection | null>(null)
    const videoRef = useRef<HTMLVideoElement>(null)
    useEffect(() => {
        const recieverSocket = new WebSocket("ws://localhost:8080");
        recieverSocket.onopen = () => {
            recieverSocket.send(JSON.stringify({ type: "reciever" }))
            setSocket(recieverSocket)
        }

        recieverSocket.onmessage = async (event: any) => {
            const message = JSON.parse(event.data);
            let pc: RTCPeerConnection | null = null;
            //set Remote Description
            if (message.type == "createOffer") {
                pc = new RTCPeerConnection()
                // setPC(pc)
                const remoteDesc: RTCSessionDescriptionInit = {
                    type: "offer",  // The type should be "offer"
                    sdp: message.sdp,  // The actual SDP string from the message
                };

                // Set the remote description using the formatted object
                await pc.setRemoteDescription(remoteDesc);
                //ioce candidate
                pc.onicecandidate = (event: any) => {
                    if (event.candidate) {
                        console.log("EEEVEEENT", event)
                        recieverSocket.send(JSON.stringify({ type: "iceCandidate", candidate: event.candidate }))
                    }
                }

                // adding track here
                pc.ontrack = (event) => {
                    console.log("HELLO")
                    if (videoRef.current) {
                        videoRef.current.srcObject = new MediaStream([event.track])
                        videoRef.current.play()
                    }
                    const video = document.createElement("video")
                    video.srcObject = new MediaStream([event.track])
                    video.play()
                }

                const answer = await pc.createAnswer()
                //set Local Description
                await pc.setLocalDescription(answer);
                recieverSocket.send(JSON.stringify({ type: "createAnswer", sdp: pc.localDescription }))
                console.log("answer",pc)
            } else if (message.type == "iceCandidate") {
                //@ts-ignore
                pc?.addIceCandidate(message.candidate)
            }

        }
    }, [])

    return (
        <div>
            Reciever
            <video ref={videoRef} style={{ width: "100%", height: "auto" }}></video>
        </div>
    )
}

export default Reciever

import { useEffect, useRef } from 'react'

const Reciever = () => {


    const videoRef = useRef<HTMLVideoElement>(null)
    useEffect(() => {
        const recieverSocket = new WebSocket("ws://localhost:8080");
        recieverSocket.onopen = () => {
            recieverSocket.send(JSON.stringify({ type: "reciever" }))
        }
        let pc: RTCPeerConnection | null = null;

        recieverSocket.onmessage = async (event: any) => {
            const message = JSON.parse(event.data);
            //set Remote Description
            if (message.type == "createOffer") {
                pc = new RTCPeerConnection();

                // Set the remote description 
                pc.setRemoteDescription(message.sdp);
                //ioce candidate
                pc.onicecandidate = (event: any) => {
                    if (event.candidate) {

                        console.log("EEEVEEENT", event)
                        recieverSocket.send(JSON.stringify({ type: "iceCandidate", candidate: event.candidate }))
                    }
                }

                // adding track here
                pc.ontrack = (event) => {
                    console.log("on track")
                    const video = document.createElement("video")
                    document.body.appendChild(video)
                    video.srcObject = new MediaStream([event.track])
                    video.setAttribute("playsinline", "true");
                    video.play()
                }

                const answer = await pc.createAnswer()
                //set Local Description
                await pc.setLocalDescription(answer);
                recieverSocket.send(JSON.stringify({ type: "createAnswer", sdp: answer }))
                console.log("answer", pc)
            } else if (message.type == "iceCandidate") {
                console.log("ice candidate", pc)
                if (pc != null) {
                    console.log("hell")
                    //@ts-ignore
                    pc.addIceCandidate(message.candidate)
                } else {
                    console.log("no pc")
                }
            }
        }
    }, [])

    return (
        <div>
            Reciever
            {/* <video ref={videoRef} style={{ width: "100%", height: "auto" }}></video> */}
        </div>
    )
}

export default Reciever

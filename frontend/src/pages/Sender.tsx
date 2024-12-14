import { useEffect, useRef, useState } from 'react'

const Sender = () => {
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null)
    useEffect(() => {
        const senderSocket = new WebSocket("ws://localhost:8080");
        setSocket(senderSocket);
        senderSocket.onopen = () => {
            console.log("Socket opened")
            senderSocket.send(JSON.stringify({ type: "sender" }))
        }

    }, [])

    async function startSendingVideo() {
        if (!socket) {
            console.log("no socket")
            return;
        }
        const pc = new RTCPeerConnection();

        //WHen ever the sdp changes(new video/audio is added then sdp changes) we need to create a offer again
        // and again therfore onnegotiation we are creating offer and sending it to the reciever
        pc.onnegotiationneeded = async () => {
            console.log("onnegotiationneeded")
            //initialize peer connection
            //create offer
            const offer = await pc.createOffer();  //sdp
            console.log("OFFER : ", offer)
            // set the localDescription to offer
            await pc.setLocalDescription(offer);
            console.log("local", pc.localDescription)
            //send the offer to the reciever
            socket?.send(JSON.stringify({ type: "createOffer", sdp: pc.localDescription })); //or pc.localDescription
            console.log("offer created")
        }



        //ice candidate
        pc.onicecandidate = (event: any) => {
            console.log("ice candidate", event)
            if (event.candidate) {
                socket.send(JSON.stringify({ type: "iceCandidate", candidate: event.candidate }))
            }
        }
        socket.onmessage = async (event: any) => {
            const data = JSON.parse(event.data)
            if (data.type == "createAnswer") {
                console.log("ANSWER CREATED")
                await pc.setRemoteDescription(data.sdp)
                console.log("Remote description", pc.remoteDescription)
            } else if (data.type == "iceCandidate") {
                console.log("ICe candidate added")
                await pc.addIceCandidate(data.candidate)
                console.log("ICe candidate done")
            }
        }


        //after the webrtc logic adding video/audio
        //asks for permissions
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })

        //add the video
        stream.getTracks().forEach((track) => {
            console.log("Sending track - Type:", track.kind);
            console.log("Track constraints:", track.getConstraints());
            pc.addTrack(track, stream);
        }); // it will send it to the other side
        console.log("PC after ", pc);
        console.log("video/audio object", stream)

        //add the video to the dom
        console.log("Adding video");
        if(videoRef.current){
            videoRef.current.srcObject = stream
            await videoRef.current.play()
        }

    }
    return (
        <div>
            <h2>Sender</h2>
            <button
                onClick={startSendingVideo}
                style={{ padding: '10px', margin: '10px' }}
            >
                Send Video
            </button>
            <video ref={videoRef}></video>
            <div id="status"></div>
        </div>
    )

}

export default Sender;
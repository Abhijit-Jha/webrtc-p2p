import { useEffect, useState } from 'react'

const Sender = () => {
    const [socket, setSocket] = useState<WebSocket | null>(null);
    useEffect(() => {
        const senderSocket = new WebSocket("ws://localhost:8080");
        setSocket(senderSocket);
        senderSocket.onopen = () => {
            //("sender socket opened");
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
            //("OFFER : ",offer)
            // set the localDescription to offer
            await pc.setLocalDescription(offer);
            //("local",pc.localDescription)
            //send the offer to the reciever
            socket?.send(JSON.stringify({ type: "createOffer", sdp: offer.sdp })); //or pc.localDescription
        }



        //ice candidate
        pc.onicecandidate = (event: any) => {
            console.log("EEEVEEENT", event)
            if (event.candidate) {
                socket.send(JSON.stringify({ type: "iceCandidate", candidate: event.candidate }))
            }
        }
        socket.onmessage = async (event: any) => {
            const data = JSON.parse(event.data)
            if (data.type == "createAnswer") {
                //("ANSWER CREATED")
                pc.setRemoteDescription(data.sdp)
                //(pc.remoteDescription)
            } else if (data.type == "iceCandidate") {
                pc.addIceCandidate(data.candidate)
            }
        }


        //after the webrtc logic adding video/audio
        //asks for permissions
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })

        //add the video
        stream.getTracks().forEach((track) => {
            console.log("track added");
            console.log(track);
            pc.addTrack(track);
            
        }); // it will send it to the other side
        console.log("PC after ",pc);
        console.log("video/audio object", stream)


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
            <div id="status"></div>
        </div>
    )

}

export default Sender;
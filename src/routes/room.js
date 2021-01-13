import React, { useRef, useEffect, useState } from "react";
import io from "socket.io-client";

const Room = (props) => {
    const userVideo = useRef();
    const partnerVideo = useRef();
    const peerRef = useRef();
    const socketRef = useRef();
    const otherUser = useRef();
    const userStream = useRef();
    const senders = useRef([]);
    const [json, setJson] = useState([]);
    const [json2, setJson2] = useState([]);
    const [json3, setJson3] = useState([]);
    const [json4, setJson4] = useState([]);

    useEffect(() => {
        navigator.mediaDevices.getUserMedia({ audio: true, video: true }).then(stream => {
            userVideo.current.srcObject = stream;
            userStream.current = stream;

            socketRef.current = io.connect("/");

            socketRef.current.on('connection-success', data => {
                setJson(data.socketId);
            });

            socketRef.current.on('room full', data => {
                console.log("Room is full!");
            });

            socketRef.current.emit("join room", props.match.params.roomID);

            socketRef.current.on('other user', userID => {
                handleOffer(userID);
                otherUser.current = userID;
            });

            socketRef.current.on("user joined", userID => {
                otherUser.current = userID;
                setJson3(userID);
            });

            socketRef.current.on("offer", handleRecieveCall);

            socketRef.current.on("answer", handleAnswer);

            socketRef.current.on("ice-candidate", handleNewICECandidateMsg);
        });

    }, []);

    function createPeer(userID) {
        const peer = new RTCPeerConnection({
            iceServers: [
                {
                    url: 'turn:global.turn.twilio.com:3478?transport=udp',
                    username: '08d8032f0fbfb6bd01acdb6a78ef56ea08150468c92514c10bfa788536465808',
                    urls: 'turn:global.turn.twilio.com:3478?transport=udp',
                    credential: 'kBZTE33+2x3/qZYbE5edOlowo2grOZwizv1iV7noq7E='
                },
                {
                    url: 'turn:global.turn.twilio.com:3478?transport=tcp',
                    username: '08d8032f0fbfb6bd01acdb6a78ef56ea08150468c92514c10bfa788536465808',
                    urls: 'turn:global.turn.twilio.com:3478?transport=tcp',
                    credential: 'kBZTE33+2x3/qZYbE5edOlowo2grOZwizv1iV7noq7E='
                },
                {
                    url: 'turn:global.turn.twilio.com:443?transport=tcp',
                    username: '08d8032f0fbfb6bd01acdb6a78ef56ea08150468c92514c10bfa788536465808',
                    urls: 'turn:global.turn.twilio.com:443?transport=tcp',
                    credential: 'kBZTE33+2x3/qZYbE5edOlowo2grOZwizv1iV7noq7E='
                },
                {
                    urls: ["turn:numb.viagenie.ca"],
                    username: "alenthomas678@gmail.com",
                    credential: "dio2063@benedire"
                },
                {
                    url: 'stun:global.stun.twilio.com:3478?transport=udp',
                    urls: 'stun:global.stun.twilio.com:3478?transport=udp',
                    urls: 'stun:stun.l.google.com:19302'
                },
                {
                    urls: "stun:stun.stunprotocol.org"
                },
                {
                    urls: 'turn:numb.viagenie.ca',
                    credential: 'muazkh',
                    username: 'webrtc@live.com'
                },
            ]
        });

        peer.onicecandidate = handleICECandidateEvent;
        peer.oniceconnectionstatechange = (e) => {

        }
        peer.ontrack = handleTrackEvent;
        peer.close = () => {

        }

        return peer;
    }

    function handleOffer(userID) {
        peerRef.current = createPeer(userID);
        peerRef.current.createOffer().then(offer => {
            return peerRef.current.setLocalDescription(offer);
        }).then(() => {
            const payload = {
                target: userID,
                name: props.match.params.email,
                caller: socketRef.current.id,
                sdp: peerRef.current.localDescription
            };
            socketRef.current.emit("offer", payload);
        }).catch(e => console.log(e));
    }

    function handleRecieveCall(incoming) {
        setJson4(incoming.name);
        peerRef.current = createPeer(incoming.caller);
        const desc = new RTCSessionDescription(incoming.sdp);
        peerRef.current.setRemoteDescription(desc).then(() => {
            userStream.current.getTracks().forEach(track => peerRef.current.addTrack(track, userStream.current));
        }).then(() => {
            return peerRef.current.createAnswer();
        }).then(answer => {
            return peerRef.current.setLocalDescription(answer);
        }).then(() => {
            const payload = {
                target: incoming.caller,
                name: props.match.params.email,
                caller: socketRef.current.id,
                sdp: peerRef.current.localDescription
            }
            socketRef.current.emit("answer", payload);
        })
    }

    function handleAnswer(message) {
        setJson4(message.name);
        const desc = new RTCSessionDescription(message.sdp);
        peerRef.current.setRemoteDescription(desc).catch(e => console.log(e));
    }

    function handleICECandidateEvent(e) {
        if (e.candidate) {
            const payload = {
                target: otherUser.current,
                candidate: e.candidate,
            }
            socketRef.current.emit("ice-candidate", payload);
        }
    }

    function handleNewICECandidateMsg(incoming) {
        const candidate = new RTCIceCandidate(incoming);

        peerRef.current.addIceCandidate(candidate)
            .catch(e => console.log(e));
    }

    function handleTrackEvent(e) {
        partnerVideo.current.srcObject = e.streams[0];
    };

    function shareScreen() {
        navigator.mediaDevices.getDisplayMedia({ cursor: true }).then(stream => {
            const screenTrack = stream.getTracks()[0];
            senders.current.find(sender => sender.track.kind === 'video').replaceTrack(screenTrack);
            screenTrack.onended = function () {
                senders.current.find(sender => sender.track.kind === "video").replaceTrack(userStream.current.getTracks()[1]);
            }
        })
    }

    return (
        <div style={{ margin: 10 }}>
            <video style={{
                width: 240, height: 240,
                margin: 5, backgroundColor: 'black',
            }}
                ref={userVideo} autoPlay></video>
            <video style={{
                width: 240, height: 240,
                margin: 5, backgroundColor: 'black',
            }}
                ref={partnerVideo} autoPlay></video>
            <br />
            <p>{JSON.stringify(json)}</p>
            <br />
            <p>{JSON.stringify(json2)}</p>
            <br />
            <p>{JSON.stringify(json3)}</p>
            <br />
            <p>{json4}</p>
        </div>
    );
};

export default Room;






















// import React, { useRef, useEffect, useState } from "react";
// import io from "socket.io-client";
// import axios from 'axios';

// const Room = (props) => {
//     const userVideo = useRef();
//     const partnerVideo = useRef();
//     const peerRef = useRef();
//     const socketRef = useRef();
//     const otherUser = useRef();
//     const userStream = useRef();
//     const senders = useRef([]);
//     const [json, setJson] = useState([]);
//     const [json2, setJson2] = useState([]);
//     const [json3, setJson3] = useState([]);
//     const [json4, setJson4] = useState([]);

//     useEffect(() => {
//         // axios.get('http://localhost:5000/auth/home', {
//         //     headers: { 'Authorization': `Bearer ${JSON.parse(localStorage.getItem('auth'))}` }
//         // }).then(res => {
//         //     setJson2(res.data[0]['name']);
//         // }).catch(err => {
//         //     console.log('Error');
//         // })

//         navigator.mediaDevices.getUserMedia({ audio: true, video: true }).then(stream => {
//             userVideo.current.srcObject = stream;
//             userStream.current = stream;

//             socketRef.current = io.connect("/");

//             socketRef.current.on('connection-success', data => {
//                 setJson(data.socketId);
//             });

//             socketRef.current.on('room full', data => {
//                 console.log("Room is full!");
//             });

//             socketRef.current.emit("join room", props.match.params.roomID);

//             socketRef.current.on('other user', userID => {
//                 callUser(userID);
//                 setJson3(userID);
//                 otherUser.current = userID;
//             });

//             socketRef.current.on("user joined", userID => {
//                 otherUser.current = userID;
//                 setJson3(userID);
//             });

//             socketRef.current.on("offer", handleRecieveCall);

//             socketRef.current.on("answer", handleAnswer);

//             socketRef.current.on("ice-candidate", handleNewICECandidateMsg);
//         });

//     }, []);

//     function callUser(userID) {
//         peerRef.current = createPeer(userID);
//         userStream.current.getTracks().forEach(track => senders.current.push(peerRef.current.addTrack(track, userStream.current)));
//     }

//     function createPeer(userID) {
//         const peer = new RTCPeerConnection({
//             iceServers: [
//                 {
//                     url: 'turn:global.turn.twilio.com:3478?transport=udp',
//                     username: '08d8032f0fbfb6bd01acdb6a78ef56ea08150468c92514c10bfa788536465808',
//                     urls: 'turn:global.turn.twilio.com:3478?transport=udp',
//                     credential: 'kBZTE33+2x3/qZYbE5edOlowo2grOZwizv1iV7noq7E='
//                 },
//                 {
//                     url: 'turn:global.turn.twilio.com:3478?transport=tcp',
//                     username: '08d8032f0fbfb6bd01acdb6a78ef56ea08150468c92514c10bfa788536465808',
//                     urls: 'turn:global.turn.twilio.com:3478?transport=tcp',
//                     credential: 'kBZTE33+2x3/qZYbE5edOlowo2grOZwizv1iV7noq7E='
//                 },
//                 {
//                     url: 'turn:global.turn.twilio.com:443?transport=tcp',
//                     username: '08d8032f0fbfb6bd01acdb6a78ef56ea08150468c92514c10bfa788536465808',
//                     urls: 'turn:global.turn.twilio.com:443?transport=tcp',
//                     credential: 'kBZTE33+2x3/qZYbE5edOlowo2grOZwizv1iV7noq7E='
//                 },
//                 {
//                     urls: ["turn:numb.viagenie.ca"],
//                     username: "alenthomas678@gmail.com",
//                     credential: "dio2063@benedire"
//                 },
//                 {
//                     url: 'stun:global.stun.twilio.com:3478?transport=udp',
//                     urls: 'stun:global.stun.twilio.com:3478?transport=udp',
//                     urls: 'stun:stun.l.google.com:19302'
//                 },
//                 {
//                     urls: "stun:stun.stunprotocol.org"
//                 },
//                 {
//                     urls: 'turn:numb.viagenie.ca',
//                     credential: 'muazkh',
//                     username: 'webrtc@live.com'
//                 },
//             ]
//         });

//         peer.onicecandidate = handleICECandidateEvent;
//         peer.ontrack = handleTrackEvent;
//         peer.onnegotiationneeded = () => handleNegotiationNeededEvent(userID);

//         return peer;
//     }

//     function handleOffer(userID) {
//         peerRef.current.createOffer().then(offer => {
//             return peerRef.current.setLocalDescription(offer);
//         }).then(() => {
//             const payload = {
//                 target: userID,
//                 name: props.match.params.email,
//                 caller: socketRef.current.id,
//                 sdp: peerRef.current.localDescription
//             };
//             socketRef.current.emit("offer", payload);
//         }).catch(e => console.log(e));
//     }

//     function handleRecieveCall(incoming) {
//         setJson4(incoming.name);
//         peerRef.current = createPeer();
//         const desc = new RTCSessionDescription(incoming.sdp);
//         peerRef.current.setRemoteDescription(desc).then(() => {
//             userStream.current.getTracks().forEach(track => peerRef.current.addTrack(track, userStream.current));
//         }).then(() => {
//             return peerRef.current.createAnswer();
//         }).then(answer => {
//             return peerRef.current.setLocalDescription(answer);
//         }).then(() => {
//             const payload = {
//                 target: incoming.caller,
//                 name: props.match.params.email,
//                 caller: socketRef.current.id,
//                 sdp: peerRef.current.localDescription
//             }
//             socketRef.current.emit("answer", payload);
//         })
//     }

//     function handleAnswer(message) {
//         setJson4(message.name);
//         const desc = new RTCSessionDescription(message.sdp);
//         peerRef.current.setRemoteDescription(desc).catch(e => console.log(e));
//     }

//     function handleICECandidateEvent(e) {
//         if (e.candidate) {
//             const payload = {
//                 target: otherUser.current,
//                 candidate: e.candidate,
//             }
//             socketRef.current.emit("ice-candidate", payload);
//         }
//     }

//     function handleNewICECandidateMsg(incoming) {
//         const candidate = new RTCIceCandidate(incoming);

//         peerRef.current.addIceCandidate(candidate)
//             .catch(e => console.log(e));
//     }

//     function handleTrackEvent(e) {
//         partnerVideo.current.srcObject = e.streams[0];
//     };

//     function shareScreen() {
//         navigator.mediaDevices.getDisplayMedia({ cursor: true }).then(stream => {
//             const screenTrack = stream.getTracks()[0];
//             senders.current.find(sender => sender.track.kind === 'video').replaceTrack(screenTrack);
//             screenTrack.onended = function () {
//                 senders.current.find(sender => sender.track.kind === "video").replaceTrack(userStream.current.getTracks()[1]);
//             }
//         })
//     }

//     return (
//         <div style={{ margin: 10 }}>
//             <video style={{
//                 width: 240, height: 240,
//                 margin: 5, backgroundColor: 'black',
//             }}
//                 ref={userVideo} autoPlay></video>
//             <video style={{
//                 width: 240, height: 240,
//                 margin: 5, backgroundColor: 'black',
//             }}
//                 ref={partnerVideo} autoPlay></video>
//             <br />
//             <p>{JSON.stringify(json)}</p>
//             <br />
//             <p>{JSON.stringify(json2)}</p>
//             <br />
//             <p>{JSON.stringify(json3)}</p>
//             <br />
//             <p>{json4}</p>
//         </div>
//     );
// };

// export default Room;
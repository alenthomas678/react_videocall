import React, { Component } from 'react';

import io from 'socket.io-client'

import Video from './components/Video'

class App extends Component {
    constructor(props) {
        super(props)

        this.state = {
            localStream: null,
            remoteStream: null,
            pc: null,
            my_uid: "",
            peer_uid: "",

            status: 'Please wait...',

            pc_config: {
                "iceServers": [
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
            },

            sdpConstraints: {
                'mandatory': {
                    'OfferToReceiveAudio': true,
                    'OfferToReceiveVideo': true
                }
            },
        }

        this.serviceIP = '/'


        this.socket = null
    }

    getLocalStream = () => {
        const success = (stream) => {
            window.localStream = stream
            this.setState({
                localStream: stream
            })

            this.whoisOnline()
        }

        const failure = (e) => {
            console.log('getUserMedia Error: ', e)
        }

        const constraints = {
			audio: false,
            video: true,
            options: {
                mirror: true,
            }
        }

        navigator.mediaDevices.getUserMedia(constraints)
            .then(success)
            .catch(failure)
    }

    whoisOnline = () => {
        this.sendToPeer('onlinePeers', null, { local: this.socket.id })
    }

    sendToPeer = (messageType, payload, socketID) => {
        this.socket.emit(messageType, {
            socketID,
            payload
        })
    }

    createPeerConnection = (socketID) => {


        let peer = new RTCPeerConnection(this.state.pc_config);

        peer.onicecandidate = (e) => {
            if (e.candidate) {
                this.socket.emit('candidate', {
                    candidate: e.candidate,
                    local: this.socket.id,
                    remote: socketID
                })
            }
        }

        peer.oniceconnectionstatechange = (e) => {

        }

        peer.ontrack = (e) => {
            this.setState({
                remoteStream: e.streams[0]
            })
        }

        peer.close = () => {
        }

        if (this.state.localStream)
            peer.addStream(this.state.localStream)



        return peer;
    }

    sendOffer = (socketID) => {
        if (this.pc)
            this.pc.createOffer({ offerToReceiveVideo: 1, offerToReceiveAudio: 1 }).then(offer => {
                return this.pc.setLocalDescription(offer);
            }).then(() => {
                this.socket.emit('offer', {
                    sdp: JSON.stringify(this.pc.localDescription),
                    local: this.socket.id,
                    remote: socketID,
                })
            }).catch(e => console.log(e));
    }

    handleRecieveCall = (incoming) => {
        this.pc = this.createPeerConnection(incoming["socketID"]);
        this.pc.addStream(this.state.localStream)
		const value = JSON.parse(incoming["sdp"]);
        const desc = new RTCSessionDescription(value);
        this.pc.setRemoteDescription(desc).then(() => {
            return this.pc.createAnswer({ offerToReceiveVideo: 1, offerToReceiveAudio: 1 });
        }).then(answer => {
            return this.pc.setLocalDescription(answer);
        }).then(() => {
            this.socket.emit('answer', {
                sdp: JSON.stringify(this.pc.localDescription),
                local: this.socket.id,
                remote: incoming["socketID"],
            })
        })
    }

    handleAnswer = (message) => {
		console.log(message["sdp"]);
		const value = JSON.parse(message["sdp"]);
        const desc = new RTCSessionDescription(value);
        this.pc.setRemoteDescription(desc).catch(e => console.log(e));
    }

    componentDidMount = () => {
		
		this.getLocalStream();

        this.socket = io.connect(
            this.serviceIP,
        )

        this.socket.on('connection-success', data => {

            this.setState({
                my_uid: data.success
            })

            console.log(data.success)
            const status = data.peerCount > 1 ? `Total Connected Peers to room ${window.location.pathname}: ${data.peerCount}` : 'Waiting for other peers to connect'

            this.setState({
                status: status
            })
        })

        this.socket.emit("join room", { roomID: window.location.pathname });

        this.socket.on('joined peers', (data) => {

            this.setState({
                peer_uid: data.otherUser
            })
        })
 
        this.socket.on('online-peer', (data) => {
            const socketID = data.otherUser;
            this.setState({
                peer_uid: socketID
            })
            this.pc = this.createPeerConnection(socketID);
            this.sendOffer(socketID);
        })


        this.socket.on('offer', data => {
            this.handleRecieveCall(data);
        })


        this.socket.on('answer', data => {
            this.handleAnswer(data);
        })

        this.socket.on('candidate', (data) => {
            const candidate = JSON.parse(data["candidate"]); 
			console.log(candidate);
            if (this.pc)
                this.pc.addIceCandidate(new RTCIceCandidate(candidate))
        })
    }

    render() {

        const statusText = <div style={{ color: 'yellow', padding: 5 }}>{this.state.status}</div>

        return (
            <div>
                <Video
                    videoStyles={{
                        zIndex: 2,
                        position: 'absolute',
                        right: 0,
                        width: 200,
                        height: 200,
                        margin: 5,
                        backgroundColor: 'black'
                    }}
                    videoStream={this.state.localStream}
                    autoPlay muted>
                </Video>
                <Video
                    videoStyles={{
                        zIndex: 1,
                        position: 'fixed',
                        bottom: 0,
                        minWidth: '100%',
                        minHeight: '100%',
                        backgroundColor: 'black'
                    }}
                    videoStream={this.state.remoteStream}
                    autoPlay>
                </Video>
                <br />
                <div style={{
                    zIndex: 3,
                    position: 'absolute',
                    margin: 10,
                    backgroundColor: '#cdc4ff4f',
                    padding: 10,
                    borderRadius: 5,
                }}>
                    {statusText}
                    {this.state.my_uid}
                    <br />
                    {this.state.peer_uid}
                </div>

                <br />
            </div>
        )
    }
}

export default App;
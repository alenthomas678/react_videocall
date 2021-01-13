import React, { useRef, useEffect, useState } from 'react';
import io from 'socket.io-client';

const socket = io(
  '/webRTCPeers',
  {
    path: '/webrtc',
    query: {
      room: window.location.pathname,
    }
  }
);

function Video() {
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const textRef = useRef();
  const [offerVisible, setOfferVisible] = useState(true);
  const [answerVisible, setAnswerVisible] = useState(false);
  const [status, setStatus] = useState('Make a call now');

  var pc_config = {
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
      }
    ]
  };

  const pc = useRef(new RTCPeerConnection(pc_config));

  useEffect(() => {

    socket.on('connection-success', success => {
      console.log(success);
    });

    socket.on('sdp', data => {
      console.log(data);

      pc.current.setRemoteDescription(new RTCSessionDescription(data.sdp));
      textRef.current.value = JSON.stringify(data.sdp);

      if(data.sdp.type === 'offer') {
        setOfferVisible(false);
        setAnswerVisible(true);
        setStatus('Incoming call...');
      } else {
        setStatus('Call established.');
      }
    });

    socket.on('candidate', candidate => {
      console.log(candidate);

      pc.current.addIceCandidate(new RTCIceCandidate(candidate));
    });

    const constraints = {
      audio: true,
      video: true,
    }

    navigator.mediaDevices.getUserMedia(constraints).then(stream => {
      localVideoRef.current.srcObject = stream;

      stream.getTracks().forEach(track => {
        _pc.addTrack(track, stream);
      });
    })
    .catch(e => {
      console.log('getUserMedia Error...',e);
    });

    const _pc = new RTCPeerConnection(pc_config);

    _pc.onicecandidate = (e) => {
      if(e.candidate) {
        console.log(JSON.stringify(e.candidate));
        sendToPeer('candidate', e.candidate);
      }
    }

    _pc.oniceconnectionstatechange = (e) => {
      console.log(e);
    }

    _pc.ontrack = (e) => {
      remoteVideoRef.current.srcObject = e.streams[0];
    }

    pc.current = _pc;
  }, []);

  const sendToPeer = (eventType, payload) => {
    socket.emit(eventType, payload);
  }

  const processSDP = (sdp) => {
    console.log(JSON.stringify(sdp));
    pc.current.setLocalDescription(sdp);

    sendToPeer('sdp', { sdp });
  }

  const createOffer = () => {
    pc.current.createOffer({
      offerToReceiveAudio: 1,
      offerToReceiveVideo: 1,
    }).then(sdp => {
      processSDP(sdp);
      setOfferVisible(false);
      setStatus('Calling...');
    }).catch(e => console.log(e));
  }

  const createAnswer = () => {
    pc.current.createAnswer({
      offerToReceiveAudio: 1,
      offerToReceiveVideo: 1,
    }).then(sdp => {
      processSDP(sdp);
      setAnswerVisible(false);
      setStatus('Call established.');
    }).catch(e => console.log(e));
  }

  const showHideButtons = () => {
    if(offerVisible) {
      return (
        <div>
          <button onClick={createOffer}>Call</button>
        </div>
      )
    } else if (answerVisible) {
      return (
        <div>
          <button onClick={createAnswer}>Answer</button>
        </div>
      )
    }
  }

  return(
    <div style={{ margin: 10 }}>
      <video style={{
        width: 240, height: 240,
        margin: 5, backgroundColor: 'black',
      }}
      ref={localVideoRef} autoPlay></video>
      <video style={{
        width: 240, height: 240,
        margin: 5, backgroundColor: 'black',
      }}
      ref={remoteVideoRef} autoPlay></video>
      <br />
      { showHideButtons() }
      <br />
      <div>{ status }</div>
      <br />
      <textarea ref={textRef}></textarea>
    </div>
  );
}

export default Video;
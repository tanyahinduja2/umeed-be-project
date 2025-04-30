import React, { createContext, useState, useRef, useEffect } from 'react';
import { io } from 'socket.io-client';
import Peer from 'simple-peer';

window.process = {
    env: {
      NODE_ENV: 'development'
    }
  };

const SocketContext = createContext();

const socket = io('http://localhost:5000');

const ContextProvider = ({ children }) => {
  const [callAccepted, setCallAccepted] = useState(false);
  const [callEnded, setCallEnded] = useState(false);
  const [stream, setStream] = useState();
  const [name, setName] = useState('');
  const [call, setCall] = useState({});
  const [me, setMe] = useState('');

  const myVideo = useRef();
  const userVideo = useRef();
  const connectionRef = useRef();

  useEffect(() => {
    if (socket && socket.connected) {
      socket.emit('getMe'); // ask for id if already connected
    } else {
      socket.on('connect', () => {
        socket.emit('getMe'); // ask for id after connecting
      });
    }
  
    socket.on('me', (id) => {
      console.log('Received ID from server:', id);
      setMe(id);
    });

    socket.on('callUser', ({ from, name: callerName, signal }) => {
        console.log("Incoming call from:", from);
        setCall({ isReceivingCall: true, from, name: callerName, signal });
    });
  
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((currentStream) => {
        setStream(currentStream);
        if (myVideo.current) {
          myVideo.current.srcObject = currentStream;
        }
      })
      .catch((err) => {
        console.error("Error accessing media devices:", err);
      });
  
    return () => {
      socket.off('me');
      socket.off('connect');
    };
  }, []);
  
  
  useEffect(() => {
    if (myVideo.current && stream) {
      myVideo.current.srcObject = stream;
    }
  }, [stream]);
  

  const answerCall = () => {
    setCallAccepted(true);
  
    const peer = new Peer({ initiator: false, trickle: false, stream });
  
    peer.on('signal', (data) => {
      console.log("Sending answerCall signal data...");
      socket.emit('answerCall', { signal: data, to: call.from });
    });
  
    peer.on('stream', (currentStream) => {
      console.log("Receiving remote stream...");
      userVideo.current.srcObject = currentStream;
    });
  
    peer.signal(call.signal);
  
    connectionRef.current = peer;
  };
  

  const callUser = (id) => {
    console.log('Calling user:', id);

    const peer = new Peer({ initiator: true, trickle: false, stream });

    peer.on('signal', (data) => {
      console.log('Sending callUser socket event with signal data...');
      socket.emit('callUser', { userToCall: id, signalData: data, from: me, name });
    });

    peer.on('stream', (currentStream) => {
      console.log('Receiving user video stream...');
      userVideo.current.srcObject = currentStream;
    });

    socket.on('callAccepted', (signal) => {
      console.log('Call accepted, connecting...');
      setCallAccepted(true);
      peer.signal(signal);
    });

    connectionRef.current = peer;
};

  const leaveCall = () => {
    setCallEnded(true);

    connectionRef.current.destroy();

    window.location.reload();
  };

  return (
    <SocketContext.Provider value={{
      call,
      callAccepted,
      myVideo,
      userVideo,
      stream,
      name,
      setName,
      callEnded,
      me,
      callUser,
      leaveCall,
      answerCall,
    }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export { ContextProvider, SocketContext };
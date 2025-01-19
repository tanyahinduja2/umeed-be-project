import React, { useEffect, useRef, useState } from "react";
import Button from "@material-ui/core/Button";
import IconButton from "@material-ui/core/IconButton";
import TextField from "@material-ui/core/TextField";
import AssignmentIcon from "@material-ui/icons/Assignment";
import PhoneIcon from "@material-ui/icons/Phone";
import { CopyToClipboard } from "react-copy-to-clipboard";
import Peer from "simple-peer";
import io from "socket.io-client";
import "../App.css";

const socket = io.connect("http://localhost:5000");

const VideoChat = () => {
  const [me, setMe] = useState("");
  const [stream, setStream] = useState();
  const [receivingCall, setReceivingCall] = useState(false);
  const [caller, setCaller] = useState("");
  const [callerSignal, setCallerSignal] = useState();
  const [callAccepted, setCallAccepted] = useState(false);
  const [idToCall, setIdToCall] = useState("");
  const [callEnded, setCallEnded] = useState(false);
  const [name, setName] = useState("");
  const [transcription, setTranscription] = useState("");
  const [isRecording, setIsRecording] = useState(false);

  const myVideo = useRef();
  const userVideo = useRef();
  const connectionRef = useRef();
  const recognitionRef = useRef(null);

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        setStream(stream);
        myVideo.current.srcObject = stream;
      });

    socket.on("me", (id) => setMe(id));

    socket.on("callUser", (data) => {
      setReceivingCall(true);
      setCaller(data.from);
      setName(data.name); // Store the caller's name
      setCallerSignal(data.signal);
    });
    

    socket.on("transcription", (data) => {
      setTranscription((prev) =>
        prev + (prev ? '\n' : '') + `[${data.senderName || 'Peer'}]: ${data.transcript}`
      );
    });

    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
      socket.off("transcription");
    };
  }, []);

  const callUser = (id) => {
    const peer = new Peer({ initiator: true, trickle: false, stream });
    peer.on("signal", (data) => {
      socket.emit("callUser", {
        userToCall: id,
        signalData: data,
        from: me,
        name: name,  // Include the calling user's name
      });
    });
    peer.on("stream", (stream) => (userVideo.current.srcObject = stream));
    // socket.on("callAccepted", (signal) => {
    //   setCallAccepted(true);
    //   peer.signal(signal);
    // });
    socket.on("callAccepted", (data) => {
      setCallAccepted(true);
      // Store the name of the user accepting the call
      if (data.name) {
        setName(data.name); // Update name to the accepting user’s name
      }
      peer.signal(data.signal);
    });
    
    connectionRef.current = peer;
  };
  

  // const callUser = (id) => {
  //   const peer = new Peer({ initiator: true, trickle: false, stream });
  
  //   peer.on("signal", (data) => {
  //     socket.emit("callUser", {
  //       userToCall: id,
  //       signalData: data,
  //       from: me,
  //       name: name,
  //     });
  //   });
  
  //   peer.on("stream", (stream) => (userVideo.current.srcObject = stream));
  
  //   const onCallAccepted = (signal) => {
  //     setCallAccepted(true);
  //     peer.signal(signal);
  //   };
  
  //   socket.on("callAccepted", onCallAccepted);
  
  //   connectionRef.current = peer;
  
  //   // Cleanup listener if needed
  //   return () => socket.off("callAccepted", onCallAccepted);
  // };
  

  // const answerCall = () => {
  //   setCallAccepted(true);
  //   const peer = new Peer({ initiator: false, trickle: false, stream });
  //   peer.on("signal", (data) => {
  //     socket.emit("answerCall", { signal: data, to: caller, name: name }); // Include your name
  //   });
  //   peer.on("stream", (stream) => (userVideo.current.srcObject = stream));
  //   peer.signal(callerSignal);
  //   connectionRef.current = peer;
  // };

  const answerCall = () => {
    setCallAccepted(true);
    const peer = new Peer({ initiator: false, trickle: false, stream });
    peer.on("signal", (data) => {
      socket.emit("answerCall", {
        signal: data,
        to: caller,
        name: name, // Include the accepting user's name
      });
    });
    peer.on("stream", (stream) => (userVideo.current.srcObject = stream));
    peer.signal(callerSignal);
    connectionRef.current = peer;
  };
  

  // const leaveCall = () => {
  //   setCallEnded(true);
  //   connectionRef.current?.destroy();
  //   stream?.getTracks().forEach((track) => track.stop());
  //   setTranscription("");
  // };

  const leaveCall = () => {
    setCallEnded(true);
    connectionRef.current?.destroy();
    stream?.getTracks().forEach((track) => track.stop());
    socket.off("callAccepted"); // Cleanup callAccepted listener
    socket.off("transcription"); // Cleanup transcription listener
    setTranscription("");
  };
  

  const startSpeechRecognition = () => {
    if (!("webkitSpeechRecognition" in window)) {
      console.error("Speech recognition is not supported in this browser.");
      return;
    }

    if (recognitionRef.current) recognitionRef.current.stop();

    const recognition = new window.webkitSpeechRecognition();
    recognitionRef.current = recognition;

    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onstart = () => setIsRecording(true);
    recognition.onend = () => setIsRecording(false);

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      const sender = name || "Me";
      setTranscription((prev) => prev + (prev ? "\n" : "") + `[${sender}]: ${transcript}`);
      socket.emit("sendTranscription", { transcript, sender });
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error", event);
      setIsRecording(false);
    };

    recognition.start();
  };

  const stopSpeechRecognition = () => {
    setIsRecording(false);
    recognitionRef.current?.stop();
    recognitionRef.current = null;
  };

  return (
    <>
      <h1 style={{ textAlign: "center", color: "#fff" }}>Zoomish</h1>
      <div className="container">
        {!callAccepted || callEnded ? (
          <>
            <div className="video-container">
              <div className="video">
                {stream && <video playsInline muted ref={myVideo} autoPlay style={{ width: "300px" }} />}
              </div>
            </div>
            <div className="myId">
              <TextField
                id="filled-basic"
                label="Name"
                variant="filled"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{ marginBottom: "20px" }}
              />
              <CopyToClipboard text={me} style={{ marginBottom: "2rem" }}>
                <Button variant="contained" color="primary" startIcon={<AssignmentIcon fontSize="large" />}>
                  Copy ID
                </Button>
              </CopyToClipboard>
              <TextField
                id="filled-basic"
                label="ID to call"
                variant="filled"
                value={idToCall}
                onChange={(e) => setIdToCall(e.target.value)}
              />
              <div className="call-button">
                <IconButton color="primary" aria-label="call" onClick={() => callUser(idToCall)}>
                  <PhoneIcon fontSize="large" />
                </IconButton>
              </div>
            </div>
            {receivingCall && !callAccepted && (
              <div className="caller">
                <h1>{name} is calling...</h1>
                <Button variant="contained" color="primary" onClick={answerCall}>
                  Answer
                </Button>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="video-container">
              <div className="video">
                {stream && <video playsInline muted ref={myVideo} autoPlay style={{ width: "300px" }} />}
              </div>
              <div className="video">
                <video playsInline ref={userVideo} autoPlay style={{ width: "300px" }} />
              </div>
            </div>
            <div className="transcription-box" style={{ marginTop: "20px" }}>
              <TextField
                id="outlined-multiline-static"
                label="Live Transcription"
                multiline
                minRows={6}
                variant="outlined"
                value={transcription}
                fullWidth
                disabled
                style={{ maxHeight: "200px", overflowY: "auto" }}
              />
            </div>
            <div style={{ marginTop: "10px", display: "flex", gap: "10px", justifyContent: "center" }}>
              <Button variant="contained" color="secondary" onClick={leaveCall}>
                End Call
              </Button>
              <Button
                variant="contained"
                color={isRecording ? "secondary" : "primary"}
                onClick={isRecording ? stopSpeechRecognition : startSpeechRecognition}
              >
                {isRecording ? "Stop Recording" : "Start Recording"}
              </Button>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default VideoChat;

import React, { useEffect, useRef, useState } from "react";
import { CopyToClipboard } from "react-copy-to-clipboard";
import Peer from "simple-peer";
import io from "socket.io-client";
import "../Mentor.css";
import { jsPDF } from "jspdf";
import { useNavigate } from "react-router-dom";

const socket = io.connect("http://localhost:5000");

const VideoChat = () => {
  const navigate = useNavigate();

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
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
      setStream(stream);
      myVideo.current.srcObject = stream;
    });

    socket.on("me", (id) => setMe(id));

    socket.on("callUser", (data) => {
      setReceivingCall(true);
      setCaller(data.from);
      setName(data.name);
      setCallerSignal(data.signal);
    });

    socket.on("transcription", (data) => {
      setTranscription((prev) => prev + (prev ? '\n' : '') + `[${data.senderName || 'Peer'}]: ${data.transcript}`);
    });

    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
      socket.off("transcription");
    };
  }, []);

  const downloadPdfFile = () => {
    const doc = new jsPDF();
    doc.text(transcription, 10, 10);
    doc.save("transcription.pdf");
  };

  const callUser = (id) => {
    const peer = new Peer({ initiator: true, trickle: false, stream });
    peer.on("signal", (data) => {
      socket.emit("callUser", {
        userToCall: id,
        signalData: data,
        from: me,
        name,
      });
    });
    peer.on("stream", (stream) => (userVideo.current.srcObject = stream));
    socket.on("callAccepted", (data) => {
      setCallAccepted(true);
      if (data.name) setName(data.name);
      peer.signal(data.signal);
    });
    connectionRef.current = peer;
  };

  const answerCall = () => {
    setCallAccepted(true);
    const peer = new Peer({ initiator: false, trickle: false, stream });
    peer.on("signal", (data) => {
      socket.emit("answerCall", { signal: data, to: caller, name });
    });
    peer.on("stream", (stream) => (userVideo.current.srcObject = stream));
    peer.signal(callerSignal);
    connectionRef.current = peer;
  };

  const leaveCall = () => {
    setCallEnded(true);
    connectionRef.current?.destroy();
    stream?.getTracks().forEach((track) => track.stop());
    socket.off("callAccepted");
    socket.off("transcription");
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
      <h1 style={{ textAlign: "center", color: "#fff" }}>Video Chat</h1>
      <div className="container">
        {!callAccepted || callEnded ? (
          <>
            <div className="video-container">
              <div className="video">
                {stream && <video playsInline muted ref={myVideo} autoPlay style={{ width: "300px" }} />}
              </div>
              <div className="video">
                {callAccepted && !callEnded && <video playsInline ref={userVideo} autoPlay style={{ width: "300px" }} />}
              </div>
            </div>
            <div className="myId">
              <input
                type="text"
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{ marginBottom: "10px", padding: "8px", width: "100%" }}
              />
              <CopyToClipboard text={me}>
                <button style={{ marginBottom: "10px" }}>Copy ID</button>
              </CopyToClipboard>
              <input
                type="text"
                placeholder="ID to call"
                value={idToCall}
                onChange={(e) => setIdToCall(e.target.value)}
                style={{ marginBottom: "10px", padding: "8px", width: "100%" }}
              />
              <div className="call-button">
                <button onClick={() => callUser(idToCall)}>Call</button>
              </div>
            </div>
            {receivingCall && !callAccepted && (
              <div className="caller">
                <h1>{name} is calling...</h1>
                <button onClick={answerCall}>Answer</button>
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
              <textarea
                readOnly
                rows="6"
                value={transcription}
                style={{ width: "100%", maxHeight: "200px", overflowY: "auto" }}
              />
              <button onClick={downloadPdfFile}>Download as PDF</button>
            </div>
            <div style={{ marginTop: "10px", display: "flex", gap: "10px", justifyContent: "center" }}>
              <button onClick={leaveCall}>End Call</button>
              <button onClick={isRecording ? stopSpeechRecognition : startSpeechRecognition}>
                {isRecording ? "Stop Recording" : "Start Recording"}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default VideoChat;

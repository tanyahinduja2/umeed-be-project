import React, { useEffect, useRef, useState, useCallback } from "react";
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
  const [stream, setStream] = useState(null);
  const [receivingCall, setReceivingCall] = useState(false);
  const [caller, setCaller] = useState("");
  const [callerSignal, setCallerSignal] = useState(null);
  const [callAccepted, setCallAccepted] = useState(false);
  const [idToCall, setIdToCall] = useState("");
  const [callEnded, setCallEnded] = useState(false);
  const [name, setName] = useState("");
  const [transcription, setTranscription] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState("");

  const myVideo = useRef(null);
  const userVideo = useRef(null);
  const connectionRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
	if (myVideo.current && stream) {
	  myVideo.current.srcObject = stream;
	}
  }, [stream]);
  
  useEffect(() => {
	if (userVideo.current && connectionRef.current?.remoteStream) {
	  userVideo.current.srcObject = connectionRef.current.remoteStream;
	}
  }, [callAccepted]);

  useEffect(() => {
    const getMedia = async () => {
      try {
        const currentStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        setStream(currentStream);
        if (myVideo.current) {
          myVideo.current.srcObject = currentStream;
        }
      } catch (err) {
        console.error("Media error:", err);
        setError("Please allow camera and microphone access.");
      }
    };

    getMedia();

    socket.on("me", (id) => setMe(id));

    socket.on("callUser", (data) => {
      setReceivingCall(true);
      setCaller(data.from);
      setCallerSignal(data.signal);
    });

    socket.on("transcription", (data) => {
      setTranscription((prev) =>
        prev + (prev ? "\n" : "") + `[${data.senderName || "Peer"}]: ${data.transcript}`
      );
    });

    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
      if (stream) stream.getTracks().forEach((track) => track.stop());
      socket.off("me");
      socket.off("callUser");
      socket.off("transcription");
    };
  }, []);

  const callUser = (id) => {
    if (!stream) {
      setError("Camera/mic access required.");
      return;
    }

    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream,
      config: { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] },
    });

    peer.on("signal", (data) => {
      socket.emit("callUser", {
        userToCall: id,
        signalData: data,
        from: me,
        name: name.trim() || "Anonymous",
      });
    });

    peer.on("stream", (incomingStream) => {
		console.log("Received remote stream:", incomingStream);
		if (userVideo.current) {
		  userVideo.current.srcObject = incomingStream;
		}
	  });

	  peer.on("connect", () => {
		console.log("Peer connection established");
	  });
	  peer.on("error", (err) => {
		console.error("Peer connection error:", err);
	  });


    socket.on("callAccepted", (data) => {
      setCallAccepted(true);
      if (!peer.destroyed) {
        try {
          peer.signal(data.signal);
        } catch (err) {
          console.error("Signal error:", err);
        }
      }
    });

    connectionRef.current = peer;
  };

  const answerCall = () => {
    if (!stream) {
      setError("Camera/mic access required.");
      return;
    }

    setCallAccepted(true);

    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream,
      config: { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] },
    });

    peer.on("signal", (data) => {
      socket.emit("answerCall", {
        signal: data,
        to: caller,
        name: name.trim() || "Anonymous",
      });
    });

    peer.on("stream", (incomingStream) => {
      if (userVideo.current) userVideo.current.srcObject = incomingStream;
    });

    peer.on("error", (err) => console.error("Peer error:", err));

    if (!peer.destroyed) {
      try {
        peer.signal(callerSignal);
      } catch (err) {
        console.error("Signal error:", err);
      }
    }

    connectionRef.current = peer;
  };

  const leaveCall = () => {
    setCallEnded(true);

    if (connectionRef.current) connectionRef.current.destroy();
    if (stream) stream.getTracks().forEach((track) => track.stop());

    socket.off("callAccepted");
    socket.off("transcription");

    setTranscription("");
    setReceivingCall(false);
    setCallAccepted(false);
  };

  const handleNameChange = useCallback((e) => {
    setName(e.target.value);
  }, []);

  const downloadPdfFile = () => {
    const doc = new jsPDF();
    doc.text(transcription, 10, 10);
    doc.save("transcription.pdf");
  };

  const startSpeechRecognition = () => {
    if (!("webkitSpeechRecognition" in window)) {
      setError("Speech recognition not supported.");
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
      console.error("Speech error", event);
      setIsRecording(false);
      setError("Speech recognition error occurred.");
    };

    recognition.start();
  };

  const stopSpeechRecognition = () => {
    setIsRecording(false);
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
  };

  return (
	<>
	  <h1 style={{ textAlign: "center", color: "#fff" }}>Video Chat</h1>
  
	  {error && (
		<div style={{ textAlign: "center", color: "red", margin: "10px 0" }}>
		  {error}
		  <button onClick={() => setError("")} style={{ marginLeft: "10px", background: "transparent", border: "none", color: "white", cursor: "pointer" }}>
			✕
		  </button>
		</div>
	  )}
  
	  <div className="container">
		<div className="video-container">
		  <div className="video">
			<video
			  ref={myVideo}
			  playsInline
			  muted
			  autoPlay
			  style={{ width: "300px", backgroundColor: "#000" }}
			/>
		  </div>
		  <div className="video">
			<video
			  ref={userVideo}
			  playsInline
			  autoPlay
			  style={{ width: "300px" }}
			/>
		  </div>
		</div>
  
		{!callAccepted && !callEnded && (
		  <div className="myId">
			<input
			  type="text"
			  placeholder="Name"
			  value={name}
			  onChange={(e) => setName(e.target.value)}
			  style={{ marginBottom: "10px", padding: "8px", width: "100%" }}
			/>
			<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
			  <span style={{ color: "#fff", wordBreak: "break-all", marginRight: "10px" }}>
				{me && `Your ID: ${me.substring(0, 10)}...`}
			  </span>
			  <CopyToClipboard text={me}>
				<button>Copy ID</button>
			  </CopyToClipboard>
			</div>
			<input
			  type="text"
			  placeholder="ID to call"
			  value={idToCall}
			  onChange={(e) => setIdToCall(e.target.value)}
			  style={{ marginBottom: "10px", padding: "8px", width: "100%" }}
			/>
			<div className="call-button">
			  <button onClick={() => callUser(idToCall)} disabled={!idToCall || !stream}>
				Call
			  </button>
			</div>
		  </div>
		)}
  
		{receivingCall && !callAccepted && (
		  <div className="caller">
			<h1>Someone is calling...</h1>
			<button onClick={answerCall}>Answer</button>
		  </div>
		)}
  
		{callAccepted && !callEnded && (
		  <>
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

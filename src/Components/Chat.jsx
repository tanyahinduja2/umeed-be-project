import React, { useState, useEffect } from "react";
import { db } from "../firebaseConfig";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import "../Mentor.css";
import { MdSend } from "react-icons/md"; // Paper plane icon from Material Design

// SpeechRecognition setup for voice input
const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
recognition.lang = "en-US";
recognition.continuous = false;

const Chat = ({ user }) => {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [isRecognizing, setIsRecognizing] = useState(false); // Track the recognition state

  const messagesRef = collection(db, "messages"); // Firestore collection

  // Load messages from Firestore
  useEffect(() => {
    const q = query(messagesRef, orderBy("timestamp"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsubscribe(); // Unsubscribe when component unmounts
  }, []);

  // Read out the welcome message, last message and prompt for voice input
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      const messageContent = `${lastMessage.sender}: ${lastMessage.content}`;

      // Welcome message
      const welcomeMsg = new SpeechSynthesisUtterance(
        `Welcome to the chat, ${user.name}!`
      );
      window.speechSynthesis.speak(welcomeMsg);

      // Read out the last message
      const lastMsg = new SpeechSynthesisUtterance(messageContent);
      window.speechSynthesis.speak(lastMsg);

      // Ask if the user wants to speak a new message
      const askToSpeakMsg = new SpeechSynthesisUtterance(
        "Would you like to speak your message?"
      );
      window.speechSynthesis.speak(askToSpeakMsg);

      // Listen for user's response after asking for voice input
      if (!isRecognizing) {
        recognition.start();
        setIsRecognizing(true); // Prevent starting recognition multiple times
      }

      recognition.onresult = (event) => {
        const speechResult = event.results[0][0].transcript.toLowerCase();
        if (speechResult.includes("yes")) {
          // If user says yes, prompt for message input
          const promptToSpeakMsg = new SpeechSynthesisUtterance(
            "Please say the message you want to send."
          );
          window.speechSynthesis.speak(promptToSpeakMsg);

          if (!isRecognizing) {
            recognition.start();
            setIsRecognizing(true); // Prevent starting recognition multiple times
          }

          recognition.onresult = (event) => {
            const messageText = event.results[0][0].transcript;
            setMessage(messageText); // Set the message input as the voice input
            const sendMsg = new SpeechSynthesisUtterance(
              `You said: ${messageText}. Your message will be sent now.`
            );
            window.speechSynthesis.speak(sendMsg);
          };
        } else {
          // If the user says something else
          const errorMsg = new SpeechSynthesisUtterance(
            "Please respond with 'yes' if you'd like to speak your message."
          );
          window.speechSynthesis.speak(errorMsg);
        }
      };
    }
  }, [messages, isRecognizing]); // Trigger this when messages change or recognition state

  // Function to send message
  const sendMessage = async () => {
    if (message.trim() === "") return;

    await addDoc(messagesRef, {
      sender: user.name,
      content: message,
      timestamp: serverTimestamp(),
    });

    setMessage(""); // Clear input field
  };

  // Function to give instructions to type a message
  useEffect(() => {
    const msg = new SpeechSynthesisUtterance("Please type your message below.");
    window.speechSynthesis.speak(msg);
  }, []);

  return (
    <div className="chat-container">
      <div className="navbar">
        <div className="logo">Umeed</div>
        <div className="nav-links">
          <button className="btn" onClick={() => (window.location.href = "/")}>
            <p>Home</p>
          </button>
          <button
            className="btn"
            onClick={() => (window.location.href = "/video-call")}
          >
            Video Call
          </button>
        </div>
      </div>
      <h2 className="chat-heading">Chat with Mentor</h2>
      <div className="chat-box">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`chat-message ${
              msg.sender === user.name ? "sent" : "received"
            }`}
            style={{
              textAlign: msg.sender === user.name ? "right" : "left",
            }}
          >
            <p>
              <strong>{msg.sender}:</strong> {msg.content}
            </p>
            <small>
              {msg.timestamp && msg.timestamp.seconds
                ? new Date(msg.timestamp.seconds * 1000).toLocaleTimeString()
                : "Sending..."}
            </small>
          </div>
        ))}
      </div>
      <div className="chat-input">
        <input
          type="text"
          placeholder="Type a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button onClick={sendMessage}>
          <MdSend size={24} /> {/* Use the MdSend icon */}
        </button>
      </div>
    </div>
  );
};

export default Chat;

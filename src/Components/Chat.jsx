import React, { useState, useEffect } from "react";
import { db } from "../firebaseConfig";
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from "firebase/firestore";
import "../Mentor.css";

const Chat = ({ user }) => {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");

  const messagesRef = collection(db, "messages"); // Firestore collection

  // Load messages from Firestore
  useEffect(() => {
    const q = query(messagesRef, orderBy("timestamp"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsubscribe(); // Unsubscribe when component unmounts
  }, []);

  // Function to send message
  const sendMessage = async () => {
    if (message.trim() === "") return;

    await addDoc(messagesRef, {
      sender: user.displayName,
      content: message,
      timestamp: serverTimestamp(),
    });

    setMessage(""); // Clear input field
  };

  return (
    <div className="chat-container">
      <h2>Mentor Chat</h2>
      <div className="chat-box">
      {messages.map((msg) => (
  <div key={msg.id} className={`chat-message ${msg.sender === user.displayName ? "sent" : "received"}`}>
    <p><strong>{msg.sender}:</strong> {msg.content}</p>
    <small>
      {msg.timestamp && msg.timestamp.seconds
        ? new Date(msg.timestamp.seconds * 1000).toLocaleTimeString()
        : "Sending..."}
    </small>
  </div>))}
      </div>
      <div className="chat-input">
        <input
          type="text"
          placeholder="Type a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
};

export default Chat;
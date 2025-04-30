import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import "./Mentor.css";

/* global webkitSpeechRecognition */

const MentorPage = () => {
  const [mentors, setMentors] = useState([]);
  const [userType, setUserType] = useState("");
  const [loading, setLoading] = useState(true);
  const [listening, setListening] = useState(false);
  const navigate = useNavigate();

  const db = getFirestore();
  const auth = getAuth();

  const speakText = (text, callback = null) => {
    if ("speechSynthesis" in window) {
      const speech = new SpeechSynthesisUtterance(text);
      speech.lang = "en-US";
      speech.onend = () => {
        if (callback) callback();
      };
      window.speechSynthesis.speak(speech);
    }
  };

  const startListening = () => {
    if ("webkitSpeechRecognition" in window) {
      setListening(true);
      const recognition = new webkitSpeechRecognition();
      recognition.lang = "en-US";
      recognition.interimResults = false;

      recognition.onresult = (event) => {
        setListening(false);
        const transcript = event.results[0][0].transcript.toLowerCase();
        handleVoiceCommand(transcript);
      };

      recognition.onerror = () => {
        setListening(false);
        speakText("Speech recognition error.");
      };

      recognition.start();
    }
  };

  const handleVoiceCommand = (command) => {
    if (command.includes("scroll down")) {
      window.scrollBy(0, 300);
    } else if (command.includes("scroll up")) {
      window.scrollBy(0, -300);
    } else if (command.includes("chat with")) {
      const name = command.replace("chat with", "").trim();
      const mentor = mentors.find(
        (m) => m.name.toLowerCase() === name.toLowerCase()
      );
      if (mentor) {
        speakText(`Opening chat with ${name}`);
        navigate(`/chat`);
      } else {
        speakText(`Mentor named ${name} not found`);
      }
    } else if (command.includes("call")) {
      const name = command.replace("call", "").trim();
      const mentor = mentors.find(
        (m) => m.name.toLowerCase() === name.toLowerCase()
      );
      if (mentor) {
        speakText(`Starting video call with ${name}`);
        navigate(`/video-call`);
      } else {
        speakText(`Mentor named ${name} not found`);
      }
    } else {
      speakText("Sorry, I did not understand that.");
    }
  };

  useEffect(() => {
    const fetchUserAndMentors = async (uid) => {
      try {
        const userDocs = await getDocs(collection(db, "users"));
        const userData = userDocs.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        const currentUser = userData.find((u) => u.uid === uid);

        if (currentUser?.userType === "mentor") {
          navigate("/chat");
        } else {
          setUserType("user");
          const mentorList = userData.filter((u) => u.userType === "mentor");
          setMentors(mentorList);
          speakText("Welcome user. Here are your available mentors.");
        }
      } catch (err) {
        console.error("Error loading data:", err);
      } finally {
        setLoading(false);
      }
    };

    onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchUserAndMentors(user.uid);
      } else {
        navigate("/login");
      }
    });
  }, [auth, db, navigate]);

  useEffect(() => {
    speakText(
      "Say commands like scroll down, chat with mentor name, or call mentor name.",
      () => {
        startListening();
      }
    );
  }, [mentors]);

  if (loading) return <p>Loading...</p>;

  return (
    <div className="mentor-page">
      <div className="navbar">
        <div className="logo">Umeed</div>
        <div className="nav-links">
          <button
            className="btn"
            onClick={() => (window.location.href = "/")}
          >
            <p>Home</p>
          </button>
          <button
            className="btn"
            onClick={() => (window.location.href = "/application")}
          >
            Apply
          </button>
        </div>
      </div>
      <h1 className="mentor-heading">Connect with Our Mentors</h1>
      {listening && <p className="listening"></p>}
      {userType === "user" && mentors.length > 0 ? (
        <div className="mentor-cards">
          {mentors.map((mentor) => (
            <div className="mentor-card" key={mentor.id}>
              <div className="mentor-head">{mentor.name}</div>
              <div className="mentor-content">
                <p>Disability Type: {mentor.disabilityType}</p>
                <p>Email: {mentor.email}</p>
                <br />
                <div className="mentor-buttons">
                  <button
                    className="mentor-button"
                    onClick={() => navigate(`/chat`)}
                  >
                    Chat
                  </button>
                  <button
                    className="mentor-button"
                    onClick={() => navigate(`/video-call`)}
                  >
                    Video Call
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p>No mentors available.</p>
      )}
    </div>
  );
};

export default MentorPage;

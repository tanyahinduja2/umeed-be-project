import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./SignupPage.css";
import leftImage from "./assets/images/Signup2.png";

import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "./firebaseConfig"; // Adjust the path if needed

/* global webkitSpeechRecognition */
const SignupPage = () => {
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    password: "",
    confirmPassword: "",
    userType: "user",
    disabilityType: "",
    udid: "",
    phone: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [mode, setMode] = useState(null);
  const [currentField, setCurrentField] = useState(null);
  const [listening, setListening] = useState(false);
  const navigate = useNavigate();

  const speakText = (text, callback = null) => {
    if ("speechSynthesis" in window) {
      const speech = new SpeechSynthesisUtterance(text);
      speech.lang = "en-US";
      speech.onend = () => callback?.();
      window.speechSynthesis.speak(speech);
    } else {
      alert("Text-to-Speech is not supported in this browser.");
    }
  };

  const startSpeechRecognition = (field, onComplete) => {
    if ("webkitSpeechRecognition" in window) {
      setListening(true);
      const recognition = new webkitSpeechRecognition();
      recognition.lang = "en-US";
      recognition.interimResults = false;

      recognition.onresult = (event) => {
        setListening(false);
        let transcript = event.results[0][0].transcript.toLowerCase().trim();

        if (field === "email") {
          transcript = transcript
            .replace(/at the rate/gi, "@")
            .replace(/ /g, "");
        } else if (field === "role") {
          if (transcript.includes("mentor")) {
            transcript = "mentor";
          } else {
            transcript = "user";
          }
        }

        setFormData((prev) => ({ ...prev, [field]: transcript }));
        speakText(`You entered ${transcript}`, onComplete);
      };

      recognition.onerror = () => {
        setListening(false);
        setError("Speech recognition failed. Please try again.");
      };

      recognition.start();
    } else {
      alert("Speech recognition is not supported in this browser.");
    }
  };

  const fieldOrder = [
    "email",
    "name",
    "password",
    "confirmPassword",
    "role",
    "disabilityType",
    "udid",
    "phone",
  ];

  const proceedToNextField = (current) => {
    const currentIndex = fieldOrder.indexOf(current);
    if (currentIndex < fieldOrder.length - 1) {
      const nextField = fieldOrder[currentIndex + 1];
      setCurrentField(nextField);
      speakText(`Please provide your ${nextField}`, () =>
        startSpeechRecognition(nextField, () => proceedToNextField(nextField))
      );
    } else {
      speakText("All fields are filled. Press Enter to submit.");
    }
  };

  const handleSubmit = async () => {
    setError(""); // Clear previous errors

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      speakText("Passwords do not match. Please re-enter.");
      return;
    }

    try {
      const q = query(
        collection(db, "validUDIDs"),
        where("udid_num", "==", formData.udid.trim())
      );
      const querySnapshot = await getDocs(q);
  
      if (querySnapshot.empty) {
        alert("UDID not registered or valid. Please check your UDID number.");
        speakText("UDID not registered or valid. Please check your UDID number.");
        return;
      }

      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      const actualUID = userCredential.user.uid;

      const userData = {
        uid: actualUID,
        email: formData.email.trim(),
        name: formData.name.trim(),
        userType: formData.userType,
        disabilityType: formData.disabilityType.trim(),
        udid: formData.udid.trim(),
        phone: formData.phone.trim(),
      };

      await setDoc(doc(db, "users", actualUID), userData);

      setSuccess("Signup successful!");
      speakText("Signup successful! Redirecting to the login page.", () => {
        navigate("/login");
      });
    } catch (err) {
      console.error("Signup error:", err);
      setError(err.message || "An error occurred. Please try again.");
      speakText("An error occurred. Please try again.");
    }
  };

  // New function to handle UDID checking
  const checkUDID = async () => {
    try {
      const q = query(
        collection(db, "validUDIDs"),
        where("udid_num", "==", formData.udid.trim())
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        alert("UDID not registered or valid. Please check your UDID number.");
        speakText("UDID not registered or valid. Please check your UDID number.");
      } else {
        alert("UDID is valid!");
        speakText("UDID is valid!");
      }
    } catch (err) {
      console.error("Error checking UDID:", err);
      alert("An error occurred while checking the UDID. Please try again.");
      speakText("An error occurred while checking the UDID. Please try again.");
    }
  };

  useEffect(() => {
    const welcomeMessage =
      'Welcome to the signup page. Say "typing mode" to use your keyboard, or say "speaking mode" to provide your details verbally.';
    speakText(welcomeMessage, () => {
      const recognition = new webkitSpeechRecognition();
      recognition.lang = "en-US";
      recognition.interimResults = false;

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript.toLowerCase();
        if (transcript.includes("typing mode")) {
          setMode("typing");
          speakText("Typing mode activated. Please fill out the form.");
        } else if (transcript.includes("speaking mode")) {
          setMode("speaking");
          setCurrentField("email");
          speakText("Speaking mode activated. Please provide your email.", () =>
            startSpeechRecognition("email", () => proceedToNextField("email"))
          );
        } else {
          speakText(
            'Command not recognized. Please say "typing mode" or "speaking mode".'
          );
        }
      };

      recognition.onerror = () => console.error("Speech recognition error.");
      recognition.start();
    });
  }, []);

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === "Enter") {
        handleSubmit();
      }
    };
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [formData]);

  return (
    <div className="signup-page">
      <div className="left-section">
        <h2>Stay on top of Job tracking</h2>
        <p>
          "Join us today to explore inclusive career opportunities and unlock
          your potential. It's simple and accessible for everyone!"
        </p>
        <img src={leftImage} alt="Time Tracking" />
      </div>

      <div className="right-section">
        <h1>Create Account</h1>
        {mode === "speaking" && (
          <p className="instructions">Speaking Mode Active</p>
        )}
        {listening && <p className="listening-indicator">Listening...</p>}
        <form onSubmit={(e) => e.preventDefault()}>
          <div>
            <label>Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
          </div>
          <div>
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />
          </div>
          <div>
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
            />
          </div>
          <div>
            <label>Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={(e) =>
                setFormData({ ...formData, confirmPassword: e.target.value })
              }
            />
          </div>
          <div>
            <label>Are you a user or mentor?</label>
            <div>
              <label>
                <input
                  type="radio"
                  name="userType"
                  value="user"
                  checked={formData.userType === "user"}
                  onChange={(e) =>
                    setFormData({ ...formData, userType: e.target.value })
                  
                  }
                  style={{marginTop: "0"}}
                />
                User
              </label>
              <label>
                <input
                  type="radio"
                  name="userType"
                  value="mentor"
                  checked={formData.userType === "mentor"}
                  onChange={(e) =>
                    setFormData({ ...formData, userType: e.target.value })
                  }
                />
                Mentor
              </label>
            </div>

            <div>
            <label>Type of Disability</label>
            <input
              type="text"
              name="disabilityType"
              value={formData.disabilityType}
              onChange={(e) =>
                setFormData({ ...formData, disabilityType: e.target.value })
              }
            />
             </div>

            <div>
            <label>UDID</label>
            <div className="udidDiv">
            <input
              type="text"
              name="udid"
              value={formData.udid}
              onChange={(e) =>
                setFormData({ ...formData, udid: e.target.value })
              }
            />
            <button type="button" onClick={checkUDID}>
              Check UDID
            </button>
            </div>
            </div>

            <label>Phone</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
            />
          </div>
          {error && <p style={{ color: "red" }}>{error}</p>}
          {success && <p style={{ color: "green" }}>{success}</p>}
          <button type="button" onClick={handleSubmit}>
            Create Account
          </button>
        </form>
        <div className="alt-login">
          <p>
            Already have an account? <a href="/login">Login</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;

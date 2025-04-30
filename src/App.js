import React, { createContext, useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { auth } from "./firebaseConfig";
import HomePage from "./HomePage";
import ApplicationPage from "./ApplicationPage";
import LoginPage from "./LoginPage";
import SignupPage from "./SignupPage";
import MentorPage from "./MentorPage";
import VideoChat from "./Components/VideoChat";
import Login from "./Components/Login";
import Chat from "./Components/Chat";
import VideoCall from "./VideoCall"
import { onAuthStateChanged,getAuth } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";

export const UserContext = createContext(null);

const App = () => {
  const auth = getAuth();
  const [user, setUser] = useState(null);
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        const db = getFirestore();
        const userDocRef = doc(db, "users", authUser.uid);

        try {
          const userDocSnapshot = await getDoc(userDocRef);
          if (userDocSnapshot.exists()) {
            setUser(userDocSnapshot.data());
          } else {
            console.error("User data not found in Firestore");
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      } else {
        setUser(null);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);
  return (
    <UserContext.Provider value={user}>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/application" element={<ApplicationPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/mentor" element={<MentorPage />} />
          <Route path="/login" element={<Login setUser={setUser} />} />
          <Route
            path="/chat"
            element={user ? <Chat user={user} /> : <Login setUser={setUser} />}
          />
          <Route path="/video-chat" element={<VideoChat />} />
          <Route path="/video-call" element={<VideoCall />} />
        </Routes>
      </Router>
    </UserContext.Provider>
  );
};

export default App;

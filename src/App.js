import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { auth } from "./firebaseConfig";
import HomePage from './HomePage';
import ApplicationPage from './ApplicationPage';
import LoginPage from './LoginPage';
import SignupPage from './SignupPage';
import MentorPage from './Mentor';
import VideoChat from './Components/VideoChat';
import Login from './Components/Login';
import Chat from './Components/Chat';

const App = () => {
    const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

    return (
        <Router>
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/application" element={<ApplicationPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/mentor" element={<MentorPage />} />
                <Route path="/login" element={<Login setUser={setUser}/>} />
                <Route path="/chat" element={user ? <Chat user={user} /> : <Login setUser={setUser} />} />
                <Route path="/video-chat" element={<VideoChat />} />
            </Routes>
        </Router>
    );
};

export default App;

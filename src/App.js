import React, { useState, useEffect } from "react";
import './App.css';
import { auth } from "./firebaseConfig";
import VideoChat from './Components/VideoChat';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from './Components/Login';
import Chat from './Components/Chat';

function App() {
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
        <Route path="/" element={<VideoChat />} />
        <Route path="/login" element={<Login setUser={setUser}/>} />
        <Route path="/chat" element={user ? <Chat user={user} /> : <Login setUser={setUser} />} />
      </Routes>
    </Router>
  );
}

export default App;

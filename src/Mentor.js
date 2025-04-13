import React, { useState, useEffect } from "react";
import "./Mentor.css";
import { auth } from "./firebaseConfig";
import VideoChat from './Components/VideoChat';
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
    <></>
  );
}

export default App;
/* global webkitSpeechRecognition */
import React, { useEffect } from 'react';

const HomePage = () => {
    // Text-to-Speech Function
    const speakText = (text, callback = null) => {
        if ('speechSynthesis' in window) {
            const speech = new SpeechSynthesisUtterance(text);
            speech.lang = 'en-US';
            speech.pitch = 1;
            speech.rate = 1;

            speech.onend = () => {
                if (callback) callback(); // Trigger callback when speech ends
            };

            window.speechSynthesis.speak(speech);
        } else {
            alert('Text-to-Speech is not supported in this browser.');
        }
    };

    // Speech-to-Text for Navigation
    const startVoiceNavigation = () => {
        if ('webkitSpeechRecognition' in window) {
            const recognition = new webkitSpeechRecognition();
            recognition.lang = 'en-US';
            recognition.interimResults = false;

            recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript.toLowerCase();

                if (transcript.includes('go to login page')) {
                    window.location.href = '/login'; // Navigate to login Page
                } else if (transcript.includes('go to sign up page')) {
                    window.location.href = '/signup'; // Navigate to Signup Page
                }else if (transcript.includes('say again')) {
                    speakText('Welcome to the Accessible Jobs Portal. Say "go to Login page" or "go to Signup Page" to navigate or "say again".');
                } else {
                    speakText('Command not recognized. Please say "go to Login page" or "go to Signup Page" or "say again".', startVoiceNavigation);
                }
            };

            recognition.onerror = () => {
                console.error('Speech recognition error.');
                speakText('There was an error. Please try again.', startVoiceNavigation);
            };

            recognition.start();
        } else {
            alert('Speech recognition is not supported in this browser.');
        }
    };

    useEffect(() => {
        const handleInteraction = () => {
            const welcomeMessage = 'Welcome to the Accessible Jobs Portal. Say "go to Login page" or "go to Signup Page" to navigate or "say again".';
            speakText(welcomeMessage, startVoiceNavigation); // Start TTS and Speech Recognition
            window.removeEventListener('click', handleInteraction); // Remove interaction listener
        };

        // Listen for user interaction to trigger autoplay
        window.addEventListener('click', handleInteraction);

        // Cleanup listener on component unmount
        return () => {
            window.removeEventListener('click', handleInteraction);
        };
    }, []);

    return (
        <div>
            <h1>Welcome to Accessible Jobs Portal</h1>
            <p>This portal empowers people with disabilities to find inclusive job opportunities.</p>
            <p>Say "go to Login page" or "go to Signup Page" to navigate to the next page, or "say again" to repeat instructions.</p>
        </div>
    );
};

export default HomePage;

/* global webkitSpeechRecognition */
import React, { useEffect } from 'react';
import './HomePage.css';

const HomePage = () => {
    // Text-to-Speech Function
    const speakText = (text, callback = null) => {
        if ('speechSynthesis' in window) {
            const speech = new SpeechSynthesisUtterance(text);
            speech.lang = 'en-US';
            speech.pitch = 1;
            speech.rate = 1;

            speech.onend = () => {
                if (callback) callback();
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
                    window.location.href = '/login';
                } else if (transcript.includes('go to sign up page')) {
                    window.location.href = '/signup';
                } else if (transcript.includes('say again')) {
                    speakText('Welcome to Umeed – Your Gateway to Inclusive Careers. Say "go to Login page," "go to Signup page," or "say again" to repeat instructions.');
                } else {
                    speakText('Command not recognized. Please say "go to Login page," "go to Signup page," or "say again".', startVoiceNavigation);
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
            const welcomeMessage = 'Welcome to Umeed – Your Gateway to Inclusive Careers. Say "go to Login page," "go to Signup page," or "say again" to repeat instructions.';
            speakText(welcomeMessage, startVoiceNavigation);
            window.removeEventListener('click', handleInteraction);
        };

        window.addEventListener('click', handleInteraction);

        return () => {
            window.removeEventListener('click', handleInteraction);
        };
    }, []);

    return (
        <div className="home-page">
            <div className="container">
                {/* Hero Section */}
                <section className="hero-section">
                    <h1>Welcome to <span className="highlight">Umeed</span></h1>
                    <p className="description">
                        Your Gateway to Inclusive Careers. <br />
                        To get started, simply say: <br />
                        <strong>"Go to Login page"</strong> <br />
                        <strong>"Go to Signup page"</strong><br />
                        <strong>"Say again"</strong>
                    </p>
                    <div className="button-group">
                        <button className="btn login-btn" onClick={() => (window.location.href = '/login')}>Login</button>
                        <button className="btn signup-btn" onClick={() => (window.location.href = '/signup')}>Signup</button>
                    </div>
                </section>

                {/* About Us Section */}
                <section className="about-us-section">
                    <h2>About Us</h2>
                    <p>
                        Umeed is dedicated to fostering an inclusive world by bridging the gap between individuals with disabilities and employers who value diversity.
                    </p>
                    <p>
                        Whether you're seeking your first job or aiming to advance your career, Umeed provides the tools and resources you need to succeed.
                    </p>
                </section>
            </div>
        </div>
    );
};

export default HomePage;

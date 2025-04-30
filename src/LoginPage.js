import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from './firebaseConfig'; // adjust the path based on your file structure
import './LoginPage.css';
import loginImg from "./assets/images/login.png";

/* global webkitSpeechRecognition */
const LoginPage = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [error, setError] = useState('');
    const [listening, setListening] = useState(false);
    const [isTyping, setIsTyping] = useState(false);  // Track if user is typing
    const navigate = useNavigate();
    let speechSynthesisInstance = null;  // To hold speech synthesis instance

    const speakText = (text, callback = null) => {
        if ('speechSynthesis' in window) {
            const speech = new SpeechSynthesisUtterance(text);
            speech.lang = 'en-US';
            speech.onend = () => {
                if (callback) callback();
            };
            speechSynthesisInstance = speech;  // Keep reference to speech instance
            window.speechSynthesis.speak(speech);
        } else {
            alert('Text-to-Speech is not supported in this browser.');
        }
    };

    const startSpeechRecognition = (field, onComplete) => {
        if ('webkitSpeechRecognition' in window) {
            setListening(true);
            const recognition = new webkitSpeechRecognition();
            recognition.lang = 'en-US';
            recognition.interimResults = false;

            recognition.onresult = (event) => {
                setListening(false);
                let transcript = event.results[0][0].transcript;
                if (field === 'email') {
                    transcript = transcript.replace(/at the rate/gi, '@').replace(/ /g, '');
                }
                setFormData((prev) => ({
                    ...prev,
                    [field]: transcript,
                }));
                speakText(`You entered ${transcript}`, onComplete);
            };

            recognition.onerror = () => {
                setListening(false);
                setError('Speech recognition failed. Please try again.');
                speakText('Speech recognition failed. Please try again.');
            };

            recognition.start();
        } else {
            alert('Speech recognition is not supported in this browser.');
        }
    };

    const handleSubmit = async () => {
        setError('');
        if (!formData.email.trim() || !formData.password.trim()) {
            setError('Both email and password are required.');
            speakText('Both email and password are required. Please fill them before submitting.');
            return;
        }

        try {
            const userCredential = await signInWithEmailAndPassword(auth, formData.email.trim(), formData.password.trim());
            const user = userCredential.user;
            speakText('Login successful! Redirecting to the application page.', () => {
                navigate('/application', { state: { userName: user.email } });
            });
        } catch (err) {
            console.error('Login error:', err.message);
            setError('Login failed. Please check your credentials.');
            speakText('Login failed. Please check your credentials and try again.');
        }
    };

    const proceedToNextField = (current) => {
        const fieldOrder = ['email', 'password'];
        const currentIndex = fieldOrder.indexOf(current);
        if (currentIndex < fieldOrder.length - 1) {
            const nextField = fieldOrder[currentIndex + 1];
            speakText(`Please provide your ${nextField}`, () =>
                startSpeechRecognition(nextField, () => proceedToNextField(nextField))
            );
        } else {
            speakText('All fields are filled. Press Enter to submit.');
        }
    };

    const handleTyping = (e, field) => {
        setIsTyping(true);  // User is typing
        if (speechSynthesisInstance) {
            window.speechSynthesis.cancel();  // Stop any ongoing speech
            speechSynthesisInstance = null;  // Reset the speech synthesis instance
        }
        setFormData({ ...formData, [field]: e.target.value });
    };

    const handleFocus = (field) => {
        if (!isTyping) {
            speakText(`Please provide your ${field}`);
        }
    };

    useEffect(() => {
        const welcomeMessage =
            'Welcome to the login page. Say "typing mode" to use your keyboard, or say "speaking mode" to provide your details verbally.';
        speakText(welcomeMessage, () => {
            const recognition = new webkitSpeechRecognition();
            recognition.lang = 'en-US';
            recognition.interimResults = false;

            recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript.toLowerCase();
                if (transcript.includes('typing mode')) {
                    speakText('Typing mode activated. Please fill out the form.');
                } else if (transcript.includes('speaking mode')) {
                    speakText('Speaking mode activated. Please provide your email.', () =>
                        startSpeechRecognition('email', () => proceedToNextField('email'))
                    );
                } else {
                    speakText('Command not recognized. Please say "typing mode" or "speaking mode".');
                }
            };

            recognition.onerror = () => {
                console.error('Speech recognition error.');
            };

            recognition.start();
        });
    }, []);

    useEffect(() => {
        const handleKeyPress = (e) => {
            if (e.key === 'Enter') {
                handleSubmit();
            }
        };
        window.addEventListener('keydown', handleKeyPress);
        return () => {
            window.removeEventListener('keydown', handleKeyPress);
        };
    }, [formData]);

    return (
        <div className="login-page">
            <div className="login-overlay"></div>

            <div className="login-container">
                <h1>Login</h1>
                <form onSubmit={(e) => e.preventDefault()}>
                    <div>
                        <label>Email:</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={(e) => handleTyping(e, 'email')}
                            onFocus={() => handleFocus('email')}
                        />
                    </div>
                    <div>
                        <label>Password:</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={(e) => handleTyping(e, 'password')}
                            onFocus={() => handleFocus('password')}
                        />
                    </div>
                    {error && <p className="error-message">{error}</p>}
                    <button type="button" onClick={handleSubmit}>
                        Login
                    </button>
                </form>
                {listening && <p className="listening">Listening...</p>}
            </div>
            <div>
                <img src={loginImg} alt="login" />
            </div>
        </div>
    );
};

export default LoginPage;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginPage.css'; 

/* global webkitSpeechRecognition */
const LoginPage = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [error, setError] = useState('');
    const [listening, setListening] = useState(false); // Track if STT is active
    const navigate = useNavigate(); // For navigation

    // Text-to-Speech (TTS)
    const speakText = (text, callback = null) => {
        if ('speechSynthesis' in window) {
            const speech = new SpeechSynthesisUtterance(text);
            speech.lang = 'en-US';

            speech.onend = () => {
                if (callback) callback();
            };

            window.speechSynthesis.speak(speech);
        } else {
            alert('Text-to-Speech is not supported in this browser.');
        }
    };

    // Speech-to-Text (STT)
    const startSpeechRecognition = (field, onComplete) => {
        if ('webkitSpeechRecognition' in window) {
            setListening(true);
            const recognition = new webkitSpeechRecognition();
            recognition.lang = 'en-US';
            recognition.interimResults = false;

            recognition.onresult = (event) => {
                setListening(false);
                let transcript = event.results[0][0].transcript;

                // Replace "at the rate" with "@" for email field
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
            };

            recognition.start();
        } else {
            alert('Speech recognition is not supported in this browser.');
        }
    };

    // Handle form submission
    const handleSubmit = async () => {
        if (!formData.email.trim() || !formData.password.trim()) {
            setError('Both email and password are required.');
            speakText('Both email and password are required. Please fill them before submitting.');
            return;
        }

        try {
            // Call backend API for login
            const response = await fetch('http://localhost:5000/api/users/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: formData.email.trim(),
                    password: formData.password.trim(),
                }),
            });

            const data = await response.json();

            if (response.ok) {
                speakText('Login successful! Redirecting to the application page.', () => {
                    navigate('/application'); // Navigate to application page
                });
            } else {
                setError(data.message || 'Login failed. Please try again.');
                speakText('Login failed. Please try again.');
            }
        } catch (err) {
            console.error('Error:', err);
            setError('An error occurred. Please try again.');
            speakText('An error occurred. Please try again.');
        }
    };

    // Navigate through fields in speaking mode
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

    // Start verbal interaction on page load
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
                    speakText(
                        'Command not recognized. Please say "typing mode" or "speaking mode".'
                    );
                }
            };

            recognition.onerror = () => {
                console.error('Speech recognition error.');
            };

            recognition.start();
        });
    }, []);

    // Add Enter key listener
    useEffect(() => {
        const handleKeyPress = (e) => {
            if (e.key === 'Enter') {
                handleSubmit(); // Submit the form when Enter is pressed
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => {
            window.removeEventListener('keydown', handleKeyPress);
        };
    }, [formData]);

    return (
        <div className="login-container">
            
            <form onSubmit={(e) => e.preventDefault()} className="login-form">
            <h1>Login</h1>
                <div className="input-field">
                    <label>Email:</label>
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                </div>
                <div className="input-field">
                    <label>Password:</label>
                    <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                </div>
                {error && <p className="error-message">{error}</p>}
                <button type="button" onClick={handleSubmit} className="login-button">
                    Login
                </button>
            </form>
            {listening && <p>Listening...</p>}
        </div>
    );
};

export default LoginPage;

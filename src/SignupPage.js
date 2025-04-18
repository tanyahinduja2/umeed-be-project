import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './SignupPage.css';
import leftImage from './assets/images/Signup2.png'; 

/* global webkitSpeechRecognition */
const SignupPage = () => {
    const [formData, setFormData] = useState({
        email: '',
        name: '',
        password: '',
        confirmPassword: '',
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [mode, setMode] = useState(null); // Mode: 'typing' or 'speaking'
    const [currentField, setCurrentField] = useState(null); // Track the current field for verbal input
    const navigate = useNavigate(); // For navigation
    const [listening, setListening] = useState(false); // Track if STT is active

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
        // Ensure all fields are filled
        if (
            !formData.email.trim() ||
            !formData.name.trim() ||
            !formData.password.trim() ||
            !formData.confirmPassword.trim()
        ) {
            setError('All fields are required.');
            speakText('All fields are required. Please fill them before submitting.');
            return;
        }

        // Ensure passwords match
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match.');
            speakText('Passwords do not match. Please re-enter.');
            return;
        }

        try {
            // Call backend API
            const response = await fetch('http://localhost:5000/api/users/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: formData.email.trim(),
                    name: formData.name.trim(),
                    password: formData.password.trim(),
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess('Signup successful!');
                speakText('Signup successful! Redirecting to the login page.', () => {
                    navigate('/login'); // Navigate to login page
                });
            } else {
                setError(data.message || 'Signup failed.');
                speakText('Signup failed. Please try again.');
            }
        } catch (err) {
            console.error('Error:', err);
            setError('An error occurred. Please try again.');
            speakText('An error occurred. Please try again.');
        }
    };

    // Navigate through fields in speaking mode
    const proceedToNextField = (current) => {
        const fieldOrder = ['email', 'name', 'password', 'confirmPassword'];
        const currentIndex = fieldOrder.indexOf(current);
        if (currentIndex < fieldOrder.length - 1) {
            const nextField = fieldOrder[currentIndex + 1];
            setCurrentField(nextField);
            speakText(`Please provide your ${nextField}`, () =>
                startSpeechRecognition(nextField, () => proceedToNextField(nextField))
            );
        } else {
            speakText('All fields are filled. Press Enter to submit.');
        }
    };

    // Mode selection on page load
    useEffect(() => {
        const welcomeMessage =
            'Welcome to the signup page. Say "typing mode" to use your keyboard, or say "speaking mode" to provide your details verbally.';
        speakText(welcomeMessage, () => {
            const recognition = new webkitSpeechRecognition();
            recognition.lang = 'en-US';
            recognition.interimResults = false;

            recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript.toLowerCase();
                if (transcript.includes('typing mode')) {
                    setMode('typing');
                    speakText('Typing mode activated. Please fill out the form.');
                } else if (transcript.includes('speaking mode')) {
                    setMode('speaking');
                    setCurrentField('email');
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
        <div className="signup-page">
            {/* Left Section */}
            <div className="left-section">
                <h2>Stay on top of Job tracking</h2>
                <p>
                "Join us today to explore inclusive career opportunities and unlock your potential. It's simple and accessible for everyone!"
                </p>
                <img src={leftImage} alt="Time Tracking" />
                
            </div>

            {/* Right Section */}
            <div className="right-section">
                <h1>Create Account</h1>
                {mode === 'speaking' && <p className="instructions">Speaking Mode Active</p>}
                {listening && <p className="listening-indicator">Listening...</p>}
                <form onSubmit={(e) => e.preventDefault()}>
                    <div>
                        <label>First Name</label>
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
                                setFormData({
                                    ...formData,
                                    confirmPassword: e.target.value,
                                })
                            }
                        />
                    </div>
                    {error && <p style={{ color: 'red' }}>{error}</p>}
                    {success && <p style={{ color: 'green' }}>{success}</p>}
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

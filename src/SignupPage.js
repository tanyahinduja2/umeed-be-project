/* global webkitSpeechRecognition */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './SignupPage.css'; // Importing the CSS file

const SignupPage = () => {
    const [formData, setFormData] = useState({
        email: '',
        name: '',
        password: '',
        confirmPassword: '',
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [mode, setMode] = useState(null);
    const [currentField, setCurrentField] = useState(null);
    const navigate = useNavigate();
    const [listening, setListening] = useState(false);

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
            };

            recognition.start();
        } else {
            alert('Speech recognition is not supported in this browser.');
        }
    };

    const handleSubmit = async () => {
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

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match.');
            speakText('Passwords do not match. Please re-enter.');
            return;
        }

        try {
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
                    navigate('/login');
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
        <div className="signup-container">
            <form className="signup-form" onSubmit={(e) => e.preventDefault()}>
                <h1>Signup</h1>
                <div>
                    <label>Email:</label>
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                </div>
                <div>
                    <label>Name:</label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                </div>
                <div>
                    <label>Password:</label>
                    <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                </div>
                <div>
                    <label>Confirm Password:</label>
                    <input
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={(e) =>
                            setFormData({ ...formData, confirmPassword: e.target.value })
                        }
                    />
                </div>
                {error && <p className="error">{error}</p>}
                {success && <p className="success">{success}</p>}
                <button type="button" onClick={handleSubmit}>
                    Signup
                </button>
            </form>
        </div>
    );
};

export default SignupPage;

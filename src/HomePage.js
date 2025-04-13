/* global webkitSpeechRecognition */
import React, { useEffect } from 'react';
import './HomePage.css';
import heroImage from './assets/images/Home1.png'; // Adjust path to match your file's location


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
            {/* Navbar */}
            <div className="navbar">
                <div className="logo">Umeed</div>
                <div className="nav-links">
                    <button className="btn login-btn" onClick={() => (window.location.href = '/login')}>Login</button>
                    <button className="btn signup-btn" onClick={() => (window.location.href = '/signup')}>Signup</button>
                    <button className="btn signup-btn" onClick={() => (window.location.href = '/mentor')}>Mentor</button>
                </div>
            </div>
    
            <div className="container">
                {/* Hero Section */}
                <section className="hero-section" style={{ backgroundImage: `url(${heroImage})` }}>
                    <div className="hero-overlay"></div>
                    <div className="hero-content">
                        <h1><span className="highlight">Umeed</span></h1>
                        <h3>Your Dream Job is waiting!</h3>
                        <p className="description">
                            To get started, simply say: <br />
                            <strong>"Go to Login page"</strong> <br />
                            <strong>"Go to Signup page"</strong><br />
                            <strong>"Go to Mentor page"</strong><br />
                            <strong>"Say again"</strong>
                        </p>
                        <div className="button-group">
                            <button className="btn login-btn" onClick={() => (window.location.href = '/login')}>Login</button>
                            <button className="btn signup-btn" onClick={() => (window.location.href = '/signup')}>Signup</button>
                            <button className="btn signup-btn" onClick={() => (window.location.href = '/mentor')}>Mentor</button>
                        </div>
                    </div>
                </section>

    
                {/* About Us Section */}
                <section className="about-us-section">
                    <h2>About Us</h2>
                    <p>
                        Umeed is a platform dedicated to fostering an inclusive world by bridging the gap between individuals with disabilities and organizations that value diversity and inclusion.
                    </p>
    
                    <div className="categories">
                        <div className="category">
                            <h3>Seamless Job Search</h3>
                            <p>
                                Discover the latest job opportunities in one place with direct links to apply, making your job search efficient and hassle-free.
                            </p>
                        </div>

                        <div className="category">
                            <h3>Accessible for the Blind</h3>
                            <p>
                                Voice navigation and screen reader-friendly features ensure a smooth experience for visually impaired users.
                            </p>
                        </div>

                        <div className="category">
                            <h3>Tailored for the Deaf</h3>
                            <p>
                                Text-based instructions and visual navigation tools make the platform intuitive and accessible for hearing-impaired users.
                            </p>
                        </div>

                        <div className="category">
                            <h3>Mentorship Support</h3>
                            <p>
                                Get career guidance from experienced mentors to make informed decisions and grow in your chosen field.
                            </p>
                        </div>

                        <div className="category">
                            <h3>User-Friendly Design</h3>
                            <p>
                                An intuitive interface designed for ease of use, ensuring everyone can access opportunities effortlessly.
                            </p>
                        </div>

                        <div className="category">
                            <h3>Job Application Simplified</h3>
                            <p>
                                Direct links to application portals save time, allowing you to focus on the opportunities that matter most.
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}

export default HomePage;
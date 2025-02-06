import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './ApplicationPage.css'; // Import the CSS

/* global webkitSpeechRecognition */
const ApplicationPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const userName = location.state?.userName || 'User';

    // Hardcoded jobs (later to be fetched from an API)
    const jobs = [
        { 
            id: 1, 
            title: 'Software Developer', 
            description: 'Build and maintain web applications.', 
            location: 'Remote', 
            salary: '$80,000/year', 
            link: 'https://www.deloitte.com/software-developer-apply'
        },
        { 
            id: 2, 
            title: 'Data Analyst', 
            description: 'Analyze and interpret complex data.', 
            location: 'New York, NY', 
            salary: '$70,000/year', 
            link: 'https://www.deloitte.com/data-analyst-apply'
        },
        { 
            id: 3, 
            title: 'Graphic Designer', 
            description: 'Design creative content for marketing campaigns.', 
            location: 'San Francisco, CA', 
            salary: '$60,000/year', 
            link: 'https://www.deloitte.com/graphic-designer-apply'
        },
    ];

    const [currentJobIndex, setCurrentJobIndex] = useState(0); // Start at the first job
    const [listening, setListening] = useState(false); // Tracks STT state
    const [hasSpokenWelcome, setHasSpokenWelcome] = useState(false); // Ensures welcome speech is spoken only once

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
            console.error('TTS is not supported in this browser.');
        }
    };

    // Speech-to-Text (STT)
    const startSpeechRecognition = () => {
        if ('webkitSpeechRecognition' in window) {
            setListening(true);
            const recognition = new webkitSpeechRecognition();
            recognition.lang = 'en-US';
            recognition.interimResults = false;

            recognition.onresult = (event) => {
                setListening(false);
                const transcript = event.results[0][0].transcript.toLowerCase();

                if (transcript.includes('read')) {
                    handleNextJob();
                } else if (transcript.includes('apply')) {
                    applyForSpecificJob(jobs[currentJobIndex]); // Use the current job for voice commands
                } else if (transcript.includes('go back to home')) {
                    navigate('/');
                } else {
                    speakText(
                        'Command not recognized. You can say "read the next job," "apply for this job," or "go back to home page."',
                        startSpeechRecognition
                    );
                }
            };

            recognition.onerror = () => {
                setListening(false);
                speakText('Speech recognition failed. Please try again.', startSpeechRecognition);
            };

            recognition.onend = () => {
                setListening(false);
            };

            recognition.start();
        }
    };

    // Handle Next Job
    const handleNextJob = () => {
        if (currentJobIndex < jobs.length - 1) {
            const nextIndex = currentJobIndex + 1;
            setCurrentJobIndex(nextIndex);
        } else {
            speakText('There are no more jobs to read.', startSpeechRecognition);
        }
    };

    // Apply for a Specific Job
    const applyForSpecificJob = (job) => {
        const applicationMessage = `Opening the application page for the position of ${job.title}. Redirecting to the link.`;
        speakText(applicationMessage, () => {
            window.open(job.link, '_blank'); // Open job link in a new tab
        });
    };

    // Read Current Job
    const readCurrentJob = () => {
        const job = jobs[currentJobIndex];
        const jobDetails = `
            Job ID: ${job.id}.
            Title: ${job.title}.
            Description: ${job.description}.
            Location: ${job.location}.
            Salary: ${job.salary}.
            To apply for this job, say "apply for this job."
        `;
        speakText(jobDetails, startSpeechRecognition);
    };

    // On Page Load
    useEffect(() => {
        if (!hasSpokenWelcome) {
            const welcomeMessage = `Welcome, ${userName}. You are now on the application page. Say "read the next job" to hear job details or "go back to home page" to return to the home page.`;
            speakText(welcomeMessage, () => {
                setHasSpokenWelcome(true);
                readCurrentJob(); // Reads the first job after welcome
            });
        }
    }, [hasSpokenWelcome]); // Ensures welcome is spoken only once

    // Trigger Job Reading on Current Job Change
    useEffect(() => {
        if (hasSpokenWelcome && currentJobIndex !== 0) {
            readCurrentJob();
        }
    }, [currentJobIndex, hasSpokenWelcome]);

    return (
        <div className="application-page">
            {/* Navbar */}
            <nav className="application-navbar">
                <div className="application-logo">Umeed</div>
                <button className="application-signout-btn" onClick={() => navigate('/')}>Sign Out</button>
            </nav>

            {/* Welcome Message */}
            <h1 className="application-welcome-message">Welcome, {userName}</h1>
            <h2 className="application-jobs-heading">Available Jobs</h2>
            
            <div className="application-job-list">
                <ul className="application-job-ul">
                    {jobs.map((job) => (
                        <li key={job.id} className="application-job-li">
                            <span className="application-job-title">{job.title}</span>
                            <span className="application-job-location">{job.location}</span>
                            <span className="application-job-salary">{job.salary}</span>
                            <button onClick={() => applyForSpecificJob(job)} className="application-apply-btn">
                                Apply
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
            <p>You can say "read the next job," "apply for this job," or "go back to home page."</p>
            {listening && <p>Listening for your command...</p>}
        </div>
    );
};

export default ApplicationPage;

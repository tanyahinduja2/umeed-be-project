import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./ApplicationPage.css"; // Import the CSS
import { color } from "framer-motion";


const ApplicationPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const userName = location.state?.userName || "User";

  const [resumeFile, setResumeFile] = useState(null);
  const [userInfo, setUserInfo] = useState({});
  const [recommendedJob, setRecommendedJob] = useState("");
  const [matchingJobs, setMatchingJobs] = useState([]);
  const [listening, setListening] = useState(false);
  const [hasSpokenWelcome, setHasSpokenWelcome] = useState(false);

  // Text-to-Speech
  const speakText = (text, callback = null) => {
    if ("speechSynthesis" in window) {
      const speech = new SpeechSynthesisUtterance(text);
      speech.lang = "en-US";
      speech.onend = () => {
        if (callback) callback();
      };
      window.speechSynthesis.speak(speech);
    }
  };

  const handleFileChange = (event) => {
    setResumeFile(event.target.files[0]);
  };

  const handleResumeSubmit = async (event) => {
    event.preventDefault();

    if (!resumeFile) {
      speakText("Please select a resume file first.");
      return;
    }

    const formData = new FormData();
    formData.append("resume", resumeFile);

    try {
      const response = await fetch("http://127.0.0.1:5000/pred", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload resume.");
      }

      const data = await response.json();

      setUserInfo({
        name: data.name,
        email: data.email,
        phone: data.phone,
        extracted_skills: data.extracted_skills,
        extracted_education: data.extracted_education,
      });

      setRecommendedJob(data.recommended_job || "");

      // === New Filtering Logic ===
      const allJobs = data.google_jobs || [];
      const indianJobs = allJobs.filter(
        (job) => job.location && job.location.toLowerCase().includes("india")
      );
      const topIndianJobs = indianJobs.slice(0, 10);

      setMatchingJobs(topIndianJobs);

      speakText("Resume uploaded successfully. Showing your details and jobs.");
    } catch (error) {
      console.error("Error uploading resume:", error);
      speakText("There was an error uploading the resume. Please try again.");
    }
  };

  useEffect(() => {
    if (!hasSpokenWelcome) {
      const welcomeMessage = `Welcome, ${userName}. You are now on the application page.`;
      speakText(welcomeMessage, () => {
        setHasSpokenWelcome(true);
      });
    }
  }, [hasSpokenWelcome]);

  return (
    <div className="application-page">
      {/* Navbar */}
      <div className="navbar">
        <div className="logo">Umeed</div>
        <div className="nav-links">
          <button
            className="btn"
            onClick={() => (window.location.href = "/")}
          >
            <p>Home</p>
          </button>
          <button
            className="btn"
            onClick={() => (window.location.href = "/mentor")}
          >
            Mentor
          </button>
        </div>
      </div>

      {/* Welcome Message */}
      <h1 className="application-welcome-message" style={{marginBottom: "40px"}}>Welcome, {userName}</h1>

      <h2 className="application-jobs-heading" style={{marginLeft: "380px"}}>
        Want tailored job recommendations? Upload your resume:
      </h2>

      <div className="upload-resume">
        <div className="upload-resume-container">
          <form onSubmit={handleResumeSubmit}>
            <label htmlFor="resume">Choose a file:</label>
            <input
              accept=".pdf,.txt"
              className="resume-input"
              name="resume"
              id="resume"
              type="file"
              onChange={handleFileChange}
              style={{color: "white", padding: "14px"}}
            />
            <button type="submit" className="resume-input">Send</button>
          </form>
        </div>
      </div>

      {/* Extracted User Info */}
      {userInfo.name && (
        <div className="user-info">
          <h2 className="application-jobs-heading">Extracted Information</h2>
          <p className="extracted-info"><span style={{color: "#008CBA"}}><strong>Email:</strong></span> {userInfo.email}</p>
          <p className="extracted-info"><span style={{color: "#008CBA"}}><strong>Phone:</strong></span> {userInfo.phone}</p>
          <p className="extracted-info"><span style={{color: "#008CBA"}}><strong>Skills:</strong></span> {userInfo.extracted_skills?.join(", ")}</p>
          <p className="extracted-info"><span style={{color: "#008CBA"}}><strong>Education:</strong></span> {userInfo.extracted_education?.join(", ")}</p>
        </div>
      )}

      {/* Recommended Job */}
      {recommendedJob && (
        <div className="recommended-job">
          <h2 className="application-jobs-heading">Recommended Job Title</h2>
          <p className="extracted-info"><span style={{color: "#008CBA", fontWeight: "bold", fontSize: "20px"}}>{recommendedJob}</span></p>
        </div>
      )}

      {/* Top 10 Jobs from SERP */}
      {matchingJobs.length > 0 && (
  <>
    <h2 className="application-jobs-heading">Relevant Top Jobs in India</h2>
    <div className="application-job-list">
      <ul className="application-job-ul">
        {matchingJobs.map((job, index) => (
          <li key={index} className="application-job-li">
            <p className="application-job-title">
              <strong>Company:</strong> {job.company}
            </p>
            <p className="application-job-location">
              <strong>Location:</strong> {job.location}
            </p>
            {job.link && (
              <button
                onClick={() => window.open(job.link, "_blank")}
                className="application-apply-btn"
              >
                Apply
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  </>
)}

      {listening && <p>Listening for your command...</p>}
    </div>
  );
};

export default ApplicationPage;

import React, { useState, useRef } from 'react';
import { Button, Box, Textarea, Flex } from '@chakra-ui/react';
import { jsPDF } from 'jspdf';

const SpeechToText = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef(null);

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Speech Recognition not supported in this browser!');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcriptChunk = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          setTranscript(prev => prev + transcriptChunk + ' ');
        } else {
          interimTranscript += transcriptChunk;
        }
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
    recognitionRef.current = recognition;
    setIsListening(true);
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.text(transcript, 10, 10);
    doc.save('transcript.pdf');
  };

  return (
    <Flex direction="column" align="center" mt={8}>
      <Button
        colorScheme={isListening ? "red" : "green"}
        onClick={isListening ? stopListening : startListening}
        mb={4}
      >
        {isListening ? 'Stop Listening' : 'Start Listening'}
      </Button>

      <Textarea
        value={transcript}
        placeholder="Transcript will appear here..."
        size="md"
        width="80%"
        height="200px"
        readOnly
        mb={4}
      />

      <Button colorScheme="blue" onClick={downloadPDF}>
        Download Transcript as PDF
      </Button>
    </Flex>
  );
};

export default SpeechToText; 
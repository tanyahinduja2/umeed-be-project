import React from 'react';
import { Box, Heading, Flex } from '@chakra-ui/react';

import VideoPlayer from './Components/VideoPlayer';
import Sidebar from './Components/Sidebar';
import Notifications from './Components/Notifications';
import SpeechToText from './Components/SpeechToText';


const VideoCall = () => {
  return (
    <>
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
            onClick={() => (window.location.href = "/application")}
          >
            Apply
          </button>
        </div>
      </div>
    <Flex direction="column" align="center" width="100%">
      <Box
        borderRadius="15px"
        margin="30px 100px"
        display="flex"
        flexDirection="row"
        justifyContent="center"
        alignItems="center"
        width="400px"
        border="2px solid #083858"
        position="static"
        bg="inherit"
        p={4}
        _responsive={{
          base: { width: "90%" }, // Small screens (mobile)
        }}
      >
        <Heading as="h2" size="l" textAlign="center">
          Video Chat
        </Heading>
      </Box>
      <VideoPlayer />
      <Sidebar>
        <Notifications />
      </Sidebar>
    </Flex>
    </>
  );
};

export default VideoCall;

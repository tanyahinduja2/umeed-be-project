import React, { useContext } from 'react';
import { Box, Flex, Heading } from '@chakra-ui/react';

import { SocketContext } from '../Context';

const VideoPlayer = () => {
  const { name, callAccepted, myVideo, userVideo, callEnded, stream, call } = useContext(SocketContext);

  return (
    <Flex
      justify="center"
      flexWrap="wrap"
      flexDirection={{ base: 'column', md: 'row' }} // Responsive: column on small screens
    >
      {stream && (
        <Box
          p="10px"
          border="2px solid black"
          m="10px"
          borderRadius="md"
          width={{ base: '300px', md: '550px' }}
        >
          <Flex direction="column" align="center">
            <Heading as="h5" size="md" mb={2}>
              {name || 'Name'}
            </Heading>
            <video
              playsInline
              muted
              ref={myVideo}
              autoPlay
              style={{
                width: '100%',
                borderRadius: '8px',
              }}
            />
          </Flex>
        </Box>
      )}
      {callAccepted && !callEnded && (
        <Box
          p="10px"
          border="2px solid #083858"
          m="10px"
          borderRadius="md"
          width={{ base: '300px', md: '550px' }}
        >
          <Flex direction="column" align="center">
            <Heading as="h5" size="md" mb={2}>
              {call.name || 'Name'}
            </Heading>
            <video
              playsInline
              ref={userVideo}
              autoPlay
              style={{
                width: '100%',
                borderRadius: '8px',
              }}
            />
          </Flex>
        </Box>
      )}
    </Flex>
  );
};

export default VideoPlayer;

import React, { useState, useContext, useEffect } from 'react';
import { Button, Input, Grid, Heading, Box, Flex } from '@chakra-ui/react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { MdAssignment, MdPhone, MdPhoneDisabled } from 'react-icons/md';

import { SocketContext } from '../Context';
import SpeechToText from './SpeechToText'; // Import SpeechToText

const Sidebar = ({ children }) => {
  const { me, callAccepted, name, setName, callEnded, leaveCall, callUser } = useContext(SocketContext);
  const [idToCall, setIdToCall] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    // Reset "Copied!" status after 2 minutes
    if (isCopied) {
      const timer = setTimeout(() => {
        setIsCopied(false);
      }, 120000); // 120000 ms = 2 minutes

      return () => clearTimeout(timer);
    }
  }, [isCopied]);

  return (
    <Flex
      direction="column"
      width={{ base: '80%', md: '600px' }}
      my="35px"
      mx="auto"
    >
      <Box
        p="10px 20px"
        border="2px solid #083858"
        borderRadius="md"
        boxShadow="lg"
      >
        <form>
          <Grid
            templateColumns={{ base: '1fr', md: '1fr 1fr' }}
            gap={4}
            width="100%"
          >
            <Flex direction="column" p={5}>
              <Heading as="h6" size="md" mb={2}>
                Account Info
              </Heading>
              <Input
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                mb={3}
              />
              <CopyToClipboard text={me} onCopy={() => setIsCopied(true)}>
                <Button
                  colorScheme="#083858"
                  leftIcon={<MdAssignment size="24px" />}
                  width="100%"
                >
                  {isCopied ? 'Copied!' : 'Copy Your ID'}
                </Button>
              </CopyToClipboard>
            </Flex>

            <Flex direction="column" p={5}>
              <Heading as="h6" size="md" mb={2}>
                Make a call
              </Heading>
              <Input
                placeholder="ID to call"
                value={idToCall}
                onChange={(e) => setIdToCall(e.target.value)}
                mb={3}
              />
              {callAccepted && !callEnded ? (
                <Button
                  colorScheme="red"
                  leftIcon={<MdPhoneDisabled size="24px" />}
                  width="100%"
                  onClick={leaveCall}
                >
                  Hang Up
                </Button>
              ) : (
                <Button
                  colorScheme="blue"
                  leftIcon={<MdPhone size="24px" />}
                  width="100%"
                  onClick={() => callUser(idToCall)}
                >
                  Call
                </Button>
              )}
            </Flex>
          </Grid>
        </form>

        {children}
      </Box>

      {/* Only show SpeechToText if the call is accepted and not ended */}
      {callAccepted && !callEnded && <SpeechToText />}
    </Flex>
  );
};

export default Sidebar;

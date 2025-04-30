import React, { useContext } from 'react';
import { Button, Flex, Heading } from '@chakra-ui/react';

import { SocketContext } from '../Context';

const Notifications = () => {
  const { answerCall, call, callAccepted } = useContext(SocketContext);

  return (
    <>
      {call.isReceivingCall && !callAccepted && (
        <Flex justify="space-around" align="center">
          <Heading as="h1" size="md">
            {call.name} is calling:
          </Heading>
          <Button colorScheme="blue" onClick={answerCall}>
            Answer
          </Button>
        </Flex>
      )}
    </>
  );
};

export default Notifications;

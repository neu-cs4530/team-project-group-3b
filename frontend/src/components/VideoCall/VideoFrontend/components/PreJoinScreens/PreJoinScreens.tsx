import React, { useState, useEffect, FormEvent } from 'react';
import DeviceSelectionScreen from './DeviceSelectionScreen/DeviceSelectionScreen';
import IntroContainer from '../IntroContainer/IntroContainer';
import MediaErrorSnackbar from './MediaErrorSnackbar/MediaErrorSnackbar';
import RoomNameScreen from './RoomNameScreen/RoomNameScreen';
import { useAppState } from '../../state';
import { useParams } from 'react-router-dom';
import useVideoContext from '../../hooks/useVideoContext/useVideoContext';
import { TownJoinResponse } from '../../../../../classes/TownsServiceClient';
import { Heading, Text } from '@chakra-ui/react';
import TownSelection from '../../../../Login/TownSelection';
import SpotifyButton from '../../../../Spotify/SpotifyButton';

export enum Steps {
  roomNameStep,
  deviceSelectionStep,
}

export default function PreJoinScreens(props: { doLogin: (initData: TownJoinResponse) => Promise<boolean>}) {
  const { user } = useAppState();
  const { getAudioAndVideoTracks } = useVideoContext();

  const [mediaError, setMediaError] = useState<Error>();


  useEffect(() => {
    if (!mediaError) {
      getAudioAndVideoTracks().catch(error => {
        console.log('Error acquiring local media:');
        console.dir(error);
        setMediaError(error);
      });
    }
  }, [getAudioAndVideoTracks, mediaError]);


  return (
    <IntroContainer>
      <MediaErrorSnackbar error={mediaError} />
      <Heading as="h2" size="xl">Welcome to Covey.Town!</Heading>
      <Text p="4">
        Covey.Town is a social platform that integrates a 2D game-like metaphor with video chat.
        To get started, setup your camera and microphone, choose a username, and then create a new town
        to hang out in, or join an existing one.
      </Text>
        <DeviceSelectionScreen />
        <SpotifyButton />
        <TownSelection doLogin={props.doLogin} />
    </IntroContainer>
  );
}
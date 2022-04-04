import React from 'react';
import MenuItem from '@material-ui/core/MenuItem';
import Typography from '@material-ui/core/Typography';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import assert from 'assert';
import useCoveyAppState from '../../hooks/useCoveyAppState';

function spotifyFlow() {
  // const state = generateRandomString(16); // todo technically optional but recommended, removed for now
  // const scope = 'user-read-playback-state user-modify-playback-state app-remote-control user-read-profile';
  const scope = 'user-read-email';

  console.log(process.env);

  assert(process.env.REACT_APP_SPOTIFY_CLIENT_ID,
    'Environmental variable SPOTIFY_CLIENT_ID must be set');
  assert(process.env.REACT_APP_SPOTIFY_REDIRECT_URI,
    'Environmental variable SPOTIFY_REDIRECT_URI must be set');

  const clientID = process.env.REACT_APP_SPOTIFY_CLIENT_ID;
  const redirectURI = process.env.REACT_APP_SPOTIFY_REDIRECT_URI;

  const urlParams: string = new URLSearchParams({
    response_type: 'token',
    client_id: clientID,
    scope,
    redirect_uri: redirectURI,
  }).toString();
  
  window.location.replace(`https://accounts.spotify.com/authorize?${urlParams}`);
  // TODO error handling maybe?
}

export default function SpotifyButton(): JSX.Element {
  // const { apiClient } = useCoveyAppState();
  
  const url = useLocation();
  const hashFragmentParams = new URLSearchParams(url.hash.substring(1));
  const spotifyAccessToken = hashFragmentParams.get("access_token");

  if(spotifyAccessToken != null) {
    window.localStorage.setItem("spotifyAccessToken", spotifyAccessToken);
  }

  return (
    <MenuItem onClick={spotifyFlow}>
      <Typography variant="body1">Login with Spotify</Typography>
    </MenuItem>
  );
}

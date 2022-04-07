import React, { useState } from 'react';
import MenuItem from '@material-ui/core/MenuItem';
import Typography from '@material-ui/core/Typography';
import { useLocation } from 'react-router-dom';
// import axios from 'axios';
import assert from 'assert';
import { Button } from '@chakra-ui/react';
// import useCoveyAppState from '../../hooks/useCoveyAppState';

function spotifyFlow() {
  // const state = generateRandomString(16); // todo technically optional but recommended, removed for now
  // const scope = 'user-read-playback-state user-modify-playback-state app-remote-control user-read-profile user-read-email';
  const scope = 'user-read-email';

  // console.log(process.env);

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

function isTokenExpired() {
  const now = new Date();
  const localStorageToken = window.localStorage.getItem("CoveyTownSpotifyAccessToken");
  assert(localStorageToken);
  
  const timeNow = now.getTime();
  const timeExpiry = parseInt(JSON.parse(localStorageToken).expiry, 10);

  return timeNow > timeExpiry;
}

export default function SpotifyButton(): JSX.Element {
  // const { apiClient } = useCoveyAppState();
  const now = new Date();
  
  // add new access token to local storage if on the end of a callback, based on given url params
  const url = useLocation();
  const hashFragmentParams = new URLSearchParams(url.hash.substring(1));
  const spotifyAccessToken = hashFragmentParams.get("access_token");
  const spotifyExpiresIn = hashFragmentParams.get("expires_in");

  const localStorageToken = window.localStorage.getItem("CoveyTownSpotifyAccessToken");
  let callAuthFlow = false;

  if (localStorageToken) {
    // if expired, discard it
    if (isTokenExpired()) {
      window.localStorage.removeItem("CoveyTownSpotifyAccessToken");
      // flow should happen
      callAuthFlow = true;
    }
  // if no token, is one available in the url?
  } else if (spotifyAccessToken != null && spotifyExpiresIn != null) {
    const fullToken = {"access_token": spotifyAccessToken, "expiry": now.getTime() + (parseInt(spotifyExpiresIn, 10) * 1000)};

    window.localStorage.setItem("CoveyTownSpotifyAccessToken", JSON.stringify(fullToken));

    const baseURL = process.env.REACT_APP_BASE_URL;
    if (baseURL) {
      window.location.replace(baseURL);
    }
  } else {
    // flow should happen
    callAuthFlow = true;
  }

  return (
      <Button onClick={callAuthFlow ? spotifyFlow : () => { console.log('SpotifyButton: Token is live.') }}>
        <Typography variant="body1">Login with Spotify</Typography>
      </Button>
  );
}

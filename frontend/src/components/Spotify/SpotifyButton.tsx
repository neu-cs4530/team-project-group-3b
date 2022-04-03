import React from 'react';
import MenuItem from '@material-ui/core/MenuItem';
import Typography from '@material-ui/core/Typography';
import useCoveyAppState from '../../hooks/useCoveyAppState';

export default function SpotifyButton(): JSX.Element {
  const { apiClient } = useCoveyAppState();
  
  return (
    <MenuItem onClick={apiClient.requestSpotifyAuthorizationFlow}>
      <Typography variant="body1">Login with Spotify</Typography>
    </MenuItem>
  );
}

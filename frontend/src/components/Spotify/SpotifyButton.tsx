import React from 'react';
import MenuItem from '@material-ui/core/MenuItem';
import Typography from '@material-ui/core/Typography';

export default function SpotifyButton(): JSX.Element {
  return (
    <MenuItem>
      <Typography variant="body1">Login with Spotify</Typography>
    </MenuItem>
  );
}

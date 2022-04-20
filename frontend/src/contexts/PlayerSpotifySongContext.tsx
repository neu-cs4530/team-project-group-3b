import React from 'react';
import Player from '../classes/Player';

export type PlayerSpotifySongCallback = (playerSpotifySongChanged: Player) => void;

const Context = React.createContext<PlayerSpotifySongCallback[]>([]);

export default Context;

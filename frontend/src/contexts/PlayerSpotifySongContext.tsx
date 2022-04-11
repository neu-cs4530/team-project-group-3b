import React from 'react';
import { ServerPlayer } from '../classes/Player';

export type PlayerSpotifySongCallback = (playerMoved: ServerPlayer) => void;

const Context = React.createContext<PlayerSpotifySongCallback[]>([]);

export default Context;

/* eslint-disable @typescript-eslint/no-explicit-any */
import assert from 'assert';
import axios, { AxiosResponse } from 'axios';
import dotenv from 'dotenv';
import Player from '../types/Player';
import ISpotifyClient from './ISpotifyClient';

dotenv.config();

// 1 hour: each client will time out after 1 hour of listening and need to refresh
const MAX_ALLOWED_SESSION_DURATION = 3600;
declare global {
  interface Error {
    code: undefined;
  }
}
export default class SpotifyClient implements ISpotifyClient {
  private static _instance: SpotifyClient;

  private _spotifyClientID: string;

  private _spotifyClientSecret: string;

  private _spotifyRedirectURI: string;

  // maps coveyTownIDs to a map from Players to their spotifyTokens
  private _townsToPlayerMaps: Map<string, Map<Player, string>>;

  constructor(spotifyClientID: string,
    spotifyClientSecret: string,
    spotifyRedirectURI: string) {
    this._townsToPlayerMaps = new Map<string, Map<Player, string>>();

    this._spotifyClientID = spotifyClientID;

    this._spotifyClientSecret = spotifyClientSecret;

    this._spotifyRedirectURI = spotifyRedirectURI;
  }

  public static getInstance(): SpotifyClient {
    if (!SpotifyClient._instance) {
      assert(process.env.SPOTIFY_CLIENT_ID,
        'Environmental variable SPOTIFY_CLIENT_ID must be set');
      assert(process.env.SPOTIFY_CLIENT_SECRET,
        'Environmental variable SPOTIFY_CLIENT_SECRET must be set');
      assert(process.env.SPOTIFY_REDIRECT_URI,
        'Environmental variable SPOTIFY_REDIRECT_URI must be set');
      SpotifyClient._instance = new SpotifyClient(
        process.env.SPOTIFY_CLIENT_ID,
        process.env.SPOTIFY_CLIENT_SECRET,
        process.env.SPOTIFY_REDIRECT_URI,
      );
    }
    return SpotifyClient._instance;
  }

  async getSpotifyAPICallResponse(apiURL: string, 
    coveyTownID: string, 
    player: Player): Promise<AxiosResponse<any> | undefined> {
    const playerToken = this.getTokenForTownPlayer(coveyTownID, player);

    try {
      const response = await axios.get(apiURL, { 
        headers: { 
          'Authorization': `Bearer ${playerToken}`,
          'Content-Type': 'application/json',
        },
      });
    
      return response;
    } catch (err) {
      console.log(err);
      return undefined;
    }
  }

  async addTownToClient(coveyTownID: string): Promise<void> {
    const playerToToken = new Map<Player, string>();

    this._townsToPlayerMaps.set(coveyTownID, playerToToken);
  }

  async removeTownFromClient(coveyTownID: string): Promise<void> {
    this._townsToPlayerMaps.delete(coveyTownID);
  }

  async addTownPlayerToClient(coveyTownID: string, player: Player, spotifyToken: string): Promise<void> {
    const playerToToken = this._townsToPlayerMaps.get(coveyTownID);

    playerToToken?.set(player, spotifyToken);
  }

  async removeTownPlayerFromClient(coveyTownID: string, player: Player): Promise<void> {
    const playerToToken = this._townsToPlayerMaps.get(coveyTownID);

    playerToToken?.delete(player);
  }

  async getTokenForTownPlayer(coveyTownID: string, player: Player): Promise<string | undefined> {
    const playerToToken = this._townsToPlayerMaps.get(coveyTownID);

    return playerToToken?.get(player);
  }

  async getSpotifyUserID(coveyTownID: string, player: Player): Promise<string | undefined> {
    // scope = 'user-read-private user-read-email'

    const userInfo = await this.getSpotifyAPICallResponse('https://api.spotify.com/v1/me', 
      coveyTownID, 
      player);

    if (userInfo) {
      const userJsonData = await userInfo.data;

      const spotifyUserID = await userJsonData.id;

      return spotifyUserID;
    }

    return undefined;
  }

  async getCurrentPlayingSong(coveyTownID: string, player: Player): Promise<string | undefined> {
    // scope = 'user-read-currently-playing'

    const currentTrackInfo = 
    await this.getSpotifyAPICallResponse('https://api.spotify.com/v1/me/player/currently-playing',
      coveyTownID, 
      player);

    if (currentTrackInfo) {
      const currentTrackJsonData = await currentTrackInfo.data;

      const currentTrackTitle = await currentTrackJsonData.item.name;

      return currentTrackTitle;
    }
    
    return undefined;
  }
  
}
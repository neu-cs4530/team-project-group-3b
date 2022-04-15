/* eslint-disable @typescript-eslint/no-explicit-any */
import assert from 'assert';
import axios, { AxiosResponse } from 'axios';
import dotenv from 'dotenv';
// import { access } from 'fs';
import Player from '../types/Player';
// import ISpotifyClientStatic from './ISpotifyClient';

dotenv.config();

/**
 * The format of a spotify token, with the access token and the expiry time
 */
export interface SpotifyToken {
  /** The access token for the spotify session * */
  accessToken: string;
  /** The expiry time of the spotify token * */
  expiry: number;
}

// 1 hour: each client will time out after 1 hour of listening and need to refresh
/* const MAX_ALLOWED_SESSION_DURATION = 3600;
declare global {
  interface Error {
    code: undefined;
  }
} */

export default class SpotifyClient {
  private static _instance: SpotifyClient;

  // maps coveyTownIDs to a map from Players to their spotifyTokens
  private static _townsToPlayerMaps: Map<string, Map<Player, SpotifyToken>>;

  private _spotifyClientID: string;

  private _spotifyClientSecret: string;

  private _spotifyRedirectURI: string;

  constructor(spotifyClientID: string,
    spotifyClientSecret: string,
    spotifyRedirectURI: string) {
    SpotifyClient._townsToPlayerMaps = new Map<string, Map<Player, SpotifyToken>>();

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

  static getTokenForTownPlayer(coveyTownID: string, player: Player): string | undefined {
    if (this) {
      const playerToToken = SpotifyClient._townsToPlayerMaps.get(coveyTownID);

      const fullToken = playerToToken?.get(player);
      const accessToken = fullToken?.accessToken;
      return accessToken;
    }
    return undefined;
  }

  private static async getSpotifyAPICallResponse(apiURL: string, 
    coveyTownID: string, 
    player: Player): Promise<AxiosResponse<any> | undefined> {
    const playerToken = SpotifyClient.getTokenForTownPlayer(coveyTownID, player);

    try {
      const response = await axios.get(apiURL, { 
        headers: { 
          'Authorization': `Bearer ${playerToken}`,
          'Content-Type': 'application/json',
        },
      });
    
      console.log(`username: ${player.userName}, id: ${player.id}, token: ${playerToken}`);
      return response;
    } catch (err) {
      console.log(`username: ${player.userName}, id: ${player.id}, token: ${playerToken}`);
      console.log(err);
      return undefined;
    }
  }

  static addTownToClient(coveyTownID: string): void {
    const playerToToken = new Map<Player, SpotifyToken>();

    SpotifyClient._townsToPlayerMaps.set(coveyTownID, playerToToken);
  }

  static removeTownFromClient(coveyTownID: string): void {
    SpotifyClient._townsToPlayerMaps.delete(coveyTownID);
  }

  static addTownPlayerToClient(coveyTownID: string, player: Player, spotifyToken: string): void {
    const playerToToken = SpotifyClient._townsToPlayerMaps.get(coveyTownID);

    const tokenJson = JSON.parse(spotifyToken);
    const token: SpotifyToken = {
      accessToken: tokenJson.access_token,
      expiry: tokenJson.expiry,
    };
    playerToToken?.set(player, token);
  }

  static removeTownPlayerFromClient(coveyTownID: string, player: Player): void {
    const playerToToken = SpotifyClient._townsToPlayerMaps.get(coveyTownID);

    playerToToken?.delete(player);
    console.log(SpotifyClient._townsToPlayerMaps);
  }

  public static async getSpotifyUserID(coveyTownID: string, player: Player): Promise<string | undefined> {
    // scope = 'user-read-private user-read-email'

    const userInfo = await SpotifyClient.getSpotifyAPICallResponse('https://api.spotify.com/v1/me', 
      coveyTownID, 
      player);

    if (userInfo) {
      const userJsonData = await userInfo.data;

      const spotifyUserID = await userJsonData.id;

      return spotifyUserID;
    }

    return undefined;
  }

  public static async getCurrentPlayingSong(coveyTownID: string, player: Player): Promise<string | undefined> {
    // scope = 'user-read-currently-playing'

    const currentTrackInfo = 
    await SpotifyClient.getSpotifyAPICallResponse('https://api.spotify.com/v1/me/player/currently-playing',
      coveyTownID, 
      player);

    if (currentTrackInfo) {
      const currentTrackJsonData = await currentTrackInfo.data;

      if (currentTrackJsonData.item) {
        const currentTrackTitle = await currentTrackJsonData.item.name;

        const currentTrackArtist = await currentTrackJsonData.item.album.artists[0].name;
        
        return `${currentTrackTitle} by ${currentTrackArtist}`;
      }
    }
    
    return undefined;
  }
  
}

/* eslint-disable @typescript-eslint/no-explicit-any */
import assert from 'assert';
import axios, { AxiosResponse } from 'axios';
import dotenv from 'dotenv';
import Player from '../types/Player';
// import ISpotifyClientStatic from './ISpotifyClient';

dotenv.config();

// 1 hour: each client will time out after 1 hour of listening and need to refresh
const MAX_ALLOWED_SESSION_DURATION = 3600;
declare global {
  interface Error {
    code: undefined;
  }
}

export default class SpotifyClient {
  private static _instance: SpotifyClient;

  // maps coveyTownIDs to a map from Players to their spotifyTokens
  private static _townsToPlayerMaps: Map<string, Map<Player, string>>;

  private _spotifyClientID: string;

  private _spotifyClientSecret: string;

  private _spotifyRedirectURI: string;

  constructor(spotifyClientID: string,
    spotifyClientSecret: string,
    spotifyRedirectURI: string) {
    SpotifyClient._townsToPlayerMaps = new Map<string, Map<Player, string>>();

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

      return playerToToken?.get(player);
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
          // 'Authorization': `Bearer ${playerToken}`,
          'Authorization': `Bearer BQDrVClDgUEaZqk88p-KUp8pGzuqVMbmkHlOd3NInaFFhHM5UKs-KqtTAp5-jg9y7DBhCSw4DWpdWcvk3yk3MDD75VbkEMgBGsBLrFRzSC4viSa8kGexY4Jce45XKDcZEIewwF8iCGK7hhXPbvjnfk1KGnuVOcgB0gVacUzzrYDjHFroaZcpOA`,
          'Content-Type': 'application/json',
        },
      });
    
      return response;
    } catch (err) {
      console.log(err);
      return undefined;
    }
  }

  static addTownToClient(coveyTownID: string): void {
    const playerToToken = new Map<Player, string>();

    SpotifyClient._townsToPlayerMaps.set(coveyTownID, playerToToken);
  }

  static removeTownFromClient(coveyTownID: string): void {
    SpotifyClient._townsToPlayerMaps.delete(coveyTownID);
  }

  static addTownPlayerToClient(coveyTownID: string, player: Player, spotifyToken: string): void {
    const playerToToken = SpotifyClient._townsToPlayerMaps.get(coveyTownID);

    playerToToken?.set(player, spotifyToken);
  }

  static removeTownPlayerFromClient(coveyTownID: string, player: Player): void {
    const playerToToken = SpotifyClient._townsToPlayerMaps.get(coveyTownID);

    playerToToken?.delete(player);
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

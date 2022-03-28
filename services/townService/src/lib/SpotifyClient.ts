import assert from 'assert';
import dotenv from 'dotenv';
import axios, { AxiosInstance, AxiosResponse } from 'axios';

dotenv.config();

declare global {
  interface Error {
    code: undefined;
  }
}
export default class SpotifyClient {
  private static _instance: SpotifyClient;

  private _spotifyClientID: string;

  private _spotifyClientSecret: string;

  private _redirectURI: string;


  constructor(spotifyClientID: string,
    spotifyClientSecret: string,
    redirectURI: string) {
    this._spotifyClientID = spotifyClientID;
    this._spotifyClientSecret = spotifyClientSecret;
    this._redirectURI = redirectURI;
  }

  public static getInstance(): SpotifyClient {
    if (!SpotifyClient._instance) {
      assert(process.env.SPOTIFY_CLIENT_ID,
        'Environmental variable SPOTIFY_CLIENT_ID must be set');
      assert(process.env.SPOTIFY_CLIENT_SECRET,
        'Environmental variable SPOTIFY_CLIENT_SECRET must be set');
      SpotifyClient._instance = new SpotifyClient(
        process.env.SPOTIFY_CLIENT_ID, process.env.SPOTIFY_CLIENT_SECRET, "localhost:3000"
      );
    }
    return SpotifyClient._instance;
  }

  async requestAuthorizationForUser(coveyTownID: string, clientIdentity: string): Promise<string> {
    // const state = generateRandomString(16);
    const scope = 'user-read-playback-state user-modify-playback-state app-remote-control user-read-profile';

    const responseWrapper = await axios.get('https://accounts.spotify.com/authorize?response_type=code&client_id'); //todo
    // const token = new Twilio.jwt.AccessToken(
    //   this._twilioAccountSid, this._twilioApiKeySID, this._twilioApiKeySecret, {
    //     ttl: MAX_ALLOWED_SESSION_DURATION,
    //   },
    // );
    // token.identity = clientIdentity;
    // const videoGrant = new Twilio.jwt.AccessToken.VideoGrant({ room: coveyTownID });
    // token.addGrant(videoGrant);
    // return token.toJwt();
  }

  async getTokenForTown(coveyTownID: string, clientIdentity: string): Promise<string> {
    // const token = new Twilio.jwt.AccessToken(
    //   this._twilioAccountSid, this._twilioApiKeySID, this._twilioApiKeySecret, {
    //     ttl: MAX_ALLOWED_SESSION_DURATION,
    //   },
    // );
    // token.identity = clientIdentity;
    // const videoGrant = new Twilio.jwt.AccessToken.VideoGrant({ room: coveyTownID });
    // token.addGrant(videoGrant);
    // return token.toJwt();
    return "todo";
  }
}

import assert from 'assert';
import dotenv from 'dotenv';
import ISpotifyClient from './ISpotifyClient';

dotenv.config();

// 1 hour: each client will time out after 1 hour of video and need to refresh
const MAX_ALLOWED_SESSION_DURATION = 3600;
declare global {
  interface Error {
    code: undefined;
  }
}
export default class SpotifyClient implements ISpotifyClient {
  // private _twilioClient: Twilio.Twilio;

  private static _instance: SpotifyClient;

  private _spotifyAccountSid: string;

  private _spotifyApiKeySID: string;

  private _spotifyApiKeySecret: string;


  constructor(spotifyAccountSid: string,
    spotifyAuthToken: string,
    spotifyAPIKeySID: string,
    spotifyAPIKeySecret: string) {
    this._spotifyAccountSid = spotifyAccountSid;
    this._spotifyApiKeySID = spotifyAPIKeySID;
    this._spotifyApiKeySecret = spotifyAPIKeySecret;
    // this._twilioClient = Twilio(twilioAccountSid, twilioAuthToken);
  }

  public static getInstance(): SpotifyClient {
    if (!SpotifyClient._instance) {
      assert(process.env.SPOTIFY_API_AUTH_TOKEN,
        'Environmental variable SPOTIFY_API_AUTH_TOKEN must be set');
      assert(process.env.SPOTIFY_ACCOUNT_SID,
        'Environmental variable SPOTIFY_ACCOUNT_SID must be set');
      assert(process.env.SPOTIFY_API_KEY_SID,
        'Environmental variable SPOTIFY_API_KEY_SID must be set');
      assert(process.env.SPOTIFY_API_KEY_SECRET,
        'Environmental variable SPOTIFY_API_KEY_SECRET must be set');
      SpotifyClient._instance = new SpotifyClient(
        process.env.SPOTIFY_ACCOUNT_SID, process.env.SPOTIFY_API_AUTH_TOKEN,
        process.env.SPOTIFY_API_KEY_SID, process.env.SPOTIFY_API_KEY_SECRET,
      );
    }
    return SpotifyClient._instance;
  }

  async getTokenForTown(coveyTownID: string, clientIdentity: string): Promise<string> {
    const token = new Twilio.jwt.AccessToken(
      this._spotifyAccountSid, this._spotifyApiKeySID, this._spotifyApiKeySecret, {
        ttl: MAX_ALLOWED_SESSION_DURATION,
      },
    );
    token.identity = clientIdentity;
    const videoGrant = new Twilio.jwt.AccessToken.VideoGrant({ room: coveyTownID });
    token.addGrant(videoGrant);
    return token.toJwt();
  }
  
}

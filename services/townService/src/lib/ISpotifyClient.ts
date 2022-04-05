/**
 * The Spotify listening component of Covey.Town must implement this server interface,
 * which is used to authorize a client to connect to Spotify.
 */
export default interface ISpotifyClient {
  /**
     * Issue a secret token on behalf of Spotify that the client will be able to use
     * to connect to Spotify.
     *
     * @param coveyTownID The town that the client should be able to connect to
     * @param clientIdentity The identity of the client; Spotify will map a client
     *                      that connects with the returned token back to this client identifier
     */
  getTokenForTown(coveyTownID: string, clientIdentity: string): Promise<string>;
}
import { customAlphabet, nanoid } from 'nanoid';
import { BoundingBox, ServerConversationArea } from '../client/TownsServiceClient';
import { ChatMessage, UserLocation } from '../CoveyTypes';
import CoveyTownListener from '../types/CoveyTownListener';
import Player, { SongData } from '../types/Player';
import PlayerSession from '../types/PlayerSession';
import IVideoClient from './IVideoClient';
import SpotifyClient from './SpotifyClient';
import TwilioVideo from './TwilioVideo';

const friendlyNanoID = customAlphabet('1234567890ABCDEF', 8);

/**
 * The CoveyTownController implements the logic for each town: managing the various events that
 * can occur (e.g. joining a town, moving, leaving a town)
 */
export default class CoveyTownController {
  get capacity(): number {
    return this._capacity;
  }

  set isPubliclyListed(value: boolean) {
    this._isPubliclyListed = value;
  }

  get isPubliclyListed(): boolean {
    return this._isPubliclyListed;
  }

  get townUpdatePassword(): string {
    return this._townUpdatePassword;
  }

  get players(): Player[] {
    return this._players;
  }

  get occupancy(): number {
    return this._listeners.length;
  }

  get friendlyName(): string {
    return this._friendlyName;
  }

  set friendlyName(value: string) {
    this._friendlyName = value;
  }

  get coveyTownID(): string {
    return this._coveyTownID;
  }

  get conversationAreas(): ServerConversationArea[] {
    return this._conversationAreas;
  }

  /** The list of players currently in the town * */
  private _players: Player[] = [];

  /** The list of valid sessions for this town * */
  private _sessions: PlayerSession[] = [];

  /** The videoClient that this CoveyTown will use to provision video resources * */
  private _videoClient: IVideoClient = TwilioVideo.getInstance();

  /** The spotifyClient that this CoveyTown will use to handle Spotify interactions */
  private _spotifyClient: SpotifyClient = SpotifyClient.getInstance();

  /** The list of CoveyTownListeners that are subscribed to events in this town * */
  private _listeners: CoveyTownListener[] = [];

  /** The list of currently active ConversationAreas in this town */
  private _conversationAreas: ServerConversationArea[] = [];

  private readonly _coveyTownID: string;

  private _friendlyName: string;

  private readonly _townUpdatePassword: string;

  private _isPubliclyListed: boolean;

  private _capacity: number;

  /** user for recurring function calls */
  private _intervalID: NodeJS.Timeout | undefined = undefined;

  updatePlayerSongs(): void {
    if (this.coveyTownID) {
      this._players.forEach(async player => {
        const currentPlayingSong = await SpotifyClient.getCurrentPlayingSong(this.coveyTownID, player);
        const playbackState = await SpotifyClient.getPlaybackState(this.coveyTownID, player);

        const songIsPlaying = playbackState?.isPlaying;
        
        if (!songIsPlaying) {
          player.spotifySong = undefined;
        } else {
          player.spotifySong = currentPlayingSong;
        }
        
        if (this._listeners) {
          this._listeners.forEach(listener => listener.onPlayerSongUpdated(player));
        }

        console.log(player.spotifySong?.displayTitle);
      });
    }
    if (this._players.length === 0 && this._intervalID) {
      clearInterval(this._intervalID);
    }
  }

  constructor(friendlyName: string, isPubliclyListed: boolean) {
    this._coveyTownID = process.env.DEMO_TOWN_ID === friendlyName ? friendlyName : friendlyNanoID();
    this._capacity = 50;
    this._townUpdatePassword = nanoid(24);
    this._isPubliclyListed = isPubliclyListed;
    this._friendlyName = friendlyName;
    this.updatePlayerSongs = this.updatePlayerSongs.bind(this);
  }

  /**
   * If the timer does not exist, begins repeated calls to updatePlayerSongs.
   */
  public beginUpdatePlayerSongs(): void {
    if (!this._intervalID) {
      this._intervalID = setInterval(this.updatePlayerSongs.bind(this), 5000);
    }
  }

  /**
   * If the timer exists, ends repeated calls to updatePlayerSongs.
   */
  public forceEndUpdatePlayerSongs(): void {
    if (this._intervalID) {
      clearInterval(this._intervalID);
    }
  }

  /**
   * Adds a player to this Covey Town, provisioning the necessary credentials for the
   * player, and returning them
   *
   * @param newPlayer The new player to add to the town
   */
  async addPlayer(newPlayer: Player): Promise<PlayerSession> {
    const theSession = new PlayerSession(newPlayer);

    this._sessions.push(theSession);
    this._players.push(newPlayer);

    // Create a video token for this user to join this town
    theSession.videoToken = await this._videoClient.getTokenForTown(
      this._coveyTownID,
      newPlayer.id,
    );

    // Notify other players that this player has joined
    this._listeners.forEach(listener => listener.onPlayerJoined(newPlayer));

    return theSession;
  }

  /**
   * Destroys all data related to a player in this town.
   *
   * @param session PlayerSession to destroy
   */
  destroySession(session: PlayerSession): void {
    const p = this._players.find(player => player.id === session.player.id);
    if (p !== undefined) {
      SpotifyClient.removeTownPlayerFromClient(this._coveyTownID, p);
    }
    this._players = this._players.filter(player => player.id !== session.player.id);
    // console.log(`players: ${this._players}`);
    this._sessions = this._sessions.filter(s => s.sessionToken !== session.sessionToken);
    this._listeners.forEach(listener => listener.onPlayerDisconnected(session.player));
    const conversation = session.player.activeConversationArea;
    if (conversation) {
      this.removePlayerFromConversationArea(session.player, conversation);
    }
  }

  /**
   * Updates the location of a player within the town
   * 
   * If the player has changed conversation areas, this method also updates the
   * corresponding ConversationArea objects tracked by the town controller, and dispatches
   * any onConversationUpdated events as appropriate
   * 
   * @param player Player to update location for
   * @param location New location for this player
   */
  updatePlayerLocation(player: Player, location: UserLocation): void {
    const conversation = this.conversationAreas.find(conv => conv.label === location.conversationLabel);
    const prevConversation = player.activeConversationArea;

    player.location = location;
    player.activeConversationArea = conversation;

    if (conversation !== prevConversation) {
      if (prevConversation) {
        this.removePlayerFromConversationArea(player, prevConversation);
      }
      if (conversation) {
        conversation.occupantsByID.push(player.id);
        this._listeners.forEach(listener => listener.onConversationAreaUpdated(conversation));
      }
    }

    this._listeners.forEach(listener => listener.onPlayerMoved(player));
  }

  /**
   * Updates the song of a player within the town
   * 
   * Will update the song based on the provided song data, but the with a progress
   * (timestamp) of 0, causing the song to play at the beginning.  Will also trigger
   * a Spotify API call to change the song the user is listening to on Spotify.
   * 
   * @param player Player to update song for
   * @param songData New song for the player
   */
  async changePlayerSong(player: Player, songData: SongData): Promise<void> {
    const songFromStart = {
      displayTitle: songData.displayTitle,
      uris: songData.uris,
      progress: 0,
    };

    const songChanged = await SpotifyClient.startUserPlayback(this.coveyTownID, player, songFromStart);

    if (songChanged) {
      player.spotifySong = songFromStart;
      this._listeners.forEach(listener => listener.onPlayerSongUpdated(player));
    }
  }

  /**
   * Removes a player from a conversation area, updating the conversation area's occupants list, 
   * and emitting the appropriate message (area updated or area destroyed)
   * 
   * Does not update the player's activeConversationArea property.
   * 
   * @param player Player to remove from conversation area
   * @param conversation Conversation area to remove player from
   */
  removePlayerFromConversationArea(player: Player, conversation: ServerConversationArea) : void {
    conversation.occupantsByID.splice(conversation.occupantsByID.findIndex(p=>p === player.id), 1);
    if (conversation.occupantsByID.length === 0) {
      this._conversationAreas.splice(this._conversationAreas.findIndex(conv => conv === conversation), 1);
      this._listeners.forEach(listener => listener.onConversationAreaDestroyed(conversation));
    } else {
      this._listeners.forEach(listener => listener.onConversationAreaUpdated(conversation));
    }
  }

  /**
   * Creates a new conversation area in this town if there is not currently an active
   * conversation with the same label.
   *
   * Adds any players who are in the region defined by the conversation area to it.
   *
   * Notifies any CoveyTownListeners that the conversation has been updated
   *
   * @param _conversationArea Information describing the conversation area to create. Ignores any
   *  occupantsById that are set on the conversation area that is passed to this method.
   *
   * @returns true if the conversation is successfully created, or false if not
   */
  addConversationArea(_conversationArea: ServerConversationArea): boolean {
    if (this._conversationAreas.find(
      eachExistingConversation => eachExistingConversation.label === _conversationArea.label,
    ))
      return false;
    if (_conversationArea.topic === ''){
      return false;
    }
    if (this._conversationAreas.find(eachExistingConversation => 
      CoveyTownController.boxesOverlap(eachExistingConversation.boundingBox, _conversationArea.boundingBox)) !== undefined){
      return false;
    }
    const newArea :ServerConversationArea = Object.assign(_conversationArea);
    this._conversationAreas.push(newArea);
    const playersInThisConversation = this.players.filter(player => player.isWithin(newArea));
    playersInThisConversation.forEach(player => {player.activeConversationArea = newArea;});
    newArea.occupantsByID = playersInThisConversation.map(player => player.id);
    this._listeners.forEach(listener => listener.onConversationAreaUpdated(newArea));
    return true;
  }

  /**
   * Detects whether two bounding boxes overlap and share any points
   * 
   * @param box1 
   * @param box2 
   * @returns true if the boxes overlap, otherwise false
   */
  static boxesOverlap(box1: BoundingBox, box2: BoundingBox):boolean{
    // Helper function to extract the top left (x1,y1) and bottom right corner (x2,y2) of each bounding box
    const toRectPoints = (box: BoundingBox) => ({ x1: box.x - box.width / 2, x2: box.x + box.width / 2, y1: box.y - box.height / 2, y2: box.y + box.height / 2 });
    const rect1 = toRectPoints(box1);
    const rect2 = toRectPoints(box2);
    const noOverlap = rect1.x1 >= rect2.x2 || rect2.x1 >= rect1.x2 || rect1.y1 >= rect2.y2 || rect2.y1 >= rect1.y2;
    return !noOverlap;
  }

  /**
   * Subscribe to events from this town. Callers should make sure to
   * unsubscribe when they no longer want those events by calling removeTownListener
   *
   * @param listener New listener
   */
  addTownListener(listener: CoveyTownListener): void {
    this._listeners.push(listener);
  }

  /**
   * Unsubscribe from events in this town.
   *
   * @param listener The listener to unsubscribe, must be a listener that was registered
   * with addTownListener, or otherwise will be a no-op
   */
  removeTownListener(listener: CoveyTownListener): void {
    this._listeners = this._listeners.filter(v => v !== listener);
  }

  onChatMessage(message: ChatMessage): void {
    this._listeners.forEach(listener => listener.onChatMessage(message));
  }

  /**
   * Fetch a player's session based on the provided session token. Returns undefined if the
   * session token is not valid.
   *
   * @param token
   */
  getSessionByToken(token: string): PlayerSession | undefined {
    return this._sessions.find(p => p.sessionToken === token);
  }

  disconnectAllPlayers(): void {
    this._listeners.forEach(listener => listener.onTownDestroyed());
  }

}

export interface SongData {
  /** The display title for the song * */
  displayTitle: string;
  /** The Spotify uris associated with the song */
  uris: Array<string>;
  /** The progress (timestamp) in the song, in ms */
  progress: number;
}

export default class Player {
  public location?: UserLocation;

  private readonly _id: string;

  private readonly _userName: string;

  public sprite?: Phaser.GameObjects.Sprite;

  public label?: Phaser.GameObjects.Text;

  public songLabel?: Phaser.GameObjects.Text;

  public song?: SongData;

  constructor(id: string, userName: string, location: UserLocation, song: SongData) {
    this._id = id;
    this._userName = userName;
    this.location = location;
    this.song = song;
  }

  get userName(): string {
    return this._userName;
  }

  get id(): string {
    return this._id;
  }

  static fromServerPlayer(playerFromServer: ServerPlayer): Player {
    return new Player(playerFromServer._id, playerFromServer._userName, playerFromServer.location, playerFromServer._song);
  }
}
export type ServerPlayer = { _id: string, _userName: string, location: UserLocation, _song: SongData };

export type Direction = 'front'|'back'|'left'|'right';

export type UserLocation = {
  x: number,
  y: number,
  rotation: Direction,
  moving: boolean,
  conversationLabel?: string
};

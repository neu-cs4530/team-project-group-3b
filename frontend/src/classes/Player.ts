export default class Player {
  public location?: UserLocation;

  private readonly _id: string;

  private readonly _userName: string;

  public sprite?: Phaser.GameObjects.Sprite;

  public label?: Phaser.GameObjects.Text;

  public spotifyLabel?: Phaser.GameObjects.Text;

  public song?: string;

  constructor(id: string, userName: string, location: UserLocation, song: string) {
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
    return new Player(playerFromServer._id, playerFromServer._userName, playerFromServer.location, playerFromServer.song);
  }
}
export type ServerPlayer = { _id: string, _userName: string, location: UserLocation, song: string };

export type Direction = 'front'|'back'|'left'|'right';

export type UserLocation = {
  x: number,
  y: number,
  rotation: Direction,
  moving: boolean,
  conversationLabel?: string
};

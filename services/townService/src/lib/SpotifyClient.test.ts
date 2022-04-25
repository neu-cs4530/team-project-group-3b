import { nanoid } from 'nanoid';
import axios from 'axios';
import { mock, mockDeep, mockReset } from 'jest-mock-extended';
import Player, { PlaybackState, SongData } from '../types/Player';
import CoveyTownController from './CoveyTownController';
import SpotifyClient from './SpotifyClient';
import TwilioVideo from './TwilioVideo';

jest.useFakeTimers();

const mockTwilioVideo = mockDeep<TwilioVideo>();
jest.spyOn(TwilioVideo, 'getInstance').mockReturnValue(mockTwilioVideo);

const mockSpotifyClient = mockDeep<SpotifyClient>();
jest.spyOn(SpotifyClient, 'getInstance').mockReturnValue(mockSpotifyClient);

jest.mock('axios');

const getUserData = { data: {
  'country': 'US',
  'display_name': 'ec',
  'email': 'leecostich@gmail.com',
  'explicit_content': {
    'filter_enabled': false,
    'filter_locked': false,
  },
  'external_urls': {
    'spotify': 'https://open.spotify.com/user/leecostich',
  },
  'followers': {
    'href': null,
    'total': 9,
  },
  'href': 'https://api.spotify.com/v1/users/leecostich',
  'id': 'leecostich',
  'images': [
    {
      'height': null,
      'url': 'https://i.scdn.co/image/ab6775700000ee857af1d30308cbf00a46690537',
      'width': null,
    },
  ],
  'product': 'premium',
  'type': 'user',
  'uri': 'spotify:user:leecostich',
} };

const getCPSData = { data: {
  'timestamp': 1649900555682,
  'context': {
    'external_urls': {
      'spotify': 'https://open.spotify.com/playlist/37i9dQZF1EJxR0ZgymRw21',
    },
    'href': 'https://api.spotify.com/v1/playlists/37i9dQZF1EJxR0ZgymRw21',
    'type': 'playlist',
    'uri': 'spotify:playlist:37i9dQZF1EJxR0ZgymRw21',
  },
  'progress_ms': 3753,
  'item': {
    'album': {
      'album_type': 'album',
      'artists': [
        {
          'external_urls': {
            'spotify': 'https://open.spotify.com/artist/15iVAtD3s3FsQR4w1v6M0P',
          },
          'href': 'https://api.spotify.com/v1/artists/15iVAtD3s3FsQR4w1v6M0P',
          'id': '15iVAtD3s3FsQR4w1v6M0P',
          'name': 'Chief Keef',
          'type': 'artist',
          'uri': 'spotify:artist:15iVAtD3s3FsQR4w1v6M0P',
        },
      ],
      'external_urls': {
        'spotify': 'https://open.spotify.com/album/117i43x9P3zxUQ7UAcxrBV',
      },
      'href': 'https://api.spotify.com/v1/albums/117i43x9P3zxUQ7UAcxrBV',
      'id': '117i43x9P3zxUQ7UAcxrBV',
      'images': [
        {
          'height': 640,
          'url': 'https://i.scdn.co/image/ab67616d0000b2730f30c5c8809fa6e6776dceaa',
          'width': 640,
        },
        {
          'height': 300,
          'url': 'https://i.scdn.co/image/ab67616d00001e020f30c5c8809fa6e6776dceaa',
          'width': 300,
        },
        {
          'height': 64,
          'url': 'https://i.scdn.co/image/ab67616d000048510f30c5c8809fa6e6776dceaa',
          'width': 64,
        },
      ],
      'name': '4NEM',
      'release_date': '2021-12-17',
      'release_date_precision': 'day',
      'total_tracks': 15,
      'type': 'album',
      'uri': 'spotify:album:117i43x9P3zxUQ7UAcxrBV',
    },
    'artists': [
      {
        'external_urls': {
          'spotify': 'https://open.spotify.com/artist/15iVAtD3s3FsQR4w1v6M0P',
        },
        'href': 'https://api.spotify.com/v1/artists/15iVAtD3s3FsQR4w1v6M0P',
        'id': '15iVAtD3s3FsQR4w1v6M0P',
        'name': 'Chief Keef',
        'type': 'artist',
        'uri': 'spotify:artist:15iVAtD3s3FsQR4w1v6M0P',
      },
    ],
    'disc_number': 1,
    'duration_ms': 111483,
    'explicit': true,
    'external_ids': {
      'isrc': 'QMRSZ2102952',
    },
    'external_urls': {
      'spotify': 'https://open.spotify.com/track/082PtKxlyQMemAnYZLSJMP',
    },
    'href': 'https://api.spotify.com/v1/tracks/082PtKxlyQMemAnYZLSJMP',
    'id': '082PtKxlyQMemAnYZLSJMP',
    'is_local': false,
    'is_playable': true,
    'name': 'Bitch Where',
    'popularity': 61,
    'preview_url': 'https://p.scdn.co/mp3-preview/3fd175d072395bcb2ecdcb170162628016c685f0?cid=774b29d4f13844c495f206cafdad9c86',
    'track_number': 1,
    'type': 'track',
    'uri': 'spotify:track:082PtKxlyQMemAnYZLSJMP',
  },
  'currently_playing_type': 'track',
  'actions': {
    'disallows': {
      'resuming': true,
      'skipping_prev': true,
    },
  },
  'is_playing': true,
} };

describe('SpotifyClient', () => {
  const testAuthToken = '{"access_token":"test_token", "expiry":3600}';
  const townName = `FriendlyNameTest1-${nanoid()}`;
  let player1 : Player;
  let townController : CoveyTownController;
  beforeEach(async () => {
    /* before each */
    SpotifyClient.getInstance();
    player1 = new Player(nanoid());
    townController = new CoveyTownController(townName, false);
    await townController.addPlayer(player1);
    SpotifyClient.addTownToClient(townController.coveyTownID);
  });
  it('should add players from different towns to the same map for a singly SpotifyClient on player add-to-town', async () => {
    const townName2 = `FriendlyNameTest2-${nanoid()}`;
    const townController2 = new CoveyTownController(townName2, false);
    const player2 = new Player(nanoid());
    await townController2.addPlayer(player2);
    SpotifyClient.addTownToClient(townController2.coveyTownID);
    SpotifyClient.addTownPlayerToClient(townController.coveyTownID, player1, testAuthToken);
    SpotifyClient.addTownPlayerToClient(townController2.coveyTownID, player2, testAuthToken);
    const retrievedToken1 = SpotifyClient.getTokenForTownPlayer(townController.coveyTownID, player1);
    expect(retrievedToken1).not.toBeUndefined();
    const retrievedToken2 = SpotifyClient.getTokenForTownPlayer(townController2.coveyTownID, player2);
    expect(retrievedToken2).not.toBeUndefined();
    // Used the same auth token to add each player, so they should be the same !
    expect(retrievedToken1).toEqual(retrievedToken2);
  });
  describe('addTownPlayerToClient', () => {
    it('should add the specified town/player combo to _townsToPlayerMaps', async () => {
      SpotifyClient.addTownPlayerToClient(townController.coveyTownID, player1, testAuthToken);
      expect(SpotifyClient.getTokenForTownPlayer(townController.coveyTownID, player1)).toEqual('test_token');
    });
  });
  describe('removeTownPlayerFromClient', () => {
    it('should remove the specified town/player combo from _townsToPlayerMaps', async () => {
      SpotifyClient.addTownPlayerToClient(townController.coveyTownID, player1, testAuthToken);
      expect(SpotifyClient.getTokenForTownPlayer(townController.coveyTownID, player1)).toEqual('test_token');
      SpotifyClient.removeTownPlayerFromClient(townController.coveyTownID, player1);
      expect(SpotifyClient.getTokenForTownPlayer(townController.coveyTownID, player1)).toBeUndefined();
    });
  });
  describe('getTokenForTownPlayer', () => {
    it('should return the proper token for a player after player is added to the town map', async () => {
      SpotifyClient.addTownPlayerToClient(townController.coveyTownID, player1, testAuthToken);
      const retrievedToken = SpotifyClient.getTokenForTownPlayer(townController.coveyTownID, player1);
      expect(retrievedToken).toEqual('test_token');
    });
    it('should return undefined for players not in the town map', async () => {
      const retrievedToken = SpotifyClient.getTokenForTownPlayer(townController.coveyTownID, player1);
      expect(retrievedToken).toBeUndefined();
    });
  });
  describe('town to client methods', () => {
    describe('addTownToClient', () => {
      it('should successfully add the specified town to the SpotifyClient tracking map', async () => {
        SpotifyClient.addTownPlayerToClient(townController.coveyTownID, player1, testAuthToken);
        const retrievedToken = SpotifyClient.getTokenForTownPlayer(townController.coveyTownID, player1);
        // If the town did not exist in the map, the return value of a token request would be undefined.
        expect(retrievedToken).not.toBeUndefined();
      });
    });
    describe('removeTownFromClient', () => {
      it('should successfully remove the specified town from the SC tracking map', async () => {
        SpotifyClient.addTownPlayerToClient(townController.coveyTownID, player1, testAuthToken);
        const retrievedToken1 = SpotifyClient.getTokenForTownPlayer(townController.coveyTownID, player1);
        expect(retrievedToken1).not.toBeUndefined();
        SpotifyClient.removeTownFromClient(townController.coveyTownID);
        const retrievedToken2 = SpotifyClient.getTokenForTownPlayer(townController.coveyTownID, player1);
        // After removal, the token request will not be able to find the key corresponding to the town ID -> undefined
        expect(retrievedToken2).toBeUndefined();
      });
    });
  });
  describe('getSpotifyUserID', () => {
    it('should successfully retrieve user data from the Spotify API', async () => {
      // Create a spy for GET, mock implementation to return spoofed data
      jest.spyOn(axios, 'get').mockImplementationOnce(() => Promise.resolve(getUserData));
      SpotifyClient.addTownPlayerToClient(townController.coveyTownID, player1, testAuthToken);
      await expect(SpotifyClient.getSpotifyUserID(townController.coveyTownID, player1)).resolves.toEqual('leecostich');
    });
  });
  describe('getCurrentPlayingSong', () => {
    it('should successfully retrieve current song data from the Spotify API', async () => {
      // Create a spy for GET, mock implementation to return spoofed data
      jest.spyOn(axios, 'get').mockImplementationOnce(() => Promise.resolve(getCPSData));
      SpotifyClient.addTownPlayerToClient(townController.coveyTownID, player1, testAuthToken);
      // Create a sample Song Data object using values we know should be in the spoofed API return
      const sampleSongData : SongData = { displayTitle: 'Bitch Where by Chief Keef',
        uris: ['spotify:track:082PtKxlyQMemAnYZLSJMP'],
        progress: 3753,
      };
      // Compare the Song Data objects of the mock API call and the sample
      await expect(SpotifyClient.getCurrentPlayingSong(townController.coveyTownID, player1)).resolves.toEqual(sampleSongData);
    });
  });
  describe('startUserPlayback', () => {
    it('should receive true when attempting PUT for startUserPlayback with valid parameters', async () => {
      // Create a spy for PUT, mock implementation to return spoofed data
      jest.spyOn(axios, 'put').mockImplementationOnce(() => Promise.resolve(true));
      SpotifyClient.addTownPlayerToClient(townController.coveyTownID, player1, testAuthToken);
      // Create a sample Song Data object using values that are required for the method calling PUT
      const sampleSongData : SongData = { displayTitle: 'Bitch Where by Chief Keef',
        uris: ['spotify:track:082PtKxlyQMemAnYZLSJMP'],
        progress: 3753,
      };
      // Look for TRUE as a response from PUT, which means that our method successfully formed the PUT request
      // for the Spotify API
      await expect(SpotifyClient.startUserPlayback(townController.coveyTownID, player1, sampleSongData)).resolves.toEqual(true);
    });
  });
  describe('getPlaybackState', () => {
    it('should successfully retrieve the current playback state from the Spotify API', async () => {
      // Create a spy for GET, mock implementation to return spoofed data
      jest.spyOn(axios, 'get').mockImplementationOnce(() => Promise.resolve(getCPSData));
      SpotifyClient.addTownPlayerToClient(townController.coveyTownID, player1, testAuthToken);
      // Create a sample PlaybackState object using values we know should be in the spoofed API return
      const samplePlaybackState : PlaybackState = { isPlaying: true };
      // Compare the PlaybackState objects of the mock API call and the sample
      await expect(SpotifyClient.getPlaybackState(townController.coveyTownID, player1)).resolves.toEqual(samplePlaybackState);
    });
  });
});


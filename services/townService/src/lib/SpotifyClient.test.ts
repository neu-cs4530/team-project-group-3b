import { nanoid } from 'nanoid';
import axios from 'axios';
import { mock, mockDeep, mockReset } from 'jest-mock-extended';
import Player, { SongData } from '../types/Player';
import CoveyTownController from './CoveyTownController';
import SpotifyClient from './SpotifyClient';
import TwilioVideo from './TwilioVideo';

jest.useFakeTimers();

const mockTwilioVideo = mockDeep<TwilioVideo>();
jest.spyOn(TwilioVideo, 'getInstance').mockReturnValue(mockTwilioVideo);

const mockSpotifyClient = mockDeep<SpotifyClient>();
jest.spyOn(SpotifyClient, 'getInstance').mockReturnValue(mockSpotifyClient);

jest.mock('axios');

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
  beforeEach(() => {
    /* before each */
    SpotifyClient.getInstance();
  });
  /* it('should add players from different towns to the same map on player add-to-town', async () => {
    const mockAddTownPlayerToClient = jest.fn();
    SpotifyClient.addTownPlayerToClient = mockAddTownPlayerToClient;
    const townName1 = `FriendlyNameTest1-${nanoid()}`;
    const townController1 = new CoveyTownController(townName1, false);
    const townName2 = `FriendlyNameTest2-${nanoid()}`;
    const townController2 = new CoveyTownController(townName2, false);
    const player1 = new Player(nanoid());
    const player2 = new Player(nanoid()); 
    await townController1.addPlayer(player1);
    await townController2.addPlayer(player2);
    expect(mockAddTownPlayerToClient).toHaveBeenCalledTimes(2);
  }); */
  describe('addTownPlayerToClient', () => {
    it('should add the specified town/player combo to _townsToPlayerMaps', async () => {
      const player1 = new Player(nanoid());
      const townName = `FriendlyNameTest1-${nanoid()}`;
      const townController = new CoveyTownController(townName, false);
      await townController.addPlayer(player1);
      const testAuthToken = '{"access_token":"test_token", "expiry":3600}';
      SpotifyClient.addTownToClient(townController.coveyTownID);
      SpotifyClient.addTownPlayerToClient(townController.coveyTownID, player1, testAuthToken);
      expect(SpotifyClient.getTokenForTownPlayer(townController.coveyTownID, player1)).toEqual('test_token');
    });
  });
  describe('removeTownPlayerFromClient', () => {
    it('should remove the specified town/player combo from _townsToPlayerMaps', async () => {
      const player1 = new Player(nanoid());
      const townName = `FriendlyNameTest1-${nanoid()}`;
      const townController = new CoveyTownController(townName, false);
      await townController.addPlayer(player1);
      const testAuthToken = '{"access_token":"test_token", "expiry":3600}';
      SpotifyClient.addTownToClient(townController.coveyTownID);
      SpotifyClient.addTownPlayerToClient(townController.coveyTownID, player1, testAuthToken);
      expect(SpotifyClient.getTokenForTownPlayer(townController.coveyTownID, player1)).toEqual('test_token');
      SpotifyClient.removeTownPlayerFromClient(townController.coveyTownID, player1);
      expect(SpotifyClient.getTokenForTownPlayer(townController.coveyTownID, player1)).toBeUndefined();
    });
  });
  describe('getTokenForTownPlayer', () => {
    it('should return the proper token for a player after player is added to the town map', async () => {
      const player1 = new Player(nanoid());
      const townName = `FriendlyNameTest1-${nanoid()}`;
      const townController = new CoveyTownController(townName, false);
      await townController.addPlayer(player1);
      const testAuthToken = '{"access_token":"test_token", "expiry":3600}';
      SpotifyClient.addTownToClient(townController.coveyTownID);
      SpotifyClient.addTownPlayerToClient(townController.coveyTownID, player1, testAuthToken);
      const retrievedToken = SpotifyClient.getTokenForTownPlayer(townController.coveyTownID, player1);
      expect(retrievedToken).toEqual('test_token');
    });
    it('should return undefined for players not in the town map', async () => {
      const player1 = new Player(nanoid());
      const townName = `FriendlyNameTest1-${nanoid()}`;
      const townController = new CoveyTownController(townName, false);
      await townController.addPlayer(player1);
      SpotifyClient.addTownToClient(townController.coveyTownID);
      const retrievedToken = SpotifyClient.getTokenForTownPlayer(townController.coveyTownID, player1);
      expect(retrievedToken).toBeUndefined();
    });
  });
  describe('town to client methods', () => {
    const townName = `FriendlyNameTest1-${nanoid()}`;
    const townController = new CoveyTownController(townName, false);
    const player1 = new Player(nanoid());
    const testAuthToken = '{"access_token":"test_token", "expiry":3600}';
    describe('addTownToClient', () => {
      it('should successfully add the specified town to the SpotifyClient tracking map', async () => {
        SpotifyClient.addTownToClient(townController.coveyTownID);
        await townController.addPlayer(player1);
        SpotifyClient.addTownPlayerToClient(townController.coveyTownID, player1, testAuthToken);
        const retrievedToken = SpotifyClient.getTokenForTownPlayer(townController.coveyTownID, player1);
        // If the town did not exist in the map, the return value of a token request would be undefined.
        expect(retrievedToken).not.toBeUndefined();
      });
    });
    describe('removeTownFromClient', () => {
      it('should successfully remove the specified town from the SC tracking map', async () => {
        SpotifyClient.addTownToClient(townController.coveyTownID);
        await townController.addPlayer(player1);
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
  describe('getCurrentPlayingSong', () => {
    it('should successfully retrieve current song data from the Spotify API', async () => {
      jest.spyOn(axios, 'get').mockImplementationOnce(() => Promise.resolve(getCPSData));
      const testAuthToken = '{"access_token":"test_token", "expiry":3600}';
      const player1 = new Player(nanoid());
      const townName = `FriendlyNameTest1-${nanoid()}`;
      const townController = new CoveyTownController(townName, false);
      await townController.addPlayer(player1);
      SpotifyClient.addTownToClient(townController.coveyTownID);
      SpotifyClient.addTownPlayerToClient(townController.coveyTownID, player1, testAuthToken);
      const sampleSongData : SongData = { displayTitle: 'Bitch Where by Chief Keef',
        uris: ['spotify:track:082PtKxlyQMemAnYZLSJMP'],
        progress: 3753,
      };
      await expect(SpotifyClient.getCurrentPlayingSong(townController.coveyTownID, player1)).resolves.toEqual(sampleSongData);
    });
  });
});


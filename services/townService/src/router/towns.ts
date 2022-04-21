import express, { Express } from 'express';
import io from 'socket.io';
import { Server } from 'http';
import { StatusCodes } from 'http-status-codes';
// import dotenv from 'dotenv'; // TODO is this ok to be in this file?
import assert from 'assert'; // TODO is this ok to be in this file?
import axios from 'axios';
import {
  conversationAreaCreateHandler,
  townCreateHandler, townDeleteHandler,
  townJoinHandler,
  townListHandler,
  townSubscriptionHandler,
  townUpdateHandler,
} from '../requestHandlers/CoveyTownRequestHandlers';
import { logError } from '../Utils';

export default function addTownRoutes(http: Server, app: Express): io.Server {
  /*
   * Create a new session (aka join a town)
   */
  app.post('/sessions', express.json(), async (req, res) => {
    try {
      if (req.body.spotifySessionToken != null) {
        const result = await townJoinHandler({
          userName: req.body.userName,
          coveyTownID: req.body.coveyTownID,
          spotifySessionToken: req.body.spotifySessionToken,
        });
        res.status(StatusCodes.OK)
          .json(result);
      } else {
        const result = await townJoinHandler({
          userName: req.body.userName,
          coveyTownID: req.body.coveyTownID,
        });
        res.status(StatusCodes.OK)
          .json(result);
      }
    } catch (err) {
      logError(err);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({
          message: 'Internal server error, please see log in server for more details',
        });
    }
  });

  /**
   * Delete a town
   */
  app.delete('/towns/:townID/:townPassword', express.json(), async (req, res) => {
    try {
      const result = townDeleteHandler({
        coveyTownID: req.params.townID,
        coveyTownPassword: req.params.townPassword,
      });
      res.status(200)
        .json(result);
    } catch (err) {
      logError(err);
      res.status(500)
        .json({
          message: 'Internal server error, please see log in server for details',
        });
    }
  });

  /**
   * List all towns
   */
  app.get('/towns', express.json(), async (_req, res) => {
    try {
      const result = townListHandler();
      res.status(StatusCodes.OK)
        .json(result);
    } catch (err) {
      logError(err);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({
          message: 'Internal server error, please see log in server for more details',
        });
    }
  });

  /**
   * Create a town
   */
  app.post('/towns', express.json(), async (req, res) => {
    try {
      const result = townCreateHandler(req.body);
      res.status(StatusCodes.OK)
        .json(result);
    } catch (err) {
      logError(err);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({
          message: 'Internal server error, please see log in server for more details',
        });
    }
  });
  /**
   * Update a town
   */
  app.patch('/towns/:townID', express.json(), async (req, res) => {
    try {
      const result = townUpdateHandler({
        coveyTownID: req.params.townID,
        isPubliclyListed: req.body.isPubliclyListed,
        friendlyName: req.body.friendlyName,
        coveyTownPassword: req.body.coveyTownPassword,
      });
      res.status(StatusCodes.OK)
        .json(result);
    } catch (err) {
      logError(err);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({
          message: 'Internal server error, please see log in server for more details',
        });
    }
  });

  app.post('/towns/:townID/conversationAreas', express.json(), async (req, res) => {
    try {
      const result = await conversationAreaCreateHandler({
        coveyTownID: req.params.townID,
        sessionToken: req.body.sessionToken,
        conversationArea: req.body.conversationArea,
      });
      res.status(StatusCodes.OK)
        .json(result);
    } catch (err) {
      logError(err);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({
          message: 'Internal server error, please see log in server for more details',
        });
    }
  });

  app.get('/spotify/login', (_req, res) => {
    // const state = generateRandomString(16); // todo technically optional but recommended, removed for now
    // const scope = 'user-read-playback-state user-modify-playback-state app-remote-control user-read-profile';
    const scope = 'user-read-email';

    assert(process.env.SPOTIFY_CLIENT_ID,
      'Environmental variable SPOTIFY_CLIENT_ID must be set');
    assert(process.env.SPOTIFY_REDIRECT_URI,
      'Environmental variable SPOTIFY_REDIRECT_URI must be set');

    const clientID = process.env.SPOTIFY_CLIENT_ID;
    const redirectURI = process.env.SPOTIFY_REDIRECT_URI;
  
    const urlParams: string = new URLSearchParams({
      response_type: 'code',
      client_id: clientID,
      scope,
      redirect_uri: redirectURI,
      // state: state
    }).toString();

    // axios.get(`https://accounts.spotify.com/authorize?${urlParams}`)
    res.redirect(`https://accounts.spotify.com/authorize?${urlParams}`);
    // TODO error handling maybe?
  });

  app.get('/spotify/callback', async (req, res) => {

    const code: string = req.query.code as string;

    assert(process.env.SPOTIFY_CLIENT_ID,
      'Environmental variable SPOTIFY_CLIENT_ID must be set');
    assert(process.env.SPOTIFY_CLIENT_SECRET,
      'Environmental variable SPOTIFY_REDIRECT_URI must be set');
    assert(process.env.SPOTIFY_REDIRECT_URI,
      'Environmental variable SPOTIFY_REDIRECT_URI must be set');

    const clientID = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    const redirectURI = process.env.SPOTIFY_REDIRECT_URI;

    const spotifyUrl = 'https://accounts.spotify.com/api/token';

    const data: string = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectURI,
    }).toString();

    const headers = {
      'Authorization': `Basic ${Buffer.from(`${clientID}:${clientSecret}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    };

    try {
      await axios.post(spotifyUrl, data, { headers });
      
      const result = {};
      res.status(StatusCodes.OK)
        .json(result);
      // todo better error handling for request
    } catch (err) {
      logError(err);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({
          message: 'Internal server error, please see log in server for more details',
        });
    }
  });

  const socketServer = new io.Server(http, { cors: { origin: '*' } });
  socketServer.on('connection', townSubscriptionHandler);
  return socketServer;
}

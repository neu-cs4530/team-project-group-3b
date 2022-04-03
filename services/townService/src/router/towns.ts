import express, { Express } from 'express';
import io from 'socket.io';
import { Server } from 'http';
import { StatusCodes } from 'http-status-codes';
// import dotenv from 'dotenv'; // TODO is this ok to be in this file?
import assert from 'assert'; // TODO is this ok to be in this file?
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
      const result = await townJoinHandler({
        userName: req.body.userName,
        coveyTownID: req.body.coveyTownID,
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
    
    res.redirect(`https://accounts.spotify.com/authorize?${urlParams}`);
    // TODO error handling maybe?
  });

  app.get('/spotify/callback', (req) => {

    // const code = req.query.code || null;
    const state = req.query.state || null;

    assert(process.env.SPOTIFY_CLIENT_ID,
      'Environmental variable SPOTIFY_CLIENT_ID must be set');
    assert(process.env.SPOTIFY_CLIENT_SECRET,
      'Environmental variable SPOTIFY_REDIRECT_URI must be set');
    assert(process.env.SPOTIFY_REDIRECT_URI,
      'Environmental variable SPOTIFY_REDIRECT_URI must be set');

    // const clientID = process.env.SPOTIFY_CLIENT_ID;
    // const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    // const redirectURI = process.env.SPOTIFY_REDIRECT_URI;

    if (state === null) {
      // this is an example of error state, since the received state obviously
      // does not match the state sent
    } else {
      // const authOptions = {
      //   url: 'https://accounts.spotify.com/api/token',
      //   form: {
      //     code,
      //     redirect_uri: redirectURI,
      //     grant_type: 'authorization_code',
      //   },
      //   headers: {
      //     'Authorization': `Basic ${Buffer.from(`${clientID}:${clientSecret}`).toString('base64')}`,
      //   },
      //   json: true,
      // };
      // todo we want to send this in a post request? we should make a call to a lib controller to a file in /client which uses
      // axios to make the post request to spotify
    }
    // TODO error handling maybe?
  });
  // still todo refresh token handling
  // all token handling should really be on the backend
  // TODO linter errors galore
  // TODO order of events: button clicked
  // get request for spotify/login
  // browser redirects to spotify
  // spotify logs in, redirects to here
  // here makes post request for auth token associated with player, redirects player to frontend
  // stores the player auth token and refresh token here
  // if that is not possible, then redirect should be to frontend, and post request still needs to be made
  // im worried that redirect to backend will mean that we lose who requested the spotify login
  // i think it will be fine but just remember that as a possibility
  // will need res to redirect to frontend

  const socketServer = new io.Server(http, { cors: { origin: '*' } });
  socketServer.on('connection', townSubscriptionHandler);
  return socketServer;
}

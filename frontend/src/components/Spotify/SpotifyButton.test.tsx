/* eslint-disable @typescript-eslint/ban-ts-comment */
import React from 'react';
import '@testing-library/jest-dom'
import  userEvent from "@testing-library/user-event";
import { render, RenderResult } from '@testing-library/react';
import SpotifyButton from './SpotifyButton';
import TownsServiceClient from '../../classes/TownsServiceClient';

const mockUseCoveyAppState = jest.fn(() => (Promise.resolve()));

jest.mock('../../classes/TownsServiceClient');
jest.mock('../../hooks/useCoveyAppState', () => ({
    __esModule: true, // this property makes it work
    default: () => (mockUseCoveyAppState)
}));

const mockRequestSpotifyAuthorizationFlow = jest.fn();
TownsServiceClient.prototype.requestSpotifyAuthorizationFlow = mockRequestSpotifyAuthorizationFlow;
// @ts-ignore
mockUseCoveyAppState.apiClient = new TownsServiceClient();

describe("SpotifyButton", () => {
    let renderedComponent: RenderResult;
    let loginButton: HTMLElement;

    beforeEach(() => {
        mockRequestSpotifyAuthorizationFlow.mockReset();

        renderedComponent = render(<SpotifyButton />);

        loginButton = renderedComponent.getByRole("menuitem");
    });

    it("makes a call to apiClient.requestSpotifyAuthorizationFlow when clicked", () => {
        expect(mockRequestSpotifyAuthorizationFlow).not.toBeCalled();

        userEvent.click(loginButton);

        expect(mockRequestSpotifyAuthorizationFlow).toBeCalledTimes(1);
    });

});
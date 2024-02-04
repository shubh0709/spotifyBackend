import SpotifyWebApi from 'spotify-web-api-node';
import dotenv from 'dotenv';
import { DEVELOPMENT } from './constants';
import { Comments } from './types';
dotenv.config();

let spotifyApi: SpotifyWebApi;

spotifyApi = new SpotifyWebApi({
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    redirectUri: process.env.NODE_ENV === DEVELOPMENT ? `${process.env.LOCALHOST_NODE_URL}/callback` : `${process.env.PRODUCTION_NODE_URL}/callback`
});

const scopes = ['user-read-private', 'user-read-email', 'playlist-read-private'];
const state = '';

const getToken = async (code: string) => {
    try {
        const data = await spotifyApi.authorizationCodeGrant(code);
        const { access_token, refresh_token } = data.body;
        spotifyApi.setAccessToken(access_token);
        spotifyApi.setRefreshToken(refresh_token);
        return { access_token, refresh_token };
    } catch (error) {
        console.error('Something went wrong when retrieving an access token', error);
        return null;
    }
};

const getUserDetails = async () => {
    try {
        const data = await spotifyApi.getMe();
        return data.body;
    } catch (error) {
        console.error('Error retrieving user details:', error);
        return null;
    }
};

export function addReplyToComment(comments: Comments[], commentId: string, reply: Comments): boolean {
    for (let comment of comments) {
        if (comment.id === commentId) {
            comment.replies.push(reply);
            return true;
        }

        // Check if this comment has replies and recursively search within them
        if (comment.replies.length > 0) {
            const isAdded = addReplyToComment(comment.replies, commentId, reply);
            if (isAdded) return true;
        }
    }
    return false;
}
const getLoginUrl = () => {
    return spotifyApi.createAuthorizeURL(scopes, state);
};

const refreshAccessToken = async () => {
    try {
        const data = await spotifyApi.refreshAccessToken();
        const { access_token } = data.body;
        spotifyApi.setAccessToken(access_token);
        return access_token;
    } catch (error) {
        console.error('Error refreshing access token:', error);
        return null;
    }
};

// Update the searchTracks method to handle token expiry
const searchTracks = async (query: string): Promise<{ name: string, id: string }[]> => {
    try {
        const data = await spotifyApi.searchTracks(query);
        return data.body.tracks!.items.map((val: SpotifyApi.TrackObjectFull) => ({ name: val.name, id: val.id }));
    } catch (error: any) {
        if (error.statusCode === 401) {
            // Token expired, refresh it
            const newToken = await refreshAccessToken();
            if (newToken) {
                return await searchTracks(query); // Retry the search with the new token
            }
        }
        console.error('Error searching tracks:', error);
        return [];
    }
};
export { spotifyApi, getLoginUrl, getToken, searchTracks, getUserDetails };

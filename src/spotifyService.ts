import SpotifyWebApi from 'spotify-web-api-node';
import dotenv from 'dotenv';
dotenv.config();

let spotifyApi: SpotifyWebApi;

console.log("client id: ", process.env.SPOTIFY_CLIENT_ID);

spotifyApi = new SpotifyWebApi({
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    redirectUri: 'http://localhost:8080/callback'
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
        return data.body; // This contains user details, including the user ID
    } catch (error) {
        console.error('Error retrieving user details:', error);
        return null;
    }
};

const getLoginUrl = () => {
    return spotifyApi.createAuthorizeURL(scopes, state);
};

const searchTracks = async (query: string) => {
    try {
        const data = await spotifyApi.searchTracks(query);
        return data.body.tracks!.items;
    } catch (error) {
        console.error('Error searching tracks:', error);
        return [];
    }
};

export { spotifyApi, getLoginUrl, getToken, searchTracks, getUserDetails };

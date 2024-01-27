import SpotifyWebApi from 'spotify-web-api-node';

let spotifyApi;

const scopes = [''];
const state = '';

const getLoginUrl = () => {
    spotifyApi = new SpotifyWebApi({
        clientId: process.env.SPOTIFY_CLIENT_ID,
        clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
        redirectUri: 'http://localhost:8080/callback'
    });
    return spotifyApi.createAuthorizeURL(scopes, state);
};

export { spotifyApi, getLoginUrl };

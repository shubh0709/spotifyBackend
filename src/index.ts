import express from 'express';
import { getLoginUrl } from './spotifyService';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

app.get('/', (req, res) => {
    res.send('Hello World!');
});


app.get('/login', (req, res) => {
    res.redirect(getLoginUrl());
});

app.get('/callback', (req, res) => {
    const code = req.query.code || null;
    res.send(`Authorization code: ${code}`);
});

app.listen(PORT, () => {
    console.log(`Server running on ${PORT}`);
});

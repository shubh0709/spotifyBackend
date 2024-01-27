import express from 'express';
import { getToken, getLoginUrl, searchTracks, getUserDetails } from './spotifyService';
import cors from 'cors';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 8080;

interface Comments {
    id: string;
    trackId: string,
    text: string;
    userId: string;
    replies: Comments[];
}

let comments: Comments[] = [];

app.get('/', (req, res) => {
    res.send('Hello World!');
});


app.get('/login', (req, res) => {
    res.redirect(getLoginUrl());
});

app.get('/callback', async (req, res) => {
    const code = req.query.code || null;
    if (code) {
        try {
            const tokenData = await getToken(code as string);
            const userDetails = await getUserDetails();

            res.json({ token: tokenData, user: userDetails });
        } catch (error) {
            res.status(500).send('Error during token exchange');
        }
    } else {
        res.status(400).send('Invalid request: No code provided');
    }
});


app.get('/search', async (req, res) => {
    const query = req.query.q;

    if (!query) {
        res.status(400).send('Query parameter "q" is required');
        return;
    }

    try {
        const tracks = await searchTracks(query as string);
        res.json(tracks);
    } catch (error) {
        res.status(500).send('Error searching for tracks');
    }
});



app.post('/comments', (req, res) => {
    const { trackId, text, userId } = req.body;
    if (!trackId || !text) {
        return res.status(400).send('Track ID and text are required');
    }

    const newComment = {
        id: uuidv4(),
        trackId,
        text,
        userId: userId || 'anonymous',
        replies: []
    };

    comments.push(newComment);
    res.status(201).json(newComment);
});


app.get('/comments/:trackId', (req, res) => {
    const { trackId } = req.params;
    const trackComments = comments.filter(comment => comment.trackId === trackId);
    res.json(trackComments);
});


app.post('/comments/:commentId/reply', (req, res) => {
    const { commentId } = req.params;
    const { text, userId } = req.body;

    if (!text) {
        return res.status(400).send('Text is required for a reply');
    }

    const parentComment = comments.find(comment => comment.id === commentId);
    if (!parentComment) {
        return res.status(404).send('Parent comment not found');
    }

    const reply = {
        id: uuidv4(),
        trackId: parentComment.trackId,
        text,
        userId: userId || 'anonymous',
        replies: [] // Replies can have their own replies
    };

    parentComment.replies.push(reply);
    res.status(201).json(reply);
});



app.listen(PORT, () => {
    console.log(`Server running on ${PORT}`);
});

import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import { getToken, getLoginUrl, searchTracks, getUserDetails, addReplyToComment } from './spotifyService';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { CORS_OPTIONS } from './constants';
import morgan from 'morgan';
import session from 'express-session';
import { Comments } from './types';



const app = express();

app.use(morgan('dev'));
app.use(cors(CORS_OPTIONS));
app.use(express.json());
app.use(session({
    secret: process.env.SESSION_SECRET ?? "",
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV !== 'development',
        sameSite: 'strict'
    }
}));

const PORT = process.env.PORT || 8080;



let comments: Comments[] = [];

app.get('/', (req, res) => {
    res.send('Hello World!');
});


app.get('/login', (req, res) => {
    res.redirect(getLoginUrl());
});

app.get('/check-auth', (req, res) => {
    if (req?.session?.user && req?.session?.accessToken) {
        console.log({ session: req.session });
        res.json({ isAuthenticated: true, user: req.session.user });
    } else {
        console.log("auth failed");
        res.json({ isAuthenticated: false });
    }
});

app.get('/callback', async (req, res) => {
    console.log("triggerd callback");
    const code = req.query.code || null;
    if (code) {
        try {
            const tokenData = await getToken(code as string);
            const userDetails = await getUserDetails();

            // Store user details and access token in the session
            req.session.user = userDetails;
            req.session.accessToken = tokenData!.access_token;

            console.log("redirecting");
            res.redirect('/');
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
    const { trackId, text, username } = req.body;
    if (!trackId || !text) {
        return res.status(400).send('Track ID and text are required');
    }

    const newComment = {
        id: uuidv4(),
        trackId,
        text,
        username: username || 'anonymous',
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

function findCommentById(comments: Comments[], commentId: string): Comments | undefined {
    for (const comment of comments) {
        if (comment.id === commentId) {
            return comment;
        }
        if (comment.replies) {
            const nestedComment = findCommentById(comment.replies, commentId);
            if (nestedComment) {
                return nestedComment;
            }
        }
    }
    return undefined;
}


app.post('/comments/:commentId/reply', (req, res) => {
    const { commentId } = req.params;
    const { text, userId } = req.body;

    console.log({ "replying to: ": commentId });

    if (!text) {
        return res.status(400).send('Text is required for a reply');
    }

    console.log({ comments });

    const parentComment = findCommentById(comments, commentId);
    if (!parentComment) {
        return res.status(404).send('Parent comment not found');
    }

    const reply: Comments = {
        id: uuidv4(),
        trackId: parentComment.trackId,
        text,
        username: userId || 'anonymous',
        replies: []
    };

    const isAdded = addReplyToComment(comments, commentId, reply);
    if (!isAdded) {
        return res.status(404).send('Parent comment not found');
    }

    // console.log({ "added comment: ": JSON.stringify(comments) });

    res.status(201).json(reply);
});



app.listen(PORT, () => {
    console.log(`Server running on ${PORT}`);
});

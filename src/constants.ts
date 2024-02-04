export const DEVELOPMENT = 'development';
console.log({ NODE_ENV: process.env.NODE_ENV });
console.log({ CLIENT_URL: process.env.CLIENT_URL });
export const CORS_OPTIONS = {
    origin: process.env.CLIENT_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
};
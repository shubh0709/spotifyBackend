export interface Comments {
    id: string;
    trackId: string,
    text: string;
    username: string;
    replies: Comments[];
}


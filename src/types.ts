export interface Album {
    id: number;
    title: string;
    artist_id: number;
    rank: number;
    release_date?: string;
    rating?: number;
    ratings_count?: string;
    image_path: string;
    spotify_link?: string;
    youtube_link?: string;
    apple_music_link?: string;
    artist_name: string;
    genres: string[];
    is_liked?: boolean;
}

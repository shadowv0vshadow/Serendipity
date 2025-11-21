export interface Album {
    id: number;
    title: string;
    artist_id: number;
    rank: number;
    release_date: string | null;
    rating: number | null;
    ratings_count: string | null;
    image_path: string;
    spotify_link: string | null;
    youtube_link: string | null;
    apple_music_link: string | null;
    artist_name: string;
    genres: string[];
}

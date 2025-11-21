from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import sqlite3
import random
import os
from typing import List, Optional
from pydantic import BaseModel

app = FastAPI(title="Serendipity API")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all for Vercel (or specify domain)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Album(BaseModel):
    id: int
    title: str
    artist_id: int
    rank: int
    release_date: Optional[str]
    rating: Optional[float]
    ratings_count: Optional[str]
    image_path: str
    spotify_link: Optional[str]
    youtube_link: Optional[str]
    apple_music_link: Optional[str]
    artist_name: str
    genres: List[str]

def get_db_connection():
    # Use absolute path for Vercel environment
    db_path = os.path.join(os.path.dirname(__file__), 'rym.db')
    # Open in read-only mode to avoid writing lock files in Vercel's read-only FS
    conn = sqlite3.connect(f"file:{db_path}?mode=ro", uri=True)
    conn.row_factory = sqlite3.Row
    return conn

@app.get("/api/albums", response_model=List[Album])
async def get_albums():
    try:
        conn = get_db_connection()
        c = conn.cursor()
        
        # Get all albums with artist names
        albums = c.execute('''
            SELECT a.*, ar.name as artist_name 
            FROM albums a 
            JOIN artists ar ON a.artist_id = ar.id
            ORDER BY a.rank ASC
        ''').fetchall()
        
        results = []
        for album in albums:
            album_dict = dict(album)
            
            # Get genres
            genres = c.execute('''
                SELECT g.name 
                FROM genres g 
                JOIN album_genres ag ON g.id = ag.genre_id 
                WHERE ag.album_id = ?
            ''', (album['id'],)).fetchall()
            
            album_dict['genres'] = [g['name'] for g in genres]
            
            # Fix image path
            # In Vercel, Next.js serves /covers/ from public/covers/
            # We just need to ensure the path string is correct
            img_path = album_dict['image_path']
            if img_path.startswith('covers/'):
                img_path = img_path.replace('covers/', '')
            
            album_dict['image_path'] = f"/covers/{img_path}"
            
            results.append(album_dict)
            
        conn.close()
        
        # Shuffle results for Serendipity
        random.shuffle(results)
        
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/albums/{album_id}", response_model=Album)
async def get_album(album_id: int):
    try:
        conn = get_db_connection()
        c = conn.cursor()
        
        album = c.execute('''
            SELECT a.*, ar.name as artist_name 
            FROM albums a 
            JOIN artists ar ON a.artist_id = ar.id
            WHERE a.id = ?
        ''', (album_id,)).fetchone()
        
        if album is None:
            conn.close()
            raise HTTPException(status_code=404, detail="Album not found")
        
        album_dict = dict(album)
        
        genres = c.execute('''
            SELECT g.name 
            FROM genres g 
            JOIN album_genres ag ON g.id = ag.genre_id 
            WHERE ag.album_id = ?
        ''', (album_id,)).fetchall()
        
        album_dict['genres'] = [g['name'] for g in genres]
        
        img_path = album_dict['image_path']
        if img_path.startswith('covers/'):
            img_path = img_path.replace('covers/', '')
        album_dict['image_path'] = f"/covers/{img_path}"
        
        conn.close()
        return album_dict
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

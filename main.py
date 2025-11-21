from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import sqlite3
import random
from typing import List, Optional
from pydantic import BaseModel

app = FastAPI(title="Serendipity API")

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount covers directory
app.mount("/covers", StaticFiles(directory="covers"), name="covers")

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
    conn = sqlite3.connect('rym.db')
    conn.row_factory = sqlite3.Row
    return conn

@app.get("/api/albums", response_model=List[Album])
async def get_albums():
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
        
        # Fix image path to point to our static mount
        # Stored as 'covers/filename.jpg', we want '/covers/filename.jpg'
        # But wait, the static mount is at /covers, so if we access /covers/filename.jpg it maps to covers/filename.jpg
        # The DB has 'covers/...' or just '...'?
        # Let's check export_db_to_json.py again. It had logic:
        # if album_dict['image_path'] and not album_dict['image_path'].startswith('/'):
        #      album_dict['image_path'] = '/' + album_dict['image_path']
        # In the DB, it is likely 'covers/filename.jpg'.
        # So if we serve it at /covers, we need the path to be /covers/filename.jpg (if the file is directly in covers/)
        # If DB has 'covers/foo.jpg', and we mount 'covers' dir at '/covers', then '/covers/foo.jpg' would look for 'covers/foo.jpg' inside 'covers/' -> 'covers/covers/foo.jpg' which is wrong.
        # Let's check what's in the DB.
        
        # Assuming DB has 'covers/filename.jpg'.
        # If we mount StaticFiles(directory="covers") at "/covers", then requesting "/covers/filename.jpg" will look for "filename.jpg" inside "covers" directory.
        # So we need to strip the "covers/" prefix from the DB value if it exists, and prepend "/covers/".
        
        img_path = album_dict['image_path']
        if img_path.startswith('covers/'):
            img_path = img_path.replace('covers/', '')
        
        # Ensure it starts with /covers/
        album_dict['image_path'] = f"/covers/{img_path}"
        
        results.append(album_dict)
        
    conn.close()
    
    # Shuffle results for Serendipity
    random.shuffle(results)
    
    return results

@app.get("/api/albums/{album_id}", response_model=Album)
async def get_album(album_id: int):
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
import sqlite3
import random
import os
from typing import List, Optional
from pydantic import BaseModel
import bcrypt
from collections import Counter

app = FastAPI(title="slowdive API")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Album(BaseModel):
    """Base album model with core album data."""
    id: int
    title: str
    artist_id: int
    rank: int
    release_date: Optional[str]
    rating: Optional[float]
    ratings_count: Optional[str]
    image_path: Optional[str]
    spotify_link: Optional[str]
    youtube_link: Optional[str]
    apple_music_link: Optional[str]
    artist_name: str
    genres: List[str]

class AlbumResponse(Album):
    """
    Album response model that extends Album with user-specific context.
    
    Note: is_liked is a context-dependent field that represents whether
    the current user has liked this album. It's a many-to-many relationship
    stored in the 'likes' table (user_id, album_id).
    """
    is_liked: bool = False

class UserRegister(BaseModel):
    username: str
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class LikeRequest(BaseModel):
    user_id: int
    album_id: int

def get_db_connection():
    # rym.db is now in the same directory as index.py (api/)
    base_dir = os.path.dirname(os.path.abspath(__file__))
    db_path = os.path.join(base_dir, 'rym.db')
    conn = sqlite3.connect(f"file:{db_path}?mode=ro", uri=True)
    conn.row_factory = sqlite3.Row
    return conn

def get_write_db_connection():
    # For write operations (Auth/Likes), we need a writable connection
    base_dir = os.path.dirname(os.path.abspath(__file__))
    db_path = os.path.join(base_dir, 'rym.db')
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn

@app.post("/api/auth/register")
async def register(user: UserRegister):
    try:
        conn = get_write_db_connection()
        c = conn.cursor()
        
        # Hash password with bcrypt
        password_bytes = user.password.encode('utf-8')
        salt = bcrypt.gensalt()
        hashed_password = bcrypt.hashpw(password_bytes, salt).decode('utf-8')
        
        c.execute("INSERT INTO users (username, password_hash) VALUES (?, ?)", (user.username, hashed_password))
        conn.commit()
        user_id = c.lastrowid
        conn.close()
        return {"id": user_id, "username": user.username}
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=400, detail="Username already exists")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/auth/login")
async def login(user: UserLogin):
    conn = get_db_connection() # Read-only is fine for login check
    c = conn.cursor()
    user_record = c.execute("SELECT * FROM users WHERE username = ?", (user.username,)).fetchone()
    conn.close()

    if not user_record:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Verify password with bcrypt
    password_bytes = user.password.encode('utf-8')
    stored_hash = user_record['password_hash'].encode('utf-8')
    
    if not bcrypt.checkpw(password_bytes, stored_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    return {"id": user_record['id'], "username": user_record['username']}

@app.post("/api/likes")
async def toggle_like(like: LikeRequest):
    try:
        conn = get_write_db_connection()
        c = conn.cursor()
        
        # Check if already liked
        existing = c.execute("SELECT * FROM likes WHERE user_id = ? AND album_id = ?", (like.user_id, like.album_id)).fetchone()
        
        if existing:
            c.execute("DELETE FROM likes WHERE user_id = ? AND album_id = ?", (like.user_id, like.album_id))
            status = "unliked"
        else:
            c.execute("INSERT INTO likes (user_id, album_id) VALUES (?, ?)", (like.user_id, like.album_id))
            status = "liked"
            
        conn.commit()
        conn.close()
        return {"status": status}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/users/{user_id}/likes", response_model=List[Album])
async def get_user_likes(user_id: int):
    """Get all albums liked by a specific user"""
    try:
        conn = get_db_connection()
        c = conn.cursor()
        
        # Get liked album IDs
        liked_ids = c.execute("SELECT album_id FROM likes WHERE user_id = ?", (user_id,)).fetchall()
        liked_album_ids = {row['album_id'] for row in liked_ids}
        
        if not liked_album_ids:
            conn.close()
            return []
        
        # Get album details for liked albums
        placeholders = ','.join('?' * len(liked_album_ids))
        albums_data = c.execute(f'''
            SELECT a.*, ar.name as artist_name 
            FROM albums a 
            JOIN artists ar ON a.artist_id = ar.id
            WHERE a.id IN ({placeholders})
            ORDER BY a.rank ASC
        ''', tuple(liked_album_ids)).fetchall()
        
        # Get all genres for these albums
        all_genres = c.execute(f'''
            SELECT ag.album_id, g.name 
            FROM genres g 
            JOIN album_genres ag ON g.id = ag.genre_id
            WHERE ag.album_id IN ({placeholders})
        ''', tuple(liked_album_ids)).fetchall()
        
        album_genres_map = {}
        for row in all_genres:
            if row['album_id'] not in album_genres_map:
                album_genres_map[row['album_id']] = []
            album_genres_map[row['album_id']].append(row['name'])
        
        results = []
        for album in albums_data:
            album_dict = dict(album)
            aid = album['id']
            
            album_dict['genres'] = album_genres_map.get(aid, [])
            album_dict['is_liked'] = True  # All albums in this list are liked
            
            img_path = album_dict['image_path']
            if img_path and img_path.startswith('covers/'):
                img_path = img_path.replace('covers/', '')
            album_dict['image_path'] = f"/covers/{img_path}" if img_path else None
            
            results.append(album_dict)
            
        conn.close()
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/albums")
async def get_albums(
    user_id: Optional[int] = None,
    limit: int = 40,
    offset: int = 0
):
    """
    Get albums with pagination support.
    
    Args:
        user_id: Optional user ID for personalized recommendations
        limit: Number of albums to return (default: 40, max: 100)
        offset: Number of albums to skip (default: 0)
    
    Returns:
        {
            "albums": [...],
            "total": total_count,
            "limit": limit,
            "offset": offset,
            "has_more": has_more
        }
    """
    # Validate and cap limit
    limit = min(max(1, limit), 100)
    offset = max(0, offset)
    try:
        conn = get_db_connection()
        c = conn.cursor()
        
        # Get all albums with artist names
        albums_data = c.execute('''
            SELECT a.*, ar.name as artist_name 
            FROM albums a 
            JOIN artists ar ON a.artist_id = ar.id
            ORDER BY a.rank ASC
        ''').fetchall()
        
        # Get all genres for all albums (optimization: fetch all at once)
        all_genres = c.execute('''
            SELECT ag.album_id, g.name 
            FROM genres g 
            JOIN album_genres ag ON g.id = ag.genre_id
        ''').fetchall()
        
        album_genres_map = {}
        for row in all_genres:
            if row['album_id'] not in album_genres_map:
                album_genres_map[row['album_id']] = []
            album_genres_map[row['album_id']].append(row['name'])

        # Get user likes if logged in
        liked_album_ids = set()
        user_genre_counts = Counter()
        
        if user_id:
            likes = c.execute("SELECT album_id FROM likes WHERE user_id = ?", (user_id,)).fetchall()
            liked_album_ids = {row['album_id'] for row in likes}
            
            # Calculate user genre preferences
            for aid in liked_album_ids:
                if aid in album_genres_map:
                    for genre in album_genres_map[aid]:
                        user_genre_counts[genre] += 1

        results = []
        for album in albums_data:
            album_dict = dict(album)
            aid = album['id']
            
            # Attach genres
            album_dict['genres'] = album_genres_map.get(aid, [])
            
            # Attach like status
            album_dict['is_liked'] = aid in liked_album_ids
            
            # Fix image path
            img_path = album_dict['image_path']
            if img_path and img_path.startswith('covers/'):
                img_path = img_path.replace('covers/', '')
            album_dict['image_path'] = f"/covers/{img_path}" if img_path else None
            
            # Calculate Score for Recommendation
            score = 0
            if user_id:
                # Base score: Random noise (0-10) to keep it fresh
                score += random.random() * 10
                
                # Genre match score
                for genre in album_dict['genres']:
                    if genre in user_genre_counts:
                        # Add weight based on how many times user liked this genre
                        score += user_genre_counts[genre] * 2
                
                # Boost liked albums slightly (or maybe hide them? let's keep them for now)
                if album_dict['is_liked']:
                    score += 5
            else:
                # Pure random if not logged in
                score = random.random()

            album_dict['_score'] = score
            results.append(album_dict)
            
        conn.close()
        
        # Get total count
        total_count = len(results)
        
        # Sort by score descending
        results.sort(key=lambda x: x['_score'], reverse=True)
        
        # Apply pagination
        paginated_results = results[offset:offset + limit]
        
        # Remove internal score field
        for album in paginated_results:
            album.pop('_score', None)
        
        return {
            "albums": paginated_results,
            "total": total_count,
            "limit": limit,
            "offset": offset,
            "has_more": offset + limit < len(results)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/albums/{album_id}", response_model=Album)
async def get_album(album_id: int, user_id: Optional[int] = None):
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
        
        # Check like status
        album_dict['is_liked'] = False
        if user_id:
            like = c.execute("SELECT * FROM likes WHERE user_id = ? AND album_id = ?", (user_id, album_id)).fetchone()
            if like:
                album_dict['is_liked'] = True

        img_path = album_dict['image_path']
        if img_path and img_path.startswith('covers/'):
            img_path = img_path.replace('covers/', '')
        album_dict['image_path'] = f"/covers/{img_path}" if img_path else None
        
        conn.close()
        return album_dict
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

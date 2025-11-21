from fastapi import FastAPI, HTTPException, Header, Response, Cookie
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import sqlite3
import random
import os
import secrets
from typing import List, Optional
from pydantic import BaseModel
import bcrypt
from collections import Counter
from datetime import datetime, timedelta

app = FastAPI(title="slowdive API")

# Enable CORS for Next.js frontend with credentials support
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,  # Important for cookies
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount covers directory
app.mount("/covers", StaticFiles(directory="covers"), name="covers")

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
    # For local dev, rym.db is in the current directory
    db_path = 'rym.db'
    conn = sqlite3.connect(f"file:{db_path}?mode=ro", uri=True)
    conn.row_factory = sqlite3.Row
    return conn

def get_write_db_connection():
    db_path = 'rym.db'
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn

def create_session(user_id: int) -> str:
    """Create a new session token for a user."""
    token = secrets.token_urlsafe(32)
    expires_at = datetime.now() + timedelta(days=30)
    
    conn = get_write_db_connection()
    c = conn.cursor()
    c.execute(
        "INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)",
        (token, user_id, expires_at.isoformat())
    )
    conn.commit()
    conn.close()
    return token

def get_user_from_session(session_token: Optional[str]) -> Optional[int]:
    """Get user_id from session token if valid."""
    if not session_token:
        return None
    
    conn = get_db_connection()
    c = conn.cursor()
    session = c.execute(
        "SELECT user_id, expires_at FROM sessions WHERE token = ?",
        (session_token,)
    ).fetchone()
    conn.close()
    
    if not session:
        return None
    
    # Check if session is expired
    expires_at = datetime.fromisoformat(session['expires_at'])
    if datetime.now() > expires_at:
        # Clean up expired session
        conn = get_write_db_connection()
        c = conn.cursor()
        c.execute("DELETE FROM sessions WHERE token = ?", (session_token,))
        conn.commit()
        conn.close()
        return None
    
    return session['user_id']

@app.post("/api/auth/register")
async def register(user: UserRegister, response: Response):
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
        
        # Create session and set cookie
        session_token = create_session(user_id)
        response.set_cookie(
            key="session_token",
            value=session_token,
            httponly=True,
            max_age=30 * 24 * 60 * 60,  # 30 days
            samesite="lax"
        )
        
        return {"id": user_id, "username": user.username}
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=400, detail="Username already exists")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/auth/login")
async def login(user: UserLogin, response: Response):
    conn = get_db_connection()
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
    
    # Create session and set cookie
    session_token = create_session(user_record['id'])
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        max_age=30 * 24 * 60 * 60,  # 30 days
        samesite="lax"
    )
    
    return {"id": user_record['id'], "username": user_record['username']}

@app.post("/api/auth/logout")
async def logout(response: Response, session_token: Optional[str] = Cookie(None)):
    """Logout user by deleting session."""
    if session_token:
        conn = get_write_db_connection()
        c = conn.cursor()
        c.execute("DELETE FROM sessions WHERE token = ?", (session_token,))
        conn.commit()
        conn.close()
    
    # Clear cookie
    response.delete_cookie(key="session_token")
    return {"message": "Logged out successfully"}

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
    session_token: Optional[str] = Cookie(None),
    limit: int = 40,
    offset: int = 0
):
    """
    Get albums with pagination support.
    
    Args:
        session_token: Session cookie for personalized recommendations
        limit: Number of albums to return (default: 40, max: 100)
        offset: Number of albums to skip (default: 0)
    
    Returns:
        {
            "albums": [...],
            "total": total_count,
            "limit": limit,
            "offset": offset
        }
    """
    try:
        # Validate and cap limit
        limit = min(max(1, limit), 100)
        offset = max(0, offset)
        
        # Get user_id from session cookie
        user_id = get_user_from_session(session_token)
        
        conn = get_db_connection()
        c = conn.cursor()
        
        # Get total count
        total_count = c.execute('SELECT COUNT(*) as count FROM albums').fetchone()['count']
        
        # Get all albums with artist names (for scoring)
        albums_data = c.execute('''
            SELECT a.*, ar.name as artist_name 
            FROM albums a 
            JOIN artists ar ON a.artist_id = ar.id
            ORDER BY a.rank ASC
        ''').fetchall()
        
        # Get all genres
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

        # Get user likes
        liked_album_ids = set()
        user_genre_counts = Counter()
        
        if user_id:
            likes = c.execute("SELECT album_id FROM likes WHERE user_id = ?", (user_id,)).fetchall()
            liked_album_ids = {row['album_id'] for row in likes}
            
            for aid in liked_album_ids:
                if aid in album_genres_map:
                    for genre in album_genres_map[aid]:
                        user_genre_counts[genre] += 1

        results = []
        for album in albums_data:
            album_dict = dict(album)
            aid = album['id']
            
            album_dict['genres'] = album_genres_map.get(aid, [])
            album_dict['is_liked'] = aid in liked_album_ids
            
            img_path = album_dict['image_path']
            if img_path and img_path.startswith('covers/'):
                img_path = img_path.replace('covers/', '')
            album_dict['image_path'] = f"/covers/{img_path}" if img_path else None
            
            # Score
            score = 0
            # Base score from rank (higher rank/lower number = higher score)
            # We use a small fraction so it acts as a tie-breaker for genre matches
            score -= album['rank'] / 100000.0

            if user_id:
                # Personalization score
                for genre in album_dict['genres']:
                    if genre in user_genre_counts:
                        score += user_genre_counts[genre] * 2
                if album_dict['is_liked']:
                    score += 5
            
            album_dict['_score'] = score
            results.append(album_dict)
            
        conn.close()
        
        # Sort by score
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

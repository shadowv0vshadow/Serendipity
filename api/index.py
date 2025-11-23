import sys
import os

from fastapi import FastAPI, HTTPException, Header, Response, Cookie
from fastapi.middleware.cors import CORSMiddleware
import sqlite3
import random
import secrets
from typing import List, Optional
from pydantic import BaseModel
import bcrypt
from collections import Counter
from datetime import datetime, timedelta

app = FastAPI(title="slowdive API")

# Test endpoint to verify the function is working
@app.get("/")
@app.get("/api")
async def root():
    return {"message": "FastAPI is working", "status": "ok"}

# Enable CORS for Next.js frontend with credentials support
# Get allowed origins from environment or use defaults
allowed_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://0.0.0.0:3000",
]

# Add Vercel deployment URL if available
vercel_url = os.environ.get("VERCEL_URL")
if vercel_url:
    allowed_origins.append(f"https://{vercel_url}")

# Add custom domain if set
custom_domain = os.environ.get("NEXT_PUBLIC_API_URL")
if custom_domain and custom_domain not in allowed_origins:
    allowed_origins.append(custom_domain)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,  # Important for cookies
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

def get_db_path() -> str:
    # Database is located in the same directory as this file (api/rym.db)
    path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "rym.db")
    return path

def get_db_connection():
    # Use absolute path to ensure we connect to the correct DB
    db_path = get_db_path()
    if not os.path.exists(db_path):
        print(f"ERROR: Database file not found at {db_path}")
        # List directory contents to debug
        dir_path = os.path.dirname(db_path)
        print(f"DEBUG: Contents of {dir_path}:")
        try:
            print(os.listdir(dir_path))
        except Exception as e:
            print(f"DEBUG: Error listing directory: {e}")
            
    conn = sqlite3.connect(f"file:{db_path}?mode=ro", uri=True)
    conn.row_factory = sqlite3.Row
    return conn

def get_write_db_connection():
    db_path = get_db_path()
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
async def toggle_like(like: LikeRequest, session_token: Optional[str] = Cookie(None)):
    print(f"DEBUG: toggle_like called. Body: {like}, Cookie: {session_token}")
    try:
        # Verify user from session
        user_id = get_user_from_session(session_token)
        print(f"DEBUG: User from session: {user_id}")
        
        if not user_id:
            print("DEBUG: No user_id from session -> 401")
            raise HTTPException(status_code=401, detail="Not authenticated")
            
        # Ensure the user_id in request matches session (or just use session user_id)
        if like.user_id != user_id:
            print(f"DEBUG: ID mismatch. Body: {like.user_id}, Session: {user_id} -> 403")
            raise HTTPException(status_code=403, detail="User ID mismatch")

        conn = get_write_db_connection()
        c = conn.cursor()
        
        # Check if already liked
        existing = c.execute("SELECT * FROM likes WHERE user_id = ? AND album_id = ?", (user_id, like.album_id)).fetchone()
        print(f"DEBUG: Existing like found? {existing is not None}")
        
        if existing:
            c.execute("DELETE FROM likes WHERE user_id = ? AND album_id = ?", (user_id, like.album_id))
            status = "unliked"
        else:
            c.execute("INSERT INTO likes (user_id, album_id) VALUES (?, ?)", (user_id, like.album_id))
            status = "liked"
            
        conn.commit()
        conn.close()
        print(f"DEBUG: Success. New status: {status}")
        return {"status": status}
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"DEBUG: Exception: {e}")
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
    offset: int = 0,
    genre: Optional[str] = None
):
    try:
        print(f"DEBUG: get_albums called. Limit: {limit}, Offset: {offset}, Genre: {genre}")
        # Validate and cap limit
        limit = min(max(1, limit), 100)
        offset = max(0, offset)
        
        # Get user_id from session cookie
        user_id = get_user_from_session(session_token)
        
        # Generate daily seed for consistent but refreshing recommendations
        from datetime import date
        today = date.today().isoformat()
        daily_seed = hash(f"{user_id or 'anonymous'}_{today}") % (2**31)
        rng = random.Random(daily_seed)
        
        conn = get_db_connection()
        c = conn.cursor()
        
        # Get total count and albums data
        if genre:
            # Filter by genre
            total_count = c.execute('''
                SELECT COUNT(DISTINCT a.id) as count 
                FROM albums a
                JOIN album_genres ag ON a.id = ag.album_id
                JOIN genres g ON ag.genre_id = g.id
                WHERE g.name = ?
            ''', (genre,)).fetchone()['count']
            
            albums_data = c.execute('''
                SELECT DISTINCT a.*, ar.name as artist_name 
                FROM albums a 
                JOIN artists ar ON a.artist_id = ar.id
                JOIN album_genres ag ON a.id = ag.album_id
                JOIN genres g ON ag.genre_id = g.id
                WHERE g.name = ?
            ''', (genre,)).fetchall()
        else:
            # No filter
            total_count = c.execute('SELECT COUNT(*) as count FROM albums').fetchone()['count']
            
            albums_data = c.execute('''
                SELECT a.*, ar.name as artist_name 
                FROM albums a 
                JOIN artists ar ON a.artist_id = ar.id
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

        # Get user profile data
        liked_album_ids = set()
        liked_artist_ids = set()
        user_genre_counts = Counter()
        similar_user_likes = set()
        
        if user_id:
            # Get user's likes
            likes = c.execute("SELECT album_id FROM likes WHERE user_id = ?", (user_id,)).fetchall()
            liked_album_ids = {row['album_id'] for row in likes}
            
            # Get liked artists
            if liked_album_ids:
                placeholders = ','.join('?' * len(liked_album_ids))
                liked_artists = c.execute(f'''
                    SELECT DISTINCT artist_id FROM albums WHERE id IN ({placeholders})
                ''', tuple(liked_album_ids)).fetchall()
                liked_artist_ids = {row['artist_id'] for row in liked_artists}
            
            # Build genre preference profile
            for aid in liked_album_ids:
                if aid in album_genres_map:
                    for g in album_genres_map[aid]:
                        user_genre_counts[g] += 1
            
            # Collaborative filtering: find similar users
            if liked_album_ids:
                # Find users who liked at least 2 of the same albums
                placeholders = ','.join('?' * len(liked_album_ids))
                similar_users = c.execute(f'''
                    SELECT user_id, COUNT(*) as common_likes
                    FROM likes
                    WHERE album_id IN ({placeholders}) AND user_id != ?
                    GROUP BY user_id
                    HAVING common_likes >= 2
                    ORDER BY common_likes DESC
                    LIMIT 10
                ''', (*tuple(liked_album_ids), user_id)).fetchall()
                
                # Get what similar users liked
                if similar_users:
                    similar_user_ids = [row['user_id'] for row in similar_users]
                    placeholders = ','.join('?' * len(similar_user_ids))
                    collab_likes = c.execute(f'''
                        SELECT DISTINCT album_id FROM likes 
                        WHERE user_id IN ({placeholders})
                    ''', tuple(similar_user_ids)).fetchall()
                    similar_user_likes = {row['album_id'] for row in collab_likes}

        # Calculate scores for all albums
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
            
            # === SCORING ALGORITHM ===
            
            # 1. BASE SCORE (30%): Quality and popularity
            base_score = 0
            # Rank score (lower rank = better)
            rank_score = max(0, 1 - (album['rank'] / 10000.0))
            # Rating score
            rating_score = (album['rating'] or 3.0) / 5.0 if album['rating'] else 0.6
            # Popularity score (normalized ratings count)
            try:
                ratings_count = int(album['ratings_count'].replace(',', '')) if album['ratings_count'] else 0
                popularity_score = min(1.0, ratings_count / 50000.0)
            except:
                popularity_score = 0
            
            base_score = (rank_score * 0.5 + rating_score * 0.3 + popularity_score * 0.2) * 30
            
            # 2. PERSONALIZATION SCORE (40%)
            personalization_score = 0
            if user_id:
                # Genre affinity
                genre_match = 0
                for g in album_dict['genres']:
                    if g in user_genre_counts:
                        genre_match += user_genre_counts[g]
                personalization_score += min(genre_match * 3, 20)  # Cap at 20
                
                # Artist affinity
                if album['artist_id'] in liked_artist_ids:
                    personalization_score += 10
                
                # Collaborative filtering boost
                if aid in similar_user_likes and aid not in liked_album_ids:
                    personalization_score += 8
                
                # Already liked albums get top priority
                if album_dict['is_liked']:
                    personalization_score += 15
            
            # 3. EXPLORATION SCORE (20%): Controlled randomness for discovery
            exploration_score = 0
            if user_id:
                # Boost albums from genres user hasn't explored much
                unexplored_boost = 0
                for g in album_dict['genres']:
                    if g not in user_genre_counts or user_genre_counts[g] < 2:
                        unexplored_boost += 1
                exploration_score += min(unexplored_boost * 3, 10)
                
                # Add controlled randomness
                exploration_score += rng.uniform(0, 10)
            else:
                # For anonymous users, more randomness
                exploration_score = rng.uniform(0, 20)
            
            # 4. DIVERSITY PENALTY (10%): Will be applied after initial sorting
            # (Applied later to avoid clustering)
            
            # Combine scores
            total_score = base_score + personalization_score + exploration_score
            album_dict['_score'] = total_score
            album_dict['_artist_id'] = album['artist_id']
            album_dict['_release_year'] = album['release_date'][:4] if album['release_date'] else None
            
            results.append(album_dict)
        
        conn.close()
        
        # Sort by score
        results.sort(key=lambda x: x['_score'], reverse=True)
        
        # Apply diversity optimization: penalize albums that cluster by artist/genre
        if not genre:  # Only apply diversity when not filtering by genre
            seen_artists = Counter()
            seen_genres = Counter()
            
            for i, album in enumerate(results):
                # Penalize if we've seen this artist too much in top results
                artist_penalty = seen_artists[album['_artist_id']] * 2
                
                # Penalize if genres are over-represented
                genre_penalty = sum(seen_genres[g] for g in album['genres']) * 0.5
                
                # Apply penalties
                diversity_penalty = (artist_penalty + genre_penalty) * 0.1
                album['_score'] -= diversity_penalty
                
                # Update counters
                seen_artists[album['_artist_id']] += 1
                for g in album['genres']:
                    seen_genres[g] += 1
            
            # Re-sort after diversity adjustment
            results.sort(key=lambda x: x['_score'], reverse=True)
        
        # Apply pagination
        paginated_results = results[offset:offset + limit]
        
        # Clean up internal fields
        for album in paginated_results:
            album.pop('_score', None)
            album.pop('_artist_id', None)
            album.pop('_release_year', None)
        
        return {
            "albums": paginated_results,
            "total": total_count,
            "limit": limit,
            "offset": offset,
            "has_more": offset + limit < len(results)
        }
    except Exception as e:
        print(f"ERROR: {e}")
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


# Export handler for Vercel using Mangum adapter
# Mangum converts ASGI app to AWS Lambda/API Gateway format (compatible with Vercel)
from mangum import Mangum

handler = Mangum(app, lifespan="off")

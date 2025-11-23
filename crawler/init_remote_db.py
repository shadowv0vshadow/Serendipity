import psycopg2
import os
import sys

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def get_postgres_conn():
    # Load from .env.local or use hardcoded
    env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env.local")
    env_vars = {}
    if os.path.exists(env_path):
        with open(env_path, 'r') as f:
            for line in f:
                if '=' in line and not line.startswith('#'):
                    key, val = line.strip().split('=', 1)
                    env_vars[key] = val
    
    host = os.environ.get("POSTGRES_HOST", env_vars.get("POSTGRES_HOST", "***REMOVED***"))
    user = os.environ.get("POSTGRES_USER", env_vars.get("POSTGRES_USER", "myuser"))
    password = os.environ.get("POSTGRES_PASSWORD", env_vars.get("POSTGRES_PASSWORD", "***REMOVED***"))
    dbname = os.environ.get("POSTGRES_DATABASE", env_vars.get("POSTGRES_DATABASE", "rym_db"))
    port = os.environ.get("POSTGRES_PORT", env_vars.get("POSTGRES_PORT", "5432"))
    
    return psycopg2.connect(host=host, user=user, password=password, dbname=dbname, port=port)

def init_db():
    conn = get_postgres_conn()
    c = conn.cursor()
    
    print("Dropping existing tables...")
    c.execute("DROP TABLE IF EXISTS likes CASCADE")
    c.execute("DROP TABLE IF EXISTS album_genres CASCADE")
    c.execute("DROP TABLE IF EXISTS genres CASCADE")
    c.execute("DROP TABLE IF EXISTS albums CASCADE")
    c.execute("DROP TABLE IF EXISTS artists CASCADE")
    c.execute("DROP TABLE IF EXISTS users CASCADE")
    c.execute("DROP TABLE IF EXISTS sessions CASCADE")
    
    print("Creating tables...")
    
    # Artists
    c.execute("""
        CREATE TABLE artists (
            id SERIAL PRIMARY KEY,
            name TEXT UNIQUE NOT NULL,
            slug TEXT,
            bio TEXT,
            image_path TEXT,
            location TEXT
        );
    """)
    
    # Albums
    c.execute("""
        CREATE TABLE albums (
            id SERIAL PRIMARY KEY,
            title TEXT NOT NULL,
            artist_id INTEGER REFERENCES artists(id),
            rank INTEGER,
            release_date TEXT,
            rating REAL,
            ratings_count TEXT,
            image_path TEXT,
            spotify_link TEXT,
            youtube_link TEXT,
            apple_music_link TEXT,
            UNIQUE(title, artist_id)
        );
    """)
    
    # Genres
    c.execute("""
        CREATE TABLE genres (
            id SERIAL PRIMARY KEY,
            name TEXT UNIQUE NOT NULL
        );
    """)
    
    # Album Genres
    c.execute("""
        CREATE TABLE album_genres (
            album_id INTEGER REFERENCES albums(id),
            genre_id INTEGER REFERENCES genres(id),
            is_primary BOOLEAN DEFAULT FALSE,
            PRIMARY KEY (album_id, genre_id)
        );
    """)
    
    # Users
    c.execute("""
        CREATE TABLE users (
            id SERIAL PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)
    
    # Sessions
    c.execute("""
        CREATE TABLE sessions (
            token TEXT PRIMARY KEY,
            user_id INTEGER REFERENCES users(id),
            expires_at TIMESTAMP NOT NULL
        );
    """)
    
    # Likes
    c.execute("""
        CREATE TABLE likes (
            user_id INTEGER REFERENCES users(id),
            album_id INTEGER REFERENCES albums(id),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (user_id, album_id)
        );
    """)
    
    conn.commit()
    conn.close()
    print("Database initialized successfully.")

if __name__ == "__main__":
    init_db()

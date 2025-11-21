import sqlite3
import os

DB_NAME = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'api', 'rym.db')

def get_db_connection():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    c = conn.cursor()
    
    # Artists Table
    c.execute('''
        CREATE TABLE IF NOT EXISTS artists (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL
        )
    ''')
    
    # Genres Table
    c.execute('''
        CREATE TABLE IF NOT EXISTS genres (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL
        )
    ''')
    
    # Albums Table
    c.execute('''
        CREATE TABLE IF NOT EXISTS albums (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            artist_id INTEGER,
            rank INTEGER,
            release_date TEXT,
            rating REAL,
            ratings_count TEXT,
            image_path TEXT,
            spotify_link TEXT,
            youtube_link TEXT,
            apple_music_link TEXT,
            FOREIGN KEY (artist_id) REFERENCES artists (id)
        )
    ''')
    
    # Album-Genres Association Table
    c.execute('''
        CREATE TABLE IF NOT EXISTS album_genres (
            album_id INTEGER,
            genre_id INTEGER,
            is_primary BOOLEAN DEFAULT 0,
            PRIMARY KEY (album_id, genre_id),
            FOREIGN KEY (album_id) REFERENCES albums (id),
            FOREIGN KEY (genre_id) REFERENCES genres (id)
        )
    ''')
    
    # Migration: Check if is_primary exists, if not add it
    try:
        c.execute("SELECT is_primary FROM album_genres LIMIT 1")
    except sqlite3.OperationalError:
        print("Migrating: Adding is_primary to album_genres")
        c.execute("ALTER TABLE album_genres ADD COLUMN is_primary BOOLEAN DEFAULT 0")

    # Users Table
    c.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Likes Table
    c.execute('''
        CREATE TABLE IF NOT EXISTS likes (
            user_id INTEGER,
            album_id INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (user_id, album_id),
            FOREIGN KEY (user_id) REFERENCES users (id),
            FOREIGN KEY (album_id) REFERENCES albums (id)
        )
    ''')

    # Sessions Table for cookie-based auth
    c.execute('''
        CREATE TABLE IF NOT EXISTS sessions (
            token TEXT PRIMARY KEY,
            user_id INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            expires_at TIMESTAMP NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')

    
    conn.commit()
    conn.close()
    print(f"Database {DB_NAME} initialized.")

if __name__ == "__main__":
    init_db()

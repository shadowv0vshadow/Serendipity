import sqlite3
import os

DB_NAME = 'rym.db'

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
            PRIMARY KEY (album_id, genre_id),
            FOREIGN KEY (album_id) REFERENCES albums (id),
            FOREIGN KEY (genre_id) REFERENCES genres (id)
        )
    ''')
    
    conn.commit()
    conn.close()
    print(f"Database {DB_NAME} initialized.")

if __name__ == "__main__":
    init_db()

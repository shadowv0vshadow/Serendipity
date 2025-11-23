import sqlite3
import psycopg2
from psycopg2.extras import execute_values
import os
import sys

# Add parent directory to path to import config if needed
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Local SQLite DB
SQLITE_DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "api", "rym.db")

# Remote Postgres DB (Load from .env.local or use hardcoded for script)
# Note: In production, use environment variables.
# For this script, we'll try to read from .env.local or fallback to known creds
def get_postgres_conn():
    try:
        # Try to load from .env.local manually
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
        
        conn = psycopg2.connect(
            host=host,
            user=user,
            password=password,
            dbname=dbname,
            port=port
        )
        return conn
    except Exception as e:
        print(f"Error connecting to Postgres: {e}")
        sys.exit(1)

def migrate():
    print(f"Connecting to SQLite: {SQLITE_DB_PATH}")
    if not os.path.exists(SQLITE_DB_PATH):
        print("SQLite DB not found!")
        return

    sqlite_conn = sqlite3.connect(SQLITE_DB_PATH)
    sqlite_conn.row_factory = sqlite3.Row
    sqlite_c = sqlite_conn.cursor()

    print("Connecting to Postgres...")
    pg_conn = get_postgres_conn()
    pg_c = pg_conn.cursor()

    # 1. Migrate Artists
    print("Migrating Artists...")
    artists = sqlite_c.execute("SELECT * FROM artists").fetchall()
    if artists:
        # Check columns in SQLite artists table
        keys = artists[0].keys()
        # Prepare INSERT statement
        # We force ID to keep relationships
        cols = ', '.join(keys)
        placeholders = ', '.join(['%s'] * len(keys))
        query = f"INSERT INTO artists ({cols}) VALUES %s ON CONFLICT (id) DO NOTHING"
        
        data = [tuple(row) for row in artists]
        execute_values(pg_c, query, data)
        # Reset sequence
        pg_c.execute("SELECT setval('artists_id_seq', (SELECT MAX(id) FROM artists))")
    
    # 2. Migrate Genres
    print("Migrating Genres...")
    genres = sqlite_c.execute("SELECT * FROM genres").fetchall()
    if genres:
        keys = genres[0].keys()
        cols = ', '.join(keys)
        query = f"INSERT INTO genres ({cols}) VALUES %s ON CONFLICT (id) DO NOTHING"
        data = [tuple(row) for row in genres]
        execute_values(pg_c, query, data)
        pg_c.execute("SELECT setval('genres_id_seq', (SELECT MAX(id) FROM genres))")

    # 3. Migrate Albums
    print("Migrating Albums...")
    albums = sqlite_c.execute("SELECT * FROM albums").fetchall()
    if albums:
        keys = albums[0].keys()
        cols = ', '.join(keys)
        query = f"INSERT INTO albums ({cols}) VALUES %s ON CONFLICT (id) DO NOTHING"
        data = [tuple(row) for row in albums]
        execute_values(pg_c, query, data)
        pg_c.execute("SELECT setval('albums_id_seq', (SELECT MAX(id) FROM albums))")

    # 4. Migrate Album Genres
    print("Migrating Album Genres...")
    album_genres = sqlite_c.execute("SELECT * FROM album_genres").fetchall()
    if album_genres:
        keys = album_genres[0].keys()
        cols = ', '.join(keys)
        query = f"INSERT INTO album_genres ({cols}) VALUES %s ON CONFLICT (album_id, genre_id) DO NOTHING"
        # Convert is_primary (0/1) to boolean
        data = []
        for row in album_genres:
            r = dict(row)
            r['is_primary'] = bool(r['is_primary'])
            data.append(tuple(r.values()))
        execute_values(pg_c, query, data)

    # 5. Migrate Users
    print("Migrating Users...")
    users = sqlite_c.execute("SELECT * FROM users").fetchall()
    if users:
        keys = users[0].keys()
        cols = ', '.join(keys)
        query = f"INSERT INTO users ({cols}) VALUES %s ON CONFLICT (id) DO NOTHING"
        data = [tuple(row) for row in users]
        execute_values(pg_c, query, data)
        pg_c.execute("SELECT setval('users_id_seq', (SELECT MAX(id) FROM users))")

    # 6. Migrate Likes
    print("Migrating Likes...")
    likes = sqlite_c.execute("SELECT * FROM likes").fetchall()
    if likes:
        keys = likes[0].keys()
        cols = ', '.join(keys)
        query = f"INSERT INTO likes ({cols}) VALUES %s ON CONFLICT (user_id, album_id) DO NOTHING"
        data = [tuple(row) for row in likes]
        execute_values(pg_c, query, data)

    pg_conn.commit()
    print("Migration complete!")
    
    sqlite_conn.close()
    pg_conn.close()

if __name__ == "__main__":
    migrate()

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
    password = os.environ.get("POSTGRES_PASSWORD", env_vars.get("POSTGRES_PASSWORD", ""))
    dbname = os.environ.get("POSTGRES_DATABASE", env_vars.get("POSTGRES_DATABASE", "rym_db"))
    port = os.environ.get("POSTGRES_PORT", env_vars.get("POSTGRES_PORT", "5432"))
    
    return psycopg2.connect(host=host, user=user, password=password, dbname=dbname, port=port)

def update_schema():
    conn = get_postgres_conn()
    c = conn.cursor()
    
    print("Creating collection_items table...")
    
    try:
        c.execute("""
            CREATE TABLE IF NOT EXISTS collection_items (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                discogs_id INTEGER,
                master_id INTEGER,
                title TEXT,
                artist TEXT,
                format TEXT,
                label TEXT,
                year TEXT,
                thumb_url TEXT,
                notes TEXT,
                added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        
        # Create index for faster lookups
        c.execute("CREATE INDEX IF NOT EXISTS idx_collection_user ON collection_items(user_id);")
        
        conn.commit()
        print("Schema updated successfully.")
        
    except Exception as e:
        print(f"Error updating schema: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    update_schema()

import psycopg2
import os
import sys

# Remote Postgres DB Credentials
DB_HOST = os.environ.get("POSTGRES_HOST", "***REMOVED***")
DB_USER = os.environ.get("POSTGRES_USER", "myuser")
DB_PASSWORD = os.environ.get("POSTGRES_PASSWORD", "")  # Must be set in environment
DB_NAME = os.environ.get("POSTGRES_DATABASE", "rym_db")
DB_PORT = os.environ.get("POSTGRES_PORT", "5432")

def get_db_connection():
    try:
        conn = psycopg2.connect(
            host=DB_HOST,
            user=DB_USER,
            password=DB_PASSWORD,
            dbname=DB_NAME,
            port=DB_PORT
        )
        return conn
    except Exception as e:
        print(f"Error connecting to Postgres: {e}")
        sys.exit(1)

def fix_double_bio():
    conn = get_db_connection()
    c = conn.cursor()
    
    try:
        # Check artist 34 specifically
        c.execute("SELECT bio FROM artists WHERE id = 34")
        result = c.fetchone()
        if result:
            print(f"REMOTE DB Artist 34 bio starts with: '{result[0][:50]}'")
        else:
            print("Artist 34 not found in remote DB")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    fix_double_bio()

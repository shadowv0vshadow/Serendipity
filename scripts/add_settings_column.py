import os
import sys
import psycopg2
from psycopg2.extras import RealDictCursor

# Add api directory to path to import db connection logic if needed, 
# but for this script we'll just connect directly using env vars
sys.path.append(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'api'))

def get_db_connection():
    # Load .env.local manually
    env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env.local')
    if os.path.exists(env_path):
        print(f"Loading environment from {env_path}")
        with open(env_path, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#'):
                    key, value = line.split('=', 1)
                    if key not in os.environ:
                        os.environ[key] = value.strip('"').strip("'")

    return psycopg2.connect(
        host=os.environ.get("POSTGRES_HOST"),
        database=os.environ.get("POSTGRES_DATABASE"),
        user=os.environ.get("POSTGRES_USER"),
        password=os.environ.get("POSTGRES_PASSWORD"),
        port=os.environ.get("POSTGRES_PORT", "5432")
    )

def migrate():
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        print("Checking if 'settings' column exists in 'users' table...")
        cur.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='users' AND column_name='settings';
        """)
        
        if cur.fetchone():
            print("'settings' column already exists. Skipping.")
        else:
            print("Adding 'settings' column...")
            cur.execute("""
                ALTER TABLE users 
                ADD COLUMN settings JSONB DEFAULT '{"collection_mode": true, "valuation_mode": false, "price_comparison_mode": false}'::jsonb;
            """)
            print("'settings' column added successfully.")
            
            # Update existing users to have default settings if null (though DEFAULT handles new rows)
            cur.execute("""
                UPDATE users 
                SET settings = '{"collection_mode": true, "valuation_mode": false, "price_comparison_mode": false}'::jsonb 
                WHERE settings IS NULL;
            """)
            print(f"Updated {cur.rowcount} existing users with default settings.")

        conn.commit()
        cur.close()
        conn.close()
        print("Migration completed successfully.")

    except Exception as e:
        print(f"Error during migration: {e}")
        sys.exit(1)

if __name__ == "__main__":
    migrate()

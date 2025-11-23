import os
import sys

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import psycopg2
from psycopg2.extras import RealDictCursor

def get_db_connection():
    """Connect to remote PostgreSQL database"""
    return psycopg2.connect(
        host=os.environ.get('POSTGRES_HOST', '***REMOVED***'),
        database=os.environ.get('POSTGRES_DATABASE', os.environ.get('POSTGRES_DB', 'musicdb')),
        user=os.environ.get('POSTGRES_USER', 'myuser'),
        password=os.environ.get('POSTGRES_PASSWORD', '***REMOVED***')
    )

def clean_biography_data():
    """Remove 'Biography' prefix from artist bio fields"""
    conn = get_db_connection()
    c = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        # Find all artists with bio starting with "Biography"
        c.execute("""
            SELECT id, name, bio 
            FROM artists 
            WHERE bio ILIKE '%Biography%' OR id = 34
        """)
        artists = c.fetchall()
        
        print(f"Found {len(artists)} artists with 'Biography' prefix")
        
        updated_count = 0
        for artist in artists:
            # Remove "Biography" prefix (case insensitive)
            cleaned_bio = artist['bio']
            if cleaned_bio.startswith('Biography'):
                cleaned_bio = cleaned_bio[9:].lstrip()  # Remove "Biography" and leading whitespace
                
                # Update database
                c.execute("""
                    UPDATE artists 
                    SET bio = %s 
                    WHERE id = %s
                """, (cleaned_bio, artist['id']))
                
                updated_count += 1
                print(f"✓ Cleaned bio for: {artist['name']}")
        
        conn.commit()
        print(f"\n✅ Successfully cleaned {updated_count} artist biographies")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    print("🧹 Cleaning artist biography data...\n")
    clean_biography_data()

import psycopg2
import os
import sys

# Add api directory to path to import get_db_connection
sys.path.append(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'api'))
from index import get_db_connection

def clean_artist_names():
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        # Find artists with asterisks
        cur.execute("SELECT id, name FROM artists WHERE name LIKE '%*%'")
        artists = cur.fetchall()
        
        print(f"Found {len(artists)} artists with asterisks to clean.")
        
        updated_count = 0
        for artist_id, name in artists:
            clean_name = name.replace('*', '').strip()
            if clean_name != name:
                print(f"Cleaning: '{name}' -> '{clean_name}'")
                try:
                    cur.execute("UPDATE artists SET name = %s WHERE id = %s", (clean_name, artist_id))
                    updated_count += 1
                except psycopg2.errors.UniqueViolation:
                    # If the cleaned name already exists, we might need to merge or skip
                    print(f"Skipping '{name}' -> '{clean_name}' (Name already exists)")
                    conn.rollback()
                    continue
                except Exception as e:
                    print(f"Error updating '{name}': {e}")
                    conn.rollback()
                    continue
                
                conn.commit()
        
        print(f"Successfully cleaned {updated_count} artist names.")
        
    except Exception as e:
        print(f"Error during cleanup: {e}")
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    clean_artist_names()

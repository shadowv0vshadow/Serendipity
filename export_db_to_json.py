import sqlite3
import json
import os

def export_to_json():
    conn = sqlite3.connect('rym.db')
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    
    # Get all albums with artist names
    albums = c.execute('''
        SELECT a.*, ar.name as artist_name 
        FROM albums a 
        JOIN artists ar ON a.artist_id = ar.id
        ORDER BY a.rank ASC
    ''').fetchall()
    
    albums_data = []
    for album in albums:
        album_dict = dict(album)
        
        # Get genres for this album
        genres = c.execute('''
            SELECT g.name 
            FROM genres g 
            JOIN album_genres ag ON g.id = ag.genre_id 
            WHERE ag.album_id = ?
        ''', (album['id'],)).fetchall()
        
        album_dict['genres'] = [g['name'] for g in genres]
        
        # Fix image path for web (remove 'covers/' prefix if present, or ensure it matches public folder)
        # In python script we saved as 'covers/filename.jpg'
        # In Next.js, if we put covers in public/covers, the src should be '/covers/filename.jpg'
        if album_dict['image_path'] and not album_dict['image_path'].startswith('/'):
             album_dict['image_path'] = '/' + album_dict['image_path']
             
        albums_data.append(album_dict)
        
    conn.close()
    
    # Create directory if not exists
    os.makedirs('web/src/data', exist_ok=True)
    
    with open('web/src/data/albums.json', 'w', encoding='utf-8') as f:
        json.dump(albums_data, f, ensure_ascii=False, indent=2)
        
    print(f"Exported {len(albums_data)} albums to web/src/data/albums.json")

if __name__ == "__main__":
    export_to_json()

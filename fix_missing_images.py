#!/usr/bin/env python3
"""
Script to check for missing album cover images and re-download them.
"""
import os
import time
import sqlite3
from curl_cffi import requests

def load_file_content(path):
    if not os.path.exists(path):
        return ""
    with open(path, 'r') as f:
        return f.read().strip()

def get_cookies_dict():
    cookie_str = load_file_content('cookie.txt')
    cookies = {}
    if cookie_str:
        for item in cookie_str.split(';'):
            if '=' in item:
                name, value = item.strip().split('=', 1)
                cookies[name] = value
    return cookies

def check_missing_images():
    """Check which album images are missing or corrupted."""
    conn = sqlite3.connect('rym.db')
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    
    albums = c.execute('''
        SELECT id, title, artist_id, image_path 
        FROM albums 
        WHERE image_path IS NOT NULL AND image_path != ''
    ''').fetchall()
    
    missing = []
    corrupted = []
    
    for album in albums:
        img_path = album['image_path']
        # Remove 'covers/' prefix if present
        if img_path.startswith('covers/'):
            img_path = img_path[7:]
        
        full_path = f"covers/{img_path}"
        
        if not os.path.exists(full_path):
            missing.append(album)
        elif os.path.getsize(full_path) < 1000:  # Less than 1KB is likely corrupted
            corrupted.append(album)
    
    conn.close()
    
    print(f"Missing images: {len(missing)}")
    print(f"Corrupted images (< 1KB): {len(corrupted)}")
    
    return missing, corrupted

def get_album_image_url(album_id):
    """Scrape the album page to get the image URL."""
    conn = sqlite3.connect('rym.db')
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    
    album = c.execute('''
        SELECT a.id, a.title, ar.name as artist_name, a.rank
        FROM albums a
        JOIN artists ar ON a.artist_id = ar.id
        WHERE a.id = ?
    ''', (album_id,)).fetchone()
    
    conn.close()
    
    if not album:
        return None
    
    # Construct RYM URL from album title and artist
    # This is a simplified approach - you might need to adjust based on actual URL structure
    # For now, we'll use the chart page approach
    return None

def download_image_with_cookies(image_url, save_path):
    """Download image with proper headers, cookies, and retry logic.
    Accepts images larger than 500 bytes (some RYM placeholders are ~730 bytes).
    Uses dynamic Referer based on the image URL to satisfy hotlink protection.
    """
    user_agent = load_file_content('user_agent.txt')
    cookies = get_cookies_dict()
    # Derive a referer from the image URL (the page that hosts the image)
    referer = image_url.rsplit('/', 1)[0] + '/'
    headers = {
        "User-Agent": user_agent,
        "Referer": referer,
        "Accept": "image/*,*/*;q=0.8",
    }
    max_attempts = 3
    for attempt in range(1, max_attempts + 1):
        try:
            response = requests.get(
                image_url,
                impersonate="chrome120",
                cookies=cookies,
                headers=headers,
                timeout=10,
            )
            if response.status_code == 200 and len(response.content) > 500:
                with open(save_path, 'wb') as f:
                    f.write(response.content)
                return True
            else:
                print(f"Attempt {attempt}: Failed status {response.status_code}, size {len(response.content)}")
        except Exception as e:
            print(f"Attempt {attempt}: Error downloading {image_url}: {e}")
        time.sleep(1)  # brief pause before retry
    return False

def fix_images_from_chart():
    """Re-scrape the chart pages to get missing images."""
    from scraper import get_html, parse_page
    
    missing, corrupted = check_missing_images()
    problem_albums = missing + corrupted
    
    if not problem_albums:
        print("No missing or corrupted images found!")
        return
    
    print(f"\nFound {len(problem_albums)} images to fix")
    print("Re-scraping chart pages...")
    
    # Get the ranks of problem albums
    problem_ranks = {album['id']: album for album in problem_albums}
    
    # Scrape pages that contain these albums
    base_url = "https://rateyourmusic.com/charts/top/album/all-time"
    
    conn = sqlite3.connect('rym.db')
    c = conn.cursor()
    
    # Get all albums with their ranks to know which pages to scrape
    albums_to_fix = c.execute('''
        SELECT id, rank, title, artist_id, image_path
        FROM albums
        WHERE id IN ({})
    '''.format(','.join('?' * len(problem_ranks))), list(problem_ranks.keys())).fetchall()
    
    # Group by page
    pages_to_scrape = set()
    for album in albums_to_fix:
        rank = album[1]
        page = ((rank - 1) // 40) + 1
        pages_to_scrape.add(page)
    
    print(f"Need to scrape {len(pages_to_scrape)} pages")
    
    fixed_count = 0
    for page in sorted(pages_to_scrape):
        print(f"\nProcessing page {page}...")
        url = f"{base_url}/{page}" if page > 1 else base_url
        
        html = get_html(url)
        if html:
            start_rank = (page - 1) * 40 + 1
            items = parse_page(html, start_rank)
            
            for item in items:
                # Check if this album needs fixing
                album_match = c.execute('''
                    SELECT a.id, a.image_path, ar.name as artist_name
                    FROM albums a
                    JOIN artists ar ON a.artist_id = ar.id
                    WHERE a.rank = ? AND a.title = ? AND ar.name = ?
                ''', (item['Rank'], item['Album'], item['Artist'])).fetchone()
                
                if album_match and album_match[0] in problem_ranks:
                    album_id = album_match[0]
                    print(f"  Fixing: {item['Artist']} - {item['Album']}")
                    
                    if item['Image URL']:
                        # Create filename
                        safe_title = "".join([c for c in item['Album'] if c.isalpha() or c.isdigit() or c==' ']).strip()
                        safe_artist = "".join([c for c in item['Artist'] if c.isalpha() or c.isdigit() or c==' ']).strip()
                        filename = f"covers/{item['Rank']}_{safe_artist}_{safe_title}.jpg".replace(" ", "_")
                        
                        if download_image_with_cookies(item['Image URL'], filename):
                            # Update database
                            c.execute('UPDATE albums SET image_path = ? WHERE id = ?', (filename, album_id))
                            conn.commit()
                            fixed_count += 1
                            print(f"    ✓ Fixed!")
                        else:
                            print(f"    ✗ Failed to download")
                    
                    time.sleep(0.5)  # Be nice to the server
            
            if page < max(pages_to_scrape):
                print("Sleeping 3 seconds...")
                time.sleep(3)
        else:
            print(f"Failed to get HTML for page {page}")
    
    conn.close()
    print(f"\n✓ Fixed {fixed_count} images")

if __name__ == "__main__":
    print("=== Album Cover Image Fixer ===\n")
    
    # Check if cookie exists
    if not load_file_content('cookie.txt'):
        print("Error: cookie.txt is missing or empty.")
        print("Please add your RYM cookie to cookie.txt")
        exit(1)
    
    fix_images_from_chart()

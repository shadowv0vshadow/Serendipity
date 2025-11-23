import time
import os
import sys

from bs4 import BeautifulSoup
from curl_cffi import requests

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import sqlite3

def get_db_connection():
    # Connect to local SQLite
    db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "api", "rym.db")
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn

def load_file_content(path):
    if not os.path.exists(path):
        return ""
    with open(path, 'r') as f:
        return f.read().strip()

def get_cookies_dict():
    # Look for cookie.txt in root or crawler dir
    paths = ['cookie.txt', 'crawler/cookie.txt', '../cookie.txt']
    cookie_str = ""
    for p in paths:
        if os.path.exists(p):
            cookie_str = load_file_content(p)
            break
            
    cookies = {}
    if cookie_str:
        for item in cookie_str.split(';'):
            if '=' in item:
                name, value = item.strip().split('=', 1)
                cookies[name] = value
    return cookies

def get_html(url):
    user_agent = load_file_content('user_agent.txt') or "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    cookies = get_cookies_dict()
    
    try:
        print(f"Fetching {url}...")
        response = requests.get(
            url, 
            impersonate="chrome120",
            cookies=cookies,
            headers={"User-Agent": user_agent}
        )
        if response.status_code == 200:
            return response.text
        print(f"Failed to fetch {url}. Status: {response.status_code}")
        return None
    except Exception as e:
        print(f"Error fetching {url}: {e}")
        return None

def scrape_artist_info(artist_name, artist_slug=None):
    # If we don't have a slug, we might need to search or guess.
    # RYM URLs are usually /artist/name_slug
    if not artist_slug:
        # Simple slugification: lowercase, replace spaces with hyphens, remove special chars
        safe_name = "".join([c if c.isalnum() or c==' ' else '' for c in artist_name]).strip().lower()
        artist_slug = safe_name.replace(' ', '-')
    
    url = f"https://rateyourmusic.com/artist/{artist_slug}"
    html = get_html(url)
    
    if not html:
        return None
        
    soup = BeautifulSoup(html, 'html.parser')
    print(f"Page Title: {soup.title.string if soup.title else 'No Title'}")
    
    info = {}

    # Bio
    bio_elem = soup.select_one('.section_artist_biography')
    if bio_elem:
        info['bio'] = bio_elem.get_text(strip=True)
    else:
        # Fallback to meta description
        meta_desc = soup.find('meta', attrs={'name': 'description'})
        if meta_desc:
            info['bio'] = meta_desc.get('content')

    # Image
    img_elem = soup.select_one('.section_artist_image img')
    if img_elem:
        src = img_elem.get('src')
        if src:
            # Ensure we get the full resolution or at least a valid URL
            # Sometimes src is relative or protocol-relative
            if src.startswith('//'):
                src = f"https:{src}"
            elif src.startswith('/'):
                src = f"https://rateyourmusic.com{src}"
            info['image_url'] = src
            
    return info

def main():
    conn = get_db_connection()
    c = conn.cursor()
    
    # Get artists without bio
    c.execute("SELECT id, name, slug FROM artists WHERE bio IS NULL")
    artists = c.fetchall()
    
    print(f"Found {len(artists)} artists to scrape.")
    
    for row in artists:
        aid, name, slug = row
        print(f"Processing {name}...")
        
        info = scrape_artist_info(name, slug)
        
        if info:
            # Update DB
            c.execute("""
                UPDATE artists 
                SET bio = ?, image_path = ? 
                WHERE id = ?
            """, (info.get('bio'), info.get('image_url'), aid))
            conn.commit()
            print(f"Updated {name}")
        else:
            print(f"Could not scrape info for {name}")
            
        time.sleep(2) # Be nice
        
    conn.close()

if __name__ == "__main__":
    main()

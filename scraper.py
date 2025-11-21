import time
import pandas as pd
from bs4 import BeautifulSoup
from curl_cffi import requests
import os

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

def get_html(url):
    user_agent = load_file_content('user_agent.txt')
    cookies = get_cookies_dict()
    
    print(f"Fetching {url}...")
    try:
        response = requests.get(
            url,
            impersonate="chrome120",
            cookies=cookies,
            headers={"User-Agent": user_agent}
        )
        if response.status_code == 200:
            return response.text
        else:
            print(f"Failed to fetch {url}. Status: {response.status_code}")
            return None
    except Exception as e:
        print(f"Error fetching {url}: {e}")
        return None

import json
import database

# ... (keep existing imports and helper functions)

def save_to_db(items):
    conn = database.get_db_connection()
    c = conn.cursor()
    
    for item in items:
        try:
            # 1. Insert/Get Artist
            c.execute('INSERT OR IGNORE INTO artists (name) VALUES (?)', (item['Artist'],))
            c.execute('SELECT id FROM artists WHERE name = ?', (item['Artist'],))
            artist_id = c.fetchone()[0]
            
            # 2. Insert Album
            c.execute('''
                INSERT INTO albums (title, artist_id, rank, release_date, rating, ratings_count, image_path, spotify_link, youtube_link, apple_music_link)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                item['Album'], artist_id, item['Rank'], item['Date'], item['Rating'], 
                item['Ratings Count'], item.get('Local Image'), 
                item.get('Spotify'), item.get('YouTube'), item.get('Apple Music')
            ))
            album_id = c.lastrowid
            
            # 3. Insert Genres and Link to Album
            if item['Genres']:
                for genre_name in item['Genres'].split(', '):
                    genre_name = genre_name.strip()
                    c.execute('INSERT OR IGNORE INTO genres (name) VALUES (?)', (genre_name,))
                    c.execute('SELECT id FROM genres WHERE name = ?', (genre_name,))
                    genre_id = c.fetchone()[0]
                    
                    c.execute('INSERT OR IGNORE INTO album_genres (album_id, genre_id) VALUES (?, ?)', (album_id, genre_id))
                    
        except Exception as e:
            print(f"Error saving item {item['Album']} to DB: {e}")
            
    conn.commit()
    conn.close()
    print("Data saved to database.")

def parse_page(html):
    soup = BeautifulSoup(html, 'html.parser')
    items = []
    
    chart_items = soup.select('.page_section_charts_item_wrapper')
    
    for idx, item in enumerate(chart_items, 1):
        try:
            # ... (keep existing extraction logic for title, artist, date, rating, num_ratings, genres)
            title_elem = item.select_one('.page_charts_section_charts_item_title a.release')
            title = title_elem.get_text(strip=True) if title_elem else None
            
            artist_elem = item.select_one('.page_charts_section_charts_item_credited_links_primary .artist')
            artist = artist_elem.get_text(strip=True) if artist_elem else None
            
            date_elem = item.select_one('.page_charts_section_charts_item_date span')
            date = date_elem.get_text(strip=True) if date_elem else None
            
            rating_elem = item.select_one('.page_charts_section_charts_item_details_average_num')
            rating = rating_elem.get_text(strip=True) if rating_elem else None
            
            num_ratings_elem = item.select_one('.page_charts_section_charts_item_details_ratings .abbr')
            num_ratings = num_ratings_elem.get_text(strip=True) if num_ratings_elem else None
            
            genres = []
            genre_elems = item.select('.page_charts_section_charts_item_genres_primary .genre, .page_charts_section_charts_item_genres_secondary .genre')
            for g in genre_elems:
                genres.append(g.get_text(strip=True))
            
            # Image URL (keep existing logic)
            img_elem = item.select_one('.page_charts_section_charts_item_image img')
            img_url = None
            if img_elem:
                if img_elem.get('data-src'):
                    src = img_elem.get('data-src')
                elif img_elem.get('src'):
                    src = img_elem.get('src')
                else:
                    src = None
                if src:
                    if src.startswith('//'):
                        img_url = f"https:{src}"
                    else:
                        img_url = src

            # Streaming Links
            spotify = None
            youtube = None
            apple = None
            
            media_container = item.select_one('.media_link_container')
            if media_container and media_container.get('data-links'):
                try:
                    links_data = json.loads(media_container.get('data-links'))
                    
                    # Spotify
                    if 'spotify' in links_data:
                        for key, val in links_data['spotify'].items():
                            if val.get('default'): # simplified logic
                                spotify = f"https://open.spotify.com/{val.get('type', 'album')}/{key}"
                                break
                    
                    # YouTube
                    if 'youtube' in links_data:
                        for key, val in links_data['youtube'].items():
                             youtube = f"https://www.youtube.com/watch?v={key}"
                             break

                    # Apple Music
                    if 'applemusic' in links_data:
                         for key, val in links_data['applemusic'].items():
                             apple = f"https://music.apple.com/{val.get('loc', 'us')}/album/{val.get('album', '')}/{key}"
                             break
                             
                except Exception as e:
                    print(f"Error parsing links: {e}")

            items.append({
                'Rank': idx,
                'Artist': artist,
                'Album': title,
                'Date': date,
                'Rating': rating,
                'Ratings Count': num_ratings,
                'Genres': ", ".join(genres),
                'Image URL': img_url,
                'Spotify': spotify,
                'YouTube': youtube,
                'Apple Music': apple
            })
        except Exception as e:
            print(f"Error parsing item {idx}: {e}")
            continue
            
    return items

def download_images(items):
    if not os.path.exists('covers'):
        os.makedirs('covers')
    
    print("Downloading covers...")
    for item in items:
        if item['Image URL']:
            try:
                # Create a safe filename
                safe_title = "".join([c for c in item['Album'] if c.isalpha() or c.isdigit() or c==' ']).strip()
                safe_artist = "".join([c for c in item['Artist'] if c.isalpha() or c.isdigit() or c==' ']).strip()
                filename = f"covers/{item['Rank']}_{safe_artist}_{safe_title}.jpg".replace(" ", "_")
                
                # Check if already exists
                if not os.path.exists(filename):
                    response = requests.get(item['Image URL'], impersonate="chrome120")
                    if response.status_code == 200:
                        with open(filename, 'wb') as f:
                            f.write(response.content)
                        item['Local Image'] = filename
                    else:
                        print(f"Failed to download image for {item['Album']}")
                else:
                    item['Local Image'] = filename
            except Exception as e:
                print(f"Error downloading image for {item['Album']}: {e}")
        
        # Small delay to be nice
        time.sleep(0.1)

def main():
    # ... (keep existing main loop)
    base_url = "https://rateyourmusic.com/charts/top/album/all-time"
    
    all_items = []
    max_pages = 3 
    
    for page in range(1, max_pages + 1):
        print(f"--- Processing Page {page} ---")
        url = f"{base_url}/{page}" if page > 1 else base_url
        
        html = get_html(url)
        if html:
            items = parse_page(html)
            all_items.extend(items)
            print(f"Found {len(items)} items on page {page}.")
            if page < max_pages:
                time.sleep(3)
        else:
            break
            
    if all_items:
        download_images(all_items)
        save_to_db(all_items) # New DB saving function
        
        # Optional: still save CSV for backup
        df = pd.DataFrame(all_items)
        df.to_csv("rym_chart_all_time.csv", index=False)
    else:
        print("No data collected.")

if __name__ == "__main__":
    main()

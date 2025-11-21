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
            
            # 2. Check if Album exists
            c.execute('SELECT id FROM albums WHERE title = ? AND artist_id = ?', (item['Album'], artist_id))
            existing_album = c.fetchone()
            
            if existing_album:
                album_id = existing_album[0]
                # Update existing album
                c.execute('''
                    UPDATE albums 
                    SET rank = ?, release_date = ?, rating = ?, ratings_count = ?, image_path = ?, spotify_link = ?, youtube_link = ?, apple_music_link = ?
                    WHERE id = ?
                ''', (
                    item['Rank'], item['Date'], item['Rating'], item['Ratings Count'], 
                    item.get('Local Image'), item.get('Spotify'), item.get('YouTube'), item.get('Apple Music'),
                    album_id
                ))
            else:
                # Insert new album
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
            # Clear existing genres for this album to avoid stale data
            c.execute('DELETE FROM album_genres WHERE album_id = ?', (album_id,))
            
            # Helper to insert genres
            def insert_genres(genre_list, is_primary):
                for genre_name in genre_list:
                    genre_name = genre_name.strip()
                    if not genre_name: continue
                    
                    c.execute('INSERT OR IGNORE INTO genres (name) VALUES (?)', (genre_name,))
                    c.execute('SELECT id FROM genres WHERE name = ?', (genre_name,))
                    genre_id = c.fetchone()[0]
                    
                    c.execute('INSERT OR IGNORE INTO album_genres (album_id, genre_id, is_primary) VALUES (?, ?, ?)', 
                              (album_id, genre_id, is_primary))

            insert_genres(item['Primary Genres'], True)
            insert_genres(item['Secondary Genres'], False)
                    
        except Exception as e:
            print(f"Error saving item {item['Album']} to DB: {e}")
            
    conn.commit()
    conn.close()
    print("Data saved to database.")

def parse_page(html, start_rank=1):
    soup = BeautifulSoup(html, 'html.parser')
    items = []
    
    chart_items = soup.select('.page_section_charts_item_wrapper')
    
    for idx, item in enumerate(chart_items, start_rank):
        try:
            # ... (keep existing extraction logic)
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
            
            # Genres
            primary_genres = []
            secondary_genres = []
            
            p_elems = item.select('.page_charts_section_charts_item_genres_primary .genre')
            for g in p_elems:
                primary_genres.append(g.get_text(strip=True))
                
            s_elems = item.select('.page_charts_section_charts_item_genres_secondary .genre')
            for g in s_elems:
                secondary_genres.append(g.get_text(strip=True))
            
            # Image URL
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
                            if val.get('default'): 
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
                'Primary Genres': primary_genres,
                'Secondary Genres': secondary_genres,
                'Genres': ", ".join(primary_genres + secondary_genres), # Keep for backward compat if needed
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
    # Check if cookie exists
    if not load_file_content('cookie.txt'):
        print("Error: cookie.txt is missing or empty. Please add your RYM cookie.")
        return

    base_url = "https://rateyourmusic.com/charts/top/album/all-time"
    
    all_items = []
    max_pages = 125 # 5000 items / 40 per page
    
    for page in range(1, max_pages + 1):
        print(f"--- Processing Page {page}/{max_pages} ---")
        url = f"{base_url}/{page}" if page > 1 else base_url
        
        html = get_html(url)
        if html:
            # Calculate start rank for this page
            start_rank = (page - 1) * 40 + 1
            items = parse_page(html, start_rank)
            
            if items:
                print(f"Found {len(items)} items on page {page}.")
                
                # Process immediately to save progress
                download_images(items)
                save_to_db(items)
                
                all_items.extend(items)
            else:
                print(f"No items found on page {page}. Possible captcha or end of list.")
                break
                
            if page < max_pages:
                sleep_time = 5
                print(f"Sleeping for {sleep_time} seconds...")
                time.sleep(sleep_time)
        else:
            print("Failed to retrieve HTML. Stopping.")
            break
            
    if all_items:
        # Optional: still save CSV for backup
        df = pd.DataFrame(all_items)
        df.to_csv("rym_chart_all_time.csv", index=False)
        print(f"Scraping complete. {len(all_items)} items saved.")
    else:
        print("No data collected.")

if __name__ == "__main__":
    main()

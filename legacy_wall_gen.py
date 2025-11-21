import pandas as pd
import random
import os

def generate_poster_wall(csv_file, html_file):
    try:
        df = pd.read_csv(csv_file)
        
        # Filter rows with valid local images
        if 'Local Image' not in df.columns:
            print("No 'Local Image' column found.")
            return
            
        items = df[df['Local Image'].notna()].to_dict('records')
        
        # Shuffle for random wall
        random.shuffle(items)
        
        html_content = """
        <!DOCTYPE html>
        <html>
        <head>
            <title>RYM Poster Wall</title>
            <style>
                body { margin: 0; padding: 0; background: #111; overflow-x: hidden; }
                .wall {
                    display: flex;
                    flex-wrap: wrap;
                    width: 100%;
                }
                .album {
                    position: relative;
                    width: 10%; /* 10 items per row */
                    padding-bottom: 10%; /* Square aspect ratio */
                    overflow: hidden;
                    cursor: pointer;
                }
                .album img {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    transition: transform 0.3s ease, filter 0.3s ease;
                }
                .album:hover img {
                    transform: scale(1.1);
                    filter: brightness(0.7);
                    z-index: 10;
                }
                .info {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    text-align: center;
                    color: white;
                    opacity: 0;
                    transition: opacity 0.3s ease;
                    width: 90%;
                    pointer-events: none;
                    z-index: 20;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                    text-shadow: 0 2px 4px rgba(0,0,0,0.8);
                }
                .album:hover .info {
                    opacity: 1;
                }
                .rank { font-size: 1.2em; font-weight: bold; color: #f5c518; }
                .title { font-size: 1em; font-weight: bold; margin: 5px 0; }
                .artist { font-size: 0.9em; font-weight: normal; }
                
                /* Responsive */
                @media (max-width: 1200px) { .album { width: 12.5%; padding-bottom: 12.5%; } } /* 8 per row */
                @media (max-width: 900px) { .album { width: 16.66%; padding-bottom: 16.66%; } } /* 6 per row */
                @media (max-width: 600px) { 
                    .album { width: 33.33%; padding-bottom: 33.33%; } /* 3 per row */
                    .info { font-size: 0.8em; } /* Smaller text */
                }
                @media (max-width: 400px) { 
                    .album { width: 50%; padding-bottom: 50%; } /* 2 per row */
                }
            </style>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body>
            <div class="wall">
        """
        
        for item in items:
            # Ensure path is relative for HTML
            img_path = item['Local Image']
            
            html_content += f"""
                <div class="album" title="{item['Artist']} - {item['Album']}">
                    <img src="{img_path}" loading="lazy" alt="{item['Album']}">
                    <div class="info">
                        <div class="rank">#{item['Rank']}</div>
                        <div class="title">{item['Album']}</div>
                        <div class="artist">{item['Artist']}</div>
                    </div>
                </div>
            """
            
        html_content += """
            </div>
        </body>
        </html>
        """
        
        with open(html_file, 'w') as f:
            f.write(html_content)
        print(f"Successfully generated {html_file} with {len(items)} albums.")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    generate_poster_wall("rym_chart_all_time.csv", "poster_wall.html")

from flask import Flask, render_template, g, request
import sqlite3
import database
import translations

app = Flask(__name__, static_folder='covers', static_url_path='/covers')

def get_db():
    if 'db' not in g:
        g.db = database.get_db_connection()
    return g.db

@app.teardown_appcontext
def close_db(error):
    if hasattr(g, 'db'):
        g.db.close()

@app.context_processor
def inject_translations():
    # Detect language from browser headers
    # request.accept_languages.best_match(['en', 'zh'])
    lang = request.accept_languages.best_match(['en', 'zh'])
    t = translations.get_translations(lang)
    return dict(t=t)

@app.route('/')
def index():
    db = get_db()
    # Get all albums with artist names
    albums = db.execute('''
        SELECT a.*, ar.name as artist_name 
        FROM albums a 
        JOIN artists ar ON a.artist_id = ar.id
        ORDER BY RANDOM()
    ''').fetchall()
    return render_template('index.html', albums=albums)

@app.route('/album/<int:album_id>')
def album_detail(album_id):
    db = get_db()
    # Get album details
    album = db.execute('''
        SELECT a.*, ar.name as artist_name 
        FROM albums a 
        JOIN artists ar ON a.artist_id = ar.id
        WHERE a.id = ?
    ''', (album_id,)).fetchone()
    
    if album is None:
        return render_template('404.html'), 404
        
    # Get genres
    genres = db.execute('''
        SELECT g.name 
        FROM genres g 
        JOIN album_genres ag ON g.id = ag.genre_id 
        WHERE ag.album_id = ?
    ''', (album_id,)).fetchall()
    
    return render_template('detail.html', album=album, genres=genres)

if __name__ == '__main__':
    app.run(debug=True, port=5001)

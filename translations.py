translations = {
    'en': {
        'title': 'Serendipity',
        'hero_title': 'Discover Your Next Favorite Album',
        'hero_subtitle': 'Curated top charts from music history.',
        'rank': '#',
        'back': '← Back',
        'listen': 'Listen Now',
        'no_links': 'No streaming links available.',
        'rating': 'Rating',
        'released': 'Released',
        'genres': 'Genres',
        'loading': 'Loading...',
        'album_not_found': 'Album not found'
    },
    'zh': {
        'title': '不期而遇',
        'hero_title': '探索你的下一张神专',
        'hero_subtitle': '精选音乐史上的顶级佳作。',
        'rank': '第 ',
        'back': '← 返回',
        'listen': '立即试听',
        'no_links': '暂无播放链接',
        'rating': '评分',
        'released': '发行',
        'genres': '流派',
        'loading': '加载中...',
        'album_not_found': '未找到该专辑'
    }
}

def get_translations(lang_code):
    # Support zh-CN, zh-TW, etc. by checking if 'zh' is in the code
    if lang_code and 'zh' in lang_code.lower():
        return translations['zh']
    return translations['en']

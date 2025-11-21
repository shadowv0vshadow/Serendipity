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

url = "https://rateyourmusic.com/charts/top/album/all-time"
user_agent = load_file_content('user_agent.txt')
cookies = get_cookies_dict()

print(f"Fetching {url}...")
response = requests.get(
    url,
    impersonate="chrome120",
    cookies=cookies,
    headers={"User-Agent": user_agent}
)

with open("debug.html", "w") as f:
    f.write(response.text)
print("Saved to debug.html")

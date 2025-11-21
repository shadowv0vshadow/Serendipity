import sys
import os

# Add parent directory to sys.path so we can import main.py from the root
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app
import os

# Vercel strips the /api prefix when routing to the function,
# but we need FastAPI to know about it for generating correct URLs (like OpenAPI)
# However, for route matching, if Vercel passes /api/albums, and our route is /api/albums, it matches.
# If Vercel passes /albums, and our route is /api/albums, it fails.
# Vercel rewrites usually preserve the path.

# Let's ensure the app is exposed as handler
handler = app

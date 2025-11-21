from main import app

# Vercel expects a callable named 'handler' for python functions.
# FastAPI's ASGI app can be used directly.
handler = app

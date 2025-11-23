import sys
import os

print("DEBUG: Loading api/index.py...")
sys.stdout.flush()

# from fastapi import FastAPI, HTTPException, Header, Response, Cookie
# from fastapi.staticfiles import StaticFiles
# from fastapi.middleware.cors import CORSMiddleware
# import sqlite3
# import random
# import secrets
# from typing import List, Optional
# from pydantic import BaseModel
# import bcrypt
# from collections import Counter
# from datetime import datetime, timedelta

# app = FastAPI(title="slowdive API")

# ... (commented out rest)

from http.server import BaseHTTPRequestHandler

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        print("DEBUG: Handling GET request")
        sys.stdout.flush()
        self.send_response(200)
        self.send_header('Content-type', 'text/plain')
        self.end_headers()
        self.wfile.write(b"Hello from minimal api/index.py")
        return

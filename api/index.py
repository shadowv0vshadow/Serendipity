import sys
import os

print("DEBUG: Loading api/index.py...")
sys.stdout.flush()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="slowdive API")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/albums")
def read_root():
    print("DEBUG: Handling /api/albums request")
    sys.stdout.flush()
    return {"message": "Hello from FastAPI"}

# Export handler for Vercel
handler = app

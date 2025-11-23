from fastapi import FastAPI
from mangum import Mangum

app = FastAPI()

@app.get("/api/albums")
def get_albums():
    return {"message": "Hello from FastAPI with Mangum!", "albums": []}

# Export handler for Vercel
handler = Mangum(app)

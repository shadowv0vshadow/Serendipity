import os
import httpx
from typing import Optional, Dict, Any, List

class DiscogsClient:
    BASE_URL = "https://api.discogs.com"
    
    def __init__(self):
        self.token = os.environ.get("DISCOGS_TOKEN")
        self.headers = {
            "User-Agent": "SlowdiveApp/1.0",
            "Authorization": f"Discogs token={self.token}"
        }
        
    async def search(self, query: str, type: str = "release") -> Dict[str, Any]:
        if not self.token:
            return {"error": "Discogs token not configured"}
            
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.BASE_URL}/database/search",
                params={"q": query, "type": type},
                headers=self.headers
            )
            return response.json()
            
    async def get_release(self, release_id: int) -> Dict[str, Any]:
        if not self.token:
            return {"error": "Discogs token not configured"}
            
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.BASE_URL}/releases/{release_id}",
                headers=self.headers
            )
            return response.json()
            
    async def get_master_versions(self, master_id: int, page: int = 1, per_page: int = 50) -> Dict[str, Any]:
        if not self.token:
            return {"error": "Discogs token not configured"}
            
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.BASE_URL}/masters/{master_id}/versions",
                params={"page": page, "per_page": per_page},
                headers=self.headers
            )
            return response.json()

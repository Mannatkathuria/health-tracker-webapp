import os
import json
from typing import List, Dict, Any
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from google import genai
from google.genai import types
import httpx

app = FastAPI()

@app.get("/nearby-doctors")
async def get_nearby_doctors(lat: float, lng: float, radius: int = 5000):
    url = "https://overpass-api.de/api/interpreter"
    
    query = f"""
    [out:json];
    (
      node["amenity"="doctors"](around:{radius},{lat},{lng});
      node["amenity"="hospital"](around:{radius},{lat},{lng});
      node["amenity"="clinic"](around:{radius},{lat},{lng});
    );
    out body;
    """
    
    async with httpx.AsyncClient() as client:
        response = await client.post(url, data={"data": query})
        
        if response.status_code != 200:
            return {"error": "OSM Server busy", "doctors": []}
            
        data = response.json()

    doctors = []
    for element in data.get("elements", []):
        doctors.append({
            "name": element.get("tags", {}).get("name", "Unknown Practice"),
            "address": element.get("tags", {}).get("address", "Address not listed"),
            "phone": element.get("contact:phone") or element.get("phone"),
            "website": element.get("contact:website") or element.get("website"),
            "type": element.get("tags", {}).get("amenity"),
            "lat": element.get("lat"),
            "lng": element.get("lon")
        })

    return {"doctors": doctors}

load_dotenv()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class AISummaryRequest(BaseModel):
    logs: List[Dict[str, Any]]

def get_ai_client():
    load_dotenv(dotenv_path="../frontend/.env")
    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        raise HTTPException(status_code=500, detail="API Key missing in child process.")
        
    return genai.Client(
        api_key=api_key,
        http_options=types.HttpOptions(api_version='v1')
    )

@app.post("/ai-summary")
async def ai_summary(data: AISummaryRequest):
    try:
        client = get_ai_client()
        
        logs_text = json.dumps(data.logs)
        prompt = f"Analyze health logs and return JSON (summary, alerts, tips): {logs_text}"

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )

        text = response.text.strip()
        if "```" in text:
            text = text.split("```")[1].replace("json", "").strip()

        return json.loads(text)

    except Exception as e:
        print(f"AI Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    
# run-> python -m uvicorn main:app --reload --app-dir .
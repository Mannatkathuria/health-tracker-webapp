from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from openai import OpenAI
import os
from dotenv import load_dotenv

load_dotenv()

client = OpenAI(
    api_key=os.getenv("OPEN_API_KEY")
)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AISummaryRequest(BaseModel):
    symptom: str = ""
    medicine: str = ""

@app.post("/ai-summary")
async def ai_summary(data: AISummaryRequest):
    prompt = f"""
    Symptoms: {data.symptom}
    Medicines: {data.medicine}

    Generate:
    - A short health summary
    - Possible warnings (if any)
    - General health tips

    Do NOT give diagnosis.
    """

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "user", "content": prompt}
        ],
        temperature=0.5,
    )

    return {
        "summary": response.choices[0].message.content
    }


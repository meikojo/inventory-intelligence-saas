from fastapi import FastAPI, Depends, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os

app = FastAPI(title="Inventory Intelligence SaaS API")

# Configure CORS
origins = [
    "http://localhost:5173", # Vite default
    "http://127.0.0.1:5173",
    "https://inventory-intelligence-saas.vercel.app", # Vercel Frontend
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ReportPayload(BaseModel):
    csv_data: str
    marketplace: str

@app.get("/")
def read_root():
    return {"message": "Inventory Intelligence SaaS API is running"}

@app.get("/api/health")
def health_check():
    return {"status": "ok", "message": "Backend is running!"}

@app.post("/api/ingest_report")
def ingest_report(payload: ReportPayload, authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid token")
    
    # In a real scenario, we verify the JWT token with Supabase and parse the CSV
    token = authorization.split(" ")[1]
    
    # For now, just return success
    return {
        "status": "success",
        "message": "Report received successfully",
        "marketplace": payload.marketplace,
        "rows_processed": len(payload.csv_data.split("\n")) - 1
    }

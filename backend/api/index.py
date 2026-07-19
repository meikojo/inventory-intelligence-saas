from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
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

@app.get("/api/health")
def health_check():
    return {"status": "ok", "message": "Backend is running!"}

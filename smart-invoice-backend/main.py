import os
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import invoices, agent, clients, expenses, organization, branding, dashboard, conversations, memories

app = FastAPI(title="Smart Invoice API")

app.include_router(invoices.router)
app.include_router(agent.router)
app.include_router(clients.router)
app.include_router(expenses.router)
app.include_router(organization.router)
app.include_router(branding.router)
app.include_router(dashboard.router)
app.include_router(conversations.router)
app.include_router(memories.router)

# Configure CORS — reads from CORS_ORIGINS env var (comma-separated), defaults to "*"
cors_origins_raw = os.getenv("CORS_ORIGINS", "*")
cors_origins = [origin.strip() for origin in cors_origins_raw.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "ok", "message": "Welcome to Smart Invoice API"}

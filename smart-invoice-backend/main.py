from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from app.database import engine
from app.models import models
from app.api import invoices, agent, clients

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Smart Invoice API")

app.include_router(invoices.router)
app.include_router(agent.router)
app.include_router(clients.router)

# Configure CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Update this to specific origins in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "ok", "message": "Welcome to Smart Invoice API"}

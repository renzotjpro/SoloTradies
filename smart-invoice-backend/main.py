from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import invoices, agent, clients, expenses, organization

app = FastAPI(title="Smart Invoice API")

app.include_router(invoices.router)
app.include_router(agent.router)
app.include_router(clients.router)
app.include_router(expenses.router)
app.include_router(organization.router)

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

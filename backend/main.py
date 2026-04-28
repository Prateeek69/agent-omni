from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers.upload import upload_router
from app.routers.analyze import analyze_router

app = FastAPI(title="Agent Omni Backend")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "Agent Omni Backend Running"}


app.include_router(upload_router, prefix="/upload", tags=["Upload"])
app.include_router(analyze_router, prefix="/analyze", tags=["Analyze"])
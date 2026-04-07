from fastapi import FastAPI
from app.routers.upload import upload_router
from app.routers.analyze import analyze_router

app = FastAPI(title="Agent Omni Backend")


@app.get("/")
def root():
    return {"message": "Agent Omni Backend Running"}


app.include_router(upload_router, prefix="/upload", tags=["Upload"])
app.include_router(analyze_router, prefix="/analyze", tags=["Analyze"])
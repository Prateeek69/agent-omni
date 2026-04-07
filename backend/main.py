from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def root():
    return {"message": "Agent Omni Backend Running"}
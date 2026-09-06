from fastapi import FastAPI
from pydantic import BaseModel
from app.ai_assistant import get_ai_response , get_weekly_summary , get_smart_tip
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AskRequest(BaseModel):
    household_id: str
    question: str


@app.get("/weekly-summary/{household_id}")
def weekly_summary_endpoint(household_id: str):
    answer = get_weekly_summary(household_id)
    return {"answer": answer}


@app.get("/tips/{household_id}")
def smart_tip_endpoint(household_id: str):
    answer = get_smart_tip(household_id)
    return {"answer": answer}

@app.post("/ask")
def ask(request: AskRequest):
    answer = get_ai_response(request.household_id, request.question)
    return {"answer": answer}
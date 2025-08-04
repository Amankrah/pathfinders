from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime

class Answer(BaseModel):
    question_id: int
    answer: int
    gift_correlation: Dict[str, float]

class AssessmentRequest(BaseModel):
    user_id: int | None = None
    answers: List[Answer]
    is_counselor_session: bool = False
    counselor_notes: Optional[str] = None
    session_date: Optional[datetime] = None

class GiftDescription(BaseModel):
    gift: str
    description: str
    details: str

class GiftDescriptions(BaseModel):
    primary: GiftDescription
    secondary: List[GiftDescription]

class GiftResult(BaseModel):
    scores: Dict[str, float]
    primary_gift: str
    secondary_gifts: List[str]
    descriptions: GiftDescriptions
    recommended_roles: Dict[str, List[str]] | None = None

    class Config:
        arbitrary_types_allowed = True

class ProgressData(BaseModel):
    user_id: int
    assessment_id: int | None = None
    current_answers: List[Answer]

# Payment validation removed - assessments are now free
# class PaymentValidationResponse(BaseModel):
#     is_valid: bool
#     message: str | None = None
#     payment_id: str | None = None
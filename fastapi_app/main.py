from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi_app.models import (
    AssessmentRequest, 
    GiftResult, 
    ProgressData, 
    GiftDescription,
    GiftDescriptions
)
from assessments.gift_calculator import GiftCalculator
import httpx
from typing import List
import os
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Pathfinders Gift Assessment API")

# CORS configuration for development and production
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://pathfindersgifts.com",
        "https://www.pathfindersgifts.com",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Update the httpx client calls to use environment variables
DJANGO_API_URL = os.getenv('DJANGO_API_URL', 'http://localhost:8000')

# For production, use the full domain
if os.getenv('ENVIRONMENT') == 'production':
    DJANGO_API_URL = 'https://pathfindersgifts.com'

calculator = GiftCalculator()

# Payment validation removed - assessments are now free
# async def validate_payment(user_id: int, payment_id: str | None = None) -> PaymentValidationResponse:
#     """Validate payment status with Django backend"""
#     try:
#         async with httpx.AsyncClient() as client:
#             response = await client.post(
#                 PAYMENT_VALIDATION_URL,
#                 json={"user_id": user_id, "payment_id": payment_id}
#             )
#             if response.status_code == 200:
#                 return PaymentValidationResponse(**response.json())
#             else:
#                 raise HTTPException(
#                     status_code=400,
#                     detail="Payment validation failed"
#                 )
#     except Exception as e:
#         logger.error(f"Payment validation error: {str(e)}")
#         raise HTTPException(
#             status_code=500,
#             detail="Error validating payment"
#         )

@app.get("/")
async def root():
    """Root endpoint for FastAPI"""
    return {"message": "Pathfinders FastAPI Service", "status": "running"}

@app.get("/health/")
@app.head("/health/")
async def health_check():
    """Health check endpoint for FastAPI - supports both GET and HEAD"""
    return {"status": "healthy", "service": "fastapi", "version": "1.0"}

@app.post("/calculate-gifts/")
async def calculate_gifts(assessment: AssessmentRequest):
    """
    Calculate motivational gifts based on assessment answers
    """
    try:
        logger.info(f"Received assessment request with {len(assessment.answers)} answers")

        # Assessments are now free - no payment validation required
        logger.info("Processing assessment (no payment validation required)")
        
        # Convert answers to the format expected by calculator
        formatted_answers = [
            {
                'question_id': a.question_id,
                'answer': a.answer,
                'gift_correlation': {
                    k.upper(): v  # Ensure gift keys are uppercase
                    for k, v in a.gift_correlation.items()
                }
            }
            for a in assessment.answers
        ]

        # Calculate results
        logger.info("Calculating gift scores")
        scores = calculator.calculate_scores(formatted_answers)
        
        # Log scores with high precision for debugging
        logger.info("Gift scores with high precision:")
        for gift, score in sorted(scores.items(), key=lambda x: x[1], reverse=True):
            logger.info(f"  {gift}: {score:.4f}")
        
        logger.info("Identifying primary and secondary gifts")
        primary_gift, secondary_gifts = calculator.identify_gifts(
            scores,
            threshold_factor=0.80  # Match threshold
        )
        
        logger.info(f"Primary gift: {primary_gift}, Secondary gifts: {secondary_gifts}")
        descriptions = calculator.get_gift_descriptions(primary_gift, secondary_gifts)

        # Get role recommendations from ministry roles mapping
        roles = {
            'primary_roles': [],
            'secondary_roles': [],
            'ministry_areas': []
        }

        logger.info("Returning assessment results")
        return GiftResult(
            scores=scores,
            primary_gift=primary_gift,
            secondary_gifts=secondary_gifts,
            descriptions=GiftDescriptions(
                primary=GiftDescription(
                    gift=descriptions['primary']['gift'],
                    description=descriptions['primary']['description'],
                    details=descriptions['primary']['details']
                ),
                secondary=[
                    GiftDescription(
                        gift=desc['gift'],
                        description=desc['description'],
                        details=desc['details']
                    )
                    for desc in descriptions['secondary']
                ]
            ),
            recommended_roles=roles
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing assessment: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error processing assessment: {str(e)}"
        )

@app.post("/progress/save/")
async def save_progress(progress: ProgressData):
    """
    Save assessment progress to Django backend
    """
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{DJANGO_API_URL}/api/assessments/save-progress/",
                json=progress.dict(),
                timeout=30.0  # Add timeout for production
            )
            return response.json()
        except Exception as e:
            logger.error(f"Failed to save progress: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to save progress: {str(e)}")

@app.get("/progress/{user_id}/")
async def get_progress(user_id: int):
    """
    Retrieve assessment progress from Django backend
    """
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"{DJANGO_API_URL}/api/assessments/get-progress/{user_id}/"
            )
            return response.json()
        except Exception as e:
            logger.error(f"Failed to get progress: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to get progress: {str(e)}")
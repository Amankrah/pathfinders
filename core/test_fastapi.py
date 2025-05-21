"""
Test script to verify FastAPI connection and gift calculation.
Run this from Django management command to test the connection.
"""

import os
import sys
import json
from .services import FastAPIClient
import logging

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def test_fastapi_connection():
    """Test the connection to FastAPI service"""
    
    # Sample test data that resembles a real assessment
    test_data = {
        "user_id": 999,  # Fake user ID for testing
        "answers": [
            {
                "question_id": 1,
                "answer": 5,
                "gift_correlation": {
                    "TEACHING": 1.0,
                    "PERCEPTION": 0.5,
                    "SERVICE": 0.2
                }
            },
            {
                "question_id": 2,
                "answer": 4,
                "gift_correlation": {
                    "GIVING": 1.0,
                    "COMPASSION": 0.7,
                    "SERVICE": 0.3
                }
            },
            {
                "question_id": 3,
                "answer": 3,
                "gift_correlation": {
                    "ADMINISTRATION": 0.8,
                    "EXHORTATION": 1.0,
                    "TEACHING": 0.4
                }
            }
        ]
    }
    
    # Create FastAPI client
    client = FastAPIClient()
    
    try:
        logger.info(f"Testing FastAPI connection to {client.base_url}")
        
        # Make the request
        result = client.calculate_gifts_sync(test_data)
        
        # Check results
        logger.info("FastAPI connection successful!")
        logger.info(f"Primary gift: {result.get('primary_gift')}")
        logger.info(f"Secondary gifts: {', '.join(result.get('secondary_gifts', []))}")
        logger.info(f"Scores: {json.dumps(result.get('scores', {}), indent=2)}")
        
        return True, result
    
    except Exception as e:
        logger.error(f"FastAPI test failed: {str(e)}")
        return False, str(e)

if __name__ == "__main__":
    success, result = test_fastapi_connection()
    if success:
        logger.info("Test completed successfully!")
        sys.exit(0)
    else:
        logger.error(f"Test failed: {result}")
        sys.exit(1) 
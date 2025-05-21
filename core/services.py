import httpx
from django.conf import settings
from typing import Dict, Any
import os
import logging
import time

logger = logging.getLogger(__name__)

class FastAPIClient:
    def __init__(self):
        # Use internal network URL since both services are on same server
        self.base_url = os.getenv('FASTAPI_URL', 'http://127.0.0.1:8001')
        self.timeout = 30.0
        self.max_retries = 2
        
    def calculate_gifts_sync(self, data):
        """Synchronous request to FastAPI calculate-gifts endpoint with retry logic"""
        logger.info(f"Attempting to connect to FastAPI at {self.base_url}/calculate-gifts/")
        
        retries = 0
        last_error = None
        
        while retries <= self.max_retries:
            try:
                with httpx.Client() as client:
                    logger.info(f"Sending request to FastAPI (attempt {retries+1}/{self.max_retries+1})")
                    
                    # Log request data summary without sensitive info
                    logger.debug(f"Request data: user_id={data.get('user_id')}, answers count={len(data.get('answers', []))}")
                    
                    response = client.post(
                        f"{self.base_url}/calculate-gifts/",  # Add endpoint path
                        json=data,
                        timeout=self.timeout
                    )
                    
                    # Log response status
                    logger.info(f"FastAPI response status: {response.status_code}")
                    
                    response.raise_for_status()
                    result = response.json()
                    
                    # Log success with summary of results
                    logger.info(f"Successfully calculated gifts: primary={result.get('primary_gift')}")
                    return result
                    
            except httpx.HTTPError as e:
                last_error = f"FastAPI HTTP error: {str(e)}"
                logger.warning(last_error)
            except httpx.TimeoutException as e:
                last_error = f"FastAPI timeout error: {str(e)}"
                logger.warning(last_error)
            except Exception as e:
                last_error = f"FastAPI unexpected error: {str(e)}"
                logger.error(last_error)
                
            # Increase retry count and wait before retry
            retries += 1
            if retries <= self.max_retries:
                wait_time = retries * 2  # Progressive backoff
                logger.info(f"Retrying in {wait_time} seconds...")
                time.sleep(wait_time)
        
        # If we've exhausted retries, raise an error
        logger.error(f"FastAPI calculation failed after {self.max_retries+1} attempts")
        raise ValueError(f"FastAPI calculation failed: {last_error}")

    async def calculate_gifts(self, data):
        """Asynchronous request to FastAPI calculate-gifts endpoint"""
        logger.info(f"Attempting async connection to FastAPI at {self.base_url}/calculate-gifts/")
        
        async with httpx.AsyncClient() as client:
            try:
                logger.debug(f"Async request data: user_id={data.get('user_id')}, answers count={len(data.get('answers', []))}")
                
                response = await client.post(
                    f"{self.base_url}/calculate-gifts/",
                    json=data,
                    timeout=self.timeout,
                    headers={
                        'X-API-Key': os.getenv('API_KEY', ''),  # Add API key for security
                    }
                )
                response.raise_for_status()
                result = response.json()
                
                # Log success
                logger.info(f"Successfully calculated gifts async: primary={result.get('primary_gift')}")
                return result
                
            except httpx.HTTPError as e:
                error_msg = f"FastAPI async HTTP error: {str(e)}"
                logger.error(error_msg)
                raise ValueError(error_msg)
            except Exception as e:
                error_msg = f"FastAPI async unexpected error: {str(e)}"
                logger.error(error_msg)
                raise ValueError(error_msg)

    async def save_progress(self, user_id: int, progress_data: Dict[str, Any]) -> Dict[str, Any]:
        """Save assessment progress"""
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    f"{self.base_url}/progress/save/",
                    json={"user_id": user_id, "progress": progress_data},
                    timeout=30.0
                )
                return response.json()
            except Exception as e:
                logger.error(f"Failed to save progress: {str(e)}")
                raise Exception(f"Failed to save progress: {str(e)}")

    async def get_progress(self, user_id: int) -> Dict[str, Any]:
        """Get assessment progress"""
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    f"{self.base_url}/progress/{user_id}/",
                    timeout=30.0
                )
                return response.json()
            except Exception as e:
                logger.error(f"Failed to get progress: {str(e)}")
                raise Exception(f"Failed to get progress: {str(e)}")

    async def close(self):
        """Close the client connection"""
        # This method is kept for backward compatibility
        pass 
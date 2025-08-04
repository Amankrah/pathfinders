import requests
import uuid
import base64
import hashlib
import time
import httpx
from django.conf import settings
from decimal import Decimal
from typing import Dict, Any
import os
import logging
import time

logger = logging.getLogger(__name__)

class FastAPIClient:
    """
    Client for communicating with the FastAPI service for gift calculations
    """
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


class MTNMobileMoneyService:
    """
    Service for integrating with MTN Mobile Money API
    Based on the PHP implementation, we create API users automatically
    """
    
    def __init__(self):
        # Base URLs for different environments
        self.sandbox_base_url = "https://sandbox.momodeveloper.mtn.com"
        self.live_base_url = "https://momodeveloper.mtn.com"
        
        # Use appropriate base URL based on environment
        if settings.MTN_TARGET_ENVIRONMENT == 'live':
            self.base_url = self.live_base_url
        else:
            self.base_url = self.sandbox_base_url
        
        # Configuration from settings
        self.subscription_key = settings.MTN_COLLECTION_SUBSCRIPTION_KEY
        self.primary_key = settings.MTN_COLLECTION_PRIMARY_KEY
        self.secondary_key = settings.MTN_COLLECTION_SECONDARY_KEY
        self.callback_url = settings.MTN_CALLBACK_URL
        self.target_environment = settings.MTN_TARGET_ENVIRONMENT
        self.merchant_number = getattr(settings, 'MTN_MERCHANT_NUMBER', '233536888387')
        
        # API credentials will be created automatically
        self.api_user = None
        self.api_key = None
        
        logger.info("MTN Mobile Money service initialized. API credentials will be created automatically.")
    
    def _create_api_user(self):
        """
        Create API User using the MTN API
        Based on the PHP implementation
        """
        try:
            # Use the secondary key as shown in the PHP code
            url = f"{self.base_url}/v1_0/apiuser"
            
            # Generate a unique reference ID
            reference_id = str(uuid.uuid4())
            
            # Data to send (based on PHP implementation)
            data = {
                "providerCallbackHost": "pathfindersgifts.com"
            }
            
            headers = {
                'X-Reference-Id': reference_id,
                'Ocp-Apim-Subscription-Key': self.secondary_key,  # Use secondary key as in PHP
                'Content-Type': 'application/json'
            }
            
            logger.info(f"Creating API user with URL: {url}")
            logger.info(f"Using secondary key: {self.secondary_key[:10]}...")
            logger.info(f"Reference ID: {reference_id}")
            
            response = requests.post(url, json=data, headers=headers)
            
            logger.info(f"API user creation response status: {response.status_code}")
            logger.info(f"API user creation response: {response.text}")
            
            if response.status_code in [200, 201]:
                logger.info(f"Successfully created API user with reference ID: {reference_id}")
                return reference_id
            else:
                logger.error(f"Failed to create API user: {response.status_code} - {response.text}")
                return None
                
        except Exception as e:
            logger.error(f"Error creating API user: {str(e)}")
            return None
    
    def _create_api_key(self, api_user_id):
        """
        Create API Key for the API User
        """
        try:
            url = f"{self.base_url}/v1_0/apiuser/{api_user_id}/apikey"
            
            headers = {
                'Ocp-Apim-Subscription-Key': self.secondary_key,  # Use secondary key
                'Content-Type': 'application/json'
            }
            
            logger.info(f"Creating API key for user: {api_user_id}")
            logger.info(f"Request URL: {url}")
            
            response = requests.post(url, headers=headers)
            
            logger.info(f"API key creation response status: {response.status_code}")
            logger.info(f"API key creation response: {response.text}")
            
            if response.status_code in [200, 201]:
                key_data = response.json()
                api_key = key_data.get('apiKey')
                if api_key:
                    logger.info(f"Successfully created API key for user: {api_user_id}")
                    return api_key
                else:
                    logger.error("API key not found in response")
                    return None
            else:
                logger.error(f"Failed to create API key: {response.status_code} - {response.text}")
                return None
                
        except Exception as e:
            logger.error(f"Error creating API key: {str(e)}")
            return None
    
    def _ensure_api_credentials(self):
        """
        Ensure we have valid API credentials by creating them if needed
        """
        # Create new API user
        api_user_id = self._create_api_user()
        if not api_user_id:
            return False
        
        # Create API key for the user
        api_key = self._create_api_key(api_user_id)
        if not api_key:
            return False
        
        self.api_user = api_user_id
        self.api_key = api_key
        
        logger.info(f"API credentials ready - User: {self.api_user}, Key: {self.api_key[:10]}...")
        return True
    
    def _get_access_token(self):
        """
        Get access token using OAuth 2.0 with API credentials
        """
        try:
            # Ensure we have API credentials
            if not self.api_user or not self.api_key:
                if not self._ensure_api_credentials():
                    return None
            
            url = f"{self.base_url}/collection/token/"
            
            # Create authorization header with API user and API key
            auth_string = f"{self.api_user}:{self.api_key}"
            auth_bytes = auth_string.encode('ascii')
            auth_b64 = base64.b64encode(auth_bytes).decode('ascii')
            
            headers = {
                'Authorization': f'Basic {auth_b64}',
                'X-Reference-Id': str(uuid.uuid4()),
                'X-Target-Environment': self.target_environment,
                'Ocp-Apim-Subscription-Key': self.subscription_key  # Use primary key for token
            }
            
            logger.info(f"Requesting access token from {url}")
            logger.info(f"Using API user: {self.api_user}")
            logger.info(f"Using subscription key: {self.subscription_key[:10]}...")
            
            response = requests.post(url, headers=headers)
            
            logger.info(f"Token response status: {response.status_code}")
            logger.info(f"Token response: {response.text}")
            
            if response.status_code == 200:
                token_data = response.json()
                access_token = token_data.get('access_token')
                logger.info(f"Successfully obtained access token: {access_token[:20] if access_token else 'None'}...")
                return access_token
            else:
                logger.error(f"Failed to get access token: {response.status_code} - {response.text}")
                return None
                
        except Exception as e:
            logger.error(f"Error getting access token: {str(e)}")
            return None
    
    def request_to_pay(self, amount, phone_number, currency='GHS', external_id=None, payer_message='', payee_note=''):
        """
        Request payment from a user via MTN Mobile Money
        
        Args:
            amount (Decimal): Amount to request
            phone_number (str): Phone number in international format (e.g., 233244123456)
            currency (str): Currency code (default: GHS)
            external_id (str): External reference ID
            payer_message (str): Message to show to payer
            payee_note (str): Note for payee
            
        Returns:
            dict: Response with reference_id and status
        """
        try:
            # Get access token
            access_token = self._get_access_token()
            if not access_token:
                return {'error': 'Failed to get access token'}
            
            # Generate reference ID
            reference_id = str(uuid.uuid4())
            
            # Prepare request data
            request_data = {
                'amount': str(amount),
                'currency': currency,
                'externalId': external_id or str(uuid.uuid4()),
                'payer': {
                    'partyIdType': 'MSISDN',
                    'partyId': phone_number
                },
                'payerMessage': payer_message or f'Donation to Pathfinders - {amount} {currency}',
                'payeeNote': payee_note or 'Thank you for your donation'
            }
            
            url = f"{self.base_url}/collection/requesttopay"
            
            headers = {
                'Authorization': f'Bearer {access_token}',
                'X-Reference-Id': reference_id,
                'X-Target-Environment': self.target_environment,
                'X-Callback-Url': self.callback_url,
                'Ocp-Apim-Subscription-Key': self.subscription_key,
                'Content-Type': 'application/json'
            }
            
            logger.info(f"Requesting payment from {url}")
            logger.info(f"Request data: {request_data}")
            
            response = requests.post(url, json=request_data, headers=headers)
            
            logger.info(f"Payment response status: {response.status_code}")
            logger.info(f"Payment response: {response.text}")
            
            if response.status_code == 202:
                logger.info(f"Request to pay initiated: {reference_id}")
                return {
                    'reference_id': reference_id,
                    'status': 'pending',
                    'message': 'Payment request sent successfully'
                }
            else:
                logger.error(f"Failed to request payment: {response.status_code} - {response.text}")
                return {
                    'error': f'Failed to request payment: {response.status_code}',
                    'details': response.text
                }
                
        except Exception as e:
            logger.error(f"Error in request_to_pay: {str(e)}")
            return {'error': f'Request to pay error: {str(e)}'}
    
    def get_payment_status(self, reference_id):
        """
        Get the status of a payment request
        
        Args:
            reference_id (str): The reference ID from request_to_pay
            
        Returns:
            dict: Payment status information
        """
        try:
            # Get access token
            access_token = self._get_access_token()
            if not access_token:
                return {'error': 'Failed to get access token'}
            
            url = f"{self.base_url}/collection/requesttopay/{reference_id}"
            
            headers = {
                'Authorization': f'Bearer {access_token}',
                'X-Target-Environment': self.target_environment,
                'Ocp-Apim-Subscription-Key': self.subscription_key
            }
            
            response = requests.get(url, headers=headers)
            
            if response.status_code == 200:
                status_data = response.json()
                return {
                    'reference_id': reference_id,
                    'status': status_data.get('status'),
                    'amount': status_data.get('amount'),
                    'currency': status_data.get('currency'),
                    'financial_transaction_id': status_data.get('financialTransactionId'),
                    'external_id': status_data.get('externalId'),
                    'payer': status_data.get('payer'),
                    'payer_message': status_data.get('payerMessage'),
                    'payee_note': status_data.get('payeeNote'),
                    'reason': status_data.get('reason')
                }
            else:
                logger.error(f"Failed to get payment status: {response.status_code} - {response.text}")
                return {
                    'error': f'Failed to get payment status: {response.status_code}',
                    'details': response.text
                }
                
        except Exception as e:
            logger.error(f"Error in get_payment_status: {str(e)}")
            return {'error': f'Get payment status error: {str(e)}'}
    
    def validate_account_holder(self, phone_number):
        """
        Validate if a phone number is registered with MTN Mobile Money
        
        Args:
            phone_number (str): Phone number to validate
            
        Returns:
            dict: Validation result
        """
        try:
            # Get access token
            access_token = self._get_access_token()
            if not access_token:
                return {'error': 'Failed to get access token'}
            
            url = f"{self.base_url}/collection/accountholder/msisdn/{phone_number}/active"
            
            headers = {
                'Authorization': f'Bearer {access_token}',
                'X-Target-Environment': self.target_environment,
                'Ocp-Apim-Subscription-Key': self.subscription_key
            }
            
            response = requests.get(url, headers=headers)
            
            if response.status_code == 200:
                return {
                    'phone_number': phone_number,
                    'is_active': response.json() if response.text else False
                }
            else:
                logger.error(f"Failed to validate account holder: {response.status_code} - {response.text}")
                return {
                    'error': f'Failed to validate account holder: {response.status_code}',
                    'details': response.text
                }
                
        except Exception as e:
            logger.error(f"Error in validate_account_holder: {str(e)}")
            return {'error': f'Validate account holder error: {str(e)}'}
    
    def get_account_balance(self):
        """
        Get the balance of the collection account
        
        Returns:
            dict: Account balance information
        """
        try:
            # Get access token
            access_token = self._get_access_token()
            if not access_token:
                return {'error': 'Failed to get access token'}
            
            url = f"{self.base_url}/collection/account/balance"
            
            headers = {
                'Authorization': f'Bearer {access_token}',
                'X-Target-Environment': self.target_environment,
                'Ocp-Apim-Subscription-Key': self.subscription_key
            }
            
            response = requests.get(url, headers=headers)
            
            if response.status_code == 200:
                balance_data = response.json()
                return {
                    'available_balance': balance_data.get('availableBalance'),
                    'currency': balance_data.get('currency')
                }
            else:
                logger.error(f"Failed to get account balance: {response.status_code} - {response.text}")
                return {
                    'error': f'Failed to get account balance: {response.status_code}',
                    'details': response.text
                }
                
        except Exception as e:
            logger.error(f"Error in get_account_balance: {str(e)}")
            return {'error': f'Get account balance error: {str(e)}'}

# Create global instances
fastapi_client = FastAPIClient()
mtn_service = MTNMobileMoneyService() 
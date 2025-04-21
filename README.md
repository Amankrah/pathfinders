# Pathfinders Project

Gift assessment platform for identifying and matching spiritual gifts.

## Local Development Setup

1. Clone the repository
```bash
git clone <repository-url>
cd pathfinders
```

2. Create a virtual environment and install dependencies
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

3. Setup environment variables
```bash
cp .env.example .env
# Edit .env with your specific settings
```

4. Run migrations
```bash
python manage_local.py migrate
```

5. Create a superuser
```bash
python manage_local.py createsuperuser
```

6. Run the development server
```bash
python manage_local.py runserver
```

The server will be available at http://localhost:8000/

## Running Tests
```bash
python manage_local.py test
```

## Additional Components

### FastAPI Integration
The project uses FastAPI for the gift assessment calculations. Make sure the FastAPI service is running at http://127.0.0.1:8001 or update the FASTAPI_URL in your .env file.

### Frontend Development
The frontend uses Next.js. For local development, the frontend should be running at http://localhost:3000 to avoid CORS issues.

## Deployment

### Production Settings
The production settings are automatically applied when ENVIRONMENT=production is set in the environment variables.

### Important Configuration Files
- `pathfinders_project/settings.py`: Main settings file
- `pathfinders_project/local_settings.py`: Local development settings override
- `manage_local.py`: Script for running with local development settings

## Project Structure
- `assessments/`: Gift assessment functionality
- `books/`: Resource materials and books
- `core/`: Core application features
- `counselors/`: Counselor management
- `users/`: User management and profiles 
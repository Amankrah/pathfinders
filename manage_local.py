#!/usr/bin/env python
"""
Django's command-line utility for local development settings.
"""
import os
import sys


def main():
    """Run administrative tasks with local settings."""
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'pathfinders_project.settings')
    
    # Override with local settings
    os.environ.setdefault('ENVIRONMENT', 'development')
    os.environ.setdefault('DEBUG', 'True')
    
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
        
    # Add a message to indicate we're running in local mode
    if len(sys.argv) > 1 and sys.argv[1] == 'runserver':
        print("🚀 Starting Pathfinders in LOCAL DEVELOPMENT mode 🚀")
        if len(sys.argv) == 2:
            # Default to port 8000 if not specified
            sys.argv.append('0.0.0.0:8000')
    
    execute_from_command_line(sys.argv)


if __name__ == '__main__':
    main() 
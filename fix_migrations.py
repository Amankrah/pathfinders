import os
import django
from django.db import connections
from django.db.migrations.recorder import MigrationRecorder

# Set up Django environment
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "pathfinders_project.settings")
django.setup()

def fix_migration_history():
    connection = connections['default']
    recorder = MigrationRecorder(connection)
    
    # Check if counselors.0001_initial is already applied
    applied_migrations = recorder.applied_migrations()
    if ('counselors', '0001_initial') not in applied_migrations:
        print("Manually recording counselors.0001_initial as applied...")
        # Add the counselors.0001_initial migration as applied
        recorder.record_applied('counselors', '0001_initial')
        print("Done!")
    else:
        print("The migration counselors.0001_initial is already applied.")
    
    print("\nRun the following command to complete the migration process:")
    print("python manage.py migrate")

if __name__ == "__main__":
    fix_migration_history() 
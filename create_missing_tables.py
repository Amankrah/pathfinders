import os
import django
import sqlite3

# Set up Django environment
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "pathfinders_project.settings")
django.setup()

from django.db import connection

def create_missing_tables():
    conn = sqlite3.connect('db.sqlite3')
    cursor = conn.cursor()
    
    # Check if counselors_counselor table exists
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='counselors_counselor'")
    if not cursor.fetchone():
        print("Creating counselors_counselor table...")
        cursor.execute('''
        CREATE TABLE "counselors_counselor" (
            "id" integer NOT NULL PRIMARY KEY AUTOINCREMENT,
            "professional_title" varchar(100) NOT NULL,
            "institution" varchar(200) NOT NULL,
            "qualification" varchar(200) NOT NULL,
            "phone_number" varchar(20) NOT NULL,
            "bio" text NOT NULL,
            "is_active" bool NOT NULL,
            "created_at" datetime NOT NULL,
            "updated_at" datetime NOT NULL,
            "user_id" integer NOT NULL UNIQUE REFERENCES "users_user" ("id") DEFERRABLE INITIALLY DEFERRED
        )
        ''')
        print("counselors_counselor table created.")
    else:
        print("counselors_counselor table already exists.")
    
    # Check if counselors_counseloruserrelation table exists
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='counselors_counseloruserrelation'")
    if not cursor.fetchone():
        print("Creating counselors_counseloruserrelation table...")
        cursor.execute('''
        CREATE TABLE "counselors_counseloruserrelation" (
            "id" integer NOT NULL PRIMARY KEY AUTOINCREMENT,
            "status" varchar(20) NOT NULL,
            "notes" text NOT NULL,
            "created_at" datetime NOT NULL,
            "updated_at" datetime NOT NULL,
            "counselor_id" integer NOT NULL REFERENCES "counselors_counselor" ("id") DEFERRABLE INITIALLY DEFERRED,
            "user_id" integer NOT NULL REFERENCES "users_user" ("id") DEFERRABLE INITIALLY DEFERRED,
            UNIQUE ("counselor_id", "user_id")
        )
        ''')
        print("counselors_counseloruserrelation table created.")
    else:
        print("counselors_counseloruserrelation table already exists.")
    
    # Commit changes and close connection
    conn.commit()
    conn.close()
    
    print("\nAll tables have been created. Now run your application again.")

if __name__ == "__main__":
    create_missing_tables() 
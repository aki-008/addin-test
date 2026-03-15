# create_user.py
from database import SessionLocal, engine
import models
import auth

# 1. Create the tables in the database if they don't exist yet
models.Base.metadata.create_all(bind=engine)

# 2. Initialize database session
db = SessionLocal()

# Define test credentials
test_username = "admin"
test_password = "password123"

# Check if user already exists
existing_user = db.query(models.User).filter(models.User.username == test_username).first()

# Hash the password using our new Argon2 setup
hashed_pw = auth.get_password_hash(test_password)

if not existing_user:
    # Create the user
    new_user = models.User(username=test_username, hashed_password=hashed_pw)
    db.add(new_user)
    print(f"User '{test_username}' created successfully!")
else:
    # UPDATE the existing user's password to the new hash
    existing_user.hashed_password = hashed_pw
    print(f"User '{test_username}' already existed. Password updated to the new Argon2 hash!")

# Commit the changes to the database
db.commit()
db.close()
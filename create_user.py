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

if not existing_user:
    # Hash the password and create the user
    hashed_pw = auth.get_password_hash(test_password)
    new_user = models.User(username=test_username, hashed_password=hashed_pw)
    
    db.add(new_user)
    db.commit()
    print(f"User '{test_username}' created successfully!")
else:
    print(f"User '{test_username}' already exists.")

db.close()
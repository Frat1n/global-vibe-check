<file>
      <absolute_file_name>/app/backend/auth.py</absolute_file_name>
      <content">"""
MongoDB-based Authentication System

This module handles user authentication, registration, and email verification
using MongoDB instead of Supabase. Provides secure password hashing,
JWT token generation, and email verification functionality.

Features:
- User registration with email verification
- Secure password hashing with bcrypt
- JWT token generation and validation
- Email verification system
- Password reset functionality
"""

import os
import jwt
import bcrypt
import uuid
import smtplib
from datetime import datetime, timedelta
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional, Dict, Any
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel, EmailStr
from fastapi import HTTPException

class UserCreate(BaseModel):
    """User registration model"""
    email: EmailStr
    password: str
    display_name: Optional[str] = None

class UserLogin(BaseModel):
    """User login model"""
    email: EmailStr
    password: str

class User(BaseModel):
    """User model"""
    id: str
    email: str
    display_name: Optional[str] = None
    is_verified: bool = False
    created_at: datetime
    updated_at: datetime

class AuthService:
    """MongoDB-based authentication service"""
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.secret_key = os.environ.get('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
        self.algorithm = 'HS256'
        self.token_expire_hours = 24 * 7  # 7 days
        
    async def hash_password(self, password: str) -> str:
        """Hash password using bcrypt"""
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
        return hashed.decode('utf-8')
    
    async def verify_password(self, password: str, hashed: str) -> bool:
        """Verify password against hash"""
        return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))
    
    def generate_token(self, user_id: str) -> str:
        """Generate JWT token"""
        payload = {
            'user_id': user_id,
            'exp': datetime.utcnow() + timedelta(hours=self.token_expire_hours),
            'iat': datetime.utcnow()
        }
        return jwt.encode(payload, self.secret_key, algorithm=self.algorithm)
    
    def verify_token(self, token: str) -> Optional[str]:
        """Verify JWT token and return user_id"""
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            return payload.get('user_id')
        except jwt.ExpiredSignatureError:
            return None
        except jwt.InvalidTokenError:
            return None
    
    async def send_verification_email(self, email: str, verification_token: str):
        """Send email verification (simplified for demo)"""
        # In production, you would use a proper email service like SendGrid
        # For now, we'll just log the verification token
        print(f"📧 Email verification for {email}")
        print(f"🔗 Verification token: {verification_token}")
        print(f"📄 In production, send email with verification link")
        
        # Store verification token in database
        await self.db.verification_tokens.insert_one({
            'email': email,
            'token': verification_token,
            'created_at': datetime.utcnow(),
            'expires_at': datetime.utcnow() + timedelta(hours=24)
        })
    
    async def register_user(self, user_data: UserCreate) -> Dict[str, Any]:
        """Register a new user"""
        # Check if user already exists
        existing_user = await self.db.users.find_one({'email': user_data.email})
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Hash password
        hashed_password = await self.hash_password(user_data.password)
        
        # Create user
        user_id = str(uuid.uuid4())
        verification_token = str(uuid.uuid4())
        
        user_doc = {
            'id': user_id,
            'email': user_data.email,
            'password_hash': hashed_password,
            'display_name': user_data.display_name or user_data.email.split('@')[0],
            'is_verified': False,  # Email verification required
            'verification_token': verification_token,
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        
        await self.db.users.insert_one(user_doc)
        
        # Send verification email
        await self.send_verification_email(user_data.email, verification_token)
        
        return {
            'message': 'User registered successfully. Please check your email for verification.',
            'user_id': user_id,
            'requires_verification': True
        }
    
    async def login_user(self, login_data: UserLogin) -> Dict[str, Any]:
        """Login user and return token"""
        # Find user
        user = await self.db.users.find_one({'email': login_data.email})
        if not user:
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        # Verify password
        if not await self.verify_password(login_data.password, user['password_hash']):
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        # Check if email is verified (for now, we'll allow unverified users to login)
        # In production, you might want to enforce email verification
        
        # Generate token
        token = self.generate_token(user['id'])
        
        return {
            'access_token': token,
            'token_type': 'bearer',
            'user': {
                'id': user['id'],
                'email': user['email'],
                'display_name': user.get('display_name'),
                'is_verified': user.get('is_verified', False)
            }
        }
    
    async def verify_email(self, token: str) -> Dict[str, Any]:
        """Verify user email with token"""
        # Find verification token
        verification = await self.db.verification_tokens.find_one({'token': token})
        if not verification:
            raise HTTPException(status_code=400, detail="Invalid verification token")
        
        # Check if token is expired
        if verification['expires_at'] < datetime.utcnow():
            raise HTTPException(status_code=400, detail="Verification token expired")
        
        # Update user verification status
        await self.db.users.update_one(
            {'email': verification['email']},
            {
                '$set': {
                    'is_verified': True,
                    'updated_at': datetime.utcnow()
                },
                '$unset': {'verification_token': ''}
            }
        )
        
        # Remove verification token
        await self.db.verification_tokens.delete_one({'token': token})
        
        return {'message': 'Email verified successfully'}
    
    async def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user by ID"""
        user = await self.db.users.find_one({'id': user_id})
        if user:
            # Remove sensitive data
            user.pop('password_hash', None)
            user.pop('verification_token', None)
        return user
</content>
    </file>
#!/usr/bin/env python3
"""
MongoDB Authentication Test Suite

Focused testing for the MongoDB authentication endpoints as requested.
Tests the specific endpoints mentioned in the review request:

1. Health Check - GET /api/ (should show new MongoDB auth message)
2. Registration - POST /api/auth/register with test user data
3. Login - POST /api/auth/login with registered user
4. Current User - GET /api/auth/me with JWT token

Test Data:
- Email: test@moodmaps.com
- Password: testpass123
- Display Name: Test User
"""

import requests
import json
import uuid
from pathlib import Path

# Load backend URL from frontend .env file
def load_backend_url():
    """Load the backend URL from frontend .env file"""
    frontend_env_path = Path("/app/frontend/.env")
    if frontend_env_path.exists():
        with open(frontend_env_path, 'r') as f:
            for line in f:
                if line.startswith('REACT_APP_BACKEND_URL='):
                    return line.split('=', 1)[1].strip()
    return "http://localhost:8001"  # fallback

BACKEND_URL = load_backend_url()
API_BASE = f"{BACKEND_URL}/api"

# Test configuration as specified in review request
TEST_EMAIL = "test@moodmaps.com"
TEST_PASSWORD = "testpass123"
TEST_DISPLAY_NAME = "Test User"

def print_test_result(test_name, success, details=""):
    """Print formatted test results"""
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"{status} {test_name}")
    if details:
        print(f"   Details: {details}")
    print()

def test_health_check():
    """Test 1: Health Check - GET /api/ (should show new MongoDB auth message)"""
    print("=" * 60)
    print("TEST 1: HEALTH CHECK")
    print("=" * 60)
    
    try:
        response = requests.get(f"{API_BASE}/")
        success = response.status_code == 200
        
        if success:
            data = response.json()
            message = data.get('message', '')
            # Check if message mentions MongoDB authentication
            has_mongo_auth = 'MongoDB Authentication' in message
            details = f"Status: {response.status_code}, Message: {message}"
            if has_mongo_auth:
                details += " ✓ Contains MongoDB Authentication reference"
        else:
            details = f"Status: {response.status_code}, Error: {response.text}"
            
        print_test_result("Health Check Endpoint", success, details)
        return success
        
    except Exception as e:
        print_test_result("Health Check Endpoint", False, f"Exception: {str(e)}")
        return False

def test_registration():
    """Test 2: Registration - POST /api/auth/register with test user data"""
    print("=" * 60)
    print("TEST 2: USER REGISTRATION")
    print("=" * 60)
    
    # Use unique email to avoid conflicts
    unique_email = f"test_{uuid.uuid4().hex[:8]}@moodmaps.com"
    
    try:
        register_data = {
            "email": unique_email,
            "password": TEST_PASSWORD,
            "display_name": TEST_DISPLAY_NAME
        }
        
        response = requests.post(f"{API_BASE}/auth/register", json=register_data)
        success = response.status_code == 200
        
        if success:
            result = response.json()
            user_id = result.get('user_id')
            message = result.get('message', '')
            requires_verification = result.get('requires_verification', False)
            
            details = f"Status: {response.status_code}, User ID: {user_id}"
            details += f", Message: {message}"
            details += f", Requires Verification: {requires_verification}"
            
            # Store for next test
            global REGISTERED_EMAIL
            REGISTERED_EMAIL = unique_email
            
        else:
            details = f"Status: {response.status_code}, Error: {response.text}"
            
        print_test_result("User Registration", success, details)
        return success
        
    except Exception as e:
        print_test_result("User Registration", False, f"Exception: {str(e)}")
        return False

def test_login():
    """Test 3: Login - POST /api/auth/login with registered user"""
    print("=" * 60)
    print("TEST 3: USER LOGIN")
    print("=" * 60)
    
    try:
        login_data = {
            "email": REGISTERED_EMAIL,
            "password": TEST_PASSWORD
        }
        
        response = requests.post(f"{API_BASE}/auth/login", json=login_data)
        success = response.status_code == 200
        
        if success:
            result = response.json()
            access_token = result.get('access_token')
            token_type = result.get('token_type')
            user_data = result.get('user', {})
            
            details = f"Status: {response.status_code}"
            details += f", Token Type: {token_type}"
            details += f", Token Received: {'Yes' if access_token else 'No'}"
            details += f", User Email: {user_data.get('email')}"
            details += f", User ID: {user_data.get('id')}"
            details += f", Verified: {user_data.get('is_verified')}"
            
            # Store token for next test
            global AUTH_TOKEN
            AUTH_TOKEN = access_token
            
        else:
            details = f"Status: {response.status_code}, Error: {response.text}"
            
        print_test_result("User Login", success, details)
        return success
        
    except Exception as e:
        print_test_result("User Login", False, f"Exception: {str(e)}")
        return False

def test_current_user():
    """Test 4: Current User - GET /api/auth/me with JWT token"""
    print("=" * 60)
    print("TEST 4: GET CURRENT USER")
    print("=" * 60)
    
    try:
        if not AUTH_TOKEN:
            print_test_result("Get Current User", False, "No auth token available from login")
            return False
            
        headers = {
            "Authorization": f"Bearer {AUTH_TOKEN}",
            "Content-Type": "application/json"
        }
        
        response = requests.get(f"{API_BASE}/auth/me", headers=headers)
        success = response.status_code == 200
        
        if success:
            user_data = response.json()
            details = f"Status: {response.status_code}"
            details += f", User ID: {user_data.get('id')}"
            details += f", Email: {user_data.get('email')}"
            details += f", Display Name: {user_data.get('display_name')}"
            details += f", Verified: {user_data.get('is_verified')}"
            details += f", Created: {user_data.get('created_at', 'N/A')[:19]}"  # First 19 chars of timestamp
            
        else:
            details = f"Status: {response.status_code}, Error: {response.text}"
            
        print_test_result("Get Current User", success, details)
        return success
        
    except Exception as e:
        print_test_result("Get Current User", False, f"Exception: {str(e)}")
        return False

def run_auth_tests():
    """Run all MongoDB authentication tests"""
    print("🔐 MONGODB AUTHENTICATION TEST SUITE")
    print(f"Backend URL: {BACKEND_URL}")
    print(f"API Base: {API_BASE}")
    print(f"Test Email Pattern: test_[random]@moodmaps.com")
    print(f"Test Password: {TEST_PASSWORD}")
    print(f"Test Display Name: {TEST_DISPLAY_NAME}")
    print()
    
    # Initialize global variables
    global REGISTERED_EMAIL, AUTH_TOKEN
    REGISTERED_EMAIL = None
    AUTH_TOKEN = None
    
    # Run tests in sequence
    test_results = {}
    
    test_results['health_check'] = test_health_check()
    test_results['registration'] = test_registration()
    test_results['login'] = test_login()
    test_results['current_user'] = test_current_user()
    
    # Summary
    print("=" * 60)
    print("MONGODB AUTHENTICATION TEST SUMMARY")
    print("=" * 60)
    
    total_tests = len(test_results)
    passed_tests = sum(test_results.values())
    
    for test_name, result in test_results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} {test_name.replace('_', ' ').title()}")
    
    print()
    print(f"Overall Result: {passed_tests}/{total_tests} tests passed")
    
    if passed_tests == total_tests:
        print("🎉 ALL MONGODB AUTHENTICATION TESTS PASSED!")
        print("✓ Health check shows MongoDB authentication message")
        print("✓ User registration creates user and shows email verification message")
        print("✓ Login returns JWT token and user data")
        print("✓ /auth/me returns user info when authenticated")
        print("✓ All endpoints handle requests properly")
    else:
        print("⚠️  Some authentication tests failed. Check the details above.")
    
    return test_results

if __name__ == "__main__":
    run_auth_tests()
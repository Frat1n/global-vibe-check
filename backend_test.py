#!/usr/bin/env python3
"""
MoodMaps Backend API Test Suite

Comprehensive testing for the MoodMaps social emotional platform backend.
Tests all major API endpoints including MongoDB authentication, mood tracking, 
social features, AI recommendations, video uploads, and private messaging.

Test Priority:
1. Basic Health Check - GET /api/
2. MongoDB Authentication - POST /api/auth/register, POST /api/auth/login, GET /api/auth/me
3. Mood Tracking APIs - POST /api/moods, GET /api/moods, GET /api/moods/public
4. Social Features - POST /api/like, POST /api/comments
5. AI Recommendations - GET /api/recommendations
6. Video Moodies - POST /api/moodies
7. Private Messages - POST /api/messages, GET /api/messages
"""

import requests
import json
import base64
import io
import os
from datetime import datetime
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

# Test configuration
TEST_USER_ID = "test_user_123"
TEST_USER_ID_2 = "test_user_456"
HEADERS = {
    "Authorization": f"Bearer {TEST_USER_ID}",
    "Content-Type": "application/json"
}
HEADERS_USER2 = {
    "Authorization": f"Bearer {TEST_USER_ID_2}",
    "Content-Type": "application/json"
}

# Test data
MOOD_DATA = {
    "mood": "happy",
    "message": "Feeling great after morning coffee!",
    "latitude": 40.7128,
    "longitude": -74.0060,
    "city": "New York",
    "country": "USA"
}

MOOD_DATA_2 = {
    "mood": "excited",
    "message": "Just got promoted at work!",
    "latitude": 34.0522,
    "longitude": -118.2437,
    "city": "Los Angeles", 
    "country": "USA"
}

def create_test_video():
    """Create a simple test video file for upload testing"""
    # Create a minimal video-like binary data
    video_content = b"FAKE_VIDEO_DATA_FOR_TESTING" * 100
    return video_content

def print_test_result(test_name, success, details=""):
    """Print formatted test results"""
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"{status} {test_name}")
    if details:
        print(f"   Details: {details}")
    print()

def test_health_check():
    """Test 1: Basic Health Check - GET /api/"""
    print("=" * 60)
    print("TEST 1: HEALTH CHECK")
    print("=" * 60)
    
    try:
        response = requests.get(f"{API_BASE}/")
        success = response.status_code == 200
        
        if success:
            data = response.json()
            details = f"Status: {response.status_code}, Message: {data.get('message', 'No message')}"
        else:
            details = f"Status: {response.status_code}, Error: {response.text}"
            
        print_test_result("Health Check Endpoint", success, details)
        return success
        
    except Exception as e:
        print_test_result("Health Check Endpoint", False, f"Exception: {str(e)}")
        return False

def test_mood_tracking():
    """Test 2: Mood Tracking APIs"""
    print("=" * 60)
    print("TEST 2: MOOD TRACKING APIS")
    print("=" * 60)
    
    results = []
    
    # Test 2a: Create mood entry
    try:
        response = requests.post(f"{API_BASE}/moods", json=MOOD_DATA, headers=HEADERS)
        success = response.status_code == 200
        
        if success:
            mood_entry = response.json()
            global created_mood_id
            created_mood_id = mood_entry.get('id')
            details = f"Status: {response.status_code}, Mood ID: {created_mood_id}"
        else:
            details = f"Status: {response.status_code}, Error: {response.text}"
            
        print_test_result("Create Mood Entry", success, details)
        results.append(success)
        
    except Exception as e:
        print_test_result("Create Mood Entry", False, f"Exception: {str(e)}")
        results.append(False)
    
    # Test 2b: Create second mood entry for testing
    try:
        response = requests.post(f"{API_BASE}/moods", json=MOOD_DATA_2, headers=HEADERS)
        success = response.status_code == 200
        print_test_result("Create Second Mood Entry", success, f"Status: {response.status_code}")
        results.append(success)
        
    except Exception as e:
        print_test_result("Create Second Mood Entry", False, f"Exception: {str(e)}")
        results.append(False)
    
    # Test 2c: Get user's mood entries
    try:
        response = requests.get(f"{API_BASE}/moods", headers=HEADERS)
        success = response.status_code == 200
        
        if success:
            moods = response.json()
            details = f"Status: {response.status_code}, Retrieved {len(moods)} mood entries"
        else:
            details = f"Status: {response.status_code}, Error: {response.text}"
            
        print_test_result("Get User Mood Entries", success, details)
        results.append(success)
        
    except Exception as e:
        print_test_result("Get User Mood Entries", False, f"Exception: {str(e)}")
        results.append(False)
    
    # Test 2d: Get public mood entries
    try:
        response = requests.get(f"{API_BASE}/moods/public")
        success = response.status_code == 200
        
        if success:
            public_moods = response.json()
            details = f"Status: {response.status_code}, Retrieved {len(public_moods)} public mood entries"
        else:
            details = f"Status: {response.status_code}, Error: {response.text}"
            
        print_test_result("Get Public Mood Entries", success, details)
        results.append(success)
        
    except Exception as e:
        print_test_result("Get Public Mood Entries", False, f"Exception: {str(e)}")
        results.append(False)
    
    return all(results)

def test_social_features():
    """Test 3: Social Features - Likes and Comments"""
    print("=" * 60)
    print("TEST 3: SOCIAL FEATURES")
    print("=" * 60)
    
    results = []
    
    # Test 3a: Like a mood entry
    try:
        like_data = {
            "content_id": created_mood_id if 'created_mood_id' in globals() else "test_mood_id",
            "content_type": "mood"
        }
        
        response = requests.post(f"{API_BASE}/like", params=like_data, headers=HEADERS_USER2)
        success = response.status_code == 200
        
        if success:
            result = response.json()
            details = f"Status: {response.status_code}, Result: {result.get('message', 'No message')}"
        else:
            details = f"Status: {response.status_code}, Error: {response.text}"
            
        print_test_result("Like Content", success, details)
        results.append(success)
        
    except Exception as e:
        print_test_result("Like Content", False, f"Exception: {str(e)}")
        results.append(False)
    
    # Test 3b: Create a comment
    try:
        comment_data = {
            "content_id": created_mood_id if 'created_mood_id' in globals() else "test_mood_id",
            "content_type": "mood",
            "text": "Great mood! Keep it up! 😊"
        }
        
        response = requests.post(f"{API_BASE}/comments", params=comment_data, headers=HEADERS_USER2)
        success = response.status_code == 200
        
        if success:
            result = response.json()
            details = f"Status: {response.status_code}, Comment ID: {result.get('comment_id', 'No ID')}"
        else:
            details = f"Status: {response.status_code}, Error: {response.text}"
            
        print_test_result("Create Comment", success, details)
        results.append(success)
        
    except Exception as e:
        print_test_result("Create Comment", False, f"Exception: {str(e)}")
        results.append(False)
    
    return all(results)

def test_ai_recommendations():
    """Test 4: AI Recommendations"""
    print("=" * 60)
    print("TEST 4: AI RECOMMENDATIONS")
    print("=" * 60)
    
    try:
        response = requests.get(f"{API_BASE}/recommendations", headers=HEADERS)
        success = response.status_code == 200
        
        if success:
            recommendations = response.json()
            rec_count = len(recommendations.get('recommendations', []))
            details = f"Status: {response.status_code}, Got {rec_count} recommendations"
        else:
            details = f"Status: {response.status_code}, Error: {response.text}"
            
        print_test_result("AI Mood Recommendations", success, details)
        return success
        
    except Exception as e:
        print_test_result("AI Mood Recommendations", False, f"Exception: {str(e)}")
        return False

def test_video_moodies():
    """Test 5: Video Moodies Upload"""
    print("=" * 60)
    print("TEST 5: VIDEO MOODIES")
    print("=" * 60)
    
    try:
        # Create test video data
        video_content = create_test_video()
        
        # Prepare multipart form data
        files = {
            'video_file': ('test_video.mp4', io.BytesIO(video_content), 'video/mp4')
        }
        
        form_data = {
            'title': 'My Happy Moodie',
            'description': 'A test video showing my happy mood!',
            'mood_tags': json.dumps(['happy', 'excited'])
        }
        
        # Remove Content-Type header for multipart upload
        auth_headers = {"Authorization": f"Bearer {TEST_USER_ID}"}
        
        response = requests.post(f"{API_BASE}/moodies", data=form_data, files=files, headers=auth_headers)
        success = response.status_code == 200
        
        if success:
            result = response.json()
            details = f"Status: {response.status_code}, Moodie ID: {result.get('moodie_id', 'No ID')}"
        else:
            details = f"Status: {response.status_code}, Error: {response.text}"
            
        print_test_result("Upload Video Moodie", success, details)
        return success
        
    except Exception as e:
        print_test_result("Upload Video Moodie", False, f"Exception: {str(e)}")
        return False

def test_private_messages():
    """Test 6: Private Messages"""
    print("=" * 60)
    print("TEST 6: PRIVATE MESSAGES")
    print("=" * 60)
    
    results = []
    
    # Test 6a: Send private message
    try:
        message_data = {
            "recipient_id": TEST_USER_ID_2,
            "message": "Hey! How are you feeling today? 😊"
        }
        
        response = requests.post(f"{API_BASE}/messages", params=message_data, headers=HEADERS)
        success = response.status_code == 200
        
        if success:
            result = response.json()
            details = f"Status: {response.status_code}, Message ID: {result.get('message_id', 'No ID')}"
        else:
            details = f"Status: {response.status_code}, Error: {response.text}"
            
        print_test_result("Send Private Message", success, details)
        results.append(success)
        
    except Exception as e:
        print_test_result("Send Private Message", False, f"Exception: {str(e)}")
        results.append(False)
    
    # Test 6b: Get private messages
    try:
        response = requests.get(f"{API_BASE}/messages", headers=HEADERS)
        success = response.status_code == 200
        
        if success:
            messages = response.json()
            details = f"Status: {response.status_code}, Retrieved {len(messages)} messages"
        else:
            details = f"Status: {response.status_code}, Error: {response.text}"
            
        print_test_result("Get Private Messages", success, details)
        results.append(success)
        
    except Exception as e:
        print_test_result("Get Private Messages", False, f"Exception: {str(e)}")
        results.append(False)
    
    return all(results)

def run_all_tests():
    """Run all backend API tests"""
    print("🚀 STARTING MOODMAPS BACKEND API TESTS")
    print(f"Backend URL: {BACKEND_URL}")
    print(f"API Base: {API_BASE}")
    print()
    
    # Initialize global variables
    global created_mood_id
    created_mood_id = None
    
    # Run tests in priority order
    test_results = {}
    
    test_results['health_check'] = test_health_check()
    test_results['mood_tracking'] = test_mood_tracking()
    test_results['social_features'] = test_social_features()
    test_results['ai_recommendations'] = test_ai_recommendations()
    test_results['video_moodies'] = test_video_moodies()
    test_results['private_messages'] = test_private_messages()
    
    # Summary
    print("=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    
    total_tests = len(test_results)
    passed_tests = sum(test_results.values())
    
    for test_name, result in test_results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} {test_name.replace('_', ' ').title()}")
    
    print()
    print(f"Overall Result: {passed_tests}/{total_tests} tests passed")
    
    if passed_tests == total_tests:
        print("🎉 ALL TESTS PASSED! Backend API is working correctly.")
    else:
        print("⚠️  Some tests failed. Check the details above.")
    
    return test_results

if __name__ == "__main__":
    run_all_tests()
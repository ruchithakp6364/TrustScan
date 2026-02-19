#!/usr/bin/env python3
"""
TrustScan Backend API Test Suite
Comprehensive testing for all API endpoints
"""
import requests
import json
import time
import os
from datetime import datetime

# Base URL from environment
BASE_URL = "https://trustscan-preview.preview.emergentagent.com/api"

# Test data
TEST_USER_DATA = {
    "name": "Alice Johnson",
    "email": "alice.johnson@example.com", 
    "password": "securepass123"
}

TEST_ADMIN_DATA = {
    "name": "Admin User",
    "email": "admin@trustscan.com",
    "password": "adminpass123"
}

TEST_URLS = [
    "https://google.com",
    "http://example.com", 
    "facebook.com",
    "not-a-url"
]

class TrustScanAPITester:
    def __init__(self):
        self.base_url = BASE_URL
        self.user_token = None
        self.admin_token = None
        self.scan_ids = []
        self.results = {
            "total_tests": 0,
            "passed": 0, 
            "failed": 0,
            "details": []
        }
    
    def log_test(self, test_name, passed, details=""):
        self.results["total_tests"] += 1
        if passed:
            self.results["passed"] += 1
            print(f"✅ PASS: {test_name}")
        else:
            self.results["failed"] += 1
            print(f"❌ FAIL: {test_name}")
        
        if details:
            print(f"   Details: {details}")
        
        self.results["details"].append({
            "test": test_name,
            "passed": passed, 
            "details": details,
            "timestamp": datetime.now().isoformat()
        })
    
    def test_root_api(self):
        """Test GET /api - Root API endpoint"""
        try:
            response = requests.get(f"{self.base_url}/", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                has_message = "message" in data
                has_endpoints = "endpoints" in data
                has_scan = "scan" in data.get("endpoints", {})
                has_auth = "auth" in data.get("endpoints", {})
                
                if has_message and has_endpoints and has_scan and has_auth:
                    self.log_test("Root API endpoint", True, f"API version: {data.get('message')}")
                else:
                    self.log_test("Root API endpoint", False, "Missing required fields in response")
            else:
                self.log_test("Root API endpoint", False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Root API endpoint", False, f"Request failed: {str(e)}")
    
    def test_user_registration(self):
        """Test POST /api/auth/register"""
        try:
            # Test with valid data
            response = requests.post(
                f"{self.base_url}/auth/register",
                json=TEST_USER_DATA,
                timeout=10
            )
            
            if response.status_code == 201:
                data = response.json()
                has_token = "token" in data
                has_user = "user" in data and data["user"].get("email") == TEST_USER_DATA["email"]
                
                if has_token and has_user:
                    self.user_token = data["token"]
                    self.log_test("User registration (valid data)", True, f"User created: {data['user']['email']}")
                else:
                    self.log_test("User registration (valid data)", False, "Missing token or user data")
            else:
                # User might already exist, try login instead
                if "already registered" in response.text.lower():
                    self.log_test("User registration (valid data)", True, "User already exists - this is expected behavior")
                    # Try to login to get token
                    self.test_user_login()
                else:
                    self.log_test("User registration (valid data)", False, f"HTTP {response.status_code}: {response.text}")
            
            # Test with invalid data
            response = requests.post(
                f"{self.base_url}/auth/register",
                json={"email": "invalid", "password": "123"}, 
                timeout=10
            )
            
            if response.status_code == 400:
                self.log_test("User registration (invalid data)", True, "Properly rejected invalid data")
            else:
                self.log_test("User registration (invalid data)", False, f"Should reject invalid data, got HTTP {response.status_code}")
                
        except Exception as e:
            self.log_test("User registration", False, f"Request failed: {str(e)}")
    
    def test_user_login(self):
        """Test POST /api/auth/login"""
        try:
            # Test with valid credentials
            response = requests.post(
                f"{self.base_url}/auth/login",
                json={
                    "email": TEST_USER_DATA["email"],
                    "password": TEST_USER_DATA["password"]
                },
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                has_token = "token" in data
                has_user = "user" in data
                
                if has_token and has_user:
                    self.user_token = data["token"]
                    self.log_test("User login (valid credentials)", True, f"Login successful for: {data['user']['email']}")
                else:
                    self.log_test("User login (valid credentials)", False, "Missing token or user data")
            else:
                self.log_test("User login (valid credentials)", False, f"HTTP {response.status_code}: {response.text}")
            
            # Test with invalid credentials
            response = requests.post(
                f"{self.base_url}/auth/login",
                json={
                    "email": "wrong@email.com",
                    "password": "wrongpass"
                },
                timeout=10
            )
            
            if response.status_code == 401:
                self.log_test("User login (invalid credentials)", True, "Properly rejected invalid credentials")
            else:
                self.log_test("User login (invalid credentials)", False, f"Should reject invalid credentials, got HTTP {response.status_code}")
                
        except Exception as e:
            self.log_test("User login", False, f"Request failed: {str(e)}")
    
    def test_get_current_user(self):
        """Test GET /api/auth/me"""
        if not self.user_token:
            self.log_test("Get current user info", False, "No user token available")
            return
            
        try:
            # Test with valid token
            headers = {"Authorization": f"Bearer {self.user_token}"}
            response = requests.get(f"{self.base_url}/auth/me", headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                has_email = "email" in data
                has_name = "name" in data
                no_password = "password" not in data
                
                if has_email and has_name and no_password:
                    self.log_test("Get current user info (authenticated)", True, f"User data retrieved: {data['email']}")
                else:
                    self.log_test("Get current user info (authenticated)", False, "Invalid user data structure")
            else:
                self.log_test("Get current user info (authenticated)", False, f"HTTP {response.status_code}: {response.text}")
            
            # Test without token
            response = requests.get(f"{self.base_url}/auth/me", timeout=10)
            
            if response.status_code == 401:
                self.log_test("Get current user info (unauthenticated)", True, "Properly rejected request without token")
            else:
                self.log_test("Get current user info (unauthenticated)", False, f"Should reject unauthenticated request, got HTTP {response.status_code}")
                
        except Exception as e:
            self.log_test("Get current user info", False, f"Request failed: {str(e)}")
    
    def test_url_scanning(self):
        """Test POST /api/scan - Core functionality"""
        test_cases = [
            {"url": "https://google.com", "should_work": True, "desc": "Valid HTTPS URL"},
            {"url": "http://example.com", "should_work": True, "desc": "Valid HTTP URL"},
            {"url": "facebook.com", "should_work": True, "desc": "Domain only"},
            {"url": "not-a-url", "should_work": False, "desc": "Invalid URL format"}
        ]
        
        for test_case in test_cases:
            try:
                response = requests.post(
                    f"{self.base_url}/scan",
                    json={"url": test_case["url"]},
                    timeout=30  # Scanning might take time
                )
                
                if test_case["should_work"]:
                    if response.status_code == 201:
                        data = response.json()
                        required_fields = ["scanId", "url", "domain", "riskScore", "trustRating", "sslInfo", "domainInfo"]
                        has_all_fields = all(field in data for field in required_fields)
                        valid_risk_score = 0 <= data.get("riskScore", -1) <= 100
                        
                        if has_all_fields and valid_risk_score:
                            self.scan_ids.append(data["scanId"])
                            self.log_test(f"URL scan ({test_case['desc']})", True, 
                                        f"Risk score: {data['riskScore']}, Rating: {data['trustRating']}")
                        else:
                            self.log_test(f"URL scan ({test_case['desc']})", False, "Missing required fields or invalid risk score")
                    else:
                        self.log_test(f"URL scan ({test_case['desc']})", False, f"HTTP {response.status_code}: {response.text}")
                else:
                    if response.status_code == 400:
                        self.log_test(f"URL scan ({test_case['desc']})", True, "Properly rejected invalid URL")
                    else:
                        self.log_test(f"URL scan ({test_case['desc']})", False, f"Should reject invalid URL, got HTTP {response.status_code}")
                
                # Small delay to avoid hitting rate limits
                time.sleep(1)
                        
            except Exception as e:
                self.log_test(f"URL scan ({test_case['desc']})", False, f"Request failed: {str(e)}")
    
    def test_scan_result_retrieval(self):
        """Test GET /api/scan/:id"""
        if not self.scan_ids:
            self.log_test("Scan result retrieval", False, "No scan IDs available for testing")
            return
            
        try:
            # Test with valid scan ID
            scan_id = self.scan_ids[0]
            response = requests.get(f"{self.base_url}/scan/{scan_id}", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ["_id", "url", "domain", "riskScore", "trustRating"]
                has_fields = all(field in data for field in required_fields)
                
                if has_fields:
                    self.log_test("Scan result retrieval (valid ID)", True, f"Retrieved scan for: {data['url']}")
                else:
                    self.log_test("Scan result retrieval (valid ID)", False, "Missing required fields")
            else:
                self.log_test("Scan result retrieval (valid ID)", False, f"HTTP {response.status_code}: {response.text}")
            
            # Test with invalid scan ID
            response = requests.get(f"{self.base_url}/scan/invalid-id-12345", timeout=10)
            
            if response.status_code == 404:
                self.log_test("Scan result retrieval (invalid ID)", True, "Properly returned 404 for invalid ID")
            else:
                self.log_test("Scan result retrieval (invalid ID)", False, f"Should return 404 for invalid ID, got HTTP {response.status_code}")
                
        except Exception as e:
            self.log_test("Scan result retrieval", False, f"Request failed: {str(e)}")
    
    def test_scan_history(self):
        """Test GET /api/history - Authenticated endpoint"""
        if not self.user_token:
            self.log_test("Scan history", False, "No user token available")
            return
            
        try:
            # Test with authentication
            headers = {"Authorization": f"Bearer {self.user_token}"}
            response = requests.get(f"{self.base_url}/history", headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                has_scans = "scans" in data
                scans_is_array = isinstance(data.get("scans"), list)
                
                if has_scans and scans_is_array:
                    self.log_test("Scan history (authenticated)", True, f"Retrieved {len(data['scans'])} scan(s)")
                else:
                    self.log_test("Scan history (authenticated)", False, "Invalid response structure")
            else:
                self.log_test("Scan history (authenticated)", False, f"HTTP {response.status_code}: {response.text}")
            
            # Test without authentication
            response = requests.get(f"{self.base_url}/history", timeout=10)
            
            if response.status_code == 401:
                self.log_test("Scan history (unauthenticated)", True, "Properly rejected unauthenticated request")
            else:
                self.log_test("Scan history (unauthenticated)", False, f"Should reject unauthenticated request, got HTTP {response.status_code}")
                
        except Exception as e:
            self.log_test("Scan history", False, f"Request failed: {str(e)}")
    
    def test_fraud_reporting(self):
        """Test POST /api/report - Authenticated endpoint"""
        if not self.user_token:
            self.log_test("Fraud reporting", False, "No user token available")
            return
            
        try:
            report_data = {
                "url": "https://suspicious-site.com",
                "reason": "phishing",
                "description": "This site is attempting to steal login credentials by mimicking a legitimate banking website."
            }
            
            # Test with authentication
            headers = {"Authorization": f"Bearer {self.user_token}"}
            response = requests.post(
                f"{self.base_url}/report",
                json=report_data,
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 201:
                data = response.json()
                has_id = "reportId" in data
                has_message = "message" in data
                
                if has_id and has_message:
                    self.log_test("Fraud reporting (authenticated)", True, f"Report submitted: {data['reportId']}")
                else:
                    self.log_test("Fraud reporting (authenticated)", False, "Missing response fields")
            else:
                self.log_test("Fraud reporting (authenticated)", False, f"HTTP {response.status_code}: {response.text}")
            
            # Test without authentication
            response = requests.post(f"{self.base_url}/report", json=report_data, timeout=10)
            
            if response.status_code == 401:
                self.log_test("Fraud reporting (unauthenticated)", True, "Properly rejected unauthenticated request")
            else:
                self.log_test("Fraud reporting (unauthenticated)", False, f"Should reject unauthenticated request, got HTTP {response.status_code}")
                
        except Exception as e:
            self.log_test("Fraud reporting", False, f"Request failed: {str(e)}")
    
    def test_rate_limiting(self):
        """Test rate limiting (5 scans per minute)"""
        print("\n⏳ Testing rate limiting - this may take up to 30 seconds...")
        
        try:
            # Make 6 requests quickly to trigger rate limit
            for i in range(6):
                response = requests.post(
                    f"{self.base_url}/scan",
                    json={"url": f"https://example{i}.com"},
                    timeout=10
                )
                
                if i < 5:
                    # First 5 should succeed or be limited by previous tests
                    if response.status_code in [201, 429]:
                        continue
                    else:
                        self.log_test("Rate limiting", False, f"Unexpected response on request {i+1}: HTTP {response.status_code}")
                        return
                else:
                    # 6th request should be rate limited
                    if response.status_code == 429:
                        data = response.json()
                        if "rate limit" in data.get("error", "").lower():
                            self.log_test("Rate limiting", True, "Properly enforced 5 requests per minute limit")
                            return
                        else:
                            self.log_test("Rate limiting", False, f"Rate limited but wrong error message: {data}")
                            return
                    else:
                        self.log_test("Rate limiting", False, f"Should be rate limited, got HTTP {response.status_code}")
                        return
                
                time.sleep(0.5)  # Small delay between requests
                        
        except Exception as e:
            self.log_test("Rate limiting", False, f"Request failed: {str(e)}")
    
    def test_error_handling(self):
        """Test error handling for invalid endpoints and methods"""
        try:
            # Test 404 for invalid endpoint
            response = requests.get(f"{self.base_url}/nonexistent", timeout=10)
            
            if response.status_code == 404:
                self.log_test("Error handling (404)", True, "Properly returned 404 for invalid endpoint")
            else:
                self.log_test("Error handling (404)", False, f"Should return 404, got HTTP {response.status_code}")
            
            # Test 405 for unsupported method
            response = requests.put(f"{self.base_url}/scan", json={"test": "data"}, timeout=10)
            
            if response.status_code == 405:
                self.log_test("Error handling (405)", True, "Properly returned 405 for unsupported method")
            else:
                self.log_test("Error handling (405)", False, f"Should return 405, got HTTP {response.status_code}")
                
        except Exception as e:
            self.log_test("Error handling", False, f"Request failed: {str(e)}")
    
    def run_all_tests(self):
        """Run complete test suite"""
        print(f"🚀 Starting TrustScan Backend API Tests")
        print(f"📍 Base URL: {self.base_url}")
        print("=" * 60)
        
        # Core functionality tests
        self.test_root_api()
        self.test_user_registration()
        self.test_user_login()  
        self.test_get_current_user()
        self.test_url_scanning()
        self.test_scan_result_retrieval()
        self.test_scan_history()
        self.test_fraud_reporting()
        self.test_rate_limiting()
        self.test_error_handling()
        
        # Print final results
        print("\n" + "=" * 60)
        print(f"🏁 Test Summary:")
        print(f"   Total Tests: {self.results['total_tests']}")
        print(f"   Passed: {self.results['passed']} ✅")
        print(f"   Failed: {self.results['failed']} ❌")
        print(f"   Success Rate: {(self.results['passed']/self.results['total_tests']*100):.1f}%")
        
        if self.results['failed'] > 0:
            print(f"\n❌ Failed Tests:")
            for detail in self.results['details']:
                if not detail['passed']:
                    print(f"   - {detail['test']}: {detail['details']}")
        
        return self.results

if __name__ == "__main__":
    tester = TrustScanAPITester()
    results = tester.run_all_tests()
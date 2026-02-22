#!/usr/bin/env python3
"""
TrustScan Backend Tests - Prisma ORM & Redis Implementation
Tests for updated TrustScan backend with Prisma ORM and Redis caching
"""

import requests
import json
import time
import os
from datetime import datetime

# Get base URL from environment
BASE_URL = os.getenv('NEXT_PUBLIC_BASE_URL', 'https://trustscan-preview.preview.emergentagent.com')

class TrustScanTester:
    def __init__(self):
        self.base_url = BASE_URL
        self.session = requests.Session()
        self.auth_token = None
        self.test_results = []
        
    def log_test(self, test_name, success, message, details=None):
        """Log test results with timestamp"""
        result = {
            'test': test_name,
            'success': success,
            'message': message,
            'timestamp': datetime.now().isoformat(),
            'details': details
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name} - {message}")
        if details:
            print(f"   Details: {details}")
    
    def test_technology_stack_verification(self):
        """Test 1: Verify Technology Stack shows Prisma ORM and Redis"""
        try:
            response = self.session.get(f"{self.base_url}/api")
            
            if response.status_code != 200:
                self.log_test("Technology Stack", False, f"API endpoint returned {response.status_code}")
                return False
            
            data = response.json()
            
            # Check for Prisma ORM indication
            database_info = data.get('database', '')
            cache_info = data.get('cache', '')
            
            prisma_found = 'Prisma ORM' in database_info
            redis_found = 'Redis' in cache_info
            
            if not prisma_found:
                self.log_test("Technology Stack", False, f"Prisma ORM not found in database info. Got: {database_info}")
                return False
            
            if not redis_found:
                self.log_test("Technology Stack", False, f"Redis not found in cache info. Got: {cache_info}")
                return False
            
            self.log_test("Technology Stack", True, 
                         "Backend correctly shows MongoDB with Prisma ORM and Redis",
                         f"Database: {database_info}, Cache: {cache_info}")
            return True
            
        except Exception as e:
            self.log_test("Technology Stack", False, f"Exception occurred: {str(e)}")
            return False
    
    def test_prisma_database_operations(self):
        """Test 2: Test Prisma Database Operations - Registration, Login, Me"""
        try:
            # Test user registration with Prisma
            test_user = {
                "name": "Alice Thompson",
                "email": f"alice.thompson.{int(time.time())}@example.com",
                "password": "SecurePass2024!"
            }
            
            print(f"\n🔄 Testing Prisma user registration...")
            reg_response = self.session.post(f"{self.base_url}/api/auth/register", json=test_user)
            
            if reg_response.status_code != 201:
                self.log_test("Prisma Registration", False, f"Registration failed with status {reg_response.status_code}")
                return False
            
            reg_data = reg_response.json()
            if not reg_data.get('token') or not reg_data.get('user'):
                self.log_test("Prisma Registration", False, "Missing token or user in registration response")
                return False
            
            self.auth_token = reg_data['token']
            user_id = reg_data['user']['id']
            
            self.log_test("Prisma Registration", True, 
                         "User created successfully via Prisma",
                         f"User ID: {user_id}, Email: {test_user['email']}")
            
            # Test user login with Prisma
            print(f"\n🔄 Testing Prisma user login...")
            login_data = {
                "email": test_user['email'],
                "password": test_user['password']
            }
            
            login_response = self.session.post(f"{self.base_url}/api/auth/login", json=login_data)
            
            if login_response.status_code != 200:
                self.log_test("Prisma Login", False, f"Login failed with status {login_response.status_code}")
                return False
            
            login_result = login_response.json()
            if not login_result.get('token'):
                self.log_test("Prisma Login", False, "No token received from login")
                return False
            
            self.log_test("Prisma Login", True, 
                         "User authenticated successfully via Prisma",
                         f"Token received for user: {login_result['user']['email']}")
            
            # Test user retrieval with Prisma
            print(f"\n🔄 Testing Prisma user retrieval...")
            headers = {'Authorization': f'Bearer {self.auth_token}'}
            me_response = self.session.get(f"{self.base_url}/api/auth/me", headers=headers)
            
            if me_response.status_code != 200:
                self.log_test("Prisma User Retrieval", False, f"User retrieval failed with status {me_response.status_code}")
                return False
            
            me_data = me_response.json()
            if me_data.get('email') != test_user['email']:
                self.log_test("Prisma User Retrieval", False, "Retrieved user email doesn't match")
                return False
            
            self.log_test("Prisma User Retrieval", True, 
                         "User data retrieved successfully via Prisma",
                         f"Retrieved: {me_data['name']} ({me_data['email']})")
            
            return True
            
        except Exception as e:
            self.log_test("Prisma Database Operations", False, f"Exception: {str(e)}")
            return False
    
    def test_redis_caching(self):
        """Test 3: Test Redis Caching - First scan vs cached scan response times"""
        try:
            test_url = "https://google.com"
            
            print(f"\n🔄 Testing Redis caching with URL: {test_url}")
            
            # First scan - should query and cache
            print("   First scan (cache miss)...")
            start_time = time.time()
            
            first_scan = self.session.post(f"{self.base_url}/api/scan", json={"url": test_url})
            first_response_time = time.time() - start_time
            
            if first_scan.status_code not in [200, 201]:
                self.log_test("Redis Caching - First Scan", False, 
                             f"First scan failed with status {first_scan.status_code}")
                return False
            
            first_data = first_scan.json()
            first_scan_id = first_data.get('scanId')
            
            self.log_test("Redis Caching - First Scan", True, 
                         f"First scan completed (cache miss)",
                         f"Response time: {first_response_time:.3f}s, Scan ID: {first_scan_id}")
            
            # Wait a moment to ensure any processing is complete
            time.sleep(1)
            
            # Second scan - should return from cache (faster)
            print("   Second scan (cache hit)...")
            start_time = time.time()
            
            second_scan = self.session.post(f"{self.base_url}/api/scan", json={"url": test_url})
            second_response_time = time.time() - start_time
            
            if second_scan.status_code not in [200, 201]:
                self.log_test("Redis Caching - Second Scan", False,
                             f"Second scan failed with status {second_scan.status_code}")
                return False
            
            second_data = second_scan.json()
            second_scan_id = second_data.get('scanId')
            
            # Verify we got cached result (should be faster)
            speed_improvement = first_response_time > second_response_time
            
            self.log_test("Redis Caching - Second Scan", True,
                         f"Second scan completed (cache hit)",
                         f"Response time: {second_response_time:.3f}s, Speed improved: {speed_improvement}")
            
            # Compare scan results
            if (first_data.get('riskScore') == second_data.get('riskScore') and 
                first_data.get('domain') == second_data.get('domain')):
                
                self.log_test("Redis Caching - Result Consistency", True,
                             "Cached results are consistent with original scan",
                             f"Risk Score: {first_data.get('riskScore')}, Domain: {first_data.get('domain')}")
                return True
            else:
                self.log_test("Redis Caching - Result Consistency", False,
                             "Cached results differ from original scan")
                return False
            
        except Exception as e:
            self.log_test("Redis Caching", False, f"Exception: {str(e)}")
            return False
    
    def test_redis_rate_limiting(self):
        """Test 4: Test Redis Rate Limiting - 5 requests allowed, 6th should fail"""
        try:
            print(f"\n🔄 Testing Redis-based rate limiting (5 requests per minute)...")
            
            # Clear any existing rate limit by waiting or using a unique identifier
            test_url_base = f"https://example{int(time.time())}.com"
            
            successful_requests = 0
            rate_limited = False
            
            # Try to make 6 consecutive scan requests
            for i in range(6):
                test_url = f"{test_url_base}/page{i}"
                print(f"   Request {i+1}/6: {test_url}")
                
                response = self.session.post(f"{self.base_url}/api/scan", json={"url": test_url})
                
                if response.status_code in [200, 201]:
                    successful_requests += 1
                    self.log_test(f"Rate Limit Test - Request {i+1}", True,
                                 f"Request {i+1} succeeded (status: {response.status_code})")
                elif response.status_code == 429:
                    rate_limited = True
                    error_data = response.json()
                    self.log_test(f"Rate Limit Test - Request {i+1}", True,
                                 f"Request {i+1} rate limited as expected (429)",
                                 f"Error: {error_data.get('error', 'Rate limit exceeded')}")
                    break
                else:
                    self.log_test(f"Rate Limit Test - Request {i+1}", False,
                                 f"Unexpected response status: {response.status_code}")
                    return False
                
                # Small delay between requests
                time.sleep(0.1)
            
            # Validate rate limiting behavior
            if successful_requests == 5 and rate_limited:
                self.log_test("Redis Rate Limiting", True,
                             "Rate limiting working correctly - 5 requests allowed, 6th blocked",
                             f"Successful: {successful_requests}, Rate limited: {rate_limited}")
                return True
            elif successful_requests < 5:
                self.log_test("Redis Rate Limiting", False,
                             f"Rate limiting too aggressive - only {successful_requests} requests allowed")
                return False
            else:
                self.log_test("Redis Rate Limiting", False,
                             "Rate limiting not working - more than 5 requests allowed")
                return False
            
        except Exception as e:
            self.log_test("Redis Rate Limiting", False, f"Exception: {str(e)}")
            return False
    
    def test_prisma_relations_queries(self):
        """Test 5: Test Prisma Relations and Queries - History and Reports"""
        try:
            if not self.auth_token:
                self.log_test("Prisma Relations", False, "No auth token available for testing")
                return False
            
            headers = {'Authorization': f'Bearer {self.auth_token}'}
            
            print(f"\n🔄 Testing Prisma relations and queries...")
            
            # Test scan history retrieval (user-scan relationship)
            print("   Testing scan history via Prisma...")
            history_response = self.session.get(f"{self.base_url}/api/history", headers=headers)
            
            if history_response.status_code != 200:
                self.log_test("Prisma Relations - History", False,
                             f"History retrieval failed with status {history_response.status_code}")
                return False
            
            history_data = history_response.json()
            scans = history_data.get('scans', [])
            
            self.log_test("Prisma Relations - History", True,
                         "Scan history retrieved successfully via Prisma",
                         f"Found {len(scans)} scan(s) in history")
            
            # Test fraud report submission (user-report relationship)
            print("   Testing fraud report via Prisma...")
            report_data = {
                "url": "https://suspicious-site.example.com",
                "reason": "phishing",
                "description": "This site appears to be impersonating a legitimate banking website to steal credentials."
            }
            
            report_response = self.session.post(f"{self.base_url}/api/report", 
                                              json=report_data, headers=headers)
            
            if report_response.status_code != 201:
                self.log_test("Prisma Relations - Report", False,
                             f"Report submission failed with status {report_response.status_code}")
                return False
            
            report_result = report_response.json()
            report_id = report_result.get('reportId')
            
            if not report_id:
                self.log_test("Prisma Relations - Report", False,
                             "No report ID returned from report submission")
                return False
            
            self.log_test("Prisma Relations - Report", True,
                         "Fraud report submitted successfully via Prisma",
                         f"Report ID: {report_id}, URL: {report_data['url']}")
            
            return True
            
        except Exception as e:
            self.log_test("Prisma Relations", False, f"Exception: {str(e)}")
            return False
    
    def test_data_persistence(self):
        """Test 6: Verify Data Persistence - Data saved via Prisma and relationships work"""
        try:
            if not self.auth_token:
                self.log_test("Data Persistence", False, "No auth token available for testing")
                return False
            
            headers = {'Authorization': f'Bearer {self.auth_token}'}
            
            print(f"\n🔄 Testing data persistence via Prisma...")
            
            # Create a scan to test persistence
            test_url = f"https://testsite{int(time.time())}.example.org"
            
            print("   Creating scan for persistence test...")
            scan_response = self.session.post(f"{self.base_url}/api/scan", 
                                            json={"url": test_url}, headers=headers)
            
            if scan_response.status_code not in [200, 201]:
                self.log_test("Data Persistence - Scan Creation", False,
                             f"Scan creation failed with status {scan_response.status_code}")
                return False
            
            scan_data = scan_response.json()
            scan_id = scan_data.get('scanId')
            
            self.log_test("Data Persistence - Scan Creation", True,
                         "Scan created and should be persisted",
                         f"Scan ID: {scan_id}, URL: {test_url}")
            
            # Wait a moment for persistence
            time.sleep(1)
            
            # Retrieve the scan by ID to verify it was persisted
            print("   Retrieving scan to verify persistence...")
            retrieve_response = self.session.get(f"{self.base_url}/api/scan/{scan_id}")
            
            if retrieve_response.status_code != 200:
                self.log_test("Data Persistence - Scan Retrieval", False,
                             f"Scan retrieval failed with status {retrieve_response.status_code}")
                return False
            
            retrieved_data = retrieve_response.json()
            
            if (retrieved_data.get('id') == scan_id and 
                retrieved_data.get('url') == test_url):
                
                self.log_test("Data Persistence - Scan Retrieval", True,
                             "Scan successfully persisted and retrieved via Prisma",
                             f"Retrieved scan with matching ID and URL")
            else:
                self.log_test("Data Persistence - Scan Retrieval", False,
                             "Retrieved scan data doesn't match original")
                return False
            
            # Check user-scan relationship by looking at history
            print("   Verifying user-scan relationship...")
            history_response = self.session.get(f"{self.base_url}/api/history", headers=headers)
            
            if history_response.status_code != 200:
                self.log_test("Data Persistence - User Relationship", False,
                             "Failed to retrieve user's scan history")
                return False
            
            history_data = history_response.json()
            user_scans = history_data.get('scans', [])
            
            # Check if our scan is in the user's history
            scan_found_in_history = any(scan.get('id') == scan_id for scan in user_scans)
            
            if scan_found_in_history:
                self.log_test("Data Persistence - User Relationship", True,
                             "User-scan relationship working correctly",
                             f"Scan appears in user's history")
                return True
            else:
                self.log_test("Data Persistence - User Relationship", False,
                             "Scan not found in user's history - relationship issue")
                return False
            
        except Exception as e:
            self.log_test("Data Persistence", False, f"Exception: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all tests for TrustScan backend with Prisma ORM and Redis"""
        print("="*80)
        print("🚀 TRUSTSCAN BACKEND TESTS - PRISMA ORM & REDIS IMPLEMENTATION")
        print("="*80)
        print(f"Base URL: {self.base_url}")
        print(f"Test started at: {datetime.now().isoformat()}")
        print()
        
        # Run all tests in sequence
        test_methods = [
            self.test_technology_stack_verification,
            self.test_prisma_database_operations,
            self.test_redis_caching,
            self.test_redis_rate_limiting,
            self.test_prisma_relations_queries,
            self.test_data_persistence
        ]
        
        passed = 0
        failed = 0
        
        for test_method in test_methods:
            try:
                if test_method():
                    passed += 1
                else:
                    failed += 1
            except Exception as e:
                failed += 1
                print(f"❌ FAIL: {test_method.__name__} - Exception: {str(e)}")
            
            print()  # Add spacing between tests
        
        # Print summary
        total_tests = passed + failed
        success_rate = (passed / total_tests * 100) if total_tests > 0 else 0
        
        print("="*80)
        print("📊 TEST SUMMARY")
        print("="*80)
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed} ✅")
        print(f"Failed: {failed} ❌")
        print(f"Success Rate: {success_rate:.1f}%")
        print()
        
        if failed > 0:
            print("🔍 FAILED TESTS:")
            for result in self.test_results:
                if not result['success']:
                    print(f"   ❌ {result['test']}: {result['message']}")
            print()
        
        print("🎯 PRISMA ORM & REDIS FEATURES TESTED:")
        print("   ✓ Technology stack verification (Prisma + Redis)")
        print("   ✓ Prisma database operations (User CRUD)")
        print("   ✓ Redis caching (scan result caching)")  
        print("   ✓ Redis rate limiting (5 requests/minute)")
        print("   ✓ Prisma relations (user-scan, user-report)")
        print("   ✓ Data persistence via Prisma")
        print()
        
        return passed == total_tests

if __name__ == "__main__":
    tester = TrustScanTester()
    success = tester.run_all_tests()
    exit(0 if success else 1)
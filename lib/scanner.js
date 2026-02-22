import https from 'https';
import { URL } from 'url';
import getRedisClient from './redis';

const CACHE_DURATION = 3600; // 1 hour in seconds

// Suspicious keywords for phishing detection
const SUSPICIOUS_KEYWORDS = [
  'verify', 'account', 'suspended', 'confirm', 'login', 'update',
  'secure', 'banking', 'paypal', 'ebay', 'amazon', 'prize', 'winner',
  'urgent', 'act-now', 'limited-time', 'free-money', 'click-here'
];

// Mock blacklist for demo
const MOCK_BLACKLIST = [
  'phishing-site.com',
  'scam-website.net',
  'fake-bank.com',
  'malicious-site.org'
];

export async function scanWebsite(url) {
  try {
    const redis = getRedisClient();
    const cacheKey = `scan:${url}`;

    // Check Redis cache first
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (redisError) {
      console.error('Redis cache read error:', redisError);
    }

    // Parse URL
    let parsedUrl;
    try {
      parsedUrl = new URL(url.startsWith('http') ? url : `https://${url}`);
    } catch (e) {
      throw new Error('Invalid URL format');
    }

    const domain = parsedUrl.hostname;

    // Perform all checks in parallel
    const [sslInfo, domainInfo, blacklistStatus, suspiciousContent, ipInfo] = await Promise.all([
      checkSSL(parsedUrl),
      checkDomainAge(domain),
      checkBlacklist(domain),
      checkSuspiciousContent(domain, url),
      checkIPInfo(domain)
    ]);

    // Calculate risk score
    const riskScore = calculateRiskScore({
      sslInfo,
      domainInfo,
      blacklistStatus,
      suspiciousContent,
      ipInfo
    });

    // Determine trust rating
    const trustRating = getTrustRating(riskScore);

    const result = {
      url,
      domain,
      riskScore,
      trustRating,
      sslInfo,
      domainInfo,
      blacklistStatus,
      suspiciousContent,
      ipInfo,
      scannedAt: new Date().toISOString()
    };

    // Cache the result in Redis
    try {
      await redis.setex(cacheKey, CACHE_DURATION, JSON.stringify(result));
    } catch (redisError) {
      console.error('Redis cache write error:', redisError);
    }

    return result;
  } catch (error) {
    console.error('Scan error:', error);
    throw error;
  }
}

async function checkSSL(parsedUrl) {
  return new Promise((resolve) => {
    if (parsedUrl.protocol !== 'https:') {
      resolve({
        hasSSL: false,
        valid: false,
        message: 'No SSL certificate (HTTP only)'
      });
      return;
    }

    const options = {
      host: parsedUrl.hostname,
      port: 443,
      method: 'HEAD',
      rejectUnauthorized: false
    };

    const req = https.request(options, (res) => {
      const cert = res.socket.getPeerCertificate();
      if (cert && Object.keys(cert).length > 0) {
        resolve({
          hasSSL: true,
          valid: true,
          issuer: cert.issuer?.O || 'Unknown',
          validFrom: cert.valid_from,
          validTo: cert.valid_to,
          message: 'Valid SSL certificate'
        });
      } else {
        resolve({
          hasSSL: false,
          valid: false,
          message: 'No valid SSL certificate found'
        });
      }
    });

    req.on('error', () => {
      resolve({
        hasSSL: false,
        valid: false,
        message: 'SSL certificate check failed'
      });
    });

    req.end();

    // Timeout after 5 seconds
    setTimeout(() => {
      req.destroy();
      resolve({
        hasSSL: false,
        valid: false,
        message: 'SSL check timeout'
      });
    }, 5000);
  });
}

async function checkDomainAge(domain) {
  // Mock implementation - in production, use WHOIS API
  const mockAges = {
    'google.com': { years: 25, months: 300 },
    'facebook.com': { years: 20, months: 240 },
    'amazon.com': { years: 28, months: 336 }
  };

  const age = mockAges[domain] || {
    years: Math.floor(Math.random() * 10),
    months: Math.floor(Math.random() * 120)
  };

  return {
    domain,
    ageYears: age.years,
    ageMonths: age.months,
    registrar: 'Mock Registrar',
    createdDate: new Date(Date.now() - age.months * 30 * 24 * 60 * 60 * 1000).toISOString(),
    message: age.months < 3 ? 'Very new domain - High risk' : 
             age.months < 12 ? 'Domain less than 1 year old' : 
             'Established domain'
  };
}

async function checkBlacklist(domain) {
  // Check against mock blacklist
  const isBlacklisted = MOCK_BLACKLIST.some(blocked => 
    domain.includes(blocked) || blocked.includes(domain)
  );

  // In production, integrate with:
  // - Google Safe Browsing API
  // - VirusTotal API
  // - PhishTank API

  return {
    isBlacklisted,
    sources: isBlacklisted ? ['Mock Blacklist Database'] : [],
    message: isBlacklisted ? 
      'Domain found in security blacklists!' : 
      'No blacklist matches found'
  };
}

async function checkSuspiciousContent(domain, url) {
  const suspiciousPatterns = [];

  // Check for suspicious keywords in URL
  const urlLower = url.toLowerCase();
  const domainLower = domain.toLowerCase();

  SUSPICIOUS_KEYWORDS.forEach(keyword => {
    if (urlLower.includes(keyword)) {
      suspiciousPatterns.push(keyword);
    }
  });

  // Check for suspicious TLDs
  const suspiciousTLDs = ['.tk', '.ml', '.ga', '.cf', '.gq', '.xyz'];
  const hasSuspiciousTLD = suspiciousTLDs.some(tld => domainLower.endsWith(tld));

  if (hasSuspiciousTLD) {
    suspiciousPatterns.push('suspicious-tld');
  }

  // Check for excessive subdomains
  const subdomainCount = domain.split('.').length - 2;
  if (subdomainCount > 2) {
    suspiciousPatterns.push('excessive-subdomains');
  }

  // Check for IP address as domain
  if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(domain)) {
    suspiciousPatterns.push('ip-address-domain');
  }

  return {
    hasSuspiciousContent: suspiciousPatterns.length > 0,
    patterns: suspiciousPatterns,
    count: suspiciousPatterns.length,
    message: suspiciousPatterns.length > 0 ?
      `Found ${suspiciousPatterns.length} suspicious pattern(s)` :
      'No suspicious patterns detected'
  };
}

async function checkIPInfo(domain) {
  // Mock implementation - in production, use IP Geolocation API
  const mockCountries = ['United States', 'United Kingdom', 'Germany', 'Netherlands', 'Singapore', 'Russia', 'China'];
  const country = mockCountries[Math.floor(Math.random() * mockCountries.length)];

  return {
    ip: '0.0.0.0',
    country,
    isp: 'Mock ISP',
    message: `Hosted in ${country}`
  };
}

function calculateRiskScore(checks) {
  let score = 0;

  // SSL check (25 points)
  if (!checks.sslInfo.hasSSL || !checks.sslInfo.valid) {
    score += 25;
  }

  // Domain age check (30 points)
  if (checks.domainInfo.ageMonths < 3) {
    score += 30;
  } else if (checks.domainInfo.ageMonths < 12) {
    score += 15;
  }

  // Blacklist check (40 points)
  if (checks.blacklistStatus.isBlacklisted) {
    score += 40;
  }

  // Suspicious content (15 points)
  if (checks.suspiciousContent.hasSuspiciousContent) {
    score += Math.min(checks.suspiciousContent.count * 5, 15);
  }

  // IP/Country check (10 points)
  const highRiskCountries = ['Russia', 'China', 'North Korea'];
  if (highRiskCountries.includes(checks.ipInfo.country)) {
    score += 10;
  }

  return Math.min(score, 100);
}

function getTrustRating(score) {
  if (score >= 70) return 'High Risk';
  if (score >= 40) return 'Moderate Risk';
  return 'Safe';
}

export async function clearCache() {
  try {
    const redis = getRedisClient();
    const keys = await redis.keys('scan:*');
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
}

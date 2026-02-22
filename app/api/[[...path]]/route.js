import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hashPassword, comparePassword, generateToken, getUserFromRequest } from '@/lib/auth';
import { scanWebsite } from '@/lib/scanner';
import { urlSchema, registerSchema, loginSchema, reportSchema } from '@/lib/validators';
import { checkRateLimit } from '@/lib/rateLimit';

// Helper to get client IP
function getClientIP(request) {
  return request.headers.get('x-forwarded-for')?.split(',')[0] || 
         request.headers.get('x-real-ip') || 
         'unknown';
}

// Helper for error responses
function errorResponse(message, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

// Helper for success responses
function successResponse(data, status = 200) {
  return NextResponse.json(data, { status });
}

// GET handler
export async function GET(request) {
  try {
    const { pathname } = new URL(request.url);
    
    // Root API endpoint
    if (pathname === '/api' || pathname === '/api/') {
      return successResponse({ 
        message: 'TrustScan API v1.0',
        status: 'operational',
        database: 'MongoDB with Prisma ORM',
        cache: 'Redis',
        endpoints: {
          scan: 'POST /api/scan',
          result: 'GET /api/scan/:id',
          auth: {
            register: 'POST /api/auth/register',
            login: 'POST /api/auth/login',
            me: 'GET /api/auth/me'
          },
          history: 'GET /api/history',
          report: 'POST /api/report',
          admin: {
            stats: 'GET /api/admin/stats',
            scans: 'GET /api/admin/scans'
          }
        }
      });
    }

    // Get scan result by ID
    if (pathname.match(/^\/api\/scan\/[^/]+$/)) {
      const id = pathname.split('/').pop();
      
      try {
        const scan = await prisma.scan.findUnique({
          where: { id }
        });
        
        if (!scan) {
          return errorResponse('Scan not found', 404);
        }
        
        return successResponse(scan);
      } catch (error) {
        return errorResponse('Scan not found', 404);
      }
    }

    // Get current user info
    if (pathname === '/api/auth/me') {
      const user = getUserFromRequest(request);
      if (!user) {
        return errorResponse('Unauthorized', 401);
      }
      
      const userData = await prisma.user.findUnique({
        where: { id: user.userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true
        }
      });
      
      if (!userData) {
        return errorResponse('User not found', 404);
      }
      
      return successResponse(userData);
    }

    // Get scan history
    if (pathname === '/api/history') {
      const user = getUserFromRequest(request);
      if (!user) {
        return errorResponse('Unauthorized', 401);
      }
      
      const scans = await prisma.scan.findMany({
        where: { userId: user.userId },
        orderBy: { createdAt: 'desc' },
        take: 50
      });
      
      return successResponse({ scans });
    }

    // Admin: Get statistics
    if (pathname === '/api/admin/stats') {
      const user = getUserFromRequest(request);
      if (!user || user.role !== 'admin') {
        return errorResponse('Unauthorized', 403);
      }
      
      const [totalScans, totalUsers, totalReports, recentScans, allScans] = await Promise.all([
        prisma.scan.count(),
        prisma.user.count(),
        prisma.report.count(),
        prisma.scan.findMany({
          orderBy: { createdAt: 'desc' },
          take: 10
        }),
        prisma.scan.findMany({
          select: { riskScore: true }
        })
      ]);

      // Calculate risk distribution
      const riskDistribution = {
        safe: allScans.filter(s => s.riskScore < 40).length,
        moderate: allScans.filter(s => s.riskScore >= 40 && s.riskScore < 70).length,
        high: allScans.filter(s => s.riskScore >= 70).length
      };
      
      return successResponse({
        totalScans,
        totalUsers,
        totalReports,
        riskDistribution,
        recentScans
      });
    }

    // Admin: Get all scans
    if (pathname === '/api/admin/scans') {
      const user = getUserFromRequest(request);
      if (!user || user.role !== 'admin') {
        return errorResponse('Unauthorized', 403);
      }
      
      const url = new URL(request.url);
      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = parseInt(url.searchParams.get('limit') || '20');
      const skip = (page - 1) * limit;
      
      const [scans, total] = await Promise.all([
        prisma.scan.findMany({
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit
        }),
        prisma.scan.count()
      ]);
      
      return successResponse({
        scans,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      });
    }

    return errorResponse('Endpoint not found', 404);
  } catch (error) {
    console.error('GET Error:', error);
    return errorResponse('Internal server error', 500);
  }
}

// POST handler
export async function POST(request) {
  try {
    const { pathname } = new URL(request.url);

    // User registration
    if (pathname === '/api/auth/register') {
      const body = await request.json();
      const validation = registerSchema.safeParse(body);
      
      if (!validation.success) {
        return errorResponse(validation.error.errors[0].message);
      }

      const { email, password, name } = validation.data;

      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });
      
      if (existingUser) {
        return errorResponse('Email already registered');
      }

      // Create user
      const hashedPassword = hashPassword(password);
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          role: 'user'
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true
        }
      });

      const token = generateToken({ userId: user.id, email: user.email, role: user.role });

      return successResponse({
        token,
        user
      }, 201);
    }

    // User login
    if (pathname === '/api/auth/login') {
      const body = await request.json();
      const validation = loginSchema.safeParse(body);
      
      if (!validation.success) {
        return errorResponse(validation.error.errors[0].message);
      }

      const { email, password } = validation.data;

      // Find user
      const user = await prisma.user.findUnique({
        where: { email }
      });
      
      if (!user) {
        return errorResponse('Invalid credentials', 401);
      }

      // Verify password
      const isValid = comparePassword(password, user.password);
      if (!isValid) {
        return errorResponse('Invalid credentials', 401);
      }

      const token = generateToken({ 
        userId: user.id, 
        email: user.email, 
        role: user.role 
      });

      return successResponse({
        token,
        user: { 
          id: user.id, 
          email: user.email, 
          name: user.name, 
          role: user.role 
        }
      });
    }

    // Scan website
    if (pathname === '/api/scan') {
      const clientIP = getClientIP(request);
      
      // Check rate limit
      const rateLimit = await checkRateLimit(clientIP);
      if (!rateLimit.allowed) {
        return errorResponse(
          `Rate limit exceeded. Try again at ${rateLimit.resetAt.toISOString()}`,
          429
        );
      }

      const body = await request.json();
      const validation = urlSchema.safeParse(body);
      
      if (!validation.success) {
        return errorResponse(validation.error.errors[0].message);
      }

      const { url } = validation.data;

      // Perform scan
      const scanResult = await scanWebsite(url);

      // Get user if authenticated
      const user = getUserFromRequest(request);
      
      // Save scan to database using Prisma
      const scan = await prisma.scan.create({
        data: {
          userId: user?.userId || null,
          url: scanResult.url,
          domain: scanResult.domain,
          riskScore: scanResult.riskScore,
          trustRating: scanResult.trustRating,
          details: {
            sslInfo: scanResult.sslInfo,
            domainInfo: scanResult.domainInfo,
            blacklistStatus: scanResult.blacklistStatus,
            suspiciousContent: scanResult.suspiciousContent,
            ipInfo: scanResult.ipInfo
          }
        }
      });

      return successResponse({
        scanId: scan.id,
        ...scanResult
      }, 201);
    }

    // Submit fraud report
    if (pathname === '/api/report') {
      const user = getUserFromRequest(request);
      if (!user) {
        return errorResponse('Unauthorized', 401);
      }

      const body = await request.json();
      const validation = reportSchema.safeParse(body);
      
      if (!validation.success) {
        return errorResponse(validation.error.errors[0].message);
      }

      const { url, reason, description } = validation.data;

      const report = await prisma.report.create({
        data: {
          userId: user.userId,
          url,
          reason,
          description,
          status: 'pending'
        }
      });

      return successResponse({
        reportId: report.id,
        message: 'Report submitted successfully'
      }, 201);
    }

    return errorResponse('Endpoint not found', 404);
  } catch (error) {
    console.error('POST Error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}

// PUT handler
export async function PUT(request) {
  return errorResponse('Method not allowed', 405);
}

// DELETE handler
export async function DELETE(request) {
  return errorResponse('Method not allowed', 405);
}

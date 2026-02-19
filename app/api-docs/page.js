import { Code2, Copy, Check } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

export default function ApiDocsPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <div className="mb-12">
        <div className="inline-flex items-center justify-center p-2 mb-6 rounded-full bg-primary/10">
          <Code2 className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-4xl font-bold mb-4">API Documentation</h1>
        <p className="text-lg text-muted-foreground">
          Integrate TrustScan's fraud detection capabilities into your applications
        </p>
      </div>

      {/* Base URL */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Base URL</CardTitle>
        </CardHeader>
        <CardContent>
          <code className="block p-4 bg-muted rounded-lg font-mono text-sm">
            {process.env.NEXT_PUBLIC_BASE_URL}/api
          </code>
        </CardContent>
      </Card>

      {/* Authentication */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Authentication</CardTitle>
          <CardDescription>
            Most endpoints require authentication using JWT tokens
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">Include the token in the Authorization header:</p>
          <code className="block p-4 bg-muted rounded-lg font-mono text-sm">
            Authorization: Bearer YOUR_JWT_TOKEN
          </code>
        </CardContent>
      </Card>

      {/* Endpoints */}
      <div className="space-y-8">
        {/* Register */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Register User</CardTitle>
              <Badge>POST</Badge>
            </div>
            <code className="text-sm">/api/auth/register</code>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Request Body</h4>
              <pre className="p-4 bg-muted rounded-lg overflow-x-auto">
                <code className="text-sm">{`{
  "email": "user@example.com",
  "password": "secure_password",
  "name": "John Doe"
}`}</code>
              </pre>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Response</h4>
              <pre className="p-4 bg-muted rounded-lg overflow-x-auto">
                <code className="text-sm">{`{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user"
  }
}`}</code>
              </pre>
            </div>
          </CardContent>
        </Card>

        {/* Login */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Login</CardTitle>
              <Badge>POST</Badge>
            </div>
            <code className="text-sm">/api/auth/login</code>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Request Body</h4>
              <pre className="p-4 bg-muted rounded-lg overflow-x-auto">
                <code className="text-sm">{`{
  "email": "user@example.com",
  "password": "secure_password"
}`}</code>
              </pre>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Response</h4>
              <pre className="p-4 bg-muted rounded-lg overflow-x-auto">
                <code className="text-sm">{`{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user"
  }
}`}</code>
              </pre>
            </div>
          </CardContent>
        </Card>

        {/* Scan Website */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Scan Website</CardTitle>
              <Badge>POST</Badge>
            </div>
            <code className="text-sm">/api/scan</code>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Request Body</h4>
              <pre className="p-4 bg-muted rounded-lg overflow-x-auto">
                <code className="text-sm">{`{
  "url": "https://example.com"
}`}</code>
              </pre>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Response</h4>
              <pre className="p-4 bg-muted rounded-lg overflow-x-auto">
                <code className="text-sm">{`{
  "scanId": "uuid",
  "url": "https://example.com",
  "domain": "example.com",
  "riskScore": 15,
  "trustRating": "Safe",
  "sslInfo": {
    "hasSSL": true,
    "valid": true,
    "issuer": "Let's Encrypt",
    "message": "Valid SSL certificate"
  },
  "domainInfo": {
    "domain": "example.com",
    "ageYears": 28,
    "ageMonths": 336,
    "registrar": "Example Registrar",
    "message": "Established domain"
  },
  "blacklistStatus": {
    "isBlacklisted": false,
    "sources": [],
    "message": "No blacklist matches found"
  },
  "suspiciousContent": {
    "hasSuspiciousContent": false,
    "patterns": [],
    "count": 0,
    "message": "No suspicious patterns detected"
  },
  "ipInfo": {
    "ip": "93.184.216.34",
    "country": "United States",
    "isp": "Example ISP"
  }
}`}</code>
              </pre>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Rate Limiting</h4>
              <p className="text-sm text-muted-foreground">
                5 requests per minute per IP address
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Get Scan Result */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Get Scan Result</CardTitle>
              <Badge variant="secondary">GET</Badge>
            </div>
            <code className="text-sm">/api/scan/:id</code>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Example Request</h4>
              <code className="block p-4 bg-muted rounded-lg font-mono text-sm">
                GET /api/scan/abc123-def456
              </code>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Response</h4>
              <p className="text-sm text-muted-foreground mb-2">
                Returns the same structure as the scan endpoint
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Get Scan History */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Get Scan History</CardTitle>
              <Badge variant="secondary">GET</Badge>
            </div>
            <code className="text-sm">/api/history</code>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Badge variant="outline">Authentication Required</Badge>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Response</h4>
              <pre className="p-4 bg-muted rounded-lg overflow-x-auto">
                <code className="text-sm">{`{
  "scans": [
    {
      "_id": "uuid",
      "url": "https://example.com",
      "domain": "example.com",
      "riskScore": 15,
      "trustRating": "Safe",
      "createdAt": "2025-01-15T10:30:00.000Z"
    }
  ]
}`}</code>
              </pre>
            </div>
          </CardContent>
        </Card>

        {/* Submit Report */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Submit Fraud Report</CardTitle>
              <Badge>POST</Badge>
            </div>
            <code className="text-sm">/api/report</code>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Badge variant="outline">Authentication Required</Badge>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Request Body</h4>
              <pre className="p-4 bg-muted rounded-lg overflow-x-auto">
                <code className="text-sm">{`{
  "url": "https://suspicious-site.com",
  "reason": "phishing",
  "description": "This site is impersonating a bank"
}`}</code>
              </pre>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Response</h4>
              <pre className="p-4 bg-muted rounded-lg overflow-x-auto">
                <code className="text-sm">{`{
  "reportId": "uuid",
  "message": "Report submitted successfully"
}`}</code>
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Error Responses */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Error Responses</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Error Format</h4>
            <pre className="p-4 bg-muted rounded-lg overflow-x-auto">
              <code className="text-sm">{`{
  "error": "Error message description"
}`}</code>
            </pre>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Common Error Codes</h4>
            <ul className="space-y-2 text-sm">
              <li><Badge variant="destructive">400</Badge> Bad Request - Invalid input</li>
              <li><Badge variant="destructive">401</Badge> Unauthorized - Missing or invalid token</li>
              <li><Badge variant="destructive">403</Badge> Forbidden - Insufficient permissions</li>
              <li><Badge variant="destructive">404</Badge> Not Found - Resource doesn't exist</li>
              <li><Badge variant="destructive">429</Badge> Too Many Requests - Rate limit exceeded</li>
              <li><Badge variant="destructive">500</Badge> Internal Server Error</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

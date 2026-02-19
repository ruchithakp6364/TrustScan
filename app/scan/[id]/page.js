'use client'

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, AlertCircle, CheckCircle, Clock, Globe, Lock, MapPin, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import RiskMeter from '@/components/RiskMeter';
import axios from 'axios';
import Link from 'next/link';

export default function ScanResultPage() {
  const params = useParams();
  const router = useRouter();
  const [scan, setScan] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchScan(params.id);
    }
  }, [params.id]);

  const fetchScan = async (id) => {
    try {
      const response = await axios.get(`/api/scan/${id}`);
      setScan(response.data);
    } catch (error) {
      console.error('Failed to fetch scan:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-20 flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="text-center">
          <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading scan results...</p>
        </div>
      </div>
    );
  }

  if (!scan) {
    return (
      <div className="container mx-auto px-4 py-20 flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Scan Not Found</h2>
          <p className="text-muted-foreground mb-4">The scan you're looking for doesn't exist.</p>
          <Button asChild>
            <Link href="/">Go Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  const { details } = scan;

  return (
    <div className="container mx-auto px-4 py-12">
      <Button variant="ghost" className="mb-6" onClick={() => router.back()}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <h1 className="text-3xl md:text-4xl font-bold mb-4">Security Scan Report</h1>
        <p className="text-lg text-muted-foreground mb-2">{scan.url}</p>
        <Badge variant="secondary" className="text-sm">
          Scanned: {new Date(scan.createdAt).toLocaleString()}
        </Badge>
      </motion.div>

      {/* Risk Score */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="mb-12"
      >
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-8 pb-8">
            <RiskMeter score={scan.riskScore} />
          </CardContent>
        </Card>
      </motion.div>

      {/* Detailed Results */}
      <div className="grid md:grid-cols-2 gap-6 max-w-6xl mx-auto">
        {/* SSL Certificate */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Lock className="mr-2 h-5 w-5" />
                SSL Certificate
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start justify-between">
                <span className="text-sm font-medium">Status:</span>
                <div className="flex items-center">
                  {details.sslInfo.hasSSL ? (
                    <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-500 mr-1" />
                  )}
                  <span className="text-sm">{details.sslInfo.message}</span>
                </div>
              </div>
              {details.sslInfo.issuer && (
                <div className="flex items-start justify-between">
                  <span className="text-sm font-medium">Issuer:</span>
                  <span className="text-sm text-right">{details.sslInfo.issuer}</span>
                </div>
              )}
              {details.sslInfo.validTo && (
                <div className="flex items-start justify-between">
                  <span className="text-sm font-medium">Valid Until:</span>
                  <span className="text-sm text-right">
                    {new Date(details.sslInfo.validTo).toLocaleDateString()}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Domain Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Globe className="mr-2 h-5 w-5" />
                Domain Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start justify-between">
                <span className="text-sm font-medium">Domain:</span>
                <span className="text-sm text-right">{details.domainInfo.domain}</span>
              </div>
              <div className="flex items-start justify-between">
                <span className="text-sm font-medium">Age:</span>
                <span className="text-sm text-right">
                  {details.domainInfo.ageYears} years ({details.domainInfo.ageMonths} months)
                </span>
              </div>
              <div className="flex items-start justify-between">
                <span className="text-sm font-medium">Registrar:</span>
                <span className="text-sm text-right">{details.domainInfo.registrar}</span>
              </div>
              <div className="flex items-start justify-between">
                <span className="text-sm font-medium">Status:</span>
                <span className="text-sm text-right">{details.domainInfo.message}</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Blacklist Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="mr-2 h-5 w-5" />
                Blacklist Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start justify-between">
                <span className="text-sm font-medium">Blacklisted:</span>
                <div className="flex items-center">
                  {details.blacklistStatus.isBlacklisted ? (
                    <AlertCircle className="h-4 w-4 text-red-500 mr-1" />
                  ) : (
                    <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                  )}
                  <span className="text-sm">
                    {details.blacklistStatus.isBlacklisted ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
              <div className="flex items-start justify-between">
                <span className="text-sm font-medium">Sources Checked:</span>
                <span className="text-sm text-right">
                  {details.blacklistStatus.sources.length || 'Multiple databases'}
                </span>
              </div>
              <Separator />
              <p className="text-sm text-muted-foreground">{details.blacklistStatus.message}</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Suspicious Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertCircle className="mr-2 h-5 w-5" />
                Suspicious Patterns
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start justify-between">
                <span className="text-sm font-medium">Patterns Found:</span>
                <span className="text-sm">{details.suspiciousContent.count}</span>
              </div>
              {details.suspiciousContent.patterns.length > 0 && (
                <div>
                  <span className="text-sm font-medium">Detected:</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {details.suspiciousContent.patterns.map((pattern, idx) => (
                      <Badge key={idx} variant="destructive">
                        {pattern}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              <Separator />
              <p className="text-sm text-muted-foreground">{details.suspiciousContent.message}</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* IP & Location */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="md:col-span-2"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="mr-2 h-5 w-5" />
                Hosting Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <span className="text-sm font-medium">Country:</span>
                  <p className="text-sm text-muted-foreground">{details.ipInfo.country}</p>
                </div>
                <div>
                  <span className="text-sm font-medium">ISP:</span>
                  <p className="text-sm text-muted-foreground">{details.ipInfo.isp}</p>
                </div>
                <div>
                  <span className="text-sm font-medium">IP Address:</span>
                  <p className="text-sm text-muted-foreground">{details.ipInfo.ip}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="flex justify-center gap-4 mt-12"
      >
        <Button asChild>
          <Link href="/">Scan Another Website</Link>
        </Button>
        <Button variant="outline" onClick={() => window.print()}>
          Print Report
        </Button>
      </motion.div>
    </div>
  );
}

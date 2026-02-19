'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import axios from 'axios';

export default function ScanForm() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleScan = async (e) => {
    e.preventDefault();
    
    if (!url.trim()) {
      toast.error('Please enter a URL');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post('/api/scan', { url: url.trim() });
      const { scanId } = response.data;
      
      toast.success('Scan completed!');
      router.push(`/scan/${scanId}`);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to scan website');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleScan} className="w-full max-w-2xl mx-auto">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Enter website URL (e.g., example.com or https://example.com)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="pl-10 h-12 text-base"
            disabled={loading}
          />
        </div>
        <Button 
          type="submit" 
          size="lg" 
          className="h-12 px-8"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Scanning...
            </>
          ) : (
            'Scan Now'
          )}
        </Button>
      </div>
      <p className="text-sm text-muted-foreground mt-3 text-center">
        Analyze any website for fraud, phishing, and security risks
      </p>
    </form>
  );
}

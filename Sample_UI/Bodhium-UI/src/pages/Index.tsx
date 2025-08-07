import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowRight, CheckCircle, RotateCcw, Home } from 'lucide-react';

// Modular Components
const UrlInputField = ({ url, setUrl, onSubmit, disabled }: {
  url: string;
  setUrl: (url: string) => void;
  onSubmit: () => void;
  disabled: boolean;
}) => (
  <div className="w-full max-w-2xl">
    <Input
      type="url"
      placeholder="Paste your product or brand page URL here..."
      value={url}
      onChange={(e) => setUrl(e.target.value)}
      onKeyPress={(e) => e.key === 'Enter' && onSubmit()}
      disabled={disabled}
      className="h-14 text-lg px-6 rounded-md border border-border focus:border-primary bg-background text-foreground"
    />
  </div>
);

const AnalyzeButton = ({ onClick, disabled }: {
  onClick: () => void;
  disabled: boolean;
}) => (
  <Button
    onClick={onClick}
    disabled={disabled}
    size="lg"
    className="h-14 px-8 text-lg rounded-md font-semibold bg-primary hover:bg-primary/90 transition-all duration-200 shadow-sm"
  >
    {disabled ? (
      <>
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Processing...
      </>
    ) : (
      <>
        Analyze Now
        <ArrowRight className="ml-2 h-5 w-5" />
      </>
    )}
  </Button>
);

const StatusBanner = ({ status, message }: {
  status: 'idle' | 'processing' | 'success' | 'error';
  message: string;
}) => {
  if (status === 'idle') return null;
  
  const statusStyles = {
    processing: 'bg-blue-50 border-blue-200 text-blue-800',
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
  };

  return (
    <div className={`mt-6 p-4 rounded-md border ${statusStyles[status]} text-center font-medium`}>
      {status === 'processing' && <Loader2 className="inline mr-2 h-4 w-4 animate-spin" />}
      {status === 'success' && <CheckCircle className="inline mr-2 h-4 w-4" />}
      {message}
    </div>
  );
};

const PostSubmitOptions = ({ onViewProducts, onPasteAnother, onStayHome }: {
  onViewProducts: () => void;
  onPasteAnother: () => void;
  onStayHome: () => void;
}) => (
  <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
    <Button
      onClick={onViewProducts}
      variant="default"
      size="lg"
      className="px-8 rounded-md font-semibold"
    >
      <CheckCircle className="mr-2 h-5 w-5" />
      View Scraped Product List
    </Button>
    <Button
      onClick={onPasteAnother}
      variant="outline"
      size="lg"
      className="px-8 rounded-md font-semibold border-border"
    >
      <RotateCcw className="mr-2 h-5 w-5" />
      Paste Another URL
    </Button>
    <Button
      onClick={onStayHome}
      variant="ghost"
      size="lg"
      className="px-8 rounded-md font-semibold"
    >
      <Home className="mr-2 h-5 w-5" />
      Stay on Homepage
    </Button>
  </div>
);

const Index = () => {
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const validateUrl = (url: string): boolean => {
    try {
      new URL(url);
      return url.startsWith('http://') || url.startsWith('https://');
    } catch {
      return false;
    }
  };

  const handleSubmit = async () => {
    if (!url.trim()) {
      setStatus('error');
      setMessage('Please enter a URL');
      return;
    }

    if (!validateUrl(url)) {
      setStatus('error');
      setMessage('Please enter a valid URL starting with http:// or https://');
      return;
    }

    setStatus('processing');
    setMessage('Processing your product...');

    try {
      // Simulate API call to /api/scrape
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (response.ok) {
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        setStatus('success');
        setMessage('Scraping successful! Choose what to do next');
      } else {
        throw new Error('Failed to scrape URL');
      }
    } catch (error) {
      console.error('Error scraping URL:', error);
      setStatus('error');
      setMessage('Failed to process the URL. Please check and try again');
    }
  };

  const handleViewProducts = () => {
    navigate('/scraped-products');
  };

  const handlePasteAnother = () => {
    setUrl('');
    setStatus('idle');
    setMessage('');
  };

  const handleStayHome = () => {
    setStatus('idle');
    setMessage('');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h1 className="text-6xl md:text-7xl font-bold mb-6 text-primary">
            BODHIUM
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 font-light">
            Query. Understand. Optimize.
          </p>
        </div>

        {/* Main Input Card */}
        <div className="max-w-4xl mx-auto">
          <Card className="bg-card border border-border shadow-sm">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-semibold text-foreground mb-2">
                  Enter Product URL
                </h2>
                <p className="text-muted-foreground">
                  Paste any product page URL to begin AI-powered analysis
                </p>
              </div>

              <div className="flex flex-col md:flex-row gap-4 items-end">
                <UrlInputField
                  url={url}
                  setUrl={setUrl}
                  onSubmit={handleSubmit}
                  disabled={status === 'processing'}
                />
                
                <AnalyzeButton
                  onClick={handleSubmit}
                  disabled={status === 'processing'}
                />
              </div>

              <StatusBanner status={status} message={message} />

              {status === 'success' && (
                <PostSubmitOptions
                  onViewProducts={handleViewProducts}
                  onPasteAnother={handlePasteAnother}
                  onStayHome={handleStayHome}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
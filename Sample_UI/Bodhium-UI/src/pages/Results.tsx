import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { 
  Copy, 
  Download, 
  RefreshCw, 
  Brain, 
  MessageSquare,
  Search,
  Zap,
  CheckCircle,
  Clock,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  FileJson,
  FileText,
  Table
} from 'lucide-react';

// Interfaces
interface QueryResponse {
  id: string;
  queryText: string;
  responses: {
    [modelId: string]: {
      status: 'loading' | 'success' | 'error';
      content?: string;
      error?: string;
      timestamp?: string;
    };
  };
}

interface Brand {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  brandId: string;
}

// Modular Components
const QueryResponseCard = ({ 
  queryResponse, 
  availableModels,
  onCopy,
  onDownload 
}: {
  queryResponse: QueryResponse;
  availableModels: { id: string; name: string; icon: React.ReactNode }[];
  onCopy: (content: string) => void;
  onDownload: (content: string, format: string, filename: string) => void;
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <Card className="bg-card/50 border-primary/20 overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-primary flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            {queryResponse.queryText}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-muted-foreground hover:text-primary"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="space-y-4">
          {availableModels.map((model) => (
            <LLMResultBlock
              key={model.id}
              modelId={model.id}
              modelName={model.name}
              modelIcon={model.icon}
              response={queryResponse.responses[model.id]}
              onCopy={onCopy}
              onDownload={onDownload}
              queryText={queryResponse.queryText}
            />
          ))}
        </CardContent>
      )}
    </Card>
  );
};

const LLMResultBlock = ({ 
  modelId,
  modelName,
  modelIcon,
  response,
  onCopy,
  onDownload,
  queryText 
}: {
  modelId: string;
  modelName: string;
  modelIcon: React.ReactNode;
  response?: {
    status: 'loading' | 'success' | 'error';
    content?: string;
    error?: string;
    timestamp?: string;
  };
  onCopy: (content: string) => void;
  onDownload: (content: string, format: string, filename: string) => void;
  queryText: string;
}) => {
  if (!response) return null;

  const getStatusIcon = () => {
    switch (response.status) {
      case 'loading':
        return <Clock className="h-4 w-4 animate-pulse text-blue-500" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusText = () => {
    switch (response.status) {
      case 'loading':
        return 'Generating response...';
      case 'success':
        return `Generated ${response.timestamp ? new Date(response.timestamp).toLocaleTimeString() : 'now'}`;
      case 'error':
        return response.error || 'Failed to generate response';
      default:
        return '';
    }
  };

  return (
    <div className="border border-primary/10 rounded-lg p-4 bg-background/20">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {modelIcon}
          <span className="font-medium text-foreground">{modelName}</span>
          {getStatusIcon()}
        </div>
        
        {response.status === 'success' && response.content && (
          <DownloadButton
            content={response.content}
            onCopy={onCopy}
            onDownload={onDownload}
            filename={`${modelName}_${queryText.slice(0, 30)}`}
          />
        )}
      </div>

      <div className="text-sm text-muted-foreground mb-3">
        {getStatusText()}
      </div>

      {response.status === 'loading' && (
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent"></div>
          <span className="text-sm text-muted-foreground">Processing with {modelName}...</span>
        </div>
      )}

      {response.status === 'success' && response.content && (
        <div className="bg-background/40 rounded-md p-4 border border-primary/10">
          <pre className="whitespace-pre-wrap text-sm text-foreground leading-relaxed">
            {response.content}
          </pre>
        </div>
      )}

      {response.status === 'error' && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-md p-4">
          <p className="text-sm text-red-400">
            {response.error || 'This model could not return a result.'}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-2 border-red-500/30 text-red-400 hover:bg-red-500/10"
          >
            Retry
          </Button>
        </div>
      )}
    </div>
  );
};

const DownloadButton = ({ 
  content, 
  onCopy, 
  onDownload, 
  filename 
}: {
  content: string;
  onCopy: (content: string) => void;
  onDownload: (content: string, format: string, filename: string) => void;
  filename: string;
}) => (
  <div className="flex items-center gap-2">
    <Button
      variant="outline"
      size="sm"
      onClick={() => onCopy(content)}
      className="border-primary/30 text-primary hover:bg-primary/10"
    >
      <Copy className="h-4 w-4" />
    </Button>
    
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="border-primary/30 text-primary hover:bg-primary/10"
        >
          <Download className="h-4 w-4 mr-1" />
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-card border-primary/20">
        <DropdownMenuItem onClick={() => onDownload(content, 'json', filename)}>
          <FileJson className="h-4 w-4 mr-2" />
          JSON
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onDownload(content, 'markdown', filename)}>
          <FileText className="h-4 w-4 mr-2" />
          Markdown
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onDownload(content, 'csv', filename)}>
          <Table className="h-4 w-4 mr-2" />
          CSV
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
);

const ResponseStatusTracker = ({ 
  totalResponses, 
  completedResponses,
  onRefresh,
  onDownloadAll,
  isRefreshing 
}: {
  totalResponses: number;
  completedResponses: number;
  onRefresh: () => void;
  onDownloadAll: () => void;
  isRefreshing: boolean;
}) => {
  const progress = totalResponses > 0 ? (completedResponses / totalResponses) * 100 : 0;

  return (
    <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/30">
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{completedResponses}</div>
              <div className="text-sm text-muted-foreground">of {totalResponses} responses</div>
            </div>
            
            <div className="w-32">
              <Progress value={progress} className="h-2 bg-background/30" />
              <div className="text-xs text-muted-foreground mt-1 text-center">
                {Math.round(progress)}% complete
              </div>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Button
              onClick={onRefresh}
              variant="outline"
              disabled={isRefreshing}
              className="border-primary/30 hover:bg-primary/5"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  disabled={completedResponses === 0}
                  className="bg-primary hover:bg-primary-glow"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download All
                  <ChevronDown className="h-3 w-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-card border-primary/20">
                <DropdownMenuItem onClick={() => onDownloadAll()}>
                  <FileJson className="h-4 w-4 mr-2" />
                  All as JSON
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDownloadAll()}>
                  <Table className="h-4 w-4 mr-2" />
                  All as CSV
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const Results = () => {
  const { toast } = useToast();
  
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [queryResponses, setQueryResponses] = useState<QueryResponse[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Mock data
  const brands: Brand[] = [
    { id: '1', name: 'TechBrand' },
    { id: '2', name: 'EcoWear' },
    { id: '3', name: 'SecureTech' },
  ];

  const products: Product[] = [
    { id: '1', name: 'Premium Wireless Headphones', brandId: '1' },
    { id: '2', name: 'Organic Cotton T-Shirt', brandId: '2' },
    { id: '3', name: 'Smart Security Camera', brandId: '3' },
  ];

  const availableModels = [
    { id: 'chatgpt', name: 'ChatGPT', icon: <MessageSquare className="h-5 w-5 text-green-500" /> },
    { id: 'perplexity', name: 'Perplexity', icon: <Search className="h-5 w-5 text-blue-500" /> },
    { id: 'ai-mode', name: 'AI Mode', icon: <Brain className="h-5 w-5 text-purple-500" /> },
    { id: 'ai-overview', name: 'AI Overview', icon: <Zap className="h-5 w-5 text-yellow-500" /> },
  ];

  useEffect(() => {
    if (selectedProduct) {
      fetchResults(selectedProduct);
    }
  }, [selectedProduct]);

  const fetchResults = async (productId: string) => {
    setIsRefreshing(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockResponses: QueryResponse[] = [
        {
          id: '1',
          queryText: 'What are the main features of this product?',
          responses: {
            'chatgpt': {
              status: 'success',
              content: 'This product features advanced wireless technology, premium audio quality, and long-lasting battery life. The ergonomic design ensures comfort during extended use, while the noise-cancellation technology provides an immersive listening experience.',
              timestamp: new Date().toISOString(),
            },
            'perplexity': {
              status: 'loading',
            },
            'ai-mode': {
              status: 'success',
              content: 'Key features include: 1) Bluetooth 5.0 connectivity for stable wireless connection, 2) Active noise cancellation with multiple modes, 3) 30-hour battery life with fast charging, 4) Premium materials and build quality, 5) Touch controls and voice assistant integration.',
              timestamp: new Date().toISOString(),
            },
            'ai-overview': {
              status: 'error',
              error: 'API rate limit exceeded. Please try again later.',
            },
          },
        },
        {
          id: '2',
          queryText: 'Who is the target audience for this product?',
          responses: {
            'chatgpt': {
              status: 'success',
              content: 'The target audience includes music enthusiasts, professionals who work remotely, commuters, and anyone who values high-quality audio experiences. The product appeals to tech-savvy consumers aged 25-45 with disposable income.',
              timestamp: new Date().toISOString(),
            },
            'perplexity': {
              status: 'loading',
            },
            'ai-mode': {
              status: 'loading',
            },
            'ai-overview': {
              status: 'loading',
            },
          },
        },
      ];
      
      setQueryResponses(mockResponses);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch results. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: "Copied!",
      description: "Content copied to clipboard.",
    });
  };

  const handleDownload = (content: string, format: string, filename: string) => {
    let fileContent = content;
    let mimeType = 'text/plain';
    let extension = 'txt';

    switch (format) {
      case 'json':
        fileContent = JSON.stringify({ content, timestamp: new Date().toISOString() }, null, 2);
        mimeType = 'application/json';
        extension = 'json';
        break;
      case 'markdown':
        fileContent = `# ${filename}\n\n${content}`;
        mimeType = 'text/markdown';
        extension = 'md';
        break;
      case 'csv':
        fileContent = `"Content"\n"${content.replace(/"/g, '""')}"`;
        mimeType = 'text/csv';
        extension = 'csv';
        break;
    }

    const blob = new Blob([fileContent], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Downloaded!",
      description: `File saved as ${filename}.${extension}`,
    });
  };

  const handleDownloadAll = () => {
    // Implementation for downloading all results
    toast({
      title: "Download Started",
      description: "Preparing all results for download...",
    });
  };

  const filteredProducts = products.filter(p => p.brandId === selectedBrand);
  
  const totalResponses = queryResponses.reduce((acc, qr) => 
    acc + Object.keys(qr.responses).length, 0
  );
  
  const completedResponses = queryResponses.reduce((acc, qr) => 
    acc + Object.values(qr.responses).filter(r => r.status === 'success').length, 0
  );

  return (
    <div className="min-h-screen bg-gradient-to-br" style={{ backgroundImage: 'var(--gradient-hero)' }}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">
            AI Results Dashboard
          </h1>
          <p className="text-lg text-muted-foreground">
            View, analyze, and export AI-generated insights in real-time
          </p>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Card className="bg-card/50 border-primary/20">
            <CardContent className="p-6">
              <label className="text-sm font-medium text-foreground mb-2 block">
                Select Brand
              </label>
              <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                <SelectTrigger className="bg-background/30 border-primary/20">
                  <SelectValue placeholder="Choose a brand..." />
                </SelectTrigger>
                <SelectContent className="bg-card border-primary/20">
                  {brands.map((brand) => (
                    <SelectItem key={brand.id} value={brand.id}>
                      {brand.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-primary/20">
            <CardContent className="p-6">
              <label className="text-sm font-medium text-foreground mb-2 block">
                Select Product
              </label>
              <Select 
                value={selectedProduct} 
                onValueChange={setSelectedProduct}
                disabled={!selectedBrand}
              >
                <SelectTrigger className="bg-background/30 border-primary/20">
                  <SelectValue placeholder="Choose a product..." />
                </SelectTrigger>
                <SelectContent className="bg-card border-primary/20">
                  {filteredProducts.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </div>

        {selectedProduct && (
          <>
            {/* Status Tracker */}
            <div className="mb-8">
              <ResponseStatusTracker
                totalResponses={totalResponses}
                completedResponses={completedResponses}
                onRefresh={() => fetchResults(selectedProduct)}
                onDownloadAll={handleDownloadAll}
                isRefreshing={isRefreshing}
              />
            </div>

            {/* Query Results */}
            <div className="space-y-6">
              {queryResponses.map((queryResponse) => (
                <QueryResponseCard
                  key={queryResponse.id}
                  queryResponse={queryResponse}
                  availableModels={availableModels}
                  onCopy={handleCopy}
                  onDownload={handleDownload}
                />
              ))}
            </div>
          </>
        )}

        {!selectedProduct && selectedBrand && (
          <Card className="text-center py-12 bg-card/50 border-primary/20">
            <CardContent>
              <Brain className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-foreground">Select a Product</h3>
              <p className="text-muted-foreground">
                Choose a product to view AI-generated results and insights.
              </p>
            </CardContent>
          </Card>
        )}

        {!selectedBrand && (
          <Card className="text-center py-12 bg-card/50 border-primary/20">
            <CardContent>
              <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-foreground">Get Started</h3>
              <p className="text-muted-foreground">
                Select a brand and product to view your AI analysis results.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Results;
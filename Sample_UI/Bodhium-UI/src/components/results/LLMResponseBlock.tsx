import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { LoadingIndicator } from './LoadingIndicator';
import { 
  Copy, 
  Download, 
  MessageSquare, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw,
  Brain,
  Target,
  Zap,
  Eye
} from 'lucide-react';

interface LLMResponseBlockProps {
  modelId: string;
  modelName: string;
  queryId: string;
  response?: string;
  isLoading: boolean;
  hasError: boolean;
  onRetry?: () => void;
}

const getModelIcon = (modelId: string) => {
  switch (modelId) {
    case 'google-ai':
      return <Brain className="h-4 w-4" />;
    case 'google-overview':
      return <Target className="h-4 w-4" />;
    case 'perplexity':
      return <Zap className="h-4 w-4" />;
    case 'chatgpt':
      return <MessageSquare className="h-4 w-4" />;
    default:
      return <Eye className="h-4 w-4" />;
  }
};

const getModelColor = (modelId: string) => {
  switch (modelId) {
    case 'google-ai':
      return 'text-primary border-primary/20';
    case 'google-overview':
      return 'text-accent border-accent/20';
    case 'perplexity':
      return 'text-warning border-warning/20';
    case 'chatgpt':
      return 'text-success border-success/20';
    default:
      return 'text-muted-foreground border-muted/20';
  }
};

export const LLMResponseBlock = ({
  modelId,
  modelName,
  queryId,
  response,
  isLoading,
  hasError,
  onRetry
}: LLMResponseBlockProps) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!response) return;
    
    try {
      await navigator.clipboard.writeText(response);
      setCopied(true);
      toast({
        title: "Copied to clipboard",
        description: `${modelName} response copied successfully.`,
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Unable to copy to clipboard.",
        variant: "destructive"
      });
    }
  };

  const handleDownload = () => {
    if (!response) return;

    const blob = new Blob([response], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${modelId}-${queryId}-response.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Download started",
      description: `${modelName} response downloaded successfully.`,
    });
  };

  const handleFeedback = () => {
    toast({
      title: "Feedback noted",
      description: "Thank you for your feedback on this response.",
    });
  };

  return (
    <Card className={`ai-border transition-all duration-300 ${getModelColor(modelId)}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getModelIcon(modelId)}
            <span className="text-sm font-medium">{modelName}</span>
          </div>
          <div className="flex items-center gap-2">
            {isLoading && <LoadingIndicator modelName={modelName} variant="minimal" />}
            {hasError && (
              <Badge variant="destructive" className="text-xs">
                <AlertCircle className="h-3 w-3 mr-1" />
                Error
              </Badge>
            )}
            {response && !isLoading && !hasError && (
              <Badge variant="default" className="text-xs bg-success/10 text-success border-success/20">
                <CheckCircle className="h-3 w-3 mr-1" />
                Complete
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {isLoading && (
          <LoadingIndicator modelName={modelName} />
        )}
        
        {hasError && (
          <div className="text-center py-6 space-y-3">
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-destructive">
                This model could not return a result
              </p>
              <p className="text-xs text-muted-foreground">
                The request failed or timed out
              </p>
            </div>
            {onRetry && (
              <Button 
                onClick={onRetry} 
                variant="outline" 
                size="sm"
                className="mt-3"
              >
                <RefreshCw className="h-3 w-3 mr-2" />
                Retry
              </Button>
            )}
          </div>
        )}
        
        {response && !isLoading && !hasError && (
          <>
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <div className="bg-muted/30 rounded-lg p-4 border border-accent/10">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {response}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 pt-2 border-t border-accent/10">
              <Button
                onClick={handleCopy}
                variant="ghost"
                size="sm"
                className="flex-1"
                disabled={copied}
              >
                {copied ? (
                  <CheckCircle className="h-4 w-4 mr-2 text-success" />
                ) : (
                  <Copy className="h-4 w-4 mr-2" />
                )}
                {copied ? 'Copied!' : 'Copy'}
              </Button>
              
              <Button
                onClick={handleDownload}
                variant="ghost"
                size="sm"
                className="flex-1"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              
              <Button
                onClick={handleFeedback}
                variant="ghost"
                size="sm"
                className="px-3"
              >
                <MessageSquare className="h-4 w-4" />
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
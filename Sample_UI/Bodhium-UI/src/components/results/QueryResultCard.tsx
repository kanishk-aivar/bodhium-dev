import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LLMResponseBlock } from './LLMResponseBlock';
import { 
  ChevronDown, 
  ChevronUp, 
  Brain, 
  Target,
  CheckCircle,
  Clock,
  AlertTriangle
} from 'lucide-react';

interface QueryResult {
  modelId: string;
  modelName: string;
  response?: string;
  isLoading: boolean;
  hasError: boolean;
}

interface QueryResultCardProps {
  queryId: string;
  queryText: string;
  queryType: 'product' | 'market';
  results: QueryResult[];
  onRetry?: (queryId: string, modelId: string) => void;
}

export const QueryResultCard = ({
  queryId,
  queryText,
  queryType,
  results,
  onRetry
}: QueryResultCardProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  
  const completedCount = results.filter(r => r.response && !r.isLoading && !r.hasError).length;
  const loadingCount = results.filter(r => r.isLoading).length;
  const errorCount = results.filter(r => r.hasError).length;
  const totalCount = results.length;

  const getStatusColor = () => {
    if (errorCount > 0 && loadingCount === 0) return 'text-destructive';
    if (completedCount === totalCount) return 'text-success';
    if (loadingCount > 0) return 'text-primary';
    return 'text-muted-foreground';
  };

  const getStatusIcon = () => {
    if (errorCount > 0 && loadingCount === 0) return <AlertTriangle className="h-4 w-4" />;
    if (completedCount === totalCount) return <CheckCircle className="h-4 w-4" />;
    if (loadingCount > 0) return <Clock className="h-4 w-4" />;
    return null;
  };

  return (
    <Card className="ai-border shadow-card animate-fade-in">
      <CardHeader className="cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="p-2 rounded-lg bg-gradient-subtle shrink-0">
              {queryType === 'product' ? (
                <Brain className="h-4 w-4 text-primary" />
              ) : (
                <Target className="h-4 w-4 text-accent" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium leading-relaxed truncate">
                {queryText}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Badge 
                  variant={queryType === 'product' ? 'default' : 'secondary'} 
                  className="text-xs"
                >
                  {queryType === 'product' ? 'Product' : 'Market'}
                </Badge>
                <div className={`flex items-center gap-1 text-xs ${getStatusColor()}`}>
                  {getStatusIcon()}
                  <span>
                    {completedCount}/{totalCount} complete
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <Button variant="ghost" size="sm" className="shrink-0">
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </CardTitle>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="space-y-4 animate-accordion-down">
          {results.map((result) => (
            <LLMResponseBlock
              key={result.modelId}
              modelId={result.modelId}
              modelName={result.modelName}
              queryId={queryId}
              response={result.response}
              isLoading={result.isLoading}
              hasError={result.hasError}
              onRetry={onRetry ? () => onRetry(queryId, result.modelId) : undefined}
            />
          ))}
          
          {results.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No models selected for this query</p>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Zap } from 'lucide-react';

interface SelectionManagerProps {
  selectedQueryCount: number;
  selectedModelCount: number;
  totalQueries: number;
  totalModels: number;
  onSelectAllQueries: () => void;
  onSelectAllLLMs: () => void;
  onGenerateResults: () => void;
  isGenerating?: boolean;
}

export const SelectionManager = ({
  selectedQueryCount,
  selectedModelCount,
  totalQueries,
  totalModels,
  onSelectAllQueries,
  onSelectAllLLMs,
  onGenerateResults,
  isGenerating = false
}: SelectionManagerProps) => {
  const canGenerate = selectedQueryCount > 0 && selectedModelCount > 0;
  
  return (
    <Card className="ai-border shadow-card sticky top-4">
      <CardContent className="pt-6 space-y-4">
        {/* Quick Actions */}
        <div className="space-y-3">
          <Button 
            variant="outline" 
            onClick={onSelectAllQueries} 
            className="w-full justify-start"
            disabled={selectedQueryCount === totalQueries}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Select All Queries
            <Badge variant="secondary" className="ml-auto">
              {selectedQueryCount}/{totalQueries}
            </Badge>
          </Button>
          
          <Button 
            variant="outline" 
            onClick={onSelectAllLLMs} 
            className="w-full justify-start"
            disabled={selectedModelCount === totalModels}
          >
            <Zap className="h-4 w-4 mr-2" />
            Select All LLMs
            <Badge variant="secondary" className="ml-auto">
              {selectedModelCount}/{totalModels}
            </Badge>
          </Button>
        </div>

        <Separator />

        {/* Selection Summary */}
        <div className="text-center space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="font-medium text-primary">{selectedQueryCount}</div>
              <div className="text-muted-foreground">Queries</div>
            </div>
            <div>
              <div className="font-medium text-accent">{selectedModelCount}</div>
              <div className="text-muted-foreground">Models</div>
            </div>
          </div>

          {/* Generate Button */}
          <Button 
            onClick={onGenerateResults}
            className="w-full"
            variant="analyze"
            size="lg"
            disabled={!canGenerate || isGenerating}
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                Generating...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Generate Results
              </>
            )}
          </Button>

          {!canGenerate && (
            <p className="text-xs text-muted-foreground">
              Select at least one query and one model to continue
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
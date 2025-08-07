import { Loader2, Brain, Zap } from 'lucide-react';

interface LoadingIndicatorProps {
  modelName: string;
  variant?: 'default' | 'minimal';
}

export const LoadingIndicator = ({ modelName, variant = 'default' }: LoadingIndicatorProps) => {
  if (variant === 'minimal') {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        <span className="text-xs">Processing...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-8 space-y-4">
      <div className="relative">
        <div className="w-12 h-12 rounded-full bg-gradient-primary/20 flex items-center justify-center">
          <Brain className="h-6 w-6 text-primary animate-pulse" />
        </div>
        <Loader2 className="absolute inset-0 h-12 w-12 text-primary/60 animate-spin" />
      </div>
      
      <div className="text-center space-y-1">
        <p className="text-sm font-medium text-foreground">
          {modelName} is analyzing...
        </p>
        <p className="text-xs text-muted-foreground">
          Generating intelligent insights
        </p>
      </div>
      
      <div className="flex items-center gap-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 bg-primary rounded-full animate-pulse"
            style={{
              animationDelay: `${i * 0.2}s`,
              animationDuration: '1s'
            }}
          />
        ))}
      </div>
    </div>
  );
};
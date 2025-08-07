import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus } from 'lucide-react';

interface CustomQueryInputProps {
  onAddQuery: (text: string, type: 'product' | 'market') => void;
}

export const CustomQueryInput = ({ onAddQuery }: CustomQueryInputProps) => {
  const [customQuery, setCustomQuery] = useState('');
  const [queryType, setQueryType] = useState<'product' | 'market'>('product');

  const handleSubmit = () => {
    if (customQuery.trim()) {
      onAddQuery(customQuery.trim(), queryType);
      setCustomQuery('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <div className="space-y-4">
      {/* Query Type Selector */}
      <div className="flex gap-2">
        <Button
          variant={queryType === 'product' ? 'ai' : 'outline'}
          size="sm"
          onClick={() => setQueryType('product')}
          className="flex-1"
        >
          Product Query
        </Button>
        <Button
          variant={queryType === 'market' ? 'ai' : 'outline'}
          size="sm"
          onClick={() => setQueryType('market')}
          className="flex-1"
        >
          Market Query
        </Button>
      </div>

      {/* Input Field */}
      <div className="flex gap-2">
        <Input
          placeholder={`Enter your custom ${queryType} query...`}
          value={customQuery}
          onChange={(e) => setCustomQuery(e.target.value)}
          onKeyDown={handleKeyPress}
          className="flex-1 focus:ring-primary focus:border-primary"
        />
        <Button 
          onClick={handleSubmit} 
          variant="glow"
          size="default"
          disabled={!customQuery.trim()}
          className="px-4"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Helper Text */}
      <p className="text-xs text-muted-foreground">
        {queryType === 'product' 
          ? 'Ask about ingredients, usage, features, benefits, or product details'
          : 'Ask about market trends, competitors, audience, or business strategy'
        }
      </p>
    </div>
  );
};
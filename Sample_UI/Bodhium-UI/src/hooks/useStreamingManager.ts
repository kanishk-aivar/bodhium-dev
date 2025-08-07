import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

interface StreamingResult {
  queryId: string;
  modelId: string;
  response?: string;
  isLoading: boolean;
  hasError: boolean;
  timestamp?: number;
}

interface StreamingManagerConfig {
  queries: Array<{ id: string; text: string; type: 'product' | 'market' }>;
  models: Array<{ id: string; name: string }>;
  productData: { url: string; name: string };
  enableWebSocket?: boolean;
  pollingInterval?: number;
}

export const useStreamingManager = ({
  queries,
  models,
  productData,
  enableWebSocket = true,
  pollingInterval = 4000
}: StreamingManagerConfig) => {
  const { toast } = useToast();
  const [results, setResults] = useState<StreamingResult[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize results state
  useEffect(() => {
    const initialResults: StreamingResult[] = [];
    
    queries.forEach(query => {
      models.forEach(model => {
        initialResults.push({
          queryId: query.id,
          modelId: model.id,
          isLoading: true,
          hasError: false,
          timestamp: Date.now()
        });
      });
    });

    setResults(initialResults);
    setIsInitialized(true);
  }, [queries, models]);

  // Update individual result
  const updateResult = useCallback((queryId: string, modelId: string, update: Partial<StreamingResult>) => {
    setResults(prev => prev.map(result => 
      result.queryId === queryId && result.modelId === modelId
        ? { ...result, ...update, timestamp: Date.now() }
        : result
    ));
  }, []);

  // Simulate API response generation
  const simulateResponse = useCallback((queryId: string, modelId: string) => {
    const query = queries.find(q => q.id === queryId);
    const model = models.find(m => m.id === modelId);
    
    if (!query || !model) return;

    // Simulate different response types
    const responses = {
      'google-ai': `Based on advanced AI analysis, here are the key insights for "${query.text}": This comprehensive analysis reveals multiple strategic opportunities and considerations that align with current market dynamics and user behavior patterns.`,
      'google-overview': `Market overview analysis indicates: The competitive landscape shows significant opportunities for differentiation through strategic positioning and value proposition enhancement.`,
      'perplexity': `Real-time data analysis shows: Current market trends indicate growing demand with 23% year-over-year growth in this category, supported by emerging consumer preferences.`,
      'chatgpt': `Creative analysis suggests: This presents an excellent opportunity to innovate and capture market share through targeted messaging and strategic product positioning.`
    };

    const baseResponse = responses[modelId as keyof typeof responses] || 
      `Detailed analysis for "${query.text}" reveals important insights about ${query.type === 'product' ? 'product features and benefits' : 'market opportunities and trends'}.`;

    // Simulate random delay and occasional errors
    const delay = Math.random() * 3000 + 2000; // 2-5 seconds
    const shouldError = Math.random() < 0.15; // 15% error rate

    setTimeout(() => {
      if (shouldError) {
        updateResult(queryId, modelId, {
          isLoading: false,
          hasError: true
        });
      } else {
        updateResult(queryId, modelId, {
          response: baseResponse,
          isLoading: false,
          hasError: false
        });
      }
    }, delay);
  }, [queries, models, updateResult]);

  // WebSocket connection
  useEffect(() => {
    if (!enableWebSocket || !isInitialized) return;

    // Simulate WebSocket connection
    console.log('Attempting WebSocket connection...');
    
    // Fallback to simulation since we don't have real WebSocket
    queries.forEach(query => {
      models.forEach(model => {
        simulateResponse(query.id, model.id);
      });
    });

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [enableWebSocket, isInitialized, queries, models, simulateResponse]);

  // Polling fallback
  useEffect(() => {
    if (enableWebSocket || !isInitialized) return;

    const startPolling = () => {
      pollingRef.current = setInterval(() => {
        // Simulate polling API call
        console.log('Polling for updates...');
        
        // Check for any incomplete results and update them
        results.forEach(result => {
          if (result.isLoading && !result.hasError) {
            const timeSinceStart = Date.now() - (result.timestamp || 0);
            if (timeSinceStart > 5000) { // After 5 seconds, complete the result
              simulateResponse(result.queryId, result.modelId);
            }
          }
        });
      }, pollingInterval);
    };

    startPolling();

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [enableWebSocket, isInitialized, pollingInterval, results, simulateResponse]);

  // Retry function
  const retryResult = useCallback((queryId: string, modelId: string) => {
    updateResult(queryId, modelId, {
      isLoading: true,
      hasError: false,
      response: undefined
    });

    toast({
      title: "Retrying request",
      description: "Re-processing with the selected model...",
    });

    simulateResponse(queryId, modelId);
  }, [updateResult, simulateResponse, toast]);

  // Calculate statistics
  const stats = {
    total: results.length,
    completed: results.filter(r => r.response && !r.isLoading && !r.hasError).length,
    loading: results.filter(r => r.isLoading).length,
    errors: results.filter(r => r.hasError).length
  };

  return {
    results,
    stats,
    retryResult,
    isInitialized
  };
};
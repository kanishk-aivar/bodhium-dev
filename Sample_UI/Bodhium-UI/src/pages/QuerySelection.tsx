import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  CheckSquare, 
  Square, 
  Brain,
  Zap,
  Search,
  MessageSquare,
  ArrowRight
} from 'lucide-react';

// Interfaces
interface Query {
  id: string;
  text: string;
  type: 'product' | 'market' | 'custom';
  selected: boolean;
  editable?: boolean;
}

interface LLMModel {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  selected: boolean;
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
const QuerySection = ({ 
  title, 
  queries, 
  onToggleQuery, 
  onDeleteQuery, 
  onEditQuery 
}: {
  title: string;
  queries: Query[];
  onToggleQuery: (queryId: string) => void;
  onDeleteQuery: (queryId: string) => void;
  onEditQuery: (queryId: string, newText: string) => void;
}) => (
  <Card className="bg-card border-border">
    <CardHeader className="pb-4">
      <CardTitle className="text-lg text-foreground flex items-center gap-2">
        <Search className="h-5 w-5" />
        {title}
        <Badge variant="secondary" className="ml-auto bg-muted text-foreground">
          {queries.length}
        </Badge>
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-3">
      {queries.map((query) => (
        <div
          key={query.id}
          className="flex items-center gap-3 p-3 rounded-md border border-border bg-background hover:bg-muted transition-colors"
        >
          <Checkbox
            checked={query.selected}
            onCheckedChange={() => onToggleQuery(query.id)}
            className="border-border"
          />
          
          <div className="flex-1">
            {query.editable ? (
              <Input
                defaultValue={query.text}
                onBlur={(e) => onEditQuery(query.id, e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    onEditQuery(query.id, e.currentTarget.value);
                  }
                }}
                className="h-8 text-sm bg-transparent border-border"
              />
            ) : (
              <span className="text-sm text-foreground">{query.text}</span>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEditQuery(query.id, query.text)}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
            >
              <Edit3 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDeleteQuery(query.id)}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </CardContent>
  </Card>
);

const LLMSelectorGroup = ({ 
  models, 
  onToggleModel, 
  onSelectAll 
}: {
  models: LLMModel[];
  onToggleModel: (modelId: string) => void;
  onSelectAll: () => void;
}) => (
  <Card className="bg-card border-border">
    <CardHeader className="pb-4">
      <div className="flex items-center justify-between">
        <CardTitle className="text-lg text-foreground flex items-center gap-2">
          <Brain className="h-5 w-5" />
          LLM Models
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={onSelectAll}
          className="border-border text-foreground hover:bg-muted"
        >
          <CheckSquare className="h-4 w-4 mr-2" />
          Select All
        </Button>
      </div>
    </CardHeader>
    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {models.map((model) => (
        <div
          key={model.id}
          onClick={() => onToggleModel(model.id)}
          className={`p-4 rounded-md border cursor-pointer transition-all ${
            model.selected
              ? 'border-primary bg-primary/10 shadow-sm'
              : 'border-border hover:border-primary hover:bg-muted'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              {model.icon}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-foreground">{model.name}</h3>
              <p className="text-sm text-muted-foreground truncate">{model.description}</p>
            </div>
            <div className="flex-shrink-0">
              {model.selected ? (
                <CheckSquare className="h-5 w-5 text-primary" />
              ) : (
                <Square className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
          </div>
        </div>
      ))}
    </CardContent>
  </Card>
);

const CustomQueryAdder = ({ 
  onAddQuery 
}: {
  onAddQuery: (text: string, type: 'product' | 'market') => void;
}) => {
  const [newQuery, setNewQuery] = useState('');
  const [queryType, setQueryType] = useState<'product' | 'market'>('product');

  const handleAdd = () => {
    if (newQuery.trim()) {
      onAddQuery(newQuery.trim(), queryType);
      setNewQuery('');
    }
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg text-foreground flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Add Custom Query
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input
              placeholder="Enter your custom query..."
              value={newQuery}
              onChange={(e) => setNewQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
              className="bg-background border-border focus:border-primary"
            />
          </div>
          <Select value={queryType} onValueChange={(value) => setQueryType(value as 'product' | 'market')}>
            <SelectTrigger className="w-full sm:w-40 bg-background border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="product">Product-Based</SelectItem>
              <SelectItem value="market">Market-Based</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={handleAdd}
            disabled={!newQuery.trim()}
            className="bg-primary hover:bg-primary/90"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const SelectedCountDisplay = ({ 
  selectedQueries, 
  selectedModels, 
  onGenerate, 
  isLoading 
}: {
  selectedQueries: number;
  selectedModels: number;
  onGenerate: () => void;
  isLoading: boolean;
}) => (
  <Card className="bg-muted border-border">
    <CardContent className="p-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{selectedQueries}</div>
            <div className="text-sm text-muted-foreground">Queries Selected</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{selectedModels}</div>
            <div className="text-sm text-muted-foreground">Models Selected</div>
          </div>
        </div>
        
        <Button
          onClick={onGenerate}
          disabled={selectedQueries === 0 || selectedModels === 0 || isLoading}
          size="lg"
          className="bg-primary hover:bg-primary/90 font-semibold"
        >
          {isLoading ? (
            <>
              <Zap className="mr-2 h-5 w-5 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              Generate Results
              <ArrowRight className="ml-2 h-5 w-5" />
            </>
          )}
        </Button>
      </div>
    </CardContent>
  </Card>
);

const QuerySelection = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [queries, setQueries] = useState<Query[]>([]);
  const [models, setModels] = useState<LLMModel[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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

  const initialModels: LLMModel[] = [
    {
      id: 'chatgpt',
      name: 'ChatGPT',
      description: 'OpenAI\'s conversational AI',
      icon: <MessageSquare className="h-6 w-6 text-green-500" />,
      selected: false,
    },
    {
      id: 'perplexity',
      name: 'Perplexity',
      description: 'AI-powered search engine',
      icon: <Search className="h-6 w-6 text-blue-500" />,
      selected: false,
    },
    {
      id: 'ai-mode',
      name: 'AI Mode',
      description: 'Advanced reasoning model',
      icon: <Brain className="h-6 w-6 text-purple-500" />,
      selected: false,
    },
    {
      id: 'ai-overview',
      name: 'AI Overview',
      description: 'Comprehensive analysis',
      icon: <Zap className="h-6 w-6 text-yellow-500" />,
      selected: false,
    },
  ];

  useEffect(() => {
    setModels(initialModels);
  }, []);

  useEffect(() => {
    if (selectedProduct) {
      fetchQueries(selectedProduct);
    }
  }, [selectedProduct]);

  const fetchQueries = async (productId: string) => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockQueries: Query[] = [
        // Product-based queries
        { id: '1', text: 'What are the main features of this product?', type: 'product', selected: false },
        { id: '2', text: 'How do I use this product effectively?', type: 'product', selected: false },
        { id: '3', text: 'What materials is this product made from?', type: 'product', selected: false },
        { id: '4', text: 'What is the warranty and return policy?', type: 'product', selected: false },
        
        // Market-based queries
        { id: '5', text: 'Who is the target audience for this product?', type: 'market', selected: false },
        { id: '6', text: 'What are the main competitor products?', type: 'market', selected: false },
        { id: '7', text: 'What is the market positioning strategy?', type: 'market', selected: false },
        { id: '8', text: 'What are the current market trends?', type: 'market', selected: false },
      ];
      
      setQueries(mockQueries);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch queries. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProducts = products.filter(p => p.brandId === selectedBrand);

  const toggleQuery = (queryId: string) => {
    setQueries(prev => prev.map(q => 
      q.id === queryId ? { ...q, selected: !q.selected } : q
    ));
  };

  const deleteQuery = (queryId: string) => {
    setQueries(prev => prev.filter(q => q.id !== queryId));
  };

  const editQuery = (queryId: string, newText: string) => {
    setQueries(prev => prev.map(q => 
      q.id === queryId ? { ...q, text: newText, editable: false } : q
    ));
  };

  const addCustomQuery = (text: string, type: 'product' | 'market') => {
    const newQuery: Query = {
      id: Date.now().toString(),
      text,
      type: 'custom',
      selected: true,
    };
    setQueries(prev => [...prev, newQuery]);
    
    toast({
      title: "Query Added",
      description: "Custom query has been added successfully.",
    });
  };

  const toggleModel = (modelId: string) => {
    setModels(prev => prev.map(m => 
      m.id === modelId ? { ...m, selected: !m.selected } : m
    ));
  };

  const selectAllModels = () => {
    const allSelected = models.every(m => m.selected);
    setModels(prev => prev.map(m => ({ ...m, selected: !allSelected })));
  };

  const handleGenerate = async () => {
    const selectedQueries = queries.filter(q => q.selected);
    const selectedModels = models.filter(m => m.selected);

    setIsLoading(true);
    try {
      // Simulate API call
      const response = await fetch('/api/llm-invoke', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: selectedProduct,
          queries: selectedQueries.map(q => q.id),
          models: selectedModels.map(m => m.id),
        }),
      });

      if (response.ok) {
        toast({
          title: "Success!",
          description: "Results generation started. Redirecting...",
        });
        
        setTimeout(() => {
          navigate('/results');
        }, 1500);
      } else {
        throw new Error('Failed to generate results');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate results. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const selectedQueryCount = queries.filter(q => q.selected).length;
  const selectedModelCount = models.filter(m => m.selected).length;

  const productQueries = queries.filter(q => q.type === 'product');
  const marketQueries = queries.filter(q => q.type === 'market');
  const customQueries = queries.filter(q => q.type === 'custom');

  return (
    <div className="min-h-screen bg-gradient-to-br" style={{ backgroundImage: 'var(--gradient-hero)' }}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">
            Query Selection
          </h1>
          <p className="text-lg text-muted-foreground">
            Configure your AI analysis by selecting products, queries, and models
          </p>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <label className="text-sm font-medium text-foreground mb-2 block">
                Select Brand
              </label>
              <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                <SelectTrigger className="bg-background border-border">
                  <SelectValue placeholder="Choose a brand..." />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {brands.map((brand) => (
                    <SelectItem key={brand.id} value={brand.id}>
                      {brand.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <label className="text-sm font-medium text-foreground mb-2 block">
                Select Product
              </label>
              <Select 
                value={selectedProduct} 
                onValueChange={setSelectedProduct}
                disabled={!selectedBrand}
              >
                <SelectTrigger className="bg-background border-border">
                  <SelectValue placeholder="Choose a product..." />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
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
            {/* Query Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="space-y-6">
                <QuerySection
                  title="Product-Based Queries"
                  queries={productQueries}
                  onToggleQuery={toggleQuery}
                  onDeleteQuery={deleteQuery}
                  onEditQuery={editQuery}
                />
                
                <QuerySection
                  title="Market-Based Queries"
                  queries={marketQueries}
                  onToggleQuery={toggleQuery}
                  onDeleteQuery={deleteQuery}
                  onEditQuery={editQuery}
                />
                
                {customQueries.length > 0 && (
                  <QuerySection
                    title="Custom Queries"
                    queries={customQueries}
                    onToggleQuery={toggleQuery}
                    onDeleteQuery={deleteQuery}
                    onEditQuery={editQuery}
                  />
                )}
              </div>

              <div className="space-y-6">
                <LLMSelectorGroup
                  models={models}
                  onToggleModel={toggleModel}
                  onSelectAll={selectAllModels}
                />
                
                <CustomQueryAdder onAddQuery={addCustomQuery} />
              </div>
            </div>

            {/* Selection Summary */}
            <SelectedCountDisplay
              selectedQueries={selectedQueryCount}
              selectedModels={selectedModelCount}
              onGenerate={handleGenerate}
              isLoading={isLoading}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default QuerySelection;
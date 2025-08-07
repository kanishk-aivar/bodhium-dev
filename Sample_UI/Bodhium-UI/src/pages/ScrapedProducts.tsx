import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RefreshCw, ArrowRight, Trash2, Eye, Globe, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Product interface
interface Product {
  id: string;
  name: string;
  sourceUrl: string;
  brand?: string;
  scrapeTimestamp: string;
  selected?: boolean;
}

// Modular Components
const ProductListTable = ({ products, onToggleSelect, onSelectAll, allSelected }: {
  products: Product[];
  onToggleSelect: (id: string) => void;
  onSelectAll: () => void;
  allSelected: boolean;
}) => (
  <div className="rounded-xl border border-primary/20 bg-card overflow-hidden shadow-lg">
    <Table>
      <TableHeader>
        <TableRow className="bg-primary/5">
          <TableHead className="w-12">
            <Checkbox
              checked={allSelected}
              onCheckedChange={onSelectAll}
              className="border-primary/30"
            />
          </TableHead>
          <TableHead className="font-semibold">Product Name</TableHead>
          <TableHead className="font-semibold">Brand</TableHead>
          <TableHead className="font-semibold">Source URL</TableHead>
          <TableHead className="font-semibold">Scraped</TableHead>
          <TableHead className="font-semibold text-center">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.map((product) => (
          <ProductRow
            key={product.id}
            product={product}
            onToggleSelect={onToggleSelect}
          />
        ))}
      </TableBody>
    </Table>
  </div>
);

const ProductRow = ({ product, onToggleSelect }: {
  product: Product;
  onToggleSelect: (id: string) => void;
}) => (
  <TableRow className="hover:bg-primary/5 transition-colors">
    <TableCell>
      <CheckboxSelector
        productId={product.id}
        selected={product.selected || false}
        onToggle={onToggleSelect}
      />
    </TableCell>
    <TableCell className="font-medium">{product.name}</TableCell>
    <TableCell>
      {product.brand ? (
        <Badge variant="secondary" className="bg-primary/10 text-primary">
          {product.brand}
        </Badge>
      ) : (
        <span className="text-muted-foreground">—</span>
      )}
    </TableCell>
    <TableCell>
      <a
        href={product.sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center text-primary hover:text-primary-glow transition-colors text-sm"
      >
        <Globe className="w-3 h-3 mr-1" />
        {new URL(product.sourceUrl).hostname}
      </a>
    </TableCell>
    <TableCell>
      <div className="flex items-center text-sm text-muted-foreground">
        <Calendar className="w-3 h-3 mr-1" />
        {new Date(product.scrapeTimestamp).toLocaleDateString()}
      </div>
    </TableCell>
    <TableCell>
      <div className="flex items-center justify-center gap-2">
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Eye className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive/80">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </TableCell>
  </TableRow>
);

const CheckboxSelector = ({ productId, selected, onToggle }: {
  productId: string;
  selected: boolean;
  onToggle: (id: string) => void;
}) => (
  <Checkbox
    checked={selected}
    onCheckedChange={() => onToggle(productId)}
    className="border-primary/30"
  />
);

const ActionBar = ({ selectedCount, onProceed, onRefresh, isLoading }: {
  selectedCount: number;
  onProceed: () => void;
  onRefresh: () => void;
  isLoading: boolean;
}) => (
  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 bg-card rounded-xl border border-primary/20 shadow-lg">
    <div className="flex items-center gap-4">
      <Badge variant="secondary" className="bg-primary/10 text-primary font-semibold px-3 py-1">
        {selectedCount} product{selectedCount !== 1 ? 's' : ''} selected
      </Badge>
    </div>
    
    <div className="flex gap-3">
      <Button
        onClick={onRefresh}
        variant="outline"
        disabled={isLoading}
        className="border-primary/30 hover:bg-primary/5"
      >
        <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        Refresh List
      </Button>
      
      <Button
        onClick={onProceed}
        disabled={selectedCount === 0 || isLoading}
        className="bg-primary hover:bg-primary-glow font-semibold"
      >
        Proceed to Query Selection
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  </div>
);

const ScrapedProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Mock data for demonstration
  const mockProducts: Product[] = [
    {
      id: '1',
      name: 'Premium Wireless Headphones',
      sourceUrl: 'https://example-shop.com/wireless-headphones',
      brand: 'TechBrand',
      scrapeTimestamp: '2024-01-15T10:30:00Z',
      selected: false,
    },
    {
      id: '2',
      name: 'Organic Cotton T-Shirt',
      sourceUrl: 'https://fashion-store.com/cotton-tshirt',
      brand: 'EcoWear',
      scrapeTimestamp: '2024-01-15T09:15:00Z',
      selected: false,
    },
    {
      id: '3',
      name: 'Smart Home Security Camera',
      sourceUrl: 'https://tech-hub.com/security-camera',
      brand: 'SecureTech',
      scrapeTimestamp: '2024-01-14T16:45:00Z',
      selected: false,
    },
    {
      id: '4',
      name: 'Artisan Coffee Beans',
      sourceUrl: 'https://coffee-roasters.com/premium-beans',
      scrapeTimestamp: '2024-01-14T14:20:00Z',
      selected: false,
    },
  ];

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      // Simulate API call to GET /api/products
      await new Promise(resolve => setTimeout(resolve, 1000));
      setProducts(mockProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: "Error",
        description: "Failed to fetch products. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleSelect = (productId: string) => {
    setProducts(prev => prev.map(product =>
      product.id === productId
        ? { ...product, selected: !product.selected }
        : product
    ));
  };

  const handleSelectAll = () => {
    const allSelected = products.every(p => p.selected);
    setProducts(prev => prev.map(product => ({
      ...product,
      selected: !allSelected
    })));
  };

  const handleProceed = async () => {
    const selectedProducts = products.filter(p => p.selected);
    const selectedIds = selectedProducts.map(p => p.id);

    try {
      // Simulate API call to POST /api/job-selected-products
      const response = await fetch('/api/job-selected-products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productIds: selectedIds }),
      });

      if (response.ok) {
        toast({
          title: "Success!",
          description: `${selectedProducts.length} products selected for query optimization.`,
        });
        
        // Navigate to Query Selection (Page 3)
        navigate('/query-selection');
      } else {
        throw new Error('Failed to process selected products');
      }
    } catch (error) {
      console.error('Error processing products:', error);
      toast({
        title: "Error",
        description: "Failed to process selected products. Please try again.",
        variant: "destructive",
      });
    }
  };

  const selectedCount = products.filter(p => p.selected).length;
  const allSelected = products.length > 0 && products.every(p => p.selected);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br" style={{ backgroundImage: 'var(--gradient-hero)' }}>
        <div className="container mx-auto px-4 py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
            <p className="text-lg text-muted-foreground">Loading your scraped products...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br" style={{ backgroundImage: 'var(--gradient-hero)' }}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">
            Scraped Product Management
          </h1>
          <p className="text-lg text-muted-foreground">
            Select products to proceed with AI optimization and query generation
          </p>
        </div>

        {/* Action Bar */}
        <div className="mb-6">
          <ActionBar
            selectedCount={selectedCount}
            onProceed={handleProceed}
            onRefresh={fetchProducts}
            isLoading={isLoading}
          />
        </div>

        {/* Products Table */}
        {products.length > 0 ? (
          <ProductListTable
            products={products}
            onToggleSelect={handleToggleSelect}
            onSelectAll={handleSelectAll}
            allSelected={allSelected}
          />
        ) : (
          <Card className="text-center py-12 bg-white/80 border-primary/20">
            <CardContent>
              <Globe className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Products Found</h3>
              <p className="text-muted-foreground mb-6">
                No scraped products available. Start by submitting a product URL.
              </p>
              <Button
                onClick={() => navigate('/')}
                variant="outline"
                className="border-primary/30"
              >
                Go to Homepage
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ScrapedProducts;
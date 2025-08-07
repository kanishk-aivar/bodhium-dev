import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppSidebar } from "@/components/AppSidebar";
import Index from "./pages/Index";

// Lazy load pages for better performance
const ScrapedProducts = lazy(() => import("./pages/ScrapedProducts"));
const QuerySelection = lazy(() => import("./pages/QuerySelection"));
const Results = lazy(() => import("./pages/Results"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <BrowserRouter>
        <SidebarProvider defaultOpen={true}>
          <div className="min-h-screen flex w-full bg-background">
            <AppSidebar />
            
            <div className="flex-1 flex flex-col">
              {/* Global Header with Sidebar Trigger - AWS Console Style */}
              <header className="h-14 flex items-center border-b border-border bg-background sticky top-0 z-40">
                <div className="flex items-center gap-4 px-4">
                  <SidebarTrigger className="hover:bg-muted rounded-md p-1" />
                  <div className="hidden sm:block">
                    <span className="text-sm font-medium text-primary">BODHIUM</span>
                    <span className="text-xs text-muted-foreground ml-2">AI Engine Optimization</span>
                  </div>
                </div>
              </header>

              {/* Main Content */}
              <main className="flex-1">
                <Suspense fallback={
                  <div className="min-h-screen flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
                  </div>
                }>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/scraped-products" element={<ScrapedProducts />} />
                    <Route path="/query-selection" element={<QuerySelection />} />
                    <Route path="/results" element={<Results />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </main>
            </div>
          </div>
        </SidebarProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { 
  Home, 
  Search, 
  BarChart3, 
  Brain, 
  Zap, 
  ChevronRight,
  Package,
  Globe
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const navigationItems = [
  {
    title: "URL Submission",
    url: "/",
    icon: Globe,
    description: "Submit product URLs"
  },
  {
    title: "Scraped Products",
    url: "/scraped-products",
    icon: Package,
    description: "Manage products"
  },
  {
    title: "Query Selection",
    url: "/query-selection",
    icon: Search,
    description: "Configure queries"
  },
  {
    title: "Results",
    url: "/results",
    icon: BarChart3,
    description: "View insights"
  }
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? "bg-primary/8 text-primary font-medium border border-primary/15 shadow-sm" 
      : "hover:bg-muted hover:text-foreground transition-all duration-200";

  return (
    <Sidebar
      className={`${collapsed ? "w-16" : "w-64"} border-r border-border bg-sidebar-background`}
      collapsible="icon"
    >
      <SidebarContent className="p-2">
        {/* Logo Section */}
        <div className={`mb-6 px-3 ${collapsed ? 'text-center' : ''}`}>
          {!collapsed ? (
            <div>
              <h2 className="text-xl font-bold text-primary">BODHIUM</h2>
              <p className="text-xs text-muted-foreground">Query. Understand. Optimize.</p>
            </div>
          ) : (
            <div className="flex justify-center">
              <Brain className="h-6 w-6 text-primary" />
            </div>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className={`${collapsed ? "sr-only" : ""} text-xs font-medium text-muted-foreground uppercase tracking-wider`}>
            Navigation
          </SidebarGroupLabel>
          
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end 
                      className={`${getNavCls({ isActive: isActive(item.url) })} group relative overflow-hidden rounded-md p-3`}
                    >
                      <item.icon className={`h-5 w-5 shrink-0 ${isActive(item.url) ? 'text-primary' : ''}`} />
                      {!collapsed && (
                        <div className="ml-3 flex-1">
                          <span className={`block text-sm font-medium ${isActive(item.url) ? 'text-primary' : ''}`}>
                            {item.title}
                          </span>
                          <span className={`block text-xs ${isActive(item.url) ? 'text-primary/70' : 'text-muted-foreground'}`}>
                            {item.description}
                          </span>
                        </div>
                      )}
                      {!collapsed && isActive(item.url) && (
                        <ChevronRight className="h-4 w-4 ml-auto text-primary/60" />
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* AI Tools Section */}
        <SidebarGroup className="mt-8">
          <SidebarGroupLabel className={`${collapsed ? "sr-only" : ""} text-xs font-medium text-muted-foreground uppercase tracking-wider`}>
            AI Tools
          </SidebarGroupLabel>
          
          <SidebarGroupContent>
            <div className={`${collapsed ? 'px-1' : 'px-3'} py-2`}>
              <div className="flex items-center gap-2 p-2 rounded-md bg-muted border border-border">
                <Zap className="h-4 w-4 text-primary" />
                {!collapsed && (
                  <span className="text-xs text-muted-foreground">
                    AI Engine Ready
                  </span>
                )}
              </div>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
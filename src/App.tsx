import React from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Beaker, Archive, PlusCircle, LayoutDashboard } from 'lucide-react';
import { cn } from './lib/utils';

// Pages
import Dashboard from './pages/Dashboard';
import CreateProduct from './pages/CreateProduct';
import ProductDetail from './pages/ProductDetail';
import VerifyProduct from './pages/VerifyProduct';

function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  
  const navItems = [
    { path: '/', icon: LayoutDashboard, label: '工作台' },
    { path: '/create', icon: PlusCircle, label: '新建研发' },
    { path: '/archived', icon: Archive, label: '已归档' },
  ];

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans flex flex-col md:flex-row">
      {/* Sidebar / Bottom Nav */}
      <nav className="bg-white border-r border-stone-200 w-full md:w-64 flex-shrink-0 fixed md:sticky bottom-0 md:top-0 z-50 md:h-screen flex md:flex-col shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] md:shadow-none">
        <div className="p-4 md:p-6 hidden md:flex items-center gap-3 border-b border-stone-100">
          <div className="bg-stone-900 text-white p-2 rounded-lg">
            <Beaker size={24} />
          </div>
          <h1 className="font-semibold text-lg tracking-tight">陶瓷研发管理</h1>
        </div>
        
        <div className="flex-1 flex md:flex-col gap-1 p-2 md:p-4 overflow-x-auto md:overflow-visible justify-around md:justify-start">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || 
                             (item.path === '/archived' && location.pathname.startsWith('/archived')) ||
                             (item.path === '/' && location.pathname.startsWith('/verify'));
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex flex-col md:flex-row items-center gap-1 md:gap-3 px-3 md:px-4 py-2 md:py-3 rounded-xl transition-all duration-200",
                  isActive 
                    ? "bg-stone-900 text-white shadow-md" 
                    : "text-stone-500 hover:bg-stone-100 hover:text-stone-900"
                )}
              >
                <Icon size={20} className={cn(isActive ? "text-stone-100" : "text-stone-400")} />
                <span className="text-[10px] md:text-sm font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 pb-24 md:pb-8 max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/create" element={<CreateProduct />} />
          <Route path="/verify/:id" element={<VerifyProduct />} />
          <Route path="/archived" element={<Dashboard status="archived" />} />
          <Route path="/product/:id" element={<ProductDetail />} />
        </Routes>
      </Layout>
      <Toaster position="top-center" />
    </BrowserRouter>
  );
}

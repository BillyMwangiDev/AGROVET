import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import { POSProvider } from '@/contexts/POSContext';
import { CartProvider } from '@/contexts/CartContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import IdleLock from '@/components/auth/IdleLock';
import { lazy, Suspense } from 'react';
import LandingPage from '@/pages/LandingPage';
import './App.css';

const AdminDashboard    = lazy(() => import('@/pages/AdminDashboard'));
const LoginPage         = lazy(() => import('@/pages/LoginPage'));
const CustomerSignupPage = lazy(() => import('@/pages/CustomerSignupPage'));
const ProductCatalogPage = lazy(() => import('@/pages/ProductCatalogPage'));
const ProductDetailPage  = lazy(() => import('@/pages/ProductDetailPage'));
const CartPage           = lazy(() => import('@/pages/CartPage'));
const ArticleList        = lazy(() => import('@/pages/ArticleList'));
const ArticleDetail      = lazy(() => import('@/pages/ArticleDetail'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,    // 5 min — prevents mid-scroll refetches on slow networks
      gcTime: 10 * 60 * 1000,      // Drop unused cache after 10 min
    },
  },
});

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
    <QueryClientProvider client={queryClient}>
      <CartProvider>
      <Router>
        <AuthProvider>
          <POSProvider>
            <Toaster position="top-right" richColors />
            <IdleLock>
              <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin" /></div>}>
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<CustomerSignupPage />} />
                  <Route path="/catalog" element={<ProductCatalogPage />} />
                  <Route path="/catalog/product/:slug" element={<ProductDetailPage />} />
                  <Route path="/cart" element={<CartPage />} />
                  <Route path="/articles" element={<ArticleList />} />
                  <Route path="/articles/:slug" element={<ArticleDetail />} />
                  <Route
                    path="/admin/*"
                    element={
                      <ProtectedRoute>
                        <AdminDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
            </IdleLock>
          </POSProvider>
        </AuthProvider>
      </Router>
      </CartProvider>
    </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;

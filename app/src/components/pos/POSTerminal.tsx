import { useState, useMemo, useEffect, useRef } from 'react';
import {
  Search, Plus, Minus, Trash2, CreditCard, Banknote, Smartphone,
  Box, RefreshCw, ScanLine, FileDown, Loader2, CheckCircle, XCircle, Star, X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useInventory } from '@/hooks/useProducts';
import { useCreateSale, useDownloadPDF } from '@/hooks/useSales';
import { useSTKPush, useMpesaStatus } from '@/hooks/useMpesa';
import { useCustomerSearch } from '@/hooks/useCustomers';
import { usePOSContext } from '@/contexts/POSContext';
import { parseDecimal } from '@/utils/formatCurrency';
import { printReceipt } from '@/utils/receipt';
import type { AdminProduct } from '@/types';
import type { ApiCustomer } from '@/api/customers';

interface CartItem {
  id: string;
  name: string;
  price: number;
  unit: string;
  category_slug: string;
  stock_level: number;
  quantity: number;
}

const categories = ['all', 'feeds', 'seeds', 'chemicals', 'semen', 'equipment'];

const paymentMethods = [
  { id: 'cash', label: 'Cash', icon: Banknote },
  { id: 'mpesa', label: 'M-Pesa', icon: Smartphone },
  { id: 'card', label: 'Card', icon: CreditCard },
] as const;

export default function POSTerminal() {
  const { searchQuery, setSearchQuery } = usePOSContext();
  const [activeCategory, setActiveCategory] = useState('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'mpesa' | 'card'>('cash');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [discount, setDiscount] = useState(0);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [showProductList, setShowProductList] = useState(true);

  // Registered customer lookup + loyalty
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<ApiCustomer | null>(null);
  const [redeemPoints, setRedeemPoints] = useState(0);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  // M-Pesa state
  const [mpesaPhone, setMpesaPhone] = useState('');
  const [mpesaCheckoutId, setMpesaCheckoutId] = useState<string | null>(null);

  // Barcode scanner state
  const [isScanDialogOpen, setIsScanDialogOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanningRef = useRef(false);

  // Post-sale PDF download state
  const [lastSale, setLastSale] = useState<{ saleId: string; receiptNumber: string } | null>(null);

  const { data: products = [], isLoading } = useInventory();
  const { data: customerSearchResults = [] } = useCustomerSearch(customerSearch);
  const createSaleMutation = useCreateSale();
  const downloadPDFMutation = useDownloadPDF();
  const stkPushMutation = useSTKPush();
  const { data: mpesaStatus } = useMpesaStatus(mpesaCheckoutId);

  // Auto-complete sale when M-Pesa payment is confirmed
  useEffect(() => {
    if (!mpesaStatus) return;
    if (mpesaStatus.status === 'success' && mpesaCheckoutId) {
      setMpesaCheckoutId(null);
      completeSale();
    } else if (
      (mpesaStatus.status === 'failed' || mpesaStatus.status === 'cancelled') &&
      mpesaCheckoutId
    ) {
      setMpesaCheckoutId(null);
      toast.error("Payment unsuccessful. Please try again or use cash.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mpesaStatus?.status]);

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === 'all' || product.category_slug === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, activeCategory, products]);

  const addToCart = (product: AdminProduct) => {
    if ((product.stock_level ?? 0) === 0) {
      toast.error(`${product.name} is out of stock`);
      return;
    }
    const price = parseDecimal(product.price);
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        if (existing.quantity >= (product.stock_level ?? 0)) {
          toast.error(`Only ${product.stock_level} units available`);
          return prev;
        }
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          price,
          unit: product.unit,
          category_slug: product.category_slug,
          stock_level: product.stock_level ?? 0,
          quantity: 1,
        },
      ];
    });
    toast.success(`${product.name} added to cart`);
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newQty = item.quantity + delta;
          if (newQty > item.stock_level) {
            toast.error(`Only ${item.stock_level} units available`);
            return item;
          }
          return { ...item, quantity: Math.max(1, newQty) };
        }
        return item;
      })
    );
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * 0.16;
  const total = subtotal + tax - discount - redeemPoints;

  const clearSale = () => {
    if (cart.length === 0) return;
    if (confirm('Are you sure you want to clear the current sale?')) {
      setCart([]);
      setDiscount(0);
      setLastSale(null);
      setSelectedCustomer(null);
      setCustomerSearch('');
      setRedeemPoints(0);
    }
  };

  const completeSale = () => {
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    const payload = {
      customer_name: customerName || selectedCustomer?.name,
      customer_phone: customerPhone || selectedCustomer?.phone,
      customer_id: selectedCustomer?.id,
      payment_method: paymentMethod,
      discount: discount,
      redeem_points: redeemPoints > 0 ? redeemPoints : undefined,
      items: cart.map((item) => ({
        product_id: item.id,
        quantity: item.quantity,
      })),
    };

    createSaleMutation.mutate(payload, {
      onSuccess: (data) => {
        toast.success(`Sale complete! Receipt: ${data.receipt_number}`);
        if (data.receipt_html) {
          printReceipt(data.receipt_html);
        }
        setLastSale({ saleId: data.sale_id, receiptNumber: data.receipt_number });
        setCart([]);
        setCustomerName('');
        setCustomerPhone('');
        setMpesaPhone('');
        setDiscount(0);
        setSelectedCustomer(null);
        setCustomerSearch('');
        setRedeemPoints(0);
        setIsCheckoutOpen(false);
      },
      onError: (err: any) => {
        const stockErrors = err?.response?.data?.stock_errors;
        if (stockErrors?.length) {
          toast.error(stockErrors[0]);
        } else {
          toast.error(err?.response?.data?.detail ?? 'Sale failed. Please try again.');
        }
      },
    });
  };

  const stopCamera = () => {
    scanningRef.current = false;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  const startBarcodeScanner = async () => {
    if (!('BarcodeDetector' in window)) {
      toast.error('Barcode scanning requires Chrome on Android or Desktop (not supported in this browser).');
      return;
    }
    setIsScanDialogOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      // Brief delay to let the dialog mount before setting srcObject
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      }, 100);

      // @ts-ignore — BarcodeDetector not in TypeScript lib yet
      const detector = new BarcodeDetector({
        formats: ['ean_13', 'ean_8', 'qr_code', 'code_128', 'code_39', 'upc_a'],
      });
      scanningRef.current = true;

      const scan = async () => {
        if (!scanningRef.current || !videoRef.current) return;
        try {
          const barcodes = await detector.detect(videoRef.current);
          if (barcodes.length > 0) {
            const code = barcodes[0].rawValue as string;
            stopCamera();
            setIsScanDialogOpen(false);
            // Match product by exact or partial name
            const matched = products.find(
              (p) =>
                p.name.toLowerCase() === code.toLowerCase() ||
                p.name.toLowerCase().includes(code.toLowerCase())
            );
            if (matched) {
              addToCart(matched);
            } else {
              setSearchQuery(code);
              toast.info(`Scanned "${code}" — showing matching products`);
            }
            return;
          }
        } catch {
          // detection may fail on empty frames — continue scanning
        }
        if (scanningRef.current) {
          setTimeout(scan, 200);
        }
      };
      setTimeout(scan, 500); // wait for video feed to start
    } catch {
      toast.error('Camera access denied. Allow camera permission and try again.');
      setIsScanDialogOpen(false);
      stopCamera();
    }
  };

  const handleSendSTKPush = () => {
    const phone = mpesaPhone || customerPhone;
    if (!phone) {
      toast.error('Enter a phone number for M-Pesa payment');
      return;
    }
    stkPushMutation.mutate(
      { phone, amount: Math.ceil(total), account_reference: 'Nicmah' },
      {
        onSuccess: (data) => {
          setMpesaCheckoutId(data.checkout_request_id);
          toast.success(data.customer_message || 'STK Push sent — check your phone.');
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.detail ?? 'Failed to send STK Push. Try again.');
        },
      }
    );
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col">
      {/* POS Top Bar */}
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-foreground uppercase tracking-wider">Current Sale</h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowProductList(!showProductList)}
            className="text-brand font-medium hover:bg-brand-50"
          >
            {showProductList ? 'Hide Products' : 'Show Products'}
          </Button>
        </div>
        <div className="flex items-center gap-2">
          {lastSale && (
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                downloadPDFMutation.mutate({
                  saleId: lastSale.saleId,
                  receiptNumber: lastSale.receiptNumber,
                })
              }
              disabled={downloadPDFMutation.isPending}
              className="h-8 text-xs border-brand text-brand hover:bg-brand-50 rounded-lg"
            >
              {downloadPDFMutation.isPending ? (
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              ) : (
                <FileDown className="w-3 h-3 mr-1" />
              )}
              Download Receipt PDF
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={startBarcodeScanner}
            className="h-8 text-xs border-brand text-brand hover:bg-brand-50 rounded-lg"
          >
            <ScanLine className="w-3 h-3 mr-1" />
            Scan
          </Button>
          <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-full px-2.5 py-0.5 uppercase tracking-wide">
            {cart.length} items · scanner ready
          </span>
          {cart.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearSale}
              className="h-8 text-xs border-red-200 text-red-600 hover:bg-red-50 rounded-lg"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Clear Sale
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 flex gap-6 min-h-0">
        {/* Main Content Area - Cart + optional Product Grid */}
        <div className="flex-1 flex flex-col min-w-0 gap-6">
          {/* Cart */}
          <Card className="flex-1 border-0 shadow-sm flex flex-col overflow-hidden">
            <CardContent className="flex-1 overflow-auto p-0">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-12">
                  <div className="w-20 h-20 bg-brand-50 rounded-2xl flex items-center justify-center mb-5 border border-brand/10">
                    <Box className="w-10 h-10 text-brand/40" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-1.5 font-mono">Ready to Scan</h3>
                  <p className="text-muted-foreground text-sm max-w-xs">
                    Scan a barcode or search for a product to begin
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 p-4 hover:bg-brand-50/30 transition-colors"
                    >
                      <div className="w-10 h-10 bg-brand-50 border border-brand/10 rounded-xl flex items-center justify-center text-brand font-bold font-mono text-sm">
                        ×{item.quantity}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground truncate text-sm">{item.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">
                          KES {item.price.toLocaleString()} / {item.unit}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => updateQuantity(item.id, -1)}
                          className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-gray-100 rounded-lg"
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => updateQuantity(item.id, 1)}
                          className="h-8 w-8 text-brand hover:bg-brand-50 rounded-lg"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFromCart(item.id)}
                          className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50 ml-1 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="text-right min-w-[90px]">
                        <p className="font-bold text-foreground font-mono text-sm">
                          KES {(item.price * item.quantity).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Product Grid (Toggleable) */}
          {showProductList && (
            <Card className="h-1/2 border-0 shadow-sm flex flex-col overflow-hidden">
              <CardHeader className="py-3 px-4 flex flex-row items-center justify-between border-b">
                <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Available Inventory
                </CardTitle>
                <div className="flex gap-2">
                  <div className="relative w-48">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[#6B7A72]" />
                    <Input
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-7 h-8 text-xs"
                    />
                  </div>
                  <select
                    value={activeCategory}
                    onChange={(e) => setActiveCategory(e.target.value)}
                    className="h-8 px-2 rounded-md border border-input bg-background text-xs"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c.charAt(0).toUpperCase() + c.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-auto p-3">
                {isLoading ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                      <div key={i} className="h-20 skeleton-shimmer rounded-xl" />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {filteredProducts.map((product) => {
                      const stock = product.stock_level ?? 0;
                      const stockLabel = stock === 0 ? 'Out' : stock <= 5 ? `${stock} low` : `${stock}`;
                      const stockClass = stock === 0
                        ? 'bg-red-50 text-red-600'
                        : stock <= 5
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-emerald-50 text-emerald-700';
                      return (
                        <button
                          key={product.id}
                          onClick={() => addToCart(product)}
                          disabled={stock === 0}
                          className="p-2.5 bg-background border border-gray-100 hover:border-brand/20 hover:bg-brand-50/40 rounded-xl text-left transition-all flex flex-col justify-between group h-20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <p className="text-xs font-semibold text-foreground line-clamp-2 leading-tight">
                            {product.name}
                          </p>
                          <div className="flex justify-between items-end mt-1">
                            <span className="text-[10px] font-bold text-brand font-mono">
                              KES {parseDecimal(product.price).toLocaleString()}
                            </span>
                            <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${stockClass}`}>
                              {stockLabel}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Side - Checkout Summary */}
        <div className="w-80 flex flex-col gap-6">
          <Card className="border border-gray-100 shadow-sm overflow-hidden flex flex-col rounded-2xl">
            <CardHeader className="py-4 px-5 border-b border-gray-100">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Checkout Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5 px-5 pb-5">
              {/* Total display */}
              <div className="bg-brand rounded-2xl p-5 mb-5 text-white">
                <p className="text-[10px] font-semibold text-white/60 uppercase tracking-widest mb-1">Total Payable</p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-lg font-bold text-white/80">KES</span>
                  <span className="text-4xl font-black tracking-tight font-mono">
                    {Math.max(0, total).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Line items */}
              <div className="space-y-2 mb-5 border-t border-dashed border-gray-200 pt-4">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground uppercase font-semibold tracking-wide">Subtotal</span>
                  <span className="text-foreground font-mono font-semibold">KES {subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground uppercase font-semibold tracking-wide">VAT (16%)</span>
                  <span className="text-foreground font-mono font-semibold">KES {tax.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-emerald-600 uppercase font-semibold tracking-wide">Discount</span>
                    <span className="text-emerald-600 font-mono font-semibold">-KES {discount.toLocaleString()}</span>
                  </div>
                )}
                {redeemPoints > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-gold uppercase font-semibold tracking-wide">Points Redeemed</span>
                    <span className="text-gold font-mono font-semibold">-KES {redeemPoints.toLocaleString()}</span>
                  </div>
                )}
              </div>

              {/* Payment buttons */}
              <div className="grid grid-cols-1 gap-2.5">
                <Button
                  onClick={() => { setPaymentMethod('cash'); setIsCheckoutOpen(true); }}
                  disabled={cart.length === 0}
                  className="w-full bg-brand hover:bg-brand-600 text-white h-13 text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2.5 shadow-brand rounded-xl border-0"
                >
                  <Banknote className="w-5 h-5" />
                  Cash
                </Button>
                <Button
                  onClick={() => { setPaymentMethod('mpesa'); setIsCheckoutOpen(true); }}
                  disabled={cart.length === 0}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-13 text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2.5 shadow-sm rounded-xl border-0"
                >
                  <Smartphone className="w-5 h-5" />
                  M-Pesa
                </Button>
                <Button
                  onClick={() => { setPaymentMethod('card'); setIsCheckoutOpen(true); }}
                  disabled={cart.length === 0}
                  className="w-full bg-slate-500 hover:bg-slate-600 text-white h-13 text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2.5 shadow-sm rounded-xl border-0"
                >
                  <CreditCard className="w-5 h-5" />
                  Card
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Checkout Dialog */}
      <Dialog
        open={isCheckoutOpen}
        onOpenChange={(open) => {
          if (!open) setMpesaCheckoutId(null);
          setIsCheckoutOpen(open);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">Complete Sale</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* Customer Info */}
            <div className="space-y-3">
              <Input
                placeholder="Customer name (optional)"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="rounded-xl"
              />
              <Input
                placeholder="Phone number (optional)"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="rounded-xl"
              />

              {/* Registered Customer Search */}
              {!selectedCustomer ? (
                <div className="relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Find registered customer…"
                      value={customerSearch}
                      onChange={(e) => {
                        setCustomerSearch(e.target.value);
                        setShowCustomerDropdown(true);
                      }}
                      className="pl-8 rounded-xl"
                    />
                  </div>
                  {showCustomerDropdown && customerSearchResults.length > 0 && (
                    <div className="absolute z-50 w-full bg-white border border-gray-100 rounded-xl shadow-glass mt-1 max-h-40 overflow-auto">
                      {customerSearchResults.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          className="w-full text-left px-3 py-2.5 hover:bg-brand-50 transition-colors border-b border-gray-50 last:border-0 first:rounded-t-xl last:rounded-b-xl"
                          onClick={() => {
                            setSelectedCustomer(c);
                            setCustomerName(c.name);
                            setCustomerPhone(c.phone);
                            setRedeemPoints(0);
                            setShowCustomerDropdown(false);
                          }}
                        >
                          <span className="text-sm font-medium text-foreground">{c.name}</span>
                          <span className="text-xs text-muted-foreground ml-2">{c.phone}</span>
                          <span className="float-right text-xs font-bold text-gold">
                            ★ {c.loyalty_points} pts
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                /* Selected customer badge */
                <div className="flex items-center justify-between bg-gold/10 border border-gold/30 rounded-xl px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-gold fill-gold" />
                    <div>
                      <span className="text-sm font-semibold text-foreground">{selectedCustomer.name}</span>
                      <span className="text-xs text-muted-foreground ml-2">{selectedCustomer.phone}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gold font-mono">
                      {selectedCustomer.loyalty_points} pts
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCustomer(null);
                        setCustomerSearch('');
                        setRedeemPoints(0);
                      }}
                      className="text-muted-foreground hover:text-red-500 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Redeem Points */}
              {selectedCustomer && selectedCustomer.loyalty_points > 0 && (
                <div className="bg-brand-50 border border-brand/10 rounded-xl p-3 space-y-2">
                  <p className="text-xs font-semibold text-foreground uppercase tracking-wide">
                    Redeem Loyalty Points
                  </p>
                  <div className="flex items-center gap-3">
                    <Input
                      type="number"
                      min={0}
                      max={selectedCustomer.loyalty_points}
                      placeholder="0"
                      value={redeemPoints || ''}
                      onChange={(e) =>
                        setRedeemPoints(
                          Math.min(Math.max(0, Number(e.target.value)), selectedCustomer.loyalty_points)
                        )
                      }
                      className="w-28 bg-white"
                    />
                    {redeemPoints > 0 ? (
                      <span className="text-sm font-semibold text-green-600">
                        = KES {redeemPoints.toLocaleString()} off
                      </span>
                    ) : (
                      <span className="text-xs text-[#6B7A72]">
                        up to {selectedCustomer.loyalty_points} pts (KES {selectedCustomer.loyalty_points.toLocaleString()})
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Payment Method */}
            <div>
              <p className="text-sm font-semibold text-foreground mb-2">Payment Method</p>
              <div className="grid grid-cols-3 gap-2">
                {paymentMethods.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => {
                      setPaymentMethod(method.id);
                      setMpesaCheckoutId(null);
                    }}
                    className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1.5 transition-all text-sm font-medium ${
                      paymentMethod === method.id
                        ? 'border-brand bg-brand text-white shadow-brand'
                        : 'border-gray-200 text-muted-foreground hover:border-brand/30 hover:bg-brand-50'
                    }`}
                  >
                    <method.icon className="w-5 h-5" />
                    <span className="text-xs font-semibold">{method.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* M-Pesa STK Push Section */}
            {paymentMethod === 'mpesa' && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-3">
                <p className="text-sm font-semibold text-emerald-800 flex items-center gap-2">
                  <Smartphone className="w-4 h-4" />
                  M-Pesa STK Push
                </p>
                {!mpesaCheckoutId ? (
                  <>
                    <Input
                      placeholder="M-Pesa phone (e.g. 0712 345 678)"
                      value={mpesaPhone || customerPhone}
                      onChange={(e) => setMpesaPhone(e.target.value)}
                      className="bg-white rounded-xl"
                    />
                    <Button
                      onClick={handleSendSTKPush}
                      disabled={stkPushMutation.isPending}
                      className="w-full bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl"
                    >
                      {stkPushMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Sending…
                        </>
                      ) : (
                        <>
                          <Smartphone className="w-4 h-4 mr-2" />
                          Send STK Push · <span className="font-mono ml-1">KES {Math.ceil(total).toLocaleString()}</span>
                        </>
                      )}
                    </Button>
                  </>
                ) : mpesaStatus?.status === 'success' ? (
                  <div className="flex items-center gap-2 text-emerald-700 font-semibold">
                    <CheckCircle className="w-5 h-5" />
                    Payment confirmed — completing sale…
                  </div>
                ) : mpesaStatus?.status === 'failed' || mpesaStatus?.status === 'cancelled' ? (
                  <div className="flex items-center gap-2 text-red-600">
                    <XCircle className="w-5 h-5" />
                    <span className="text-sm">Payment unsuccessful. Please try again or use cash.</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-emerald-700">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm font-medium">Waiting for M-Pesa confirmation…</span>
                  </div>
                )}
              </div>
            )}

            {/* Discount */}
            <div>
              <p className="text-sm font-semibold text-foreground mb-2">Discount (KES)</p>
              <Input
                type="number"
                placeholder="0"
                value={discount || ''}
                onChange={(e) => setDiscount(Number(e.target.value))}
                className="rounded-xl"
              />
            </div>

            {/* Total */}
            <div className="bg-brand-50 border border-brand/10 p-4 rounded-xl">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Total Amount</span>
                <span className="text-2xl font-black text-brand font-mono">
                  KES {Math.max(0, total).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Process Payment (cash/card only — M-Pesa uses STK Push above) */}
            {paymentMethod !== 'mpesa' && (
              <Button
                onClick={completeSale}
                disabled={createSaleMutation.isPending}
                className="w-full bg-gold hover:bg-gold-dark text-brand-900 h-12 font-bold rounded-xl shadow-gold disabled:opacity-50"
              >
                {createSaleMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing…
                  </>
                ) : (
                  'Process Payment'
                )}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Barcode Scanner Dialog */}
      <Dialog
        open={isScanDialogOpen}
        onOpenChange={(open) => {
          if (!open) stopCamera();
          setIsScanDialogOpen(open);
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ScanLine className="w-5 h-5 text-brand" />
              Scan Barcode
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <video
              ref={videoRef}
              className="w-full rounded-xl bg-black"
              style={{ maxHeight: 300 }}
              muted
              playsInline
            />
            <p className="text-xs text-center text-muted-foreground">
              Point the camera at a product barcode or QR code
            </p>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                stopCamera();
                setIsScanDialogOpen(false);
              }}
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

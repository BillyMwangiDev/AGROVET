import { useState } from 'react';
import { Save, Printer, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useStoreSettings, useUpdateStoreSettings } from '@/hooks/useSettings';
import { useStoreConfig, useUpdateStoreConfig } from '@/hooks/useStoreConfig';
import { generateTestReceiptHtml } from '@/utils/receipt';

type Tab = 'general' | 'mpesa' | 'staff' | 'printer';

function printTestReceipt() {
  const html = generateTestReceiptHtml();
  const win = window.open('', '_blank', 'width=400,height=600');
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  win.print();
}

export default function StoreSettings() {
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const [showMpesaSecret, setShowMpesaSecret] = useState(false);
  const [showPasskey, setShowPasskey] = useState(false);

  const { data: settings, isLoading } = useStoreSettings();
  const { data: config } = useStoreConfig();
  const updateSettings = useUpdateStoreSettings();
  const updateConfig = useUpdateStoreConfig();

  const [form, setForm] = useState<Record<string, string | boolean>>({});

  function field(key: string) {
    return form[key] !== undefined ? String(form[key]) : String((settings as unknown as Record<string, unknown>)?.[key] ?? '');
  }

  function boolField(key: string) {
    return form[key] !== undefined ? Boolean(form[key]) : Boolean((settings as unknown as Record<string, unknown>)?.[key]);
  }

  function set(key: string, value: string | boolean) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  async function save() {
    if (activeTab === 'general') {
      await updateSettings.mutateAsync({
        business_name: field('business_name'),
        tax_rate: field('tax_rate'),
        currency: field('currency'),
        receipt_footer: field('receipt_footer'),
      });
    } else if (activeTab === 'mpesa') {
      await updateSettings.mutateAsync({
        mpesa_consumer_key: field('mpesa_consumer_key'),
        mpesa_consumer_secret: field('mpesa_consumer_secret'),
        mpesa_shortcode: field('mpesa_shortcode'),
        mpesa_passkey: field('mpesa_passkey'),
        mpesa_callback_url: field('mpesa_callback_url'),
        enable_etims: boolField('enable_etims'),
      });
    } else if (activeTab === 'staff') {
      await updateConfig.mutateAsync({
        staff_limit: parseInt(field('staff_limit')) || 10,
        idle_timeout_minutes: parseInt(field('idle_timeout_minutes')) || 5,
      });
    }
    toast.success('Settings saved');
    setForm({});
  }

  const TABS: { id: Tab; label: string }[] = [
    { id: 'general', label: 'General' },
    { id: 'mpesa', label: 'M-Pesa' },
    { id: 'staff', label: 'Staff' },
    { id: 'printer', label: 'Printer' },
  ];

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Loading settings…</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Store Settings</h1>
        <p className="text-muted-foreground">Configure your store preferences</p>
      </div>

      {/* Tab Nav */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-white text-brand shadow-sm rounded-md'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* General Tab */}
      {activeTab === 'general' && (
        <Card className="border-0 shadow-sm max-w-lg">
          <CardHeader>
            <CardTitle className="text-base font-bold text-foreground">Business Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Business Name</label>
              <Input
                value={field('business_name')}
                onChange={(e) => set('business_name', e.target.value)}
                placeholder="Nicmah Agrovet"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Currency</label>
                <Input
                  value={field('currency')}
                  onChange={(e) => set('currency', e.target.value)}
                  placeholder="KES"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">VAT Rate (%)</label>
                <Input
                  type="number"
                  value={field('tax_rate')}
                  onChange={(e) => set('tax_rate', e.target.value)}
                  placeholder="16"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Receipt Footer</label>
              <textarea
                className="w-full border rounded-md p-2 text-sm h-20 resize-none focus:outline-none focus:ring-2 focus:ring-brand"
                value={field('receipt_footer')}
                onChange={(e) => set('receipt_footer', e.target.value)}
                placeholder="Thank you for shopping with us!"
              />
            </div>
            <Button onClick={save} className="bg-brand hover:bg-brand-600 text-white shadow-sm rounded-xl">
              <Save className="w-4 h-4 mr-2" /> Save Changes
            </Button>
          </CardContent>
        </Card>
      )}

      {/* M-Pesa Tab */}
      {activeTab === 'mpesa' && (
        <Card className="border-0 shadow-sm max-w-lg">
          <CardHeader>
            <CardTitle className="text-base font-bold text-foreground">Daraja API Credentials</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Consumer Key</label>
              <Input
                value={field('mpesa_consumer_key')}
                onChange={(e) => set('mpesa_consumer_key', e.target.value)}
                placeholder="From Safaricom portal"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Consumer Secret</label>
              <div className="relative">
                <Input
                  type={showMpesaSecret ? 'text' : 'password'}
                  value={field('mpesa_consumer_secret')}
                  onChange={(e) => set('mpesa_consumer_secret', e.target.value)}
                  placeholder="••••••••"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowMpesaSecret(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showMpesaSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Business Short Code</label>
              <Input
                value={field('mpesa_shortcode')}
                onChange={(e) => set('mpesa_shortcode', e.target.value)}
                placeholder="174379"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Passkey</label>
              <div className="relative">
                <Input
                  type={showPasskey ? 'text' : 'password'}
                  value={field('mpesa_passkey')}
                  onChange={(e) => set('mpesa_passkey', e.target.value)}
                  placeholder="••••••••"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPasskey(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPasskey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Callback URL</label>
              <Input
                value={field('mpesa_callback_url')}
                onChange={(e) => set('mpesa_callback_url', e.target.value)}
                placeholder="https://your-domain.com/api/pos/mpesa/callback/"
              />
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <input
                type="checkbox"
                id="enable_etims"
                checked={boolField('enable_etims')}
                onChange={(e) => set('enable_etims', e.target.checked)}
                className="w-4 h-4 accent-brand"
              />
              <div>
                <label htmlFor="enable_etims" className="text-sm font-medium text-foreground cursor-pointer">
                  Enable eTIMS
                </label>
                <p className="text-xs text-muted-foreground">KRA electronic invoicing integration</p>
              </div>
            </div>
            <Button onClick={save} className="bg-brand hover:bg-brand-600 text-white shadow-sm rounded-xl">
              <Save className="w-4 h-4 mr-2" /> Save Credentials
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Staff Tab */}
      {activeTab === 'staff' && (
        <Card className="border-0 shadow-sm max-w-lg">
          <CardHeader>
            <CardTitle className="text-base font-bold text-foreground">Staff Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Staff Limit</label>
              <Input
                type="number"
                value={form['staff_limit'] !== undefined ? String(form['staff_limit']) : String(config?.staff_limit ?? 10)}
                onChange={(e) => set('staff_limit', e.target.value)}
                min={1}
                max={100}
              />
              <p className="text-xs text-muted-foreground mt-1">Maximum number of staff accounts allowed</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Idle Timeout (minutes)</label>
              <Input
                type="number"
                value={form['idle_timeout_minutes'] !== undefined ? String(form['idle_timeout_minutes']) : String(config?.idle_timeout_minutes ?? 5)}
                onChange={(e) => set('idle_timeout_minutes', e.target.value)}
                min={1}
                max={60}
              />
              <p className="text-xs text-muted-foreground mt-1">Lock screen after this many minutes of inactivity</p>
            </div>
            <Button onClick={save} className="bg-brand hover:bg-brand-600 text-white shadow-sm rounded-xl">
              <Save className="w-4 h-4 mr-2" /> Save Changes
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Printer Tab */}
      {activeTab === 'printer' && (
        <Card className="border-0 shadow-sm max-w-lg">
          <CardHeader>
            <CardTitle className="text-base font-bold text-foreground">Receipt Printer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-foreground font-medium mb-1">80mm Thermal Receipt</p>
              <p className="text-xs text-muted-foreground">
                The POS uses your browser's print dialog. Make sure your thermal printer is set as the default printer
                with 80mm paper width and no margins.
              </p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm font-medium text-blue-800 mb-1">Recommended Settings</p>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• Paper size: 80mm × auto</li>
                <li>• Margins: None</li>
                <li>• Scale: 100%</li>
                <li>• Background graphics: On</li>
              </ul>
            </div>
            <Button onClick={printTestReceipt} variant="outline" className="border-brand text-brand">
              <Printer className="w-4 h-4 mr-2" /> Print Test Receipt
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

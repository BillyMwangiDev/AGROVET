import { useState, useCallback, useRef } from 'react';
import { Upload, FileSpreadsheet, Check, X, AlertCircle, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { importExcel } from '@/api/import';
import { useQueryClient } from '@tanstack/react-query';

interface PreviewRow {
  name: string;
  category: string;
  price: number;
  stock: number;
  unit: string;
  minStock: number;
  maxStock: number;
  supplier: string;
  description: string;
  valid: boolean;
  errors?: string[];
}

export default function ExcelImport() {
  const [isDragging, setIsDragging] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const rawFileRef = useRef<File | null>(null);
  const queryClient = useQueryClient();

  const validateRow = (row: any): PreviewRow => {
    const errors: string[] = [];
    
    if (!row.name || row.name.trim() === '') {
      errors.push('Name is required');
    }
    if (!row.category || row.category.trim() === '') {
      errors.push('Category is required');
    }
    if (!row.price || isNaN(Number(row.price)) || Number(row.price) <= 0) {
      errors.push('Valid price is required');
    }
    if (row.stock === undefined || isNaN(Number(row.stock))) {
      errors.push('Valid stock quantity is required');
    }
    if (!row.unit || row.unit.trim() === '') {
      errors.push('Unit is required');
    }

    return {
      name: row.name || '',
      category: row.category || '',
      price: Number(row.price) || 0,
      stock: Number(row.stock) || 0,
      unit: row.unit || '',
      minStock: Number(row.minStock) || 10,
      maxStock: Number(row.maxStock) || 100,
      supplier: row.supplier || '',
      description: row.description || '',
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  };

  const processFile = useCallback((file: File) => {
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls') && !file.name.endsWith('.csv')) {
      toast.error('Please upload an Excel file (.xlsx, .xls) or CSV');
      return;
    }

    rawFileRef.current = file;
    setFileName(file.name);
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length === 0) {
          toast.error('The file appears to be empty');
          return;
        }

        const validated = jsonData.map(validateRow);
        setPreviewData(validated);

        const validCount = validated.filter((r) => r.valid).length;
        toast.success(`Loaded ${validCount} valid products out of ${validated.length} rows`);
      } catch (error) {
        toast.error('Error reading file. Please check the format.');
      }
    };

    reader.readAsBinaryString(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleImport = async () => {
    const validRows = previewData.filter((row) => row.valid);
    if (validRows.length === 0) {
      toast.error('No valid rows to import');
      return;
    }
    if (!rawFileRef.current) {
      toast.error('No file selected');
      return;
    }

    setIsImporting(true);
    try {
      const result = await importExcel(rawFileRef.current);
      toast.success(`Imported ${result.imported} products${result.skipped ? `, skipped ${result.skipped}` : ''}`);
      if (result.errors.length > 0) {
        toast.error(`${result.errors.length} rows had errors — check your data`);
      }
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setPreviewData([]);
      setFileName('');
      rawFileRef.current = null;
    } catch (err: any) {
      toast.error(err?.response?.data?.detail ?? 'Import failed. Check your file and try again.');
    } finally {
      setIsImporting(false);
    }
  };

  const downloadTemplate = () => {
    const template = [
      {
        name: 'Dairy Meal',
        category: 'feeds',
        price: 2800,
        stock: 150,
        unit: '50kg bag',
        minStock: 50,
        maxStock: 300,
        supplier: 'Unga Feeds Ltd',
        description: 'High-quality dairy meal',
      },
      {
        name: 'Maize Seeds',
        category: 'seeds',
        price: 450,
        stock: 500,
        unit: '2kg packet',
        minStock: 200,
        maxStock: 1000,
        supplier: 'Kenya Seed Company',
        description: 'Certified maize seeds',
      },
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, 'nicmah_inventory_template.xlsx');
    toast.success('Template downloaded!');
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Excel Import</h1>
        <p className="text-muted-foreground">Bulk import products from Excel spreadsheets</p>
      </div>

      {/* Instructions */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">How to import</h3>
              <ol className="text-sm text-muted-foreground mt-2 space-y-1 list-decimal list-inside">
                <li>Download the template file below</li>
                <li>Fill in your product data (name, category, price, stock, unit)</li>
                <li>Save as .xlsx or .csv format</li>
                <li>Drag and drop or click to upload</li>
                <li>Review the preview and click Import</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Download Template */}
      <div className="flex justify-center">
        <Button
          onClick={downloadTemplate}
          variant="outline"
          className="border-brand text-brand"
        >
          <Download className="w-4 h-4 mr-2" />
          Download Template
        </Button>
      </div>

      {/* Upload Zone */}
      {!previewData.length && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all ${
            isDragging
              ? 'border-brand bg-brand-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center mx-auto mb-4">
            <Upload className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Drag and drop your Excel file
          </h3>
          <p className="text-muted-foreground mb-4">or click to browse files</p>
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileInput}
            className="hidden"
            id="file-upload"
          />
          <label htmlFor="file-upload">
            <Button variant="outline" className="cursor-pointer" asChild>
              <span>Select File</span>
            </Button>
          </label>
        </div>
      )}

      {/* Preview Table */}
      {previewData.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold text-foreground">
                  Preview: {fileName}
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {previewData.filter((r) => r.valid).length} valid,{' '}
                  {previewData.filter((r) => !r.valid).length} with errors
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setPreviewData([]);
                    setFileName('');
                  }}
                >
                  <X className="w-4 h-4 mr-2" />
                  Clear
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={
                    isImporting || previewData.filter((r) => r.valid).length === 0
                  }
                  className="bg-brand hover:bg-brand-600 text-white shadow-sm rounded-xl"
                >
                  {isImporting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Import {previewData.filter((r) => r.valid).length} Products
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <table className="w-full">
                <thead className="bg-brand-50 sticky top-0">
                  <tr>
                    <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                    <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Name</th>
                    <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Category</th>
                    <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Price</th>
                    <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Stock</th>
                    <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Unit</th>
                    <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Supplier</th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.map((row, index) => (
                    <tr
                      key={index}
                      className={`border-t hover:bg-brand-50/30 transition-colors ${
                        !row.valid ? 'bg-red-50/50' : ''
                      }`}
                    >
                      <td className="p-3">
                        {row.valid ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            <Check className="w-3 h-3" />
                            Valid
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 cursor-help"
                            title={row.errors?.join(', ')}
                          >
                            <X className="w-3 h-3" />
                            Error
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        <span className={!row.valid ? 'text-red-600' : ''}>{row.name}</span>
                      </td>
                      <td className="p-3 capitalize">{row.category}</td>
                      <td className="p-3 font-mono">KES {row.price.toLocaleString()}</td>
                      <td className="p-3">{row.stock}</td>
                      <td className="p-3">{row.unit}</td>
                      <td className="p-3 text-sm text-muted-foreground">{row.supplier}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Required Fields */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-foreground">
            Required Fields
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { field: 'name', desc: 'Product name' },
              { field: 'category', desc: 'feeds, seeds, chemicals, semen' },
              { field: 'price', desc: 'Price in KES' },
              { field: 'stock', desc: 'Current stock quantity' },
              { field: 'unit', desc: 'e.g., 50kg bag, straw' },
              { field: 'minStock', desc: 'Minimum stock threshold' },
              { field: 'maxStock', desc: 'Maximum stock capacity' },
              { field: 'supplier', desc: 'Supplier name' },
              { field: 'description', desc: 'Product description' },
            ].map(({ field, desc }) => (
              <div key={field} className="flex items-center gap-3 p-3 bg-background rounded-xl">
                <FileSpreadsheet className="w-5 h-5 text-brand" />
                <div>
                  <p className="font-medium text-foreground capitalize">{field}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

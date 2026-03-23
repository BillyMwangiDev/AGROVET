import { createContext, useContext, useState, type ReactNode } from 'react';

interface POSContextType {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  barcodeValue: string;
  setBarcodeValue: (value: string) => void;
}

const POSContext = createContext<POSContextType | undefined>(undefined);

export function POSProvider({ children }: { children: ReactNode }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [barcodeValue, setBarcodeValue] = useState('');

  return (
    <POSContext.Provider value={{ searchQuery, setSearchQuery, barcodeValue, setBarcodeValue }}>
      {children}
    </POSContext.Provider>
  );
}

export function usePOSContext() {
  const context = useContext(POSContext);
  if (context === undefined) {
    throw new Error('usePOSContext must be used within a POSProvider');
  }
  return context;
}

import { useState, useEffect, useCallback } from 'react';

export interface SaleDataPoint {
  time: string;
  sales: number;
}

export interface LatestPayment {
  id: string;
  amount: number;
  product: string;
  customer: string;
  time: string;
}

interface RealtimeSalesData {
  totalRevenue: number;
  cumulativeRevenueData: SaleDataPoint[];
  salesCount: number;
  averageSale: number;
  salesChartData: SaleDataPoint[];
  latestPayments: LatestPayment[];
}

const PRODUCTS = [
  'Maize Seeds (5kg)',
  'NPK Fertilizer (50kg)',
  'Herbicide 1L',
  'Dairy Meal (70kg)',
  'Layer Mash (50kg)',
  'Cattle Dip 1L',
  'Poultry Vaccine',
  'Acaricide 500ml',
  'Sunflower Seeds (2kg)',
  'Grass Seeds (1kg)',
];

const CUSTOMERS = [
  'John Kamau',
  'Mary Wanjiku',
  'Peter Njoroge',
  'Grace Muthoni',
  'James Mwangi',
  'Alice Wairimu',
  'David Kariuki',
  'Susan Wambui',
  'Robert Gitau',
  'Elizabeth Nyambura',
];

const getTimeString = (): string => {
  const now = new Date();
  return now.toTimeString().slice(0, 8); // HH:MM:SS
};

const randomAmount = (): number => {
  // Realistic agrovet sale amounts (KES equivalent shown as USD for demo)
  const amounts = [15, 25, 40, 55, 80, 120, 200, 350, 500, 750];
  return amounts[Math.floor(Math.random() * amounts.length)] + Math.random() * 10;
};

const generateId = (): string =>
  Math.random().toString(36).slice(2, 10);

export function useRealtimeSalesData(): RealtimeSalesData {
  const [salesChartData, setSalesChartData] = useState<SaleDataPoint[]>([]);
  const [cumulativeRevenueData, setCumulativeRevenueData] = useState<SaleDataPoint[]>([]);
  const [latestPayments, setLatestPayments] = useState<LatestPayment[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [salesCount, setSalesCount] = useState(0);

  const addSale = useCallback(() => {
    const amount = randomAmount();
    const time = getTimeString();
    const product = PRODUCTS[Math.floor(Math.random() * PRODUCTS.length)];
    const customer = CUSTOMERS[Math.floor(Math.random() * CUSTOMERS.length)];

    // Update sales chart (per-second snapshot)
    setSalesChartData(prev => {
      const updated = [...prev, { time, sales: amount }];
      return updated.slice(-60); // keep last 60 data points
    });

    // Update cumulative revenue chart
    setTotalRevenue(prev => {
      const newTotal = prev + amount;

      setCumulativeRevenueData(prevData => {
        const updated = [...prevData, { time, sales: newTotal }];
        return updated.slice(-60);
      });

      return newTotal;
    });

    setSalesCount(prev => prev + 1);

    // Update latest payments (keep last 10)
    setLatestPayments(prev => {
      const newPayment: LatestPayment = {
        id: generateId(),
        amount,
        product,
        customer,
        time,
      };
      return [newPayment, ...prev].slice(0, 10);
    });
  }, []);

  useEffect(() => {
    // Seed with initial data points
    const seed = () => {
      const now = new Date();
      let cumulative = 0;
      const initialSales: SaleDataPoint[] = [];
      const initialCumulative: SaleDataPoint[] = [];
      const initialPayments: LatestPayment[] = [];

      for (let i = 20; i >= 1; i--) {
        const t = new Date(now.getTime() - i * 3000);
        const time = t.toTimeString().slice(0, 8);
        const amount = randomAmount();
        cumulative += amount;

        initialSales.push({ time, sales: amount });
        initialCumulative.push({ time, sales: cumulative });

        if (i <= 10) {
          initialPayments.push({
            id: generateId(),
            amount,
            product: PRODUCTS[Math.floor(Math.random() * PRODUCTS.length)],
            customer: CUSTOMERS[Math.floor(Math.random() * CUSTOMERS.length)],
            time,
          });
        }
      }

      setSalesChartData(initialSales);
      setCumulativeRevenueData(initialCumulative);
      setLatestPayments(initialPayments);
      setTotalRevenue(cumulative);
      setSalesCount(20);
    };

    seed();

    // New sale every 2–4 seconds
    const scheduleNext = () => {
      const delay = 2000 + Math.random() * 2000;
      return setTimeout(() => {
        addSale();
        timerRef = scheduleNext();
      }, delay);
    };

    let timerRef = scheduleNext();

    return () => clearTimeout(timerRef);
  }, [addSale]);

  const averageSale = salesCount > 0 ? totalRevenue / salesCount : 0;

  return {
    totalRevenue,
    cumulativeRevenueData,
    salesCount,
    averageSale,
    salesChartData,
    latestPayments,
  };
}

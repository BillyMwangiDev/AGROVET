/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck — legacy mock data, not imported by any component
import type { Product, AIRecord, Customer } from '@/types';

export const products: Product[] = [
  {
    id: '1',
    name: 'Dairy Meal',
    category: 'feeds',
    price: 2800,
    stock: 150,
    unit: '50kg bag',
    image: '/images/product_feeds_sack.jpg',
    description: 'High-quality dairy meal for maximum milk production'
  },
  {
    id: '2',
    name: 'Chick Mash',
    category: 'feeds',
    price: 1800,
    stock: 80,
    unit: '50kg bag',
    description: 'Nutritious starter feed for chicks'
  },
  {
    id: '3',
    name: 'Growers Pellets',
    category: 'feeds',
    price: 2200,
    stock: 45,
    unit: '50kg bag',
    description: 'Balanced feed for growing poultry'
  },
  {
    id: '4',
    name: 'Mineral Supplement',
    category: 'feeds',
    price: 850,
    stock: 200,
    unit: '5kg block',
    description: 'Essential minerals for livestock health'
  },
  {
    id: '5',
    name: 'Certified Maize Seeds',
    category: 'seeds',
    price: 450,
    stock: 500,
    unit: '2kg packet',
    image: '/images/product_seeds_packet.jpg',
    description: 'High-yielding maize variety for local conditions'
  },
  {
    id: '6',
    name: 'Bean Seeds - Rosecoco',
    category: 'seeds',
    price: 380,
    stock: 300,
    unit: '2kg packet',
    description: 'Drought-tolerant bean variety'
  },
  {
    id: '7',
    name: 'Vegetable Seeds Mix',
    category: 'seeds',
    price: 250,
    stock: 150,
    unit: 'assorted packet',
    description: 'Mix of kale, spinach, and cabbage seeds'
  },
  {
    id: '8',
    name: 'NPK Fertilizer',
    category: 'chemicals',
    price: 3200,
    stock: 120,
    unit: '50kg bag',
    description: 'Balanced NPK fertilizer for all crops'
  },
  {
    id: '9',
    name: 'Pesticide - General',
    category: 'chemicals',
    price: 1200,
    stock: 75,
    unit: '1L bottle',
    description: 'Broad-spectrum pest control'
  },
  {
    id: '10',
    name: 'Friesian Semen - High Yield',
    category: 'semen',
    price: 8500,
    stock: 25,
    unit: 'straw',
    image: '/images/product_ai_cow.jpg',
    description: 'Premium Friesian genetics for high milk production'
  },
  {
    id: '11',
    name: 'Jersey Semen - Butterfat',
    category: 'semen',
    price: 9200,
    stock: 18,
    unit: 'straw',
    description: 'Jersey genetics for high butterfat content'
  },
  {
    id: '12',
    name: 'Ayrshire Semen - Hardy',
    category: 'semen',
    price: 7800,
    stock: 30,
    unit: 'straw',
    description: 'Hardy Ayrshire breed for tough conditions'
  }
];

export const semenProducts: SemenProduct[] = [
  {
    id: '10',
    name: 'Friesian Semen - High Yield',
    category: 'semen',
    price: 8500,
    stock: 25,
    unit: 'straw',
    image: '/images/product_ai_cow.jpg',
    description: 'Premium Friesian genetics for high milk production',
    breed: 'Friesian',
    origin: 'International',
    traits: {
      milkYield: '12,000L+ per lactation',
      hardiness: 'Moderate',
      fertility: '95% conception rate',
      longevity: '5+ lactations'
    },
    sireCode: 'FR-2024-001'
  },
  {
    id: '11',
    name: 'Jersey Semen - Butterfat',
    category: 'semen',
    price: 9200,
    stock: 18,
    unit: 'straw',
    description: 'Jersey genetics for high butterfat content',
    breed: 'Jersey',
    origin: 'International',
    traits: {
      milkYield: '7,000L+ per lactation',
      hardiness: 'High',
      fertility: '92% conception rate',
      longevity: '6+ lactations'
    },
    sireCode: 'JR-2024-003'
  },
  {
    id: '12',
    name: 'Ayrshire Semen - Hardy',
    category: 'semen',
    price: 7800,
    stock: 30,
    unit: 'straw',
    description: 'Hardy Ayrshire breed for tough conditions',
    breed: 'Ayrshire',
    origin: 'Local',
    traits: {
      milkYield: '8,500L+ per lactation',
      hardiness: 'Very High',
      fertility: '94% conception rate',
      longevity: '7+ lactations'
    },
    sireCode: 'AY-2024-002'
  },
  {
    id: '13',
    name: 'Guernsey Semen - Premium',
    category: 'semen',
    price: 9800,
    stock: 12,
    unit: 'straw',
    description: 'Premium Guernsey genetics for golden milk',
    breed: 'Guernsey',
    origin: 'International',
    traits: {
      milkYield: '6,500L+ per lactation',
      hardiness: 'High',
      fertility: '93% conception rate',
      longevity: '6+ lactations'
    },
    sireCode: 'GU-2024-004'
  }
];

export const inventory: InventoryItem[] = [
  {
    id: '1',
    name: 'Dairy Meal',
    category: 'feeds',
    price: 2800,
    stock: 150,
    minStock: 50,
    maxStock: 300,
    unit: '50kg bag',
    lastRestocked: new Date('2024-01-15'),
    supplier: 'Unga Feeds Ltd',
    description: 'High-quality dairy meal for maximum milk production'
  },
  {
    id: '2',
    name: 'Chick Mash',
    category: 'feeds',
    price: 1800,
    stock: 80,
    minStock: 100,
    maxStock: 250,
    unit: '50kg bag',
    lastRestocked: new Date('2024-01-10'),
    supplier: 'Unga Feeds Ltd',
    description: 'Nutritious starter feed for chicks'
  },
  {
    id: '3',
    name: 'Growers Pellets',
    category: 'feeds',
    price: 2200,
    stock: 45,
    minStock: 60,
    maxStock: 200,
    unit: '50kg bag',
    lastRestocked: new Date('2024-01-12'),
    supplier: 'Unga Feeds Ltd',
    description: 'Balanced feed for growing poultry'
  },
  {
    id: '4',
    name: 'Mineral Supplement',
    category: 'feeds',
    price: 850,
    stock: 200,
    minStock: 100,
    maxStock: 400,
    unit: '5kg block',
    lastRestocked: new Date('2024-01-18'),
    supplier: 'Vetcare Supplies',
    description: 'Essential minerals for livestock health'
  },
  {
    id: '5',
    name: 'Certified Maize Seeds',
    category: 'seeds',
    price: 450,
    stock: 500,
    minStock: 200,
    maxStock: 1000,
    unit: '2kg packet',
    lastRestocked: new Date('2024-01-05'),
    supplier: 'Kenya Seed Company',
    description: 'High-yielding maize variety for local conditions'
  },
  {
    id: '6',
    name: 'Bean Seeds - Rosecoco',
    category: 'seeds',
    price: 380,
    stock: 15,
    minStock: 50,
    maxStock: 300,
    unit: '2kg packet',
    lastRestocked: new Date('2024-01-08'),
    supplier: 'Kenya Seed Company',
    description: 'Drought-tolerant bean variety'
  },
  {
    id: '7',
    name: 'NPK Fertilizer',
    category: 'chemicals',
    price: 3200,
    stock: 120,
    minStock: 80,
    maxStock: 250,
    unit: '50kg bag',
    lastRestocked: new Date('2024-01-20'),
    supplier: 'Yara Kenya',
    description: 'Balanced NPK fertilizer for all crops'
  },
  {
    id: '8',
    name: 'Friesian Semen - High Yield',
    category: 'semen',
    price: 8500,
    stock: 8,
    minStock: 20,
    maxStock: 50,
    unit: 'straw',
    lastRestocked: new Date('2024-01-25'),
    supplier: 'World Wide Sires',
    description: 'Premium Friesian genetics for high milk production'
  }
];

export const aiRecords: AIRecord[] = [
  {
    id: 'AI001',
    farmerName: 'John Mwangi',
    farmerPhone: '+254712345678',
    cowId: 'COW-001',
    breed: 'Friesian',
    semenSireCode: 'FR-2024-001',
    semenBreed: 'Friesian',
    inseminationDate: new Date('2024-01-20'),
    technician: 'Dr. Kimani',
    status: 'completed',
    notes: 'Good heat detection, successful insemination'
  },
  {
    id: 'AI002',
    farmerName: 'Grace Muthoni',
    farmerPhone: '+254723456789',
    cowId: 'COW-015',
    breed: 'Jersey',
    semenSireCode: 'JR-2024-003',
    semenBreed: 'Jersey',
    inseminationDate: new Date('2024-01-25'),
    technician: 'Dr. Kimani',
    status: 'scheduled',
    notes: 'Scheduled for next heat cycle'
  },
  {
    id: 'AI003',
    farmerName: 'Peter Njoroge',
    farmerPhone: '+254734567890',
    cowId: 'COW-008',
    breed: 'Ayrshire',
    semenSireCode: 'AY-2024-002',
    semenBreed: 'Ayrshire',
    inseminationDate: new Date('2023-12-15'),
    technician: 'Dr. Ochieng',
    status: 'confirmed_pregnant',
    notes: 'Pregnancy confirmed at 60 days'
  },
  {
    id: 'AI004',
    farmerName: 'Mary Wanjiku',
    farmerPhone: '+254745678901',
    cowId: 'COW-022',
    breed: 'Friesian',
    semenSireCode: 'FR-2024-001',
    semenBreed: 'Friesian',
    inseminationDate: new Date('2023-11-20'),
    technician: 'Dr. Kimani',
    status: 'failed',
    notes: 'Returned to heat after 45 days'
  }
];

export const customers: Customer[] = [
  {
    id: 'C001',
    name: 'John Mwangi',
    phone: '+254712345678',
    location: 'Naromoru',
    totalPurchases: 45000,
    lastPurchase: new Date('2024-01-20'),
    notes: 'Dairy farmer with 15 cows'
  },
  {
    id: 'C002',
    name: 'Grace Muthoni',
    phone: '+254723456789',
    email: 'grace@example.com',
    location: 'Nanyuki',
    totalPurchases: 28000,
    lastPurchase: new Date('2024-01-25'),
    notes: 'Poultry farmer, 200 layers'
  },
  {
    id: 'C003',
    name: 'Peter Njoroge',
    phone: '+254734567890',
    location: 'Timau',
    totalPurchases: 62000,
    lastPurchase: new Date('2024-01-18'),
    notes: 'Mixed farmer - dairy and crops'
  },
  {
    id: 'C004',
    name: 'Mary Wanjiku',
    phone: '+254745678901',
    location: 'Naromoru',
    totalPurchases: 15000,
    lastPurchase: new Date('2024-01-10'),
    notes: 'Small-scale vegetable farmer'
  },
  {
    id: 'C005',
    name: 'James Kariuki',
    phone: '+254756789012',
    location: 'Nanyuki',
    totalPurchases: 38000,
    lastPurchase: new Date('2024-01-22'),
    notes: 'Large-scale maize farmer'
  }
];

export const weeklySalesData: SalesData[] = [
  { date: 'Mon', sales: 12500, orders: 8 },
  { date: 'Tue', sales: 18200, orders: 12 },
  { date: 'Wed', sales: 15400, orders: 10 },
  { date: 'Thu', sales: 22100, orders: 15 },
  { date: 'Fri', sales: 26800, orders: 18 },
  { date: 'Sat', sales: 19500, orders: 13 },
  { date: 'Sun', sales: 8900, orders: 6 }
];

export const categoryData: CategoryData[] = [
  { name: 'Animal Feeds', value: 45, color: '#0B3A2C' },
  { name: 'Seeds', value: 25, color: '#E4B83A' },
  { name: 'Fertilizers', value: 18, color: '#6B7A72' },
  { name: 'AI Semen', value: 12, color: '#111915' }
];

export const recentSales = [
  {
    id: 'SALE001',
    customer: 'John Mwangi',
    items: 3,
    total: 8400,
    time: '2 hours ago',
    status: 'completed'
  },
  {
    id: 'SALE002',
    customer: 'Grace Muthoni',
    items: 5,
    total: 12300,
    time: '4 hours ago',
    status: 'completed'
  },
  {
    id: 'SALE003',
    customer: 'Peter Njoroge',
    items: 2,
    total: 5600,
    time: '5 hours ago',
    status: 'completed'
  },
  {
    id: 'SALE004',
    customer: 'Walk-in Customer',
    items: 1,
    total: 2800,
    time: '6 hours ago',
    status: 'completed'
  }
];

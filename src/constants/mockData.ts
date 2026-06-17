
export interface Customer {
  id: string;
  name: string;
  mobile: string;
  totalOrders: number;
  lastOrderDate: string;
  type?: string;
  note?: string;
}

export const MOCK_CUSTOMERS: Customer[] = [
  { id: 'C5501', name: 'أحمد محمد الجمال', mobile: '01012345678', totalOrders: 5, lastOrderDate: '2024-04-28' },
  { id: 'C5502', name: 'سارة أحمد محمود', mobile: '01298765432', totalOrders: 2, lastOrderDate: '2024-05-01' },
  { id: 'C5503', name: 'مجوهرات النور (جملة)', mobile: '01155443322', totalOrders: 24, lastOrderDate: '2024-04-15' },
  { id: 'C5504', name: 'معرض الفضة الملكي', mobile: '01055667788', totalOrders: 15, lastOrderDate: '2024-04-29' },
  { id: 'C5505', name: 'ياسين علي الكردي', mobile: '01566778899', totalOrders: 1, lastOrderDate: '2024-05-02' },
  { id: 'C5506', name: 'ورشة إبداع للمعادن', mobile: '01122334455', totalOrders: 8, lastOrderDate: '2024-04-20' },
];

import React, { useState, useEffect } from 'react';
import { 
  ClipboardList, 
  Search, 
  Plus, 
  User, 
  Phone, 
  Layers, 
  Info, 
  Banknote, 
  Clock, 
  CheckCircle2,
  Filter,
  MoreVertical,
  ChevronDown,
  Edit2,
  Trash2,
  X,
  Check,
  Download,
  Printer,
  History as HistoryIcon,
  MessageCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Order {
  id: string;
  customerName: string;
  mobile: string;
  material: 'نحاس' | 'فضة';
  productDetails: string;
  totalPrice: number;
  deposit: number;
  status: string;
  phase: number; // 0 to 6
  date: string;
  imageUrl?: string;
  weight?: number;
}

const PHASES = [
  'استلام الطلب',
  'التصميم',
  'المنشار',
  'الليزر',
  'اللحام',
  'التشطيب',
  'الطلاء',
  'المينا',
  'جاهز للتسليم',
  'تم التسليم'
];

const MOCK_ORDERS: Order[] = [
  {
    id: 'ORD-5501',
    customerName: 'فهد العامري',
    mobile: '0554433221',
    material: 'فضة',
    productDetails: 'خاتم رجالي عيار 925 مع حجر كريم',
    totalPrice: 1500,
    deposit: 500,
    status: 'التصميم',
    phase: 1,
    date: '2026/04/28',
    imageUrl: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=200&auto=format&fit=crop'
  },
  {
    id: 'ORD-5502',
    customerName: 'سارة خالد',
    mobile: '0501122334',
    material: 'نحاس',
    productDetails: 'عقد مطلي ذهب مع كتابة اسم بالخط العربي',
    totalPrice: 850,
    deposit: 300,
    status: 'الليزر',
    phase: 3,
    date: '2026/04/29',
    imageUrl: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=200&auto=format&fit=crop'
  },
  {
    id: 'ORD-5503',
    customerName: 'عبدالعزيز محمد',
    mobile: '0567788990',
    material: 'نحاس',
    productDetails: 'درع تذكاري نحاسي مطلي نيكل',
    totalPrice: 2200,
    deposit: 1000,
    status: 'المينا',
    phase: 7,
    date: '2026/04/25',
    imageUrl: 'https://images.unsplash.com/photo-1610665241460-70576307963d?q=80&w=200&auto=format&fit=crop'
  },
  {
    id: 'ORD-5504',
    customerName: 'نورا السعيد',
    mobile: '0544556677',
    material: 'فضة',
    productDetails: 'أساور فضية ناعمة مع نقش ليزر',
    totalPrice: 1200,
    deposit: 600,
    status: 'المنشار',
    phase: 2,
    date: '2026/04/27',
    imageUrl: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?q=80&w=200&auto=format&fit=crop'
  }
];

import { MOCK_CUSTOMERS } from '../constants/mockData';

import { useNotifications } from './NotificationProvider';

export function OrdersContent({ initialStatusFilter, initialOrderId, userRole = 'Admin' }: { initialStatusFilter?: string, initialOrderId?: string, userRole?: string }) {
  const { addNotification } = useNotifications();
  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('workshop_orders');
    if (saved) return JSON.parse(saved);
    return MOCK_ORDERS;
  });

  const showPrice = userRole !== 'Worker';

  // Save to localStorage whenever orders change
  React.useEffect(() => {
    localStorage.setItem('workshop_orders', JSON.stringify(orders));
  }, [orders]);

  const [searchTerm, setSearchTerm] = useState('');
  const [materialFilter, setMaterialFilter] = useState<'all' | 'نحاس' | 'فضة'>('all');
  const [statusFilter, setStatusFilter] = useState<string>(initialStatusFilter || 'all');
  
  React.useEffect(() => {
    if (initialStatusFilter) {
      setStatusFilter(initialStatusFilter);
    }
  }, [initialStatusFilter]);

  React.useEffect(() => {
    if (initialOrderId) {
      // Find the order and open its details
      const order = orders.find(o => o.id === initialOrderId || o.id.replace('ORD-', '') === initialOrderId);
      if (order) {
        setSelectedOrder(order);
        setIsDetailsOpen(true);
      }
    }
  }, [initialOrderId, orders]);
  const [customerFilter, setCustomerFilter] = useState<string>('all');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [activeKpiId, setActiveKpiId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [tempPrice, setTempPrice] = useState<string>('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerResults, setShowCustomerResults] = useState(false);
  const [silverPrice, setSilverPrice] = useState<number>(() => {
    const saved = localStorage.getItem('workshop_silver_price');
    return saved ? Number(saved) : 45;
  });

  useEffect(() => {
    const handlePriceChange = () => {
      const saved = localStorage.getItem('workshop_silver_price');
      if (saved) {
        setSilverPrice(Number(saved));
      }
    };
    window.addEventListener('silver-price-updated', handlePriceChange);
    return () => {
      window.removeEventListener('silver-price-updated', handlePriceChange);
    };
  }, []);

  const [newOrder, setNewOrder] = useState<Partial<Order>>({
    material: 'فضة',
    totalPrice: 0,
    deposit: 0,
    phase: 0,
    weight: undefined
  });

  const uniqueCustomersWithOrders = React.useMemo(() => {
    const map = new Map();
    orders.forEach(o => {
      if (!map.has(o.mobile)) {
        map.set(o.mobile, o.customerName);
      }
    });
    return Array.from(map.entries()).map(([mobile, name]) => ({ mobile, name }));
  }, [orders]);

  const existingCustomers = React.useMemo(() => {
    return Array.from(new Set([
      ...orders.map(o => JSON.stringify({ name: o.customerName, mobile: o.mobile })),
      ...MOCK_CUSTOMERS.map(c => JSON.stringify({ name: c.name, mobile: c.mobile }))
    ])).map(s => JSON.parse(s)) as { name: string, mobile: string }[];
  }, [orders]);

  const matchingCustomers = React.useMemo(() => {
    if (!customerSearch || customerSearch.length < 1) return [];
    return existingCustomers.filter(c => 
      c.name.toLowerCase().includes(customerSearch.toLowerCase()) || 
      c.mobile.includes(customerSearch)
    ).slice(0, 5);
  }, [customerSearch, existingCustomers]);

  const handleSelectCustomer = (c: { name: string, mobile: string }) => {
    setNewOrder(prev => ({ ...prev, customerName: c.name, mobile: c.mobile }));
    setCustomerSearch(c.name);
    setShowCustomerResults(false);
  };

  const syncCustomerStats = (ordersList: Order[], targetMobile: string, targetName: string) => {
    try {
      const savedCustomers = localStorage.getItem('workshop_customers');
      let currentCustomers = savedCustomers ? JSON.parse(savedCustomers) : MOCK_CUSTOMERS.map(c => ({
        ...c,
        type: c.name.includes('جملة') || c.name.includes('معرض') || c.totalOrders >= 10 ? 'wholesale' : 
              c.name.includes('ورشة') ? 'retail' : 'individual',
        note: ''
      }));
      
      const customerOrders = ordersList.filter(o => o.mobile === targetMobile);
      const count = customerOrders.length;
      const lastDate = customerOrders.length > 0 
        ? [...customerOrders].sort((a, b) => b.date.localeCompare(a.date))[0].date 
        : '-';
        
      const customerIdx = currentCustomers.findIndex((c: any) => c.mobile === targetMobile);
      
      if (customerIdx > -1) {
        currentCustomers[customerIdx] = {
          ...currentCustomers[customerIdx],
          totalOrders: count,
          lastOrderDate: lastDate
        };
      } else if (count > 0) {
        // Only add if there are orders and they don't exist
        currentCustomers.push({
          id: `C${Date.now().toString().slice(-4)}`,
          name: targetName,
          mobile: targetMobile,
          totalOrders: count,
          lastOrderDate: lastDate,
          type: 'individual'
        });
      }
      
      localStorage.setItem('workshop_customers', JSON.stringify(currentCustomers));
    } catch (err) {
      console.error('Error syncing customer stats:', err);
    }
  };

  const handleAddOrder = (e: React.FormEvent) => {
    if (e) e.preventDefault();
    
    const phase = newOrder.phase || 0;
    const status = PHASES[phase];
    let updatedOrders: Order[];

    if (editingOrder) {
      updatedOrders = orders.map(o => o.id === editingOrder.id ? { ...o, ...(newOrder as Order), status, phase } : o);
      setOrders(updatedOrders);
      addNotification(`تم تحديث الطلب ${editingOrder.id} بنجاح`, 'info');
      
      // Sync customer data - if mobile changed, sync both old and new
      if (editingOrder.mobile !== newOrder.mobile) {
        syncCustomerStats(updatedOrders, editingOrder.mobile, editingOrder.customerName || '');
      }
      syncCustomerStats(updatedOrders, newOrder.mobile || '', newOrder.customerName || '');
      
      setEditingOrder(null);
    } else {
      const id = `ORD-${Math.floor(5500 + Math.random() * 1000)}`;
      const order: Order = {
        ...(newOrder as Order),
        id,
        status,
        phase,
        date: new Date().toLocaleDateString('en-CA')
      };
      updatedOrders = [order, ...orders];
      setOrders(updatedOrders);
      addNotification(`تم تسجيل طلب جديد بنجاح ${id}`, 'success');
      
      syncCustomerStats(updatedOrders, order.mobile, order.customerName);
    }
    
    setIsModalOpen(false);
    setNewOrder({ material: 'فضة', totalPrice: 0, deposit: 0, imageUrl: '', phase: 0, weight: undefined });
    setCustomerSearch('');
  };

  const updateOrderPhase = (orderId: string, newPhaseIdx: number) => {
    const status = PHASES[newPhaseIdx];
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, phase: newPhaseIdx, status } : o));
    addNotification(`انتقل طلب ${orderId} إلى مرحلة: ${status}`, 'info');
    if (selectedOrder?.id === orderId) {
      setSelectedOrder(prev => prev ? { ...prev, phase: newPhaseIdx, status } : null);
    }
  };

  const handlePriceUpdate = (orderId: string) => {
    const newPrice = Number(tempPrice);
    if (isNaN(newPrice)) {
      addNotification('يرجى إدخال سعر صحيح', 'error');
      return;
    }

    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, totalPrice: newPrice } : o));
    addNotification(`تم تحديث سعر الطلب ${orderId} إلى ${newPrice.toLocaleString()} ج.م`, 'success');
    setEditingPriceId(null);
  };

  const handleDeleteOrder = (id: string) => {
    const orderToDeleteObj = orders.find(o => o.id === id);
    const updatedOrders = orders.filter(o => o.id !== id);
    setOrders(updatedOrders);
    
    if (orderToDeleteObj) {
      syncCustomerStats(updatedOrders, orderToDeleteObj.mobile, orderToDeleteObj.customerName);
    }

    addNotification(`تم حذف الطلب ${id} بنجاح`, 'success');
    setOrderToDelete(null);
    setActiveMenuId(null);
    if (selectedOrder?.id === id) {
      setIsDetailsOpen(false);
      setSelectedOrder(null);
    }
  };

  const startEdit = (order: Order) => {
    setEditingOrder(order);
    setNewOrder(order);
    setCustomerSearch(order.customerName);
    setIsModalOpen(true);
    setActiveMenuId(null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        addNotification('يرجى اختيار ملف صورة صالح', 'error');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 400; // Larger than profile pic but still optimized
          const MAX_HEIGHT = 400;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          const dataUrl = canvas.toDataURL('image/jpeg', 0.75);
          setNewOrder({ ...newOrder, imageUrl: dataUrl });
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const filteredOrders = orders.filter(order => {
    const term = searchTerm.trim().toLowerCase();
    const matchesSearch = 
      order.customerName?.toLowerCase().includes(term) || 
      order.id.toLowerCase().includes(term) ||
      order.mobile?.includes(term);
    
    const matchesMaterial = materialFilter === 'all' || order.material === materialFilter;
    const matchesStatus = statusFilter === 'all' ? true 
      : statusFilter === 'late' ? (((new Date().getTime() - new Date(order.date).getTime()) / (1000 * 3600 * 24)) > 5 && order.phase < 9)
      : order.status === statusFilter;
    const matchesCustomer = customerFilter === 'all' || order.mobile === customerFilter;
    
    return matchesSearch && matchesMaterial && matchesStatus && matchesCustomer;
  });

  const phaseDistribution = PHASES.map((phase, idx) => ({
    label: phase,
    count: orders.filter(o => o.phase === idx).length
  })).filter(p => p.count > 0);

  const exportOrders = () => {
    try {
      const headers = ["كود الطلب", "اسم العميل", "الموبايل", "المعدن", "التفاصيل", "السعر الكلي", "العربون", "الحالة", "التاريخ"];
      const rows = filteredOrders.map(o => [
        o.id,
        o.customerName,
        o.mobile,
        o.material,
        o.productDetails,
        o.totalPrice,
        o.deposit,
        o.status,
        o.date
      ]);
      
      const csvContent = [
        headers.join(","),
        ...rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      ].join("\n");

      const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `تقرير_الطلبات_${new Date().toLocaleDateString('ar-EG').replace(/\//g, '-')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      addNotification('تم تصدير قائمة الطلبات بنجاح', 'success');
    } catch (err) {
      addNotification('فشل في تصدير البيانات', 'error');
    }
  };

  const printOrdersReport = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const content = `
      <html dir="rtl" lang="ar">
        <head>
          <title>تقرير الطلبات الحالية - ورشة الحكمدار</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700&display=swap');
            body { font-family: 'Tajawal', sans-serif; padding: 30px; color: #1a1a1a; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #10b981; padding-bottom: 15px; margin-bottom: 25px; }
            table { width: 100%; border-collapse: collapse; }
            th { background: #f0fdf4; padding: 10px; border: 1px solid #dcfce7; text-align: right; font-size: 11px; }
            td { padding: 10px; border: 1px solid #f0fdf4; font-size: 12px; }
            .footer { margin-top: 40px; text-align: center; font-size: 10px; color: #6b7280; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2 style="margin:0;">سجل طلبات ورشة الحكمدار</h2>
            <span>تاريخ الاستخراج: ${new Date().toLocaleDateString('ar-EG')}</span>
          </div>
          <table>
            <thead>
              <tr>
                <th>كود</th>
                <th>العميل</th>
                <th>المعدن</th>
                <th>التفاصيل</th>
                <th>السعر</th>
                <th>العربون</th>
                <th>حالة التنفيذ</th>
                <th>التاريخ</th>
              </tr>
            </thead>
            <tbody>
              ${filteredOrders.map(o => `
                <tr>
                  <td>${o.id}</td>
                  <td>${o.customerName}</td>
                  <td>${o.material}</td>
                  <td>${o.productDetails}</td>
                  <td>${o.totalPrice} ج.م</td>
                  <td>${o.deposit} ج.م</td>
                  <td>${PHASES[o.phase]}</td>
                  <td>${o.date}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="footer">تصدير رقمي من نظام إدارة الورشة</div>
        </body>
      </html>
    `;
    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); }, 500);
  };

  const stats = [
    { 
      id: 0, 
      label: 'إجمالي الطلبات', 
      count: orders.length.toString(), 
      color: 'text-brand-blue', 
      detail: `${orders.filter(o => o.phase < PHASES.length - 1).length} قيد التنفيذ · ${orders.filter(o => o.phase === PHASES.length - 2).length} جاهزة`,
      distribution: phaseDistribution
    },
    { 
      id: 1, 
      label: 'قيد التنفيذ', 
      count: orders.filter(o => o.phase < PHASES.length - 1).length.toString(), 
      color: 'text-brand-yellow', 
      detail: `${orders.filter(o => o.phase === 1).length} في مرحلة التصميم`,
      distribution: phaseDistribution.filter(p => p.label !== 'تم التسليم')
    },
    { 
      id: 2, 
      label: 'جاهز للتسليم', 
      count: orders.filter(o => o.phase === PHASES.length - 2).length.toString(), 
      color: 'text-brand-green', 
      detail: 'تم إرسال إشعارات للعملاء',
      distribution: phaseDistribution.filter(p => p.label === 'جاهز للتسليم')
    },
    { 
      id: 3, 
      label: 'طلبات اليوم', 
      count: orders.filter(o => o.date === new Date().toLocaleDateString('en-CA')).length.toString(), 
      color: 'text-brand-purple', 
      detail: 'طلبات سجلت اليوم',
      distribution: phaseDistribution.filter(p => p.count > 0) // Show all active if today clicked
    },
  ];

  const getStatusColor = (phase: number) => {
    if (phase >= 9) return 'bg-brand-green-dim text-brand-green border-brand-green-brd';
    if (phase >= 1) return 'bg-brand-blue-dim text-brand-blue border-brand-blue/20';
    return 'bg-brand-yellow-dim text-brand-yellow border-brand-yellow-brd';
  };

  return (
    <div className="flex flex-col gap-6 h-full relative">
      {/* New Order Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-sm bg-brand-card border border-brand-border rounded-xl shadow-2xl overflow-hidden"
            >
              <div className="p-3.5 border-b border-brand-border flex justify-between items-center bg-brand-bg3/50 backdrop-blur-md">
                <h2 className="text-sm font-black text-brand-text flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-brand-green" />
                  {editingOrder ? 'تعديل الطلب' : 'إضافة طلب جديد'}
                </h2>
                <button onClick={() => {
                  setIsModalOpen(false);
                  setEditingOrder(null);
                  setNewOrder({ material: 'فضة', totalPrice: 0, deposit: 0, imageUrl: '', phase: 0, weight: undefined });
                  setCustomerSearch('');
                }} className="p-1.5 hover:bg-white/5 rounded-lg text-brand-text3 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddOrder} className="p-4 space-y-3 max-h-[75vh] overflow-y-auto scrollbar-hide">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  <div className="space-y-1 relative">
                    <label className="text-[9px] font-bold text-brand-text3 pr-1">اسم العميل</label>
                    <div className="relative">
                      <User className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-brand-text3" />
                      <input 
                        required
                        type="text" 
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                          }
                        }}
                        placeholder="اسم العميل..."
                        className="w-full bg-brand-bg2 border border-brand-border rounded-lg py-1.5 pr-8 pl-3 text-[12px] focus:outline-none focus:border-brand-green transition-all"
                        value={newOrder.customerName || ''}
                        onChange={(e) => {
                          setNewOrder({...newOrder, customerName: e.target.value});
                          setCustomerSearch(e.target.value);
                          setShowCustomerResults(true);
                        }}
                        onFocus={() => setShowCustomerResults(true)}
                      />
                    </div>

                    <AnimatePresence>
                      {showCustomerResults && matchingCustomers.length > 0 && (
                        <motion.div 
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="absolute z-50 top-full left-0 right-0 mt-1 bg-brand-card border border-brand-border rounded-lg shadow-2xl overflow-hidden max-h-40 overflow-y-auto scrollbar-hide"
                        >
                          {matchingCustomers.map((c, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => handleSelectCustomer(c)}
                              className="w-full flex items-center justify-between p-2 hover:bg-brand-green-dim text-right border-b border-brand-border last:border-0"
                            >
                              <div className="flex flex-col">
                                <span className="text-[11px] font-bold text-brand-text">{c.name}</span>
                                <span className="text-[9px] text-brand-text3 text-number">{c.mobile}</span>
                              </div>
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-brand-text3 pr-1">الموبايل</label>
                    <div className="relative">
                      <Phone className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-brand-text3" />
                      <input 
                        required
                        type="tel" 
                        placeholder="05xxxxxxxx"
                        className="w-full bg-brand-bg2 border border-brand-border rounded-lg py-1.5 pr-8 pl-3 text-[12px] text-number focus:outline-none focus:border-brand-green transition-all"
                        value={newOrder.mobile || ''}
                        onChange={(e) => setNewOrder({...newOrder, mobile: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-brand-text3 pr-1">المعدن</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['فضة', 'نحاس'].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => {
                          const isSilver = m === 'فضة';
                          setNewOrder({
                            ...newOrder,
                            material: m as any,
                            // clear weight if switching away from silver
                            weight: isSilver ? newOrder.weight : undefined,
                            totalPrice: isSilver && newOrder.weight ? Math.round(newOrder.weight * silverPrice) : newOrder.totalPrice
                          });
                        }}
                        className={`py-1.5 rounded-lg border text-[11px] font-black transition-all ${newOrder.material === m ? 'bg-brand-green-dim border-brand-green text-brand-green' : 'bg-brand-bg2 border-brand-border text-brand-text3 hover:border-brand-text3'}`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                {newOrder.material === 'فضة' && (
                  <div className="space-y-1 bg-slate-500/5 p-2 rounded-xl border border-slate-500/10 animate-in fade-in duration-300">
                    <div className="flex justify-between items-center px-1">
                      <span className="text-[8px] font-black text-brand-green">وزن الفضة (جرام)</span>
                      <span className="text-[8px] font-bold text-brand-text3">سعر اليوم: {silverPrice} ج.م</span>
                    </div>
                    <div className="relative">
                      <input 
                        type="number" 
                        step="0.01"
                        placeholder="أدخل الوزن بالجرام، مثلاً: 15.4"
                        className="w-full bg-brand-bg2 border border-brand-border rounded-lg py-1.5 px-3 text-[12px] text-number focus:outline-none focus:border-brand-green transition-all"
                        value={newOrder.weight || ''}
                        onChange={(e) => {
                          const w = parseFloat(e.target.value);
                          if (!isNaN(w) && w > 0) {
                            const calculatedPrice = Math.round(w * silverPrice);
                            setNewOrder({
                              ...newOrder,
                              weight: w,
                              totalPrice: calculatedPrice
                            });
                          } else {
                            setNewOrder({
                              ...newOrder,
                              weight: e.target.value ? Number(e.target.value) : undefined
                            });
                          }
                        }}
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-brand-text3 pr-1">صورة الموديل</label>
                  <div className="flex items-center gap-3">
                    <div className="relative w-11 h-11 bg-brand-bg2 border border-brand-border rounded-lg overflow-hidden flex items-center justify-center shrink-0">
                      {newOrder.imageUrl ? (
                        <img src={newOrder.imageUrl} className="w-full h-full object-cover" alt="Preview" />
                      ) : (
                        <Layers className="w-4 h-4 text-brand-text3" />
                      )}
                    </div>
                    <label className="flex-1 cursor-pointer">
                      <div className="w-full bg-brand-bg2 border border-brand-border border-dashed hover:border-brand-green/20 hover:bg-brand-green-dim transition-all rounded-lg py-1.5 flex flex-col items-center justify-center">
                        <Plus className="w-3.5 h-3.5 text-brand-green" />
                        <span className="text-[9px] font-bold text-brand-text2">اضغط للرفع</span>
                      </div>
                      <input 
                        type="file" 
                        accept="image/*"
                        className="hidden" 
                        onChange={handleImageUpload}
                      />
                    </label>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-brand-text3 pr-1">التفاصيل</label>
                  <textarea 
                    required
                    placeholder="وصف المنتج، الحفر، المقاس..."
                    rows={1}
                    className="w-full bg-brand-bg2 border border-brand-border rounded-lg py-1.5 px-3 text-[12px] focus:outline-none focus:border-brand-green transition-all resize-none"
                    value={newOrder.productDetails || ''}
                    onChange={(e) => setNewOrder({...newOrder, productDetails: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-brand-text3 pr-1">السعر</label>
                    <input 
                      required
                      type="number" 
                      className="w-full bg-brand-bg2 border border-brand-border rounded-lg py-1.5 px-3 text-[12px] text-number focus:outline-none focus:border-brand-green transition-all"
                      value={newOrder.totalPrice || ''}
                      onChange={(e) => setNewOrder({...newOrder, totalPrice: Number(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-brand-text3 pr-1">العربون</label>
                    <input 
                      required
                      type="number" 
                      className="w-full bg-brand-bg2 border border-brand-border rounded-lg py-1.5 px-3 text-[12px] text-number focus:outline-none focus:border-brand-green transition-all"
                      value={newOrder.deposit || ''}
                      onChange={(e) => setNewOrder({...newOrder, deposit: Number(e.target.value)})}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-brand-text3 pr-1">المرحلة</label>
                  <div className="relative">
                    <select 
                      className="w-full bg-brand-bg2 border border-brand-border rounded-lg py-1.5 px-3 pr-8 text-[11px] font-black focus:outline-none focus:border-brand-green transition-all appearance-none cursor-pointer text-brand-text"
                      value={newOrder.phase || 0}
                      onChange={(e) => setNewOrder({...newOrder, phase: Number(e.target.value)})}
                    >
                      {PHASES.map((p, idx) => (
                        <option key={idx} value={idx}>{p}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-brand-text3 pointer-events-none" />
                  </div>
                </div>

                <div className="pt-2 flex gap-2">
                  <button 
                    type="submit"
                    className="flex-[2] bg-brand-green text-brand-bg py-2 rounded-lg font-black text-[11px] hover:scale-[1.02] active:scale-95 transition-all shadow-md"
                  >
                    حفظ الطلب
                  </button>
                  <button 
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      setCustomerSearch('');
                    }}
                    className="flex-1 bg-brand-bg2 border border-brand-border text-brand-text3 py-2 rounded-lg font-bold text-[11px] hover:bg-white/5 transition-all"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Header & Stats */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-brand-text flex items-center gap-2">
            <ClipboardList className="w-7 h-7 text-brand-green" />
            إدارة الطلبات
          </h1>
          <p className="text-brand-text2 text-sm mt-1">تتبع مراحل التنفيذ وحالة الطلبات للعملاء</p>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={exportOrders}
            className="flex items-center gap-2 bg-brand-bg2 border border-brand-border text-brand-text px-4 py-2.5 rounded-xl text-xs font-bold transition-all hover:bg-brand-bg3 active:scale-95"
          >
            <Download className="w-4 h-4 text-brand-text3" />
            تصدير
          </button>
          <button 
            onClick={printOrdersReport}
            className="flex items-center gap-2 bg-brand-bg2 border border-brand-border text-brand-text px-4 py-2.5 rounded-xl text-xs font-bold transition-all hover:bg-brand-bg3 active:scale-95"
          >
            <Printer className="w-4 h-4 text-brand-text3" />
            طباعة
          </button>
          <button 
            onClick={() => {
              setEditingOrder(null);
              setNewOrder({ material: 'فضة', totalPrice: 0, deposit: 0, imageUrl: '', phase: 0, weight: undefined });
              setCustomerSearch('');
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 bg-brand-green hover:bg-brand-green/90 text-[#0A0C0F] px-5 py-2.5 rounded-xl text-xs font-black transition-all shadow-[0_4px_12px_rgba(0,200,150,0.2)]"
          >
            <Plus className="w-4 h-4" />
            طلب جديد
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((stat, i) => (
          <div key={i} className="relative">
            <div 
              onClick={() => setActiveKpiId(activeKpiId === stat.id ? null : stat.id)}
              className={`glass-panel p-3 flex items-center justify-between cursor-pointer transition-all hover:border-brand-text3/30 ${activeKpiId === stat.id ? 'border-brand-text3/50 shadow-lg' : ''}`}
            >
              <div>
                <div className="text-[9px] uppercase font-bold text-brand-text3 mb-0.5 tracking-wider">{stat.label}</div>
                <div className={`text-xl font-black ${stat.color} text-number tracking-tighter`}>{stat.count}</div>
              </div>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${activeKpiId === stat.id ? 'bg-brand-text3 text-brand-bg' : 'bg-white/5 text-brand-text3'}`}>
                <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${activeKpiId === stat.id ? 'rotate-180' : ''}`} />
              </div>
            </div>
            
            <AnimatePresence>
              {activeKpiId === stat.id && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -5 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -5 }}
                  className="absolute top-full left-0 right-0 mt-2 z-20"
                >
                  <div className="glass-panel p-3 bg-brand-bg2 border-brand-border/50 shadow-2xl space-y-2">
                    <div className="flex items-center gap-2 text-[11px] font-bold text-brand-green mb-1 border-b border-brand-border pb-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-brand-green animate-pulse" />
                      {stat.detail}
                    </div>
                    <div className="flex flex-col gap-1.5 max-h-[150px] overflow-y-auto pr-1 scrollbar-hide">
                      {(stat.distribution || []).length > 0 ? (stat.distribution || []).map((d, idx) => (
                        <button 
                          key={idx} 
                          onClick={() => {
                            setStatusFilter(d.label);
                            setActiveKpiId(null);
                            // Optional: scroll to filters or list
                            const filtersElem = document.getElementById('orders-filters');
                            if (filtersElem) filtersElem.scrollIntoView({ behavior: 'smooth' });
                          }}
                          className="flex items-center justify-between hover:bg-white/10 p-1.5 rounded-lg transition-all text-right w-full"
                        >
                          <span className="text-[10px] font-bold text-brand-text2">{d.label}</span>
                          <span className="text-[10px] font-black text-brand-green text-number">{d.count} طلب</span>
                        </button>
                      )) : (
                        <div className="text-[10px] text-brand-text3 text-center py-2 italic font-bold">لا توجد تفاصيل حالية</div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {/* Enhanced Filters Section */}
      <div id="orders-filters" className="flex flex-col gap-3 bg-brand-card p-4 rounded-2xl border border-brand-border/50 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* General Search */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-brand-text3 uppercase pr-1 tracking-widest flex items-center gap-1.5">
              <Search className="w-3 h-3" />
              بحث عام
            </label>
            <div className="relative group">
              <input 
                type="text" 
                placeholder="اسم العميل، الهاتف، أو الكود..."
                className="w-full bg-brand-bg2 border border-brand-border rounded-xl py-2.5 pr-4 pl-4 text-xs focus:outline-none focus:border-brand-green transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Customer Filter */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-brand-text3 uppercase pr-1 tracking-widest flex items-center gap-1.5">
              <User className="w-3 h-3" />
              تصفية حسب العميل
            </label>
            <div className="relative">
              <select 
                value={customerFilter}
                onChange={(e) => setCustomerFilter(e.target.value)}
                className="w-full bg-brand-bg2 border border-brand-border rounded-xl py-2.5 pr-4 pl-10 text-xs font-bold focus:outline-none focus:border-brand-green transition-all appearance-none cursor-pointer text-brand-text"
              >
                <option value="all">كل العملاء</option>
                {uniqueCustomersWithOrders.map(c => (
                  <option key={c.mobile} value={c.mobile}>{c.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text3 pointer-events-none" />
            </div>
          </div>

          {/* Material Filter */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-brand-text3 uppercase pr-1 tracking-widest flex items-center gap-1.5">
              <Layers className="w-3 h-3" />
              نوع المعدن
            </label>
            <div className="flex bg-brand-bg2 border border-brand-border rounded-xl p-1 h-[42px]">
              {['all', 'فضة', 'نحاس'].map(m => (
                <button
                  key={m}
                  onClick={() => setMaterialFilter(m as any)}
                  className={`flex-1 rounded-lg text-[10px] font-black transition-all ${materialFilter === m ? 'bg-brand-bg3 text-brand-green shadow-sm' : 'text-brand-text3 hover:text-brand-text'}`}
                >
                  {m === 'all' ? 'الكل' : m}
                </button>
              ))}
            </div>
          </div>

          {/* Status Filter */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-brand-text3 uppercase pr-1 tracking-widest flex items-center gap-1.5">
              <Filter className="w-3 h-3" />
              المرحلة / الحالة
            </label>
            <div className="relative">
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-brand-bg2 border border-brand-border rounded-xl py-2.5 pr-4 pl-10 text-xs font-bold focus:outline-none focus:border-brand-green transition-all appearance-none cursor-pointer text-brand-text"
              >
                <option value="all">كل الحالات</option>
                <option value="late">الطلبات المتأخرة</option>
                {PHASES.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text3 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Filter Summary & Reset */}
        {(searchTerm || materialFilter !== 'all' || statusFilter !== 'all' || customerFilter !== 'all') && (
          <div className="flex items-center justify-between pt-3 border-t border-brand-border/30">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-brand-text3">النتائج:</span>
              <span className="text-[10px] font-black text-brand-blue bg-brand-blue/10 px-2 py-0.5 rounded-full">{filteredOrders.length} طلب مطابق</span>
            </div>
            <button 
              onClick={() => {
                setSearchTerm('');
                setMaterialFilter('all');
                setStatusFilter('all');
                setCustomerFilter('all');
              }}
              className="text-[10px] font-black text-brand-red hover:underline flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              إعادة تعيين الفلاتر
            </button>
          </div>
        )}
      </div>

      {/* Orders List */}
      <div className="flex flex-col gap-4 pb-10">
        <AnimatePresence mode='popLayout'>
          {filteredOrders.map((order) => (
            <motion.div 
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              key={order.id}
              className={`glass-panel group hover:border-brand-green/30 transition-all duration-300 ${activeMenuId === order.id ? 'z-50 relative' : 'relative z-0'}`}
            >
              <div className="p-2 lg:p-2.5">
                <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-2 mb-2.5">
                  <div className="flex gap-2 w-full sm:w-auto">
                    {order.imageUrl ? (
                      <div className="w-9 h-9 rounded-lg border border-brand-border overflow-hidden shrink-0">
                        <img 
                          src={order.imageUrl} 
                          alt={order.productDetails} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=No+Image';
                          }}
                        />
                      </div>
                    ) : (
                      <div className="w-9 h-9 rounded-lg bg-brand-bg2 border border-brand-border flex items-center justify-center shrink-0">
                        <User className="w-4 h-4 text-brand-text2" />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="text-[13px] font-black text-brand-text">{order.customerName}</h3>
                      </div>
                      <div className="flex items-center gap-2 text-brand-text3 text-[9px] font-bold">
                        <span className="flex items-center gap-1">
                          <Phone className="w-2.5 h-2.5 text-brand-green/70" />
                          <span className="text-number">{order.mobile}</span>
                        </span>
                        <span className="w-0.5 h-0.5 rounded-full bg-brand-text3" />
                        <span className="flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5 text-brand-blue/70" />
                          <span className="text-number">{order.date}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-1.5 relative">
                      <a 
                        href={`https://wa.me/${order.mobile.replace(/\D/g, '').startsWith('0') ? '2' + order.mobile.replace(/\D/g, '') : order.mobile.replace(/\D/g, '')}?text=${encodeURIComponent(`أهلاً ${order.customerName}، بخصوص طلبك رقم ${order.id}...`)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1 hover:bg-brand-green/10 rounded-lg transition-colors text-brand-green"
                        title="إرسال واتساب"
                      >
                        <MessageCircle className="w-4.5 h-4.5" />
                      </a>
                      
                      <div className="relative">
                        <select 
                          value={order.phase}
                          onChange={(e) => updateOrderPhase(order.id, Number(e.target.value))}
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border appearance-none cursor-pointer hover:bg-white/5 transition-all outline-none ${getStatusColor(order.phase)}`}
                        >
                          {PHASES.map((p, idx) => (
                            <option key={idx} value={idx} className="bg-brand-card text-brand-text">{p}</option>
                          ))}
                        </select>
                      </div>

                      <button 
                        onClick={() => setActiveMenuId(activeMenuId === order.id ? null : order.id)}
                        className="p-1 hover:bg-white/5 rounded-lg transition-colors"
                      >
                        <MoreVertical className="w-4.5 h-4.5 text-brand-text3" />
                      </button>

                      {/* Action Menu Popover */}
                      <AnimatePresence>
                        {activeMenuId === order.id && (
                          <>
                            <div 
                              className="fixed inset-0 z-10" 
                              onClick={() => setActiveMenuId(null)} 
                            />
                            <motion.div
                              initial={{ opacity: 0, scale: 0.9, y: -10 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.9, y: -10 }}
                              className="absolute left-0 mt-8 w-40 bg-brand-card border border-brand-border rounded-xl shadow-2xl z-20 overflow-hidden"
                            >
                              <div className="p-1.5 flex flex-col gap-1">
                                <button 
                                  onClick={() => {
                                    setSelectedOrder(order);
                                    setIsDetailsOpen(true);
                                    setActiveMenuId(null);
                                  }}
                                  className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-brand-text hover:bg-white/5 rounded-lg transition-colors"
                                >
                                  <Info className="w-3.5 h-3.5 text-brand-yellow" />
                                  عرض التفاصيل
                                </button>
                                <div className="h-px bg-brand-border my-0.5" />
                                <button 
                                  onClick={() => startEdit(order)}
                                  className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-brand-text hover:bg-white/5 rounded-lg transition-colors"
                                >
                                  <Edit2 className="w-3.5 h-3.5 text-brand-blue" />
                                  تعديل البيانات
                                </button>
                                <div className="h-px bg-brand-border my-0.5" />
                                <button 
                                  onClick={() => setOrderToDelete(order.id)}
                                  className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-brand-red hover:bg-brand-red/10 rounded-lg transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  حذف الطلب
                                </button>
                              </div>
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>
                    <div className="flex items-center gap-3 text-right mt-1 sm:mt-0">
                      <div className="flex flex-col items-end">
                        <span className="text-[8px] text-brand-text3 font-bold uppercase tracking-tight">السعر الإجمالي</span>
                        {editingPriceId === order.id ? (
                          <div className="flex items-center gap-1 mt-0.5">
                            <input
                              type="number"
                              autoFocus
                              value={tempPrice}
                              onChange={(e) => setTempPrice(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handlePriceUpdate(order.id);
                                if (e.key === 'Escape') setEditingPriceId(null);
                              }}
                              className="w-16 bg-brand-bg2 border border-brand-green/50 rounded px-1.5 py-0.5 text-[11px] font-black text-brand-green text-number outline-none focus:ring-1 focus:ring-brand-green/30"
                            />
                            <button 
                              type="button"
                              onClick={() => handlePriceUpdate(order.id)}
                              className="p-1 bg-brand-green/20 text-brand-green rounded hover:bg-brand-green/30 transition-colors"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                            <button 
                              type="button"
                              onClick={() => setEditingPriceId(null)}
                              className="p-1 bg-brand-red/20 text-brand-red rounded hover:bg-brand-red/30 transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 group/price">
                            <span className="text-[13px] font-bold text-brand-green text-number">{order.totalPrice.toLocaleString()} ج.م</span>
                            {(userRole === 'Admin' || userRole === 'Sales') && (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingPriceId(order.id);
                                  setTempPrice(order.totalPrice.toString());
                                }}
                                className="opacity-0 group-hover/price:opacity-100 p-1 hover:bg-brand-green/10 rounded transition-all"
                              >
                                <Edit2 className="w-2.5 h-2.5 text-brand-green/60" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[8px] text-brand-text3 font-bold uppercase tracking-tight">العربون</span>
                        <span className="text-[13px] font-bold text-brand-yellow text-number">{order.deposit.toLocaleString()} ج.م</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
                   <div className="lg:col-span-4 glass-panel-2 p-3 flex gap-3">
                    <div className="w-9 h-9 rounded-lg bg-brand-green-dim border border-brand-green-brd flex items-center justify-center shrink-0">
                      <Layers className="w-5 h-5 text-brand-green" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] text-brand-text3 font-bold">نوع المعدن:</span>
                        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${order.material === 'فضة' ? 'bg-slate-500/20 text-slate-300' : 'bg-orange-500/20 text-orange-300'}`}>
                          {order.material}
                        </span>
                        {order.weight && (
                          <span className="text-[10px] font-black text-brand-text2">
                            ({order.weight} جرام)
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-brand-text font-medium leading-relaxed line-clamp-1">{order.productDetails}</p>
                    </div>
                  </div>

                  <div className="lg:col-span-8 flex flex-col gap-2">
                    <div className="flex justify-between items-center mb-0">
                      <span className="text-[9px] font-bold text-brand-text3 uppercase tracking-wider">مراحل التنفيذ</span>
                      <span className="text-[9px] font-black text-brand-green bg-brand-green-dim px-1.5 py-0.5 rounded-md">
                        {Math.round((order.phase / (PHASES.length - 1)) * 100)}%
                      </span>
                    </div>

                    <div className="relative h-6 mt-1.5 mb-2">
                      {/* Track Background */}
                      <div className="absolute inset-x-0 top-[6px] h-1.2 bg-brand-bg2 rounded-full border border-brand-border" />
                      
                      {/* Progress Fill */}
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(order.phase / (PHASES.length - 1)) * 100}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        className="absolute inset-y-0 top-[6.5px] right-0 h-0.8 bg-gradient-to-l from-brand-green to-brand-blue rounded-full z-10"
                      />

                      {/* Phase Markers */}
                      <div className="absolute inset-x-0 inset-y-0">
                        {PHASES.map((phase, idx) => {
                          const percent = (idx / (PHASES.length - 1)) * 100;
                          const isActive = idx <= order.phase;
                          const isCurrent = idx === order.phase;
                          
                          return (
                            <div 
                              key={idx}
                              className="absolute top-0 bottom-0 flex flex-col items-center"
                              style={{ right: `${percent}%`, transform: 'translateX(50%)' }}
                            >
                              {/* Dot */}
                              <div className={`mt-[3px] relative z-20 w-2.5 h-2.5 rounded-full border-2 transition-all duration-500 ${
                                isCurrent 
                                  ? 'bg-brand-blue border-white scale-110 shadow-[0_0_8px_rgba(77,158,255,0.6)] animate-pulse' 
                                  : isActive 
                                    ? 'bg-brand-green border-brand-green-dim scale-90 shadow-[0_0_6px_rgba(0,200,150,0.4)]' 
                                    : 'bg-brand-bg2 border-brand-border scale-75'
                              }`} />
                              
                              {/* Label */}
                              <span className={`mt-2 text-[7px] font-bold transition-all duration-300 w-max max-w-[35px] text-center leading-[1] ${
                                isCurrent ? 'text-brand-text scale-105' : isActive ? 'text-brand-text2' : 'text-brand-text3 opacity-40'
                              }`}>
                                {phase}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredOrders.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-brand-card border border-brand-border flex items-center justify-center mb-4 text-brand-text3">
              <Search className="w-8 h-8" />
            </div>
            <h3 className="text-brand-text font-bold mb-1">لا توجد نتائج بحث</h3>
            <p className="text-brand-text3 text-xs">جرب البحث بكلمات أخرى أو تأكد من صحة البيانات</p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {orderToDelete && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOrderToDelete(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-brand-card border border-brand-border rounded-[2.5rem] p-8 shadow-2xl text-center"
            >
              <div className="w-20 h-20 bg-brand-red/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 className="w-10 h-10 text-brand-red" />
              </div>
              <h2 className="text-2xl font-black text-brand-text mb-2">تأكيد الحذف</h2>
              <p className="text-brand-text2 text-sm mb-8 leading-relaxed">
                هل أنت متأكد من رغبتك في حذف هذا الطلب؟ <br />
                <span className="font-black text-brand-red">هذا الإجراء لا يمكن التراجع عنه.</span>
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => handleDeleteOrder(orderToDelete)}
                  className="flex-1 bg-brand-red text-white py-4 rounded-2xl font-black text-sm hover:shadow-[0_0_20px_rgba(239,68,68,0.4)] transition-all"
                >
                  نعم، احذف الطلب
                </button>
                <button
                  onClick={() => setOrderToDelete(null)}
                  className="flex-1 bg-brand-bg3 text-brand-text font-black text-sm py-4 rounded-2xl hover:bg-brand-bg2 transition-all"
                >
                  إلغاء
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Order Details Drawer */}
      <AnimatePresence>
        {isDetailsOpen && selectedOrder && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDetailsOpen(false)}
              className="absolute inset-0 bg-brand-bg/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-xl bg-brand-card border-l border-brand-border h-full shadow-2xl flex flex-col"
            >
              <div className="p-8 border-b border-brand-border flex justify-between items-center bg-gradient-to-l from-brand-blue/10 to-transparent">
                <div className="flex items-center gap-4">
                  {selectedOrder.imageUrl ? (
                    <img 
                      src={selectedOrder.imageUrl} 
                      className="w-16 h-16 rounded-2xl object-cover border border-brand-border" 
                      alt="Order" 
                    />
                  ) : (
                    <div className="w-16 h-16 bg-brand-blue/20 rounded-2xl flex items-center justify-center text-brand-blue text-3xl font-black border border-brand-blue/30">
                      {selectedOrder.customerName[0]}
                    </div>
                  )}
                  <div>
                    <h2 className="text-2xl font-black text-brand-text mb-1">{selectedOrder.customerName}</h2>
                    <div className="flex items-center gap-2">
                       <div className="relative">
                         <select 
                           value={selectedOrder.phase}
                           onChange={(e) => updateOrderPhase(selectedOrder.id, Number(e.target.value))}
                           className={`text-[10px] font-black px-2 py-0.5 rounded-full border appearance-none cursor-pointer outline-none ${getStatusColor(selectedOrder.phase)}`}
                         >
                           {PHASES.map((p, idx) => (
                             <option key={idx} value={idx} className="bg-brand-card text-brand-text">{p}</option>
                           ))}
                         </select>
                       </div>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setIsDetailsOpen(false)}
                  className="w-10 h-10 rounded-xl bg-brand-bg3 flex items-center justify-center text-brand-text3 hover:text-brand-red transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-brand-bg2 p-4 rounded-2xl border border-brand-border">
                    <div className="text-[10px] font-bold text-brand-text3 uppercase mb-1">المعدن</div>
                    <div className="text-sm font-black text-brand-text flex items-center justify-between">
                      <span>{selectedOrder.material}</span>
                      {selectedOrder.weight && (
                        <span className="text-[10px] bg-brand-green/10 text-brand-green px-2 py-0.5 rounded-md font-bold">
                          {selectedOrder.weight} جرام
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="bg-brand-bg2 p-4 rounded-2xl border border-brand-border">
                    <div className="text-[10px] font-bold text-brand-text3 uppercase mb-1">تاريخ الطلب</div>
                    <div className="text-sm font-black text-brand-text text-number">{selectedOrder.date}</div>
                  </div>
                </div>

                <div className="bg-brand-bg2 p-5 rounded-2xl border border-brand-border space-y-4">
                  <h3 className="text-xs font-black text-brand-text3 uppercase flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    تفاصيل المنتج
                  </h3>
                  <p className="text-sm text-brand-text font-medium leading-relaxed">
                    {selectedOrder.productDetails}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-brand-bg2 p-4 rounded-2xl border border-brand-border">
                    <div className="text-[10px] font-bold text-brand-text3 uppercase mb-1 flex items-center gap-1">
                      <Banknote className="w-3 h-3" />
                      إجمالي السعر
                    </div>
                    <div className="text-lg font-black text-brand-green text-number">{selectedOrder.totalPrice.toLocaleString()} ج.م</div>
                  </div>
                  <div className="bg-brand-bg2 p-4 rounded-2xl border border-brand-border">
                    <div className="text-[10px] font-bold text-brand-text3 uppercase mb-1 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-brand-yellow" />
                      العربون المدفوع
                    </div>
                    <div className="text-lg font-black text-brand-yellow text-number">{selectedOrder.deposit.toLocaleString()} ج.م</div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-black text-brand-text mb-4">بيانات التواصل</h3>
                  <div className="bg-brand-bg2 p-3.5 md:p-4 rounded-2xl border border-brand-border flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 md:gap-3">
                      <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-brand-green/10 flex items-center justify-center shrink-0">
                        <Phone className="w-4 h-4 md:w-5 md:h-5 text-brand-green" />
                      </div>
                      <div>
                        <div className="text-[9px] md:text-[10px] font-bold text-brand-text3">رقم الهاتف</div>
                        <div className="text-[12px] md:text-sm font-black text-brand-text text-number tracking-wider md:tracking-widest">{selectedOrder.mobile}</div>
                      </div>
                    </div>
                    <a 
                      href={`https://wa.me/${selectedOrder.mobile.replace(/\D/g, '').startsWith('0') ? '2' + selectedOrder.mobile.replace(/\D/g, '') : selectedOrder.mobile.replace(/\D/g, '')}?text=${encodeURIComponent(`أهلاً ${selectedOrder.customerName}، بخصوص طلبك رقم ${selectedOrder.id}...`)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="bg-brand-green text-brand-bg px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-[9px] md:text-[10px] font-black hover:scale-105 transition-all flex items-center justify-center shrink-0"
                    >
                      واتساب
                    </a>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-black text-brand-text flex items-center gap-2">
                    <Layers className="w-4 h-4 text-brand-blue" />
                    تحديث المرحلة الحالية
                  </h3>
                  <div className="grid grid-cols-1 gap-2">
                    <div className="relative">
                      <select 
                        value={selectedOrder.phase}
                        onChange={(e) => updateOrderPhase(selectedOrder.id, Number(e.target.value))}
                        className="w-full bg-brand-bg2 border border-brand-border rounded-2xl py-4 px-6 text-sm font-black text-brand-text focus:outline-none focus:border-brand-blue transition-all appearance-none cursor-pointer"
                      >
                        {PHASES.map((p, idx) => (
                          <option key={idx} value={idx}>{p}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-text3 pointer-events-none" />
                    </div>
                    <div className="flex flex-wrap gap-2 pt-2">
                      {PHASES.map((p, idx) => {
                        const isCurrent = idx === selectedOrder.phase;
                        const isPast = idx < selectedOrder.phase;
                        return (
                          <button
                            key={idx}
                            onClick={() => updateOrderPhase(selectedOrder.id, idx)}
                            className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all border ${
                              isCurrent 
                                ? 'bg-brand-blue text-white border-brand-blue shadow-lg' 
                                : isPast 
                                  ? 'bg-brand-green-dim text-brand-green border-brand-green/20' 
                                  : 'bg-brand-bg3 text-brand-text3 border-brand-border hover:border-brand-text3'
                            }`}
                          >
                            {p}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8 border-t border-brand-border bg-brand-bg/50 flex gap-3">
                <button 
                   onClick={() => startEdit(selectedOrder)}
                   className="flex-1 bg-brand-blue text-white py-4 rounded-2xl font-black text-sm hover:shadow-2xl transition-all flex items-center justify-center gap-3"
                >
                  <Edit2 className="w-5 h-5" />
                  تعديل الطلب
                </button>
                <button 
                   onClick={() => {
                     setOrderToDelete(selectedOrder.id);
                     setIsDetailsOpen(false);
                   }}
                   className="flex-1 bg-brand-red text-white py-4 rounded-2xl font-black text-sm hover:shadow-2xl transition-all flex items-center justify-center gap-3"
                >
                  <Trash2 className="w-5 h-5" />
                  حذف
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

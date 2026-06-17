import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Search, 
  Phone, 
  History as HistoryIcon, 
  Package, 
  ArrowRight, 
  Plus, 
  Edit2, 
  Trash2, 
  X, 
  Wallet, 
  Filter,
  Download,
  Printer,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  MapPin,
  Tag,
  StickyNote,
  MessageCircle,
  ExternalLink,
  Crown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MOCK_CUSTOMERS, Customer } from '../constants/mockData';
import { useNotifications } from './NotificationProvider';

type SortOption = 'name' | 'orders' | 'date' | 'newest';
type CustomerCategory = 'all' | 'wholesale' | 'retail' | 'individual';

export interface OrderHistory {
  id: string;
  title: string;
  price: number;
  date: string;
  status: string;
  weight: string;
  type: string;
}

export interface CustomerWithOrders extends Customer {
  note?: string;
  type?: string;
  ordersDetail?: OrderHistory[];
}

export function CustomersContent({ onNavigate }: { onNavigate?: (tab: string, filter?: string, orderId?: string) => void }) {
  const { addNotification } = useNotifications();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [category, setCategory] = useState<CustomerCategory>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<string | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerWithOrders | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<CustomerWithOrders | null>(null);
  const [newCustomer, setNewCustomer] = useState<Partial<CustomerWithOrders>>({ 
    name: '', 
    mobile: '',
    type: 'individual',
    note: ''
  });
  
  const [customers, setCustomers] = useState<CustomerWithOrders[]>(() => {
    const saved = localStorage.getItem('workshop_customers');
    if (saved) return JSON.parse(saved);
    return [
      ...MOCK_CUSTOMERS.map((c) => ({ 
        ...c, 
        type: c.name.includes('جملة') || c.name.includes('معرض') || c.totalOrders >= 10 ? 'wholesale' : 
              c.name.includes('ورشة') ? 'retail' : 'individual',
        note: c.name.includes('جملة') ? 'عميل جملة قديم - يفضل الذهب عيار ٢١' : '',
        ordersDetail: [] // Start with empty ordersDetail, will fetch on openDetails
      }))
    ];
  });

  // Save to localStorage whenever customers change
  React.useEffect(() => {
    localStorage.setItem('workshop_customers', JSON.stringify(customers));
  }, [customers]);

  const filteredAndSortedCustomers = useMemo(() => {
    let result = customers.filter(c => 
      (c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      c.mobile.includes(searchTerm) ||
      (c.id && c.id.toLowerCase().includes(searchTerm.toLowerCase()))) &&
      (category === 'all' || c.type === category)
    );

    result.sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'orders') return b.totalOrders - a.totalOrders;
      if (sortBy === 'date') {
        const dateA = new Date(a.lastOrderDate).getTime() || 0;
        const dateB = new Date(b.lastOrderDate).getTime() || 0;
        return dateB - dateA;
      }
      if (sortBy === 'newest') {
        const idA = parseInt(a.id.replace(/\D/g, '')) || 0;
        const idB = parseInt(b.id.replace(/\D/g, '')) || 0;
        return idB - idA;
      }
      return 0;
    });

    return result;
  }, [customers, searchTerm, sortBy, category]);

  const stats = useMemo(() => ({
    total: customers.length,
    vip: customers.filter(c => c.totalOrders >= 10).length,
    totalOrders: customers.reduce((sum, c) => sum + (c.totalOrders || 0), 0),
    revenue: customers.reduce((sum, c) => sum + ((c.totalOrders || 0) * 1500), 0)
  }), [customers]);

  const exportToCSV = () => {
    try {
      const headers = ["كود العميل", "اسم العميل", "رقم الموبايل", "نوع العميل", "إجمالي الطلبات", "تاريخ آخر طلب"];
      const rows = customers.map(c => [
        c.id,
        c.name,
        c.mobile,
        c.type === 'wholesale' ? 'تاجر جملة' : c.type === 'retail' ? 'محل قطاعي' : 'فرد / ورشة',
        c.totalOrders,
        c.lastOrderDate
      ]);
      
      const csvContent = [
        headers.join(","),
        ...rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      ].join("\n");

      const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `تقرير_العملاء_${new Date().toLocaleDateString('ar-EG').replace(/\//g, '-')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      addNotification('تم تصدير ملف العملاء بنجاح وهو جاهز للطباعة', 'success');
    } catch (err) {
      addNotification('فشل تصدير البيانات', 'error');
    }
  };

  const printCustomersReport = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const content = `
      <html dir="rtl" lang="ar">
        <head>
          <title>تقرير العملاء - ورشة الحكمدار</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700&display=swap');
            body { font-family: 'Tajawal', sans-serif; padding: 30px; color: #1a1a1a; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #3b82f6; padding-bottom: 15px; margin-bottom: 25px; }
            table { width: 100%; border-collapse: collapse; }
            th { background: #f3f4f6; padding: 10px; border: 1px solid #e5e7eb; text-align: right; font-size: 12px; }
            td { padding: 10px; border: 1px solid #e5e7eb; font-size: 13px; }
            .footer { margin-top: 40px; text-align: center; font-size: 10px; color: #6b7280; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2 style="margin:0;">قائمة عملاء ورشة الحكمدار</h2>
            <span>تاريخ: ${new Date().toLocaleDateString('ar-EG')}</span>
          </div>
          <table>
            <thead>
              <tr>
                <th>كود</th>
                <th>الاسم</th>
                <th>الموبايل</th>
                <th>النوع</th>
                <th>إجمالي الطلبات</th>
                <th>آخر طلب</th>
              </tr>
            </thead>
            <tbody>
              ${customers.map(c => `
                <tr>
                  <td>${c.id}</td>
                  <td>${c.name}</td>
                  <td>${c.mobile}</td>
                  <td>${c.type === 'wholesale' ? 'جملة' : c.type === 'retail' ? 'محل' : 'فرد'}</td>
                  <td>${c.totalOrders}</td>
                  <td>${c.lastOrderDate}</td>
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

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomer.name || !newCustomer.mobile) return;

    if (editingCustomer) {
      setCustomers(prev => prev.map(c => c.id === editingCustomer.id ? { ...c, ...(newCustomer as Customer) } : c));
      addNotification('تم تحديث بيانات العميل بنجاح', 'success');
    } else {
      const customer = {
        id: `C${Date.now().toString().slice(-4)}`,
        name: newCustomer.name || '',
        mobile: newCustomer.mobile || '',
        totalOrders: 0,
        lastOrderDate: '-',
        type: newCustomer.type || 'individual',
        note: newCustomer.note || ''
      };
      setCustomers(prev => [customer, ...prev]);
      addNotification('تم إضافة العميل الجديد بنجاح', 'success');
    }
    setIsModalOpen(false);
    setEditingCustomer(null);
    setNewCustomer({ name: '', mobile: '', type: 'individual', note: '' });
  };

  const confirmDelete = () => {
    if (customerToDelete) {
      setCustomers(prev => prev.filter(c => c.id !== customerToDelete));
      setCustomerToDelete(null);
      setIsDetailsOpen(false);
      setSelectedCustomer(null);
      addNotification('تم حذف العميل بنجاح', 'error');
    }
  };

  const openDetails = (customer: CustomerWithOrders) => {
    // Fetch real orders for this customer from localStorage
    const savedOrders = localStorage.getItem('workshop_orders');
    if (savedOrders) {
      const allOrders = JSON.parse(savedOrders);
      const customerOrders = allOrders
        .filter((o: any) => o.mobile === customer.mobile)
        .map((o: any) => ({
          id: o.id.replace('ORD-', ''),
          title: o.productDetails || 'طلب جديد',
          price: o.totalPrice || 0,
          date: o.date || '-',
          status: o.status || 'قيد التنفيذ',
          weight: o.material || '-', // Using material as weight/type info if weight not available
          type: o.material || '-'
        }));
      setSelectedCustomer({ ...customer, ordersDetail: customerOrders });
    } else {
      setSelectedCustomer(customer);
    }
    setIsDetailsOpen(true);
  };

  const openEditModal = (customer: Customer & { note?: string, type?: string }) => {
    setEditingCustomer(customer);
    setNewCustomer({
      ...customer,
      type: customer.type || 'individual',
      note: customer.note || ''
    });
    setIsModalOpen(true);
  };

  const getCustomerStatus = (orders: number) => {
    if (orders >= 10) return { label: 'عميل برونزي (VIP)', color: 'bg-brand-yellow/10 text-brand-yellow border-brand-yellow/20', icon: '🏆' };
    if (orders >= 5) return { label: 'عميل مميز', color: 'bg-brand-blue/10 text-brand-blue border-brand-blue/20', icon: '⭐' };
    if (orders === 0) return { label: 'عميل جديد', color: 'bg-brand-green/10 text-brand-green border-brand-green/20' };
    return { label: 'عميل منتظم', color: 'bg-brand-bg3/50 text-brand-text2 border-brand-border', icon: '👤' };
  };

  return (
    <div className="space-y-8 pb-24 animate-in fade-in duration-700">
      {/* Dynamic Background Accents */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-brand-blue/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-brand-green/5 rounded-full blur-[100px]" />
      </div>

      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 card-gradient p-4 rounded-[1.2rem] border border-brand-border/50 shadow-xl relative overflow-hidden group">
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-brand-blue/10 rounded-full blur-3xl group-hover:bg-brand-blue/20 transition-all duration-1000" />
        
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-12 h-12 bg-brand-bg3 rounded-xl flex items-center justify-center border border-brand-border shadow-lg group-hover:scale-105 transition-transform duration-500">
            <Users className="w-6 h-6 text-brand-blue" />
          </div>
          <div>
            <h1 className="text-xl font-black text-brand-text tracking-tight mb-0.5">قاعدة العملاء</h1>
            <div className="flex items-center gap-1.5">
              <span className="flex items-center gap-1 text-[9px] font-bold text-brand-text3 bg-brand-bg2 px-1.5 py-0.5 rounded-lg border border-brand-border">
                <div className="w-1 h-1 bg-brand-blue rounded-full animate-pulse" />
                {stats.total} عميل
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex w-full lg:w-auto gap-2 relative z-10">
          <button 
            onClick={exportToCSV}
            className="flex-1 lg:flex-none h-9 px-3 bg-brand-bg2 border border-brand-border text-brand-text rounded-lg font-black text-[9px] hover:bg-brand-bg3 transition-all flex items-center justify-center gap-1.5 active:scale-95 group/btn"
          >
            <Download className="w-3 h-3 text-brand-text3 group-hover/btn:translate-y-0.5 transition-transform" />
            تصدير
          </button>
          <button 
            onClick={printCustomersReport}
            className="flex-1 lg:flex-none h-9 px-3 bg-brand-bg2 border border-brand-border text-brand-text rounded-lg font-black text-[9px] hover:bg-brand-bg3 transition-all flex items-center justify-center gap-1.5 active:scale-95 group/btn"
          >
            <Printer className="w-3 h-3 text-brand-text3 transition-transform" />
            طباعة
          </button>
          <button 
            onClick={() => {
              setEditingCustomer(null);
              setNewCustomer({ name: '', mobile: '' });
              setIsModalOpen(true);
            }}
            className="flex-[1.5] lg:flex-none h-9 px-4 bg-brand-blue text-white rounded-lg font-black text-[9px] hover:shadow-lg transition-all flex items-center justify-center gap-1.5 active:scale-95 overflow-hidden relative group/add"
          >
            <Plus className="w-3.5 h-3.5" />
            إضافة عميل
          </button>
        </div>
      </div>

      {/* Grid Layout for Stats & Main Content */}
      <div className="grid grid-cols-12 gap-4">
        
        {/* Main List Area */}
        <div className="col-span-12 lg:col-span-9 space-y-6">
          {/* Controls Bar */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row gap-3 items-center glass-panel p-2 rounded-xl border-brand-border/30">
              <div className="relative flex-1 w-full">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text3" />
                <input 
                  type="text"
                  placeholder="ابحث بالاسم، الهاتف..."
                  className="w-full bg-brand-bg3 border-none rounded-xl py-2 pr-10 pl-4 text-brand-text placeholder:text-brand-text3 text-xs focus:ring-1 focus:ring-brand-blue/20 transition-all font-bold"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-1 w-full sm:w-auto p-1 bg-brand-bg3 rounded-xl border border-brand-border/20">
                {(['newest', 'orders', 'name'] as SortOption[]).map((opt) => (
                  <button 
                    key={opt}
                    onClick={() => setSortBy(opt)}
                    className={`px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
                      sortBy === opt ? 'bg-brand-blue text-white shadow-lg' : 'text-brand-text3 hover:text-brand-text hover:bg-white/5'
                    }`}
                  >
                    {opt === 'newest' ? 'الأحدث' : opt === 'orders' ? 'الأكثر طلباً' : 'الاسم'}
                  </button>
                ))}
              </div>
            </div>

            {/* Category Filters */}
            <div className="flex gap-1.5 pb-1 overflow-x-auto scrollbar-hide">
              {[
                { id: 'all', label: 'الكل', icon: Users },
                { id: 'retail', label: 'قطاعي', icon: Tag },
                { id: 'wholesale', label: 'جملة', icon: Crown },
                { id: 'individual', label: 'أفراد / ورش', icon: MapPin },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id as CustomerCategory)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border text-[9px] font-black transition-all whitespace-nowrap ${
                    category === cat.id 
                      ? 'bg-brand-blue/10 border-brand-blue text-brand-blue' 
                      : 'bg-brand-card border-brand-border text-brand-text3 hover:border-brand-text3'
                  }`}
                >
                  <cat.icon className="w-3 h-3" />
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Customer Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            <AnimatePresence mode="popLayout">
              {filteredAndSortedCustomers.length > 0 ? (
                filteredAndSortedCustomers.map((customer, idx) => {
                  const status = getCustomerStatus(customer.totalOrders);
                  return (
                    <motion.div 
                      key={customer.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: idx * 0.05 }}
                      className={`glass-panel p-2.5 group hover:border-brand-blue/30 transition-all duration-500 hover:shadow-xl relative overflow-hidden ${
                        customer.type === 'wholesale' ? 'border-brand-yellow/30 bg-brand-yellow/[0.02]' : ''
                      }`}
                    >
                      <div className={`absolute top-0 left-0 w-1.5 h-full ${
                        customer.type === 'wholesale' ? 'bg-brand-yellow opacity-40' : 'bg-brand-blue opacity-0'
                      } group-hover:opacity-100 transition-all`} />
                      
                      <div className="flex items-start justify-between mb-2.5">
                        <div className="relative">
                          <div className={`w-9 h-9 bg-brand-bg3 rounded-lg flex items-center justify-center font-black text-base border border-brand-border transition-all duration-500 ${
                            customer.type === 'wholesale' ? 'text-brand-yellow border-brand-yellow/30 bg-brand-yellow/5' : 'text-brand-blue group-hover:border-brand-blue/50 group-hover:bg-brand-blue/5'
                          }`}>
                            {customer.name[0]}
                          </div>
                          <div className={`absolute -top-1.5 -right-1.5 px-1 py-0.5 rounded text-[5px] font-black uppercase border tracking-tighter ${
                            customer.type === 'wholesale' ? 'bg-brand-yellow text-[#0A0C0F] border-brand-yellow' : 
                            customer.type === 'retail' ? 'bg-brand-blue/10 border-brand-blue/30 text-brand-blue' :
                            'bg-brand-green/10 border-brand-green/30 text-brand-green'
                          }`}>
                            {customer.type === 'wholesale' ? 'جملة' : customer.type === 'retail' ? 'قطاعي' : 'فرد'}
                          </div>
                        </div>
                        <div className="flex flex-col gap-1 text-right">
                           <span className={`text-[6.5px] font-black px-1.5 py-0.5 rounded-full border ${status.color}`}>
                            {status.label}
                           </span>
                           <span className="text-[8px] font-black text-brand-text3 bg-brand-bg2 px-1 py-0.5 rounded-md border border-brand-border/30 tracking-widest uppercase">#{customer.id}</span>
                        </div>
                      </div>

                      <div className="mb-2.5">
                        <h3 className="text-[14px] font-black text-brand-text mb-0.5 line-clamp-1 group-hover:text-brand-blue transition-colors flex items-center gap-1.5">
                          {customer.name}
                          {customer.type === 'wholesale' && <Crown className="w-2.5 h-2.5 text-brand-yellow fill-brand-yellow/20" />}
                        </h3>
                        <div className="flex items-center gap-1 text-brand-text3 font-bold text-[8.5px]">
                          <Phone className="w-2 h-2 text-brand-green" />
                          <span className="text-number tracking-widest">{customer.mobile}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pb-3 border-b border-brand-border/30 mb-3">
                        <div className="space-y-0.5">
                          <div className="text-[7.5px] font-black text-brand-text3 uppercase opacity-60">الطلبات</div>
                          <div className="text-[14px] font-black text-brand-text text-number">
                            {customer.totalOrders}
                          </div>
                        </div>
                        <div className="space-y-0.5 text-left">
                          <div className="text-[7.5px] font-black text-brand-text3 uppercase opacity-60 text-right">آخر طلب</div>
                          <div className="text-[11px] font-black text-brand-text text-number truncate text-right">
                            {customer.lastOrderDate}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-1">
                        <button 
                          onClick={() => openDetails(customer)}
                          className="flex-1 h-8 bg-brand-blue/10 text-brand-blue rounded-lg font-black text-[8.5px] uppercase hover:bg-brand-blue hover:text-white transition-all flex items-center justify-center gap-1.5 tracking-wider"
                        >
                          الملف الكامل
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setCustomerToDelete(customer.id);
                          }}
                          className="w-8 h-8 bg-brand-bg2 border border-brand-border rounded-lg flex items-center justify-center text-brand-text3 hover:text-brand-red hover:bg-brand-red/5 transition-all outline-none"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <div className="col-span-full py-40 flex flex-col items-center justify-center card-gradient rounded-[3rem] border border-dashed border-brand-border/30">
                  <div className="relative mb-8">
                     <div className="w-24 h-24 bg-brand-bg3 rounded-full flex items-center justify-center border border-brand-border animate-pulse">
                        <Search className="w-10 h-10 text-brand-text3" />
                     </div>
                     <div className="absolute -right-4 -bottom-4 w-12 h-12 bg-brand-red/10 border border-brand-red/20 rounded-2xl flex items-center justify-center text-brand-red">
                        <X className="w-6 h-6" />
                     </div>
                  </div>
                  <h3 className="text-2xl font-black text-brand-text mb-2">لم نتمكن من العثور على نتائج</h3>
                  <p className="text-brand-text3 text-sm font-medium mb-8">تأكد من صحة الاسم أو رقم الموبايل أو أضف عميل جديد</p>
                  <button 
                    onClick={() => setSearchTerm('')}
                    className="h-12 px-10 bg-brand-bg3 border border-brand-border text-brand-text rounded-2xl font-black text-xs hover:bg-brand-bg2 transition-all uppercase tracking-widest"
                  >
                    عرض كافة العملاء
                  </button>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Info/Stats Sidebar */}
        <div className="col-span-12 lg:col-span-3 space-y-6">
          <div className="glass-panel p-6 border-l-4 border-brand-blue sticky top-8">
            <h3 className="text-xs font-black text-brand-text3 uppercase tracking-tighter mb-6 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-brand-blue" />
              نظرة عامة على النشاط
            </h3>
            
            <div className="space-y-6">
              <div className="p-4 bg-brand-bg2 rounded-2xl border border-brand-border/50">
                <div className="flex justify-between items-center mb-1">
                   <span className="text-[10px] font-bold text-brand-text3 uppercase">قيمة المعاملات التقديرية</span>
                   <Wallet className="w-3.5 h-3.5 text-brand-green" />
                </div>
                <div className="text-2xl font-black text-brand-green text-number">{stats.revenue.toLocaleString()} <span className="text-xs">ج.م</span></div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                 {[
                   { label: 'عملاء نشطون', val: stats.vip, color: 'text-brand-yellow', icon: HistoryIcon },
                   { label: 'طلبات مكتملة', val: stats.totalOrders, color: 'text-brand-green', icon: CheckCircle2 },
                 ].map((i, idx) => (
                   <div key={idx} className="flex items-center gap-3 p-3 bg-brand-bg3/40 rounded-xl">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center border border-brand-border ${i.color.replace('text-', 'bg-')}/10`}>
                        <i.icon className={`w-4 h-4 ${i.color}`} />
                      </div>
                      <div>
                        <div className="text-[8px] font-black text-brand-text3 uppercase">{i.label}</div>
                        <div className="text-sm font-black text-brand-text text-number">{i.val}</div>
                      </div>
                   </div>
                 ))}
              </div>

              <div className="pt-6 border-t border-brand-border/30">
                <h4 className="text-[10px] font-black text-brand-text3 uppercase mb-4 flex items-center gap-2 text-right">
                  <MapPin className="w-3.5 h-3.5" />
                  آخر الإجراءات
                </h4>
                <div className="space-y-4">
                  {customers.slice(0, 3).map((c, i) => (
                    <div key={i} className="flex gap-3 text-right">
                      <div className="w-2 h-2 bg-brand-blue rounded-full mt-1.5 shrink-0" />
                      <div>
                        <p className="text-[11px] font-bold text-brand-text leading-tight mb-1">أتم <span className="text-brand-blue">{c.name}</span> تعامله الأخير</p>
                        <p className="text-[9px] font-black text-brand-text3 uppercase tracking-wider">{c.lastOrderDate}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Full Detail Drawer */}
      <AnimatePresence>
        {isDetailsOpen && selectedCustomer && (
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
              className="relative w-full max-w-md bg-brand-card border-l border-brand-border h-full shadow-2xl flex flex-col"
            >
              {/* Header with fixed actions */}
              <div className="p-6 pb-4 flex justify-between items-center bg-brand-card/50 backdrop-blur-md z-20 border-b border-brand-border/30">
                <div className="flex gap-2">
                   <button 
                    onClick={() => openEditModal(selectedCustomer)}
                    className="w-9 h-9 rounded-xl bg-brand-bg3 border border-brand-border flex items-center justify-center text-brand-text3 hover:text-brand-blue transition-all"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setCustomerToDelete(selectedCustomer.id)}
                    className="w-9 h-9 rounded-xl bg-brand-bg3 border border-brand-border flex items-center justify-center text-brand-text3 hover:text-brand-red transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <button 
                  onClick={() => setIsDetailsOpen(false)}
                  className="w-9 h-9 rounded-xl bg-brand-bg2 flex items-center justify-center text-brand-text3 hover:text-white transition-all shadow-xl"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Content Container */}
              <div className="flex-1 overflow-y-auto scrollbar-hide py-6">
                {/* Profile Section */}
                <div className="px-6 pb-8 flex flex-col items-center text-center relative">
                  <div className="absolute -top-24 left-0 right-0 h-48 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.15),transparent)] pointer-events-none" />
                  
                  <div className="relative mb-6">
                    <div className="w-28 h-28 bg-brand-card rounded-[2.5rem] flex items-center justify-center text-brand-blue text-5xl font-black border-[6px] border-brand-bg3 shadow-2xl relative z-10 overflow-hidden group ring-1 ring-brand-blue/10">
                       {selectedCustomer.name[0]}
                       <div className="absolute inset-0 bg-brand-blue/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    {selectedCustomer.totalOrders >= 10 && (
                      <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-brand-yellow rounded-2xl flex items-center justify-center text-xl shadow-xl border-4 border-brand-card z-20 animate-bounce-slow">
                        🏆
                      </div>
                    )}
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-center mb-3">
                      <span className={`text-[9px] font-black px-3 py-1 rounded-full border uppercase tracking-[0.15em] shadow-sm ${
                        selectedCustomer.type === 'wholesale' ? 'bg-brand-yellow/10 border-brand-yellow/30 text-brand-yellow' : 
                        selectedCustomer.type === 'retail' ? 'bg-brand-blue/10 border-brand-blue/30 text-brand-blue' :
                        'bg-brand-green/10 border-brand-green/30 text-brand-green'
                      }`}>
                        {selectedCustomer.type === 'wholesale' ? 'عميل جملة VIP' : 
                         selectedCustomer.type === 'retail' ? 'عميل قطاعي' : 'فرد / ورشة خاريجة'}
                      </span>
                    </div>
                    <h2 className="text-3xl font-black text-brand-text mb-1 tracking-tight">{selectedCustomer.name}</h2>
                    <p className="text-[10px] text-brand-text3 font-bold uppercase tracking-widest opacity-60">عضو نشط منذ مارس ٢٠٢٤</p>
                  </div>

                  <div className="flex items-center justify-center gap-3 mb-8">
                     <span className={`text-[9px] font-black px-3 py-1.5 rounded-xl border flex items-center gap-2 ${getCustomerStatus(selectedCustomer.totalOrders).color} uppercase`}>
                      <span className="text-sm">{getCustomerStatus(selectedCustomer.totalOrders).icon}</span>
                      {getCustomerStatus(selectedCustomer.totalOrders).label}
                     </span>
                     <div className="flex -space-x-1.5 items-center">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="w-6 h-6 rounded-full border-2 border-brand-card bg-brand-bg3 flex items-center justify-center overflow-hidden">
                             <div className="w-full h-full bg-brand-blue/10 flex items-center justify-center text-[8px] font-bold text-brand-blue">
                                {String.fromCharCode(64 + i)}
                             </div>
                          </div>
                        ))}
                        <div className="w-6 h-6 rounded-full border-2 border-brand-card bg-brand-bg3 flex items-center justify-center text-[7px] font-black text-brand-text3">
                           +4
                        </div>
                     </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 w-full">
                    <div className="glass-panel p-4 flex flex-col items-center group/card hover:border-brand-blue/30 transition-all bg-brand-bg3/20">
                      <div className="text-2xl font-black text-brand-text text-number mb-0.5">{selectedCustomer.totalOrders}</div>
                      <div className="text-[8px] font-black text-brand-text3 uppercase tracking-wider">إجمالي الطلبيات</div>
                    </div>
                    <div className="glass-panel p-4 flex flex-col items-center border-brand-green/20 group/card hover:bg-brand-green/5 transition-all bg-brand-bg3/20">
                      <div className="text-2xl font-black text-brand-green text-number mb-0.5">{(selectedCustomer.totalOrders * 3500).toLocaleString()}</div>
                      <div className="text-[8px] font-black text-brand-text3 uppercase tracking-wider text-center">الإنفاق الكلي</div>
                    </div>
                     <div className="glass-panel p-4 flex flex-col items-center group/card hover:border-brand-blue/30 transition-all bg-brand-bg3/20">
                      <div className="text-lg font-black text-brand-text text-number h-8 flex items-center">
                         {selectedCustomer.lastOrderDate === '-' ? 'N/A' : selectedCustomer.lastOrderDate}
                      </div>
                      <div className="text-[8px] font-black text-brand-text3 uppercase tracking-wider">آخر زيارة</div>
                    </div>
                  </div>
                </div>

                {/* Sub-sections */}
                <div className="px-6 space-y-8 pb-10">
                  {/* Notes Section */}
                  <section>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-[10px] font-black text-brand-text uppercase tracking-widest flex items-center gap-2">
                         <StickyNote className="w-3.5 h-3.5 text-brand-yellow" />
                         ملاحظات خاصة
                      </h3>
                    </div>
                    <div className="p-4 bg-brand-yellow/5 border border-brand-yellow/20 rounded-2xl">
                      <p className="text-xs font-bold text-brand-text/80 text-right leading-relaxed italic">
                        {selectedCustomer.note || 'لا توجد ملاحظات مسجلة لهذا العميل.'}
                      </p>
                    </div>
                  </section>

                  <section>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-[10px] font-black text-brand-text uppercase tracking-widest flex items-center gap-2">
                         <MapPin className="w-3.5 h-3.5 text-brand-blue" />
                         بيانات التواصل
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      <div className="p-4 bg-brand-bg3/30 border border-brand-border rounded-2xl flex items-center justify-between group hover:bg-brand-bg3/50 transition-all">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-brand-green/10 rounded-xl flex items-center justify-center border border-brand-green/20 group-hover:scale-110 transition-transform">
                            <Phone className="w-4 h-4 text-brand-green" />
                          </div>
                          <div className="text-right">
                            <div className="text-[8px] font-black text-brand-text3 mb-0.5 uppercase tracking-tighter">رقم الموبايل المسجل</div>
                            <div className="text-base font-black text-brand-text text-number tracking-[0.1em]">{selectedCustomer.mobile}</div>
                          </div>
                        </div>
                        <div className="flex gap-1.5">
                           <a href={`tel:${selectedCustomer.mobile}`} className="w-9 h-9 bg-brand-green rounded-xl flex items-center justify-center text-brand-bg hover:scale-110 transition-transform shadow-lg shadow-brand-green/20">
                             <Phone className="w-4 h-4" />
                           </a>
                           <a href={`https://wa.me/${selectedCustomer.mobile.startsWith('0') ? '2' + selectedCustomer.mobile : selectedCustomer.mobile}`} target="_blank" rel="noreferrer" className="w-9 h-9 bg-brand-green-brd rounded-xl flex items-center justify-center text-brand-green hover:scale-110 transition-transform border border-brand-green/30">
                             <MessageCircle className="w-4 h-4" />
                           </a>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section>
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-[11px] font-black text-brand-text uppercase tracking-widest flex items-center gap-3">
                         <div className="w-8 h-8 bg-brand-yellow/10 rounded-xl flex items-center justify-center shadow-lg shadow-brand-yellow/5">
                           <HistoryIcon className="w-4.5 h-4.5 text-brand-yellow" />
                         </div>
                         المعاملات السابقة
                      </h3>
                      <button 
                        onClick={() => onNavigate?.('orders')}
                        className="px-3 py-1.5 bg-brand-blue/5 border border-brand-blue/10 rounded-lg text-[9px] font-black text-brand-blue uppercase hover:bg-brand-blue/10 transition-all active:scale-95"
                      >
                        عرض الكل
                      </button>
                    </div>
                    
                    <div className="space-y-4">
                      {selectedCustomer.ordersDetail && selectedCustomer.ordersDetail.length > 0 ? (
                        selectedCustomer.ordersDetail.map((order, i, arr) => (
                          <div key={order.id} className="flex gap-4 relative group/item">
                            {/* Timeline Line */}
                            {i < arr.length - 1 && (
                              <div className="absolute top-12 bottom-[-16px] right-[19px] w-[2px] bg-gradient-to-b from-brand-border/40 to-transparent group-hover/item:from-brand-blue/40 transition-colors" />
                            )}
                            
                            {/* ID Badge */}
                            <div className="relative shrink-0">
                              <div className="w-10 h-10 bg-brand-bg3/80 backdrop-blur-md rounded-2xl border border-brand-border/60 flex items-center justify-center z-10 transition-all group-hover/item:border-brand-blue group-hover/item:scale-110 shadow-lg group-hover/item:shadow-brand-blue/10">
                                <span className="text-[9px] font-black text-brand-text group-hover/item:text-brand-blue">#{order.id}</span>
                              </div>
                              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-brand-green rounded-full border-[2.5px] border-brand-card flex items-center justify-center shadow-sm z-20">
                                <CheckCircle2 className="w-2.5 h-2.5 text-white" />
                              </div>
                            </div>

                            {/* Order Details Card */}
                            <div className="flex-1 bg-brand-card/60 hover:bg-brand-bg3/30 border border-brand-border/50 p-4 rounded-[1.5rem] transition-all group-hover/item:border-brand-blue/40 shadow-sm hover:shadow-xl hover:shadow-brand-blue/5 backdrop-blur-sm">
                               <div className="flex justify-between items-start mb-3">
                                  <div className="flex-1">
                                    <h4 className="text-[14px] font-black text-brand-text mb-1.5 group-hover/item:text-brand-blue transition-colors text-right line-clamp-1">
                                      {order.title}
                                    </h4>
                                    <div className="flex items-center gap-2 justify-end">
                                      <span className="text-[8px] font-black text-brand-text2 bg-brand-bg3/50 px-2 py-0.5 rounded-lg border border-brand-border/50 uppercase">{order.type}</span>
                                      {order.weight !== order.type && (
                                        <span className="text-[8px] font-black text-brand-text2 bg-brand-bg3/50 px-2 py-0.5 rounded-lg border border-brand-border/50 uppercase">{order.weight}</span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="text-left shrink-0">
                                    <div className="text-lg font-black text-brand-green text-number tracking-tighter leading-none mb-1">
                                      {order.price.toLocaleString()} <span className="text-[10px] opacity-70">ج.م</span>
                                    </div>
                                    <div className="text-[9px] font-bold text-brand-text3 text-number tracking-tighter opacity-70">
                                      {order.date}
                                    </div>
                                  </div>
                               </div>
                               
                               <div className="flex items-center justify-between pt-3.5 border-t border-brand-border/20">
                                  <div className="flex items-center gap-2">
                                    <div className="relative">
                                      <div className={`w-1.5 h-1.5 rounded-full ${order.status === 'تم التسليم' || order.status === 'مكتمل' ? 'bg-brand-green' : 'bg-brand-yellow'}`} />
                                      <div className={`absolute inset-0 w-1.5 h-1.5 rounded-full ${order.status === 'تم التسليم' || order.status === 'مكتمل' ? 'bg-brand-green' : 'bg-brand-yellow'} animate-ping opacity-60`} />
                                    </div>
                                    <span className={`text-[9px] font-black uppercase tracking-widest ${order.status === 'تم التسليم' || order.status === 'مكتمل' ? 'text-brand-green' : 'text-brand-yellow'}`}>
                                      {order.status}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button 
                                      onClick={() => setOrderToDelete(order.id)}
                                      className="w-8 h-8 rounded-xl bg-brand-red/5 border border-brand-red/10 flex items-center justify-center text-brand-red hover:bg-brand-red hover:text-white transition-all active:scale-95"
                                      title="حذف المعاملة"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                    <button 
                                      onClick={() => onNavigate?.('orders', undefined, order.id)}
                                      className="flex items-center gap-1.5 text-[9px] font-black text-brand-blue bg-brand-blue/10 px-3.5 py-1.5 rounded-xl hover:bg-brand-blue/20 transition-all border border-brand-blue/20 active:scale-95"
                                    >
                                      التفاصيل
                                      <ExternalLink className="w-3 h-3" />
                                    </button>
                                  </div>
                               </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="py-12 flex flex-col items-center justify-center bg-brand-bg3/20 rounded-3xl border border-dashed border-brand-border/30">
                           <Package className="w-10 h-10 text-brand-text3 mb-3 opacity-20" />
                           <p className="text-[10px] font-black text-brand-text3 uppercase tracking-widest">لا توجد سجلات معاملات حقيقية</p>
                        </div>
                      )}
                    </div>
                  </section>
                </div>
              </div>

              {/* Multi-action Bottom Bar */}
              <div className="p-6 pt-5 border-t border-brand-border bg-brand-card/95 backdrop-blur-md flex gap-4">
                 <button 
                   onClick={() => onNavigate?.('orders')}
                   className="flex-[2] bg-brand-blue bg-gradient-to-r from-brand-blue to-blue-600 text-white h-14 rounded-2xl font-black text-base hover:shadow-[0_15px_35px_rgba(59,130,246,0.35)] hover:-translate-y-0.5 transition-all flex items-center justify-center gap-3 active:scale-95 group/main"
                 >
                   <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
                     <Plus className="w-5 h-5 text-white" />
                   </div>
                   طلب جديد
                 </button>
                 <a 
                   href={`https://wa.me/${selectedCustomer.mobile}`}
                   target="_blank"
                   rel="noreferrer"
                   className="flex-1 bg-brand-green/10 border border-brand-green/30 text-brand-green h-14 rounded-2xl font-black text-sm hover:shadow-[0_15px_35px_rgba(34,197,94,0.15)] hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2.5 active:scale-95 group/wa"
                 >
                   <MessageCircle className="w-5 h-5 fill-brand-green/10" />
                   واتساب
                 </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Global Form Modal (Standardized) */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-brand-bg/95 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-sm bg-brand-card border border-brand-border/50 rounded-[2rem] shadow-[0_40px_80px_-15px_rgba(0,0,0,0.6)] overflow-hidden"
            >
              <div className="p-6 border-b border-brand-border bg-gradient-to-r from-brand-blue/10 to-transparent relative">
                <div className="absolute right-0 top-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.1),transparent)]" />
                <h2 className="text-xl font-black text-brand-text tracking-tight relative z-10 flex items-center gap-3">
                  <div className="w-2.5 h-8 bg-brand-blue rounded-full shadow-md shadow-brand-blue/30" />
                  {editingCustomer ? 'تحديث البيانات' : 'إضافة عميل جديد'}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="absolute left-6 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-brand-bg2 border border-brand-border flex items-center justify-center text-brand-text3 hover:text-white transition-all group z-10">
                  <X className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                </button>
              </div>

              <form onSubmit={handleSaveCustomer} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto scrollbar-hide">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-[9px] font-black text-brand-text3 pr-1 uppercase tracking-[0.2em] flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-brand-blue" />
                      الاسم بالكامل
                    </label>
                    <input 
                      required
                      autoFocus
                      type="text" 
                      placeholder="مؤسسة الذهب العربي"
                      className="w-full h-11 bg-brand-bg2 border border-brand-border rounded-xl px-4 text-[13px] text-brand-text focus:outline-none focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/5 transition-all font-black placeholder:text-brand-text3 placeholder:font-normal shadow-inner"
                      value={newCustomer.name}
                      onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-brand-text3 pr-1 uppercase tracking-[0.2em] flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-brand-green" />
                      رقم التواصل
                    </label>
                    <input 
                      required
                      type="text" 
                      dir="ltr"
                      placeholder="01xxxxxxxxx"
                      className="w-full h-11 bg-brand-bg2 border border-brand-border rounded-xl px-4 text-sm font-sans focus:outline-none focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/5 transition-all text-right font-black tracking-[0.2em] placeholder:tracking-normal placeholder:font-normal shadow-inner"
                      value={newCustomer.mobile}
                      onChange={(e) => setNewCustomer({...newCustomer, mobile: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-brand-text3 pr-1 uppercase tracking-[0.2em] flex items-center gap-2">
                      <Tag className="w-3.5 h-3.5 text-brand-yellow" />
                      تصنيف العميل
                    </label>
                    <select 
                      className="w-full h-11 bg-brand-bg2 border border-brand-border rounded-xl px-4 text-[12px] font-black text-brand-text focus:border-brand-blue outline-none transition-all shadow-inner appearance-none"
                      value={newCustomer.type}
                      onChange={(e) => setNewCustomer({...newCustomer, type: e.target.value})}
                    >
                      <option value="wholesale">تاجر جملة</option>
                      <option value="retail">محل قطاعي</option>
                      <option value="individual">فرد / ورشة</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black text-brand-text3 pr-1 uppercase tracking-[0.2em] flex items-center gap-2">
                    <StickyNote className="w-3.5 h-3.5 text-brand-blue" />
                    ملاحظات أو قياسات
                  </label>
                  <textarea 
                    rows={2}
                    placeholder="مقاس الخاتم، تفضيلات خاصة..."
                    className="w-full bg-brand-bg2 border border-brand-border rounded-xl p-3 text-[12px] text-brand-text focus:outline-none focus:border-brand-blue transition-all font-bold placeholder:font-normal shadow-inner resize-none"
                    value={newCustomer.note}
                    onChange={(e) => setNewCustomer({...newCustomer, note: e.target.value})}
                  />
                </div>

                <div className="pt-3 flex gap-3 sticky bottom-0 bg-brand-card">
                  <button 
                    type="submit"
                    className="flex-[2.5] h-11 bg-brand-blue text-white rounded-xl font-black text-sm hover:shadow-lg transition-all active:scale-95 relative overflow-hidden group/submit"
                  >
                    {editingCustomer ? 'حفظ التحديثات' : 'تأكيد التسجيل'}
                  </button>
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 h-11 bg-brand-bg3 text-brand-text3 font-black text-[11px] rounded-xl hover:bg-brand-bg2 transition-all active:scale-95 border border-brand-border/30"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      {/* Delete Confirmation Modal for Orders */}
      <AnimatePresence>
        {orderToDelete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOrderToDelete(null)}
              className="absolute inset-0 bg-brand-bg/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-brand-card border border-brand-border p-6 rounded-[2rem] shadow-2xl max-w-sm w-full text-center"
            >
              <div className="w-16 h-16 bg-brand-red/10 rounded-2xl flex items-center justify-center text-brand-red mx-auto mb-4">
                <Trash2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-brand-text mb-2">تأكيد حذف المعاملة</h3>
              <p className="text-[13px] text-brand-text3 font-medium mb-6">هل أنت متأكد من حذف هذه المعاملة من سجلات النظام؟ لا يمكن التراجع عن هذا الإجراء.</p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setOrderToDelete(null)}
                  className="flex-1 h-11 bg-brand-bg3/50 text-brand-text3 rounded-xl font-black text-xs hover:bg-brand-bg3 transition-all"
                >
                  إلغاء
                </button>
                <button 
                  onClick={() => {
                    if (selectedCustomer && orderToDelete) {
                      const savedOrders = localStorage.getItem('workshop_orders');
                      if (savedOrders) {
                        const allOrders = JSON.parse(savedOrders);
                        const updatedAllOrders = allOrders.filter((o: any) => o.id.replace('ORD-', '') !== orderToDelete);
                        localStorage.setItem('workshop_orders', JSON.stringify(updatedAllOrders));
                        
                        const updatedOrdersDetail = selectedCustomer.ordersDetail?.filter(o => o.id !== orderToDelete);
                        const updatedCustomer = { 
                          ...selectedCustomer, 
                          ordersDetail: updatedOrdersDetail,
                          totalOrders: Math.max(0, (selectedCustomer.totalOrders || 1) - 1)
                        };
                        setSelectedCustomer(updatedCustomer);
                        setCustomers(prev => prev.map(c => c.id === selectedCustomer.id ? updatedCustomer : c));
                        addNotification('تم حذف المعاملة بنجاح', 'error');
                      }
                      setOrderToDelete(null);
                    }
                  }}
                  className="flex-1 h-11 bg-brand-red text-white rounded-xl font-black text-xs hover:bg-brand-red/90 transition-all shadow-lg shadow-brand-red/20"
                >
                  حذف نهائي
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {customerToDelete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCustomerToDelete(null)}
              className="absolute inset-0 bg-[#000]/80 backdrop-blur-md" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-brand-card border border-brand-border rounded-[2.5rem] p-8 shadow-2xl text-center overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-full h-1 bg-brand-red" />
              <div className="w-20 h-20 bg-brand-red/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 className="w-10 h-10 text-brand-red" />
              </div>
              <h2 className="text-xl font-black text-brand-text mb-2">حذف العميل</h2>
              <p className="text-brand-text2 text-sm mb-8 leading-relaxed">
                هل أنت متأكد من رغبتك في حذف هذا العميل؟ <br />
                <span className="font-black text-brand-red">سيتم مسح كافة السجلات المرتبطة به نهائياً.</span>
              </p>
              <div className="flex gap-4">
                <button
                  onClick={confirmDelete}
                  className="flex-1 bg-brand-red text-white py-3 rounded-xl font-black text-xs hover:shadow-[0_0_20px_rgba(239,68,68,0.4)] transition-all active:scale-95"
                >
                  نعم، احذف
                </button>
                <button
                  onClick={() => setCustomerToDelete(null)}
                  className="flex-1 bg-brand-bg3 text-brand-text font-black text-xs py-3 rounded-xl hover:bg-brand-bg2 transition-all active:scale-95 border border-brand-border/30"
                >
                  إلغاء
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* System Toast Notification (Migrated to Global) */}
    </div>
  );
}

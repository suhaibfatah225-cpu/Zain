import React, { useState } from 'react';
import { 
  Wallet, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Plus, 
  Search, 
  Filter, 
  MoreVertical,
  Calendar,
  Banknote,
  TrendingUp,
  Receipt,
  CreditCard,
  User,
  Trash2,
  Edit2,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  date: string;
  description: string;
  status: 'completed' | 'pending';
}

const MOCK_DATA = [
  { name: 'يناير', income: 45000, expense: 32000 },
  { name: 'فبراير', income: 52000, expense: 28000 },
  { name: 'مارس', income: 48000, expense: 35000 },
  { name: 'أبريل', income: 61000, expense: 38000 },
];

const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: 'TRX-101',
    type: 'income',
    category: 'عربون طلب',
    amount: 500,
    date: '2026/04/29',
    description: 'عربون طلب رقم #5501 - فهد العامري',
    status: 'completed'
  },
  {
    id: 'TRX-102',
    type: 'expense',
    category: 'مواد خام',
    amount: 1200,
    date: '2026/04/28',
    description: 'شراء سبائك فضة عيار 925 (500 جرام)',
    status: 'completed'
  },
  {
    id: 'TRX-103',
    type: 'income',
    category: 'دفعة نهائية',
    amount: 1800,
    date: '2026/04/28',
    description: 'تسليم طلب رقم #5480 - سارة خالد',
    status: 'completed'
  },
  {
    id: 'TRX-104',
    type: 'expense',
    category: 'رواتب',
    amount: 5000,
    date: '2026/04/27',
    description: 'راتب الفني أحمد محمود - شهر أبريل',
    status: 'pending'
  },
  {
    id: 'TRX-105',
    type: 'expense',
    category: 'إيجار',
    amount: 2500,
    date: '2026/04/25',
    description: 'إيجار الورشة القسم الثاني',
    status: 'completed'
  }
];

export function FinancialsContent() {
  const [isMounted, setIsMounted] = React.useState(false);
  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('workshop_transactions');
    if (saved) return JSON.parse(saved);
    return MOCK_TRANSACTIONS;
  });

  // Save to localStorage whenever transactions change
  React.useEffect(() => {
    localStorage.setItem('workshop_transactions', JSON.stringify(transactions));
  }, [transactions]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'income' | 'expense'>('all');
  
  // Modal State
  const [trxType, setTrxType] = useState<'income' | 'expense'>('income');
  const [trxDescription, setTrxDescription] = useState('');
  const [trxAmount, setTrxAmount] = useState('');
  const [trxCategory, setTrxCategory] = useState('عاملة');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [trxToDelete, setTrxToDelete] = useState<string | null>(null);

  const handleAddTransaction = () => {
    if (!trxAmount || !trxDescription) return;
    
    if (editingTransaction) {
      setTransactions(transactions.map(t => t.id === editingTransaction.id ? { 
        ...t, 
        type: trxType,
        category: trxCategory,
        amount: parseFloat(trxAmount),
        description: trxDescription 
      } : t));
      setEditingTransaction(null);
    } else {
      const newTrx: Transaction = {
        id: `TRX-${Math.floor(Math.random() * 900) + 100}`,
        type: trxType,
        category: trxCategory,
        amount: parseFloat(trxAmount),
        date: new Date().toLocaleDateString('en-CA'),
        description: trxDescription,
        status: 'completed'
      };
      setTransactions([newTrx, ...transactions]);
    }

    setIsModalOpen(false);
    setTrxDescription('');
    setTrxAmount('');
    setTrxType('income');
    setTrxCategory('عاملة');
  };

  const confirmDelete = (id: string) => {
    setTransactions(transactions.filter(t => t.id !== id));
    setTrxToDelete(null);
    setActiveMenuId(null);
  };

  const startEdit = (trx: Transaction) => {
    setEditingTransaction(trx);
    setTrxType(trx.type);
    setTrxDescription(trx.description);
    setTrxAmount(trx.amount.toString());
    setTrxCategory(trx.category);
    setIsModalOpen(true);
    setActiveMenuId(null);
  };

  const totalBalance = transactions.reduce((sum, t) => t.type === 'income' ? sum + t.amount : sum - t.amount, 0);
  const monthIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const monthExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = (t.description?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || t.id.includes(searchTerm);
    const matchesTab = activeTab === 'all' || t.type === activeTab;
    return matchesSearch && matchesTab;
  });

  return (
    <div className="flex flex-col gap-6 h-full relative">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-black text-brand-text flex items-center gap-2">
            <Wallet className="w-5 h-5 text-brand-green" />
            الإدارة المالية
          </h1>
          <p className="text-brand-text2 text-[10px] mt-0.5">تتبع التدفق النقدي، الإيرادات، والمصروفات</p>
        </div>
        
        <div className="flex gap-1.5">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 bg-brand-green hover:bg-brand-green/90 text-[#0A0C0F] px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            إضافة معاملة
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {[
          { label: 'إجمالي الرصيد', value: totalBalance.toLocaleString(), icon: Wallet, color: 'text-brand-blue', sub: 'رصيد المحفظة التقريبي' },
          { label: 'إجمالي الإيرادات', value: monthIncome.toLocaleString(), icon: ArrowUpCircle, color: 'text-brand-green', sub: 'إجمالي ما تم تحصيله' },
          { label: 'إجمالي المصروفات', value: monthExpense.toLocaleString(), icon: ArrowDownCircle, color: 'text-brand-red', sub: 'إجمالي ما تم صرفه' },
        ].map((stat, i) => (
          <div key={i} className="glass-panel p-3 relative overflow-hidden group">
            <div className={`absolute top-0 left-0 w-1 h-full ${stat.color.replace('text-', 'bg-')}`} />
            <div className="flex justify-between items-start mb-2">
              <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center">
                <stat.icon className={`w-3.5 h-3.5 ${stat.color}`} />
              </div>
            </div>
            <div>
              <div className="text-[8px] uppercase font-bold text-brand-text3 tracking-wider">{stat.label}</div>
              <div className="flex items-baseline gap-1">
                <span className={`text-lg font-black text-brand-text text-number tracking-tighter`}>{stat.value}</span>
                <span className="text-[8px] font-bold text-brand-text3">ج.م</span>
              </div>
              <p className="text-[8px] text-brand-text3 mt-0.5">{stat.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
        <div className="lg:col-span-8 glass-panel p-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-brand-blue" />
              <h3 className="text-[11px] font-bold text-brand-text">الإيرادات مقابل المصروفات</h3>
            </div>
            <select className="bg-brand-bg2 border border-brand-border rounded-lg text-[8px] font-bold px-1.5 py-0.5 outline-none">
              <option>آخر 4 أشهر</option>
              <option>سنة 2026</option>
            </select>
          </div>
          <div className="h-[210px] md:h-[230px] w-full relative mb-4" dir="ltr">
            {isMounted && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={MOCK_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00C896" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#00C896" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    stroke="#555B6E" 
                    fontSize={9} 
                    fontWeight="bold" 
                    axisLine={false} 
                    tickLine={false} 
                    dy={8}
                  />
                  <YAxis 
                    stroke="#555B6E" 
                    fontSize={9} 
                    fontWeight="bold" 
                    axisLine={false} 
                    tickLine={false}
                    tickFormatter={(val) => `${val/1000}k`}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#141720', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', fontSize: '9px' }}
                    itemStyle={{ fontSize: '9px', fontWeight: 'bold' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="income" 
                    stroke="#00C896" 
                    fillOpacity={1} 
                    fill="url(#colorIncome)" 
                    strokeWidth={1.5}
                    name="الإيرادات"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="expense" 
                    stroke="#FF4D4D" 
                    fillOpacity={0} 
                    strokeWidth={1.5}
                    name="المصروفات"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="lg:col-span-4 glass-panel p-3">
          <h3 className="text-[11px] font-bold text-brand-text mb-3 flex items-center gap-1.5">
            <Receipt className="w-3.5 h-3.5 text-brand-yellow" />
            تحليل المصروفات
          </h3>
          <div className="space-y-2.5">
            {[
              { label: 'رواتب وعمالة', percent: 65, color: 'bg-brand-blue' },
              { label: 'مواد خام وذهب/فضة', percent: 20, color: 'bg-brand-yellow' },
              { label: 'أدوات وصيانة', percent: 10, color: 'bg-brand-purple' },
              { label: 'كهرباء وخدمات', percent: 5, color: 'bg-brand-text3' },
            ].map((item, i) => (
              <div key={i}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[9px] font-bold text-brand-text2">{item.label}</span>
                  <span className="text-[9px] font-bold text-brand-text text-number">{item.percent}%</span>
                </div>
                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                  <div className={`h-full ${item.color}`} style={{ width: `${item.percent}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 pt-4 border-t border-brand-border">
            <div className="flex items-center gap-2 glass-panel-2 p-2.5 bg-brand-yellow-dim border-brand-yellow-brd">
              <div className="w-7 h-7 rounded-lg bg-brand-yellow flex items-center justify-center shrink-0">
                <CreditCard className="w-3.5 h-3.5 text-[#0A0C0F]" />
              </div>
              <p className="text-[9px] text-brand-yellow font-bold leading-tight">تنبيه: ميزانية الرواتب للشهر الحالي تجاوزت المخطط بـ 520 ج.م</p>
            </div>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex gap-1 bg-brand-bg2 p-1 rounded-xl border border-brand-border">
            {[
              { id: 'all', label: 'الكل' },
              { id: 'income', label: 'إيداعات' },
              { id: 'expense', label: 'مصروفات' },
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-1.5 rounded-lg text-[11px] font-bold transition-all ${activeTab === tab.id ? 'bg-brand-card text-brand-text shadow-sm' : 'text-brand-text3 hover:text-brand-text2'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-[300px]">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text3" />
            <input 
              type="text" 
              placeholder="البحث في المعاملات..."
              className="w-full bg-brand-card border border-brand-border rounded-xl py-2 pr-9 pl-3 text-xs focus:outline-none focus:border-brand-green transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="glass-panel">
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead>
                <tr className="bg-white/2 border-b border-brand-border">
                  <th className="px-4 py-3 text-[9px] font-bold text-brand-text3 uppercase tracking-wider">المعاملة</th>
                  <th className="px-4 py-3 text-[9px] font-bold text-brand-text3 uppercase tracking-wider text-center">التاريخ</th>
                  <th className="px-4 py-3 text-[9px] font-bold text-brand-text3 uppercase tracking-wider text-center">الفئة</th>
                  <th className="px-4 py-3 text-[9px] font-bold text-brand-text3 uppercase tracking-wider text-center">الحالة</th>
                  <th className="px-4 py-3 text-[9px] font-bold text-brand-text3 uppercase tracking-wider text-left">المبلغ</th>
                  <th className="px-4 py-3 text-[9px] font-bold text-brand-text3 uppercase tracking-wider text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {filteredTransactions.map((trx) => (
                  <tr key={trx.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${trx.type === 'income' ? 'bg-brand-green-dim text-brand-green' : 'bg-brand-red-dim text-brand-red'}`}>
                          {trx.type === 'income' ? <ArrowUpCircle className="w-3.5 h-3.5" /> : <ArrowDownCircle className="w-3.5 h-3.5" />}
                        </div>
                        <div>
                          <div className="text-[11px] font-bold text-brand-text line-clamp-1">{trx.description}</div>
                          <div className="text-[9px] text-brand-text3 text-number mt-0.5">{trx.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="text-[11px] font-bold text-brand-text text-number">{trx.date}</div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-[9px] font-bold text-brand-text2 bg-brand-bg2 px-1.5 py-0.5 rounded border border-brand-border">
                        {trx.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[8px] font-black border ${trx.status === 'completed' ? 'bg-brand-green-dim text-brand-green border-brand-green-brd' : 'bg-brand-yellow-dim text-brand-yellow border-brand-yellow-brd'}`}>
                        {trx.status === 'completed' ? 'مكتمل' : 'معلق'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-left">
                      <div className={`text-[11px] font-black text-number ${trx.type === 'income' ? 'text-brand-green' : 'text-brand-red'}`}>
                        {trx.type === 'income' ? '+' : '-'}{trx.amount.toLocaleString()} ج.م
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="relative">
                        <button 
                          onClick={() => setActiveMenuId(activeMenuId === trx.id ? null : trx.id)}
                          className="p-1.5 hover:bg-white/5 rounded-lg transition-colors"
                        >
                          <MoreVertical className="w-4 h-4 text-brand-text3" />
                        </button>

                        <AnimatePresence>
                          {activeMenuId === trx.id && (
                            <>
                              <div className="fixed inset-0 z-10" onClick={() => setActiveMenuId(null)} />
                              <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: -10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: -10 }}
                                className="absolute left-0 mt-2 w-36 bg-brand-card border border-brand-border rounded-xl shadow-2xl z-20 overflow-hidden"
                              >
                                <div className="p-1 flex flex-col">
                                  <button 
                                    onClick={() => startEdit(trx)}
                                    className="flex items-center gap-2 px-3 py-2 text-[10px] font-bold text-brand-text hover:bg-white/5 rounded-lg text-right"
                                  >
                                    <Edit2 className="w-3.5 h-3.5 text-brand-blue" />
                                    تعديل المعاملة
                                  </button>
                                  <button 
                                    onClick={() => setTrxToDelete(trx.id)}
                                    className="flex items-center gap-2 px-3 py-2 text-[10px] font-bold text-brand-red hover:bg-brand-red/10 rounded-lg text-right"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    حذف السجل
                                  </button>
                                </div>
                              </motion.div>
                            </>
                          )}
                        </AnimatePresence>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredTransactions.length === 0 && (
            <div className="py-20 flex flex-col items-center justify-center text-center opacity-50">
              <Receipt className="w-10 h-10 mb-4" />
              <p className="text-sm font-bold">لا توجد معاملات مطابقة</p>
            </div>
          )}
        </div>
      </div>

      {/* Placeholder Modal for Adding Transaction */}
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
              className="relative w-full max-w-sm bg-brand-card border border-brand-border rounded-xl shadow-2xl overflow-hidden"
            >
              <div className="p-4 border-b border-brand-border flex justify-between items-center bg-brand-bg3/50 backdrop-blur-md">
                <h2 className="text-sm font-black text-brand-text">
                  {editingTransaction ? 'تعديل المعاملة' : 'إضافة معاملة مالية'}
                </h2>
                <button onClick={() => {
                  setIsModalOpen(false);
                  setEditingTransaction(null);
                  setTrxAmount('');
                  setTrxDescription('');
                }} className="p-1.5 hover:bg-white/5 rounded-lg text-brand-text3 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 space-y-3.5">
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => setTrxType('income')}
                    className={`flex items-center justify-center gap-1.5 py-2.5 rounded-lg border transition-all ${trxType === 'income' ? 'border-brand-green bg-brand-green-dim text-brand-green' : 'border-brand-border bg-brand-bg2 text-brand-text3 hover:border-brand-text2'} text-[11px] font-black`}
                  >
                    <ArrowUpCircle className="w-4 h-4" />
                    إيداع (دخل)
                  </button>
                  <button 
                    onClick={() => setTrxType('expense')}
                    className={`flex items-center justify-center gap-1.5 py-2.5 rounded-lg border transition-all ${trxType === 'expense' ? 'border-brand-red bg-brand-red-dim text-brand-red' : 'border-brand-border bg-brand-bg2 text-brand-text3 hover:border-brand-text2'} text-[11px] font-black`}
                  >
                    <ArrowDownCircle className="w-4 h-4" />
                    صرف (مصروف)
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-brand-text3 pr-1">المبلغ (ج.م)</label>
                    <div className="relative">
                      <Banknote className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-brand-text3" />
                      <input 
                        type="number" 
                        placeholder="0.00"
                        value={trxAmount}
                        onChange={(e) => setTrxAmount(e.target.value)}
                        className="w-full bg-brand-bg2 border border-brand-border rounded-lg py-1.5 pr-8 pl-3 text-[12px] text-number focus:outline-none focus:border-brand-green transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-brand-text3 pr-1">الفئة</label>
                    <select 
                      value={trxCategory}
                      onChange={(e) => setTrxCategory(e.target.value)}
                      className="w-full bg-brand-bg2 border border-brand-border rounded-lg py-1.5 px-3 text-[12px] focus:outline-none focus:border-brand-green transition-all outline-none"
                    >
                      <option value="رواتب">رواتب</option>
                      <option value="مواد خام">مواد خام</option>
                      <option value="إيجار">إيجار</option>
                      <option value="عربون طلب">عربون طلب</option>
                      <option value="تلميع">تلميع</option>
                      <option value="أخرى">أخرى</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-brand-text3 pr-1">الوصف</label>
                    <textarea 
                      placeholder="اكتب ملاحظات المعاملة هنا..."
                      rows={1}
                      value={trxDescription}
                      onChange={(e) => setTrxDescription(e.target.value)}
                      className="w-full bg-brand-bg2 border border-brand-border rounded-lg py-1.5 px-3 text-[12px] focus:outline-none focus:border-brand-green transition-all resize-none"
                    />
                  </div>
                </div>

                <div className="pt-2 flex gap-2">
                  <button 
                    onClick={handleAddTransaction}
                    className="flex-[2] bg-brand-green text-brand-bg py-2 rounded-lg font-black text-[11px] hover:scale-[1.02] active:scale-95 transition-all shadow-md shadow-brand-green/10"
                  >
                    حفظ المعاملة
                  </button>
                  <button 
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 bg-brand-bg2 border border-brand-border text-brand-text3 py-2 rounded-lg font-bold text-[11px] hover:bg-white/5 transition-all"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {trxToDelete && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setTrxToDelete(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-brand-card border border-brand-border rounded-[2rem] p-8 shadow-2xl text-center"
            >
              <div className="w-20 h-20 bg-brand-red/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 className="w-10 h-10 text-brand-red" />
              </div>
              <h2 className="text-xl font-black text-brand-text mb-2">تأكيد حذف المعاملة</h2>
              <p className="text-brand-text2 text-sm mb-8 leading-relaxed">
                هل أنت متأكد من رغبتك في حذف هذا السجل المالي؟ <br />
                <span className="font-black text-brand-red">لا يمكن التراجع عن هذا الإجراء.</span>
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => confirmDelete(trxToDelete)}
                  className="flex-1 bg-brand-red text-white py-3 rounded-xl font-black text-xs hover:shadow-[0_0_20px_rgba(239,68,68,0.4)] transition-all"
                >
                  نعم، احذف
                </button>
                <button
                  onClick={() => setTrxToDelete(null)}
                  className="flex-1 bg-brand-bg3 text-brand-text font-black text-xs py-3 rounded-xl hover:bg-brand-bg2 transition-all"
                >
                  إلغاء
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

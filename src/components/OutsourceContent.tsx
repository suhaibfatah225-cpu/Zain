import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Wrench, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  ExternalLink,
  ChevronDown,
  Clock,
  CheckCircle2,
  AlertCircle,
  Building2,
  MoreVertical,
  X,
  PlusCircle,
  Truck,
  Trash2,
  Edit2,
  RotateCw
} from 'lucide-react';

interface OutsourceTask {
  id: string;
  orderId: string;
  customerName: string;
  workshopName: string;
  serviceType: string;
  status: 'بانتظار الإرسال' | 'لدى الورشة' | 'تم الاستلام';
  cost: number;
  sentDate: string;
  expectedDate: string;
  receivedDate?: string;
  notes: string;
}

const MOCK_OUTSOURCE: OutsourceTask[] = [
  {
    id: 'OUT-1001',
    orderId: 'ORD-5501',
    customerName: 'فهد العامري',
    workshopName: 'الطلاء',
    serviceType: 'طلاء ذهب عيار 18',
    status: 'لدى الورشة',
    cost: 150,
    sentDate: '2026/04/28',
    expectedDate: '2026/05/01',
    notes: 'تأكيد لمعة الطلاء'
  },
  {
    id: 'OUT-1002',
    orderId: 'ORD-5502',
    customerName: 'سارة خالد',
    workshopName: 'التصميمات',
    serviceType: 'صب قالب شمعي',
    status: 'بانتظار الإرسال',
    cost: 85,
    sentDate: '2026/04/30',
    expectedDate: '2026/05/02',
    notes: 'الدقة العالية في التفاصيل'
  },
  {
    id: 'OUT-1003',
    orderId: 'ORD-5480',
    customerName: 'أحمد محمود',
    workshopName: 'الليزر',
    serviceType: 'حفر ليزر أسماء',
    status: 'تم الاستلام',
    cost: 50,
    sentDate: '2026/04/25',
    expectedDate: '2026/04/26',
    receivedDate: '2026/04/26',
    notes: 'الاستلام بجودة ممتازة'
  }
];

const WORKSHOPS = [
  'التصميم',
  'المنشار',
  'الليزر',
  'اللحام',
  'التشطيب',
  'الطلاء',
  'المينا'
];

export function OutsourceContent() {
  const [tasks, setTasks] = useState<OutsourceTask[]>(() => {
    const saved = localStorage.getItem('workshop_outsource');
    return saved ? JSON.parse(saved) : MOCK_OUTSOURCE;
  });

  useEffect(() => {
    localStorage.setItem('workshop_outsource', JSON.stringify(tasks));
  }, [tasks]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  const handleRefresh = () => {
    setIsRefreshing(true);
    // Simulate re-fetching from local storage or server
    setTimeout(() => {
      const saved = localStorage.getItem('workshop_outsource');
      if (saved) {
        setTasks(JSON.parse(saved));
      }
      setIsRefreshing(false);
    }, 600);
  };
  const [newTask, setNewTask] = useState<Partial<OutsourceTask>>({
    workshopName: WORKSHOPS[0],
    status: 'بانتظار الإرسال',
    cost: 0
  });
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<OutsourceTask | null>(null);
  const [showOrderResults, setShowOrderResults] = useState(false);

  // Simulation of finding existing orders to link
  const existingOrders = [
    { id: 'ORD-5501', customerName: 'فهد العامري' },
    { id: 'ORD-5502', customerName: 'سارة خالد' },
    { id: 'ORD-5503', customerName: 'عبدالعزيز محمد' },
  ];

  const handleLinkOrder = (order: { id: string, customerName: string }) => {
    setNewTask({ ...newTask, orderId: order.id, customerName: order.customerName });
    setShowOrderResults(false);
  };

  const handleUpdateStatus = (id: string, newStatus: OutsourceTask['status']) => {
    setTasks(tasks.map(t => {
      if (t.id === id) {
        return { 
          ...t, 
          status: newStatus,
          receivedDate: newStatus === 'تم الاستلام' ? new Date().toLocaleDateString('en-CA') : t.receivedDate
        };
      }
      return t;
    }));
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Format helper to YYYY/MM/DD
    const formatDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}/${month}/${day}`;
    };

    if (editingTask) {
      setTasks(tasks.map(t => t.id === editingTask.id ? { ...t, ...newTask } as OutsourceTask : t));
      setEditingTask(null);
    } else {
      const id = `OUT-${Math.floor(1000 + Math.random() * 9000)}`;
      const task = {
        ...newTask,
        id,
        sentDate: formatDate(new Date()),
        expectedDate: formatDate(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)),
      } as OutsourceTask;
      setTasks([task, ...tasks]);
    }
    
    setIsModalOpen(false);
    setNewTask({ workshopName: WORKSHOPS[0], status: 'بانتظار الإرسال', cost: 0 });
  };

  const handleDeleteTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
    setActiveMenuId(null);
  };

  const startEdit = (task: OutsourceTask) => {
    setEditingTask(task);
    setNewTask(task);
    setIsModalOpen(true);
    setActiveMenuId(null);
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = 
      task.workshopName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.orderId.includes(searchTerm) ||
      task.customerName.includes(searchTerm) ||
      task.serviceType.includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const costByStage = WORKSHOPS.reduce((acc, stage) => {
    const stageTasks = tasks.filter(t => t.workshopName === stage);
    const total = stageTasks.reduce((sum, t) => sum + t.cost, 0);
    if (total > 0) acc.push({ label: stage, total, count: stageTasks.length });
    return acc;
  }, [] as { label: string; total: number; count: number }[]);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'تم الاستلام':
        return 'bg-brand-green-dim text-brand-green border-brand-green-brd';
      case 'لدى الورشة':
        return 'bg-brand-blue-dim text-brand-blue border-brand-blue/20';
      default:
        return 'bg-brand-yellow-dim text-brand-yellow border-brand-yellow-brd shadow-[0_0_12px_rgba(255,176,32,0.15)]';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'تم الاستلام':
        return <CheckCircle2 className="w-3.5 h-3.5" />;
      case 'لدى الورشة':
        return <Truck className="w-3.5 h-3.5" />;
      default:
        return <Clock className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="flex flex-col gap-6 h-full relative">
      {/* Header section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-brand-text flex items-center gap-2">
            <Wrench className="w-7 h-7 text-brand-blue" />
            الأعمال الخارجية
          </h1>
          <p className="text-brand-text2 text-sm mt-1">إدارة وتتبع العمليات المرسلة للورش الخارجية</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleRefresh}
            className="flex items-center justify-center p-2.5 bg-brand-bg2 border border-brand-border rounded-xl text-brand-text3 hover:text-brand-blue hover:border-brand-blue/30 transition-all active:scale-90"
            title="تحديث البيانات"
          >
            <RotateCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-brand-blue hover:bg-brand-blue/90 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-[0_4px_12px_rgba(77,158,255,0.2)] hover:scale-[1.02] active:scale-95"
          >
            <PlusCircle className="w-5 h-5" />
            إرسال شغل لورشة
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-brand-blue" />
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
              <Truck className="w-5 h-5 text-brand-blue" />
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-brand-text3 mb-1 tracking-wider">شحنات خارجية نشطة</div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-brand-text text-number tracking-tighter">
                {tasks.filter(t => t.status !== 'تم الاستلام').length}
              </span>
              <span className="text-[10px] font-bold text-brand-text3">قطعة</span>
            </div>
          </div>
        </div>

        <div className="glass-panel p-5 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-brand-green" />
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-brand-green" />
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-brand-text3 mb-1 tracking-wider">إجمالي التكلفة الخارجية</div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-brand-text text-number tracking-tighter">
                {tasks.reduce((sum, t) => sum + t.cost, 0).toLocaleString()}
              </span>
              <span className="text-[10px] font-bold text-brand-text3">ج.م</span>
            </div>
          </div>
        </div>

        {/* Cost by Stage Breakdown */}
        <div className="lg:col-span-2 glass-panel p-4 flex flex-col gap-3">
          <div className="text-[10px] uppercase font-black text-brand-text3 tracking-[0.2em] mb-1">إجمالي الحساب حسب المرحلة الخراجية</div>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {costByStage.length > 0 ? costByStage.map((s, idx) => (
              <div key={idx} className="bg-brand-bg2 border border-brand-border rounded-xl px-4 py-2 shrink-0 min-w-[120px] hover:border-brand-blue/30 transition-all group">
                <div className="text-[9px] font-bold text-brand-text3 mb-1 flex justify-between items-center">
                  <span>{s.label}</span>
                  <span className="bg-brand-blue/10 text-brand-blue px-1.5 rounded-sm">{s.count}</span>
                </div>
                <div className="text-sm font-black text-brand-text text-number group-hover:text-brand-blue transition-colors">{s.total.toLocaleString()} <span className="text-[9px]">ج.م</span></div>
              </div>
            )) : (
              <div className="text-xs text-brand-text3 italic py-2">لا توجد بيانات مرحلية حالياً</div>
            )}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1 group">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-text3 group-focus-within:text-brand-blue transition-colors" />
          <input 
            type="text" 
            placeholder="بحث باسم الورشة، رقم الطلب، أو نوع الخدمة..."
            className="w-full bg-brand-card border border-brand-border rounded-xl py-3 pr-11 pl-4 text-sm focus:outline-none focus:border-brand-blue transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex bg-brand-card border border-brand-border rounded-xl p-1 shrink-0 overflow-x-auto scrollbar-hide">
          {[
            { id: 'all', label: 'الكل' },
            { id: 'بانتظار الإرسال', label: 'بانتظار الإرسال' },
            { id: 'لدى الورشة', label: 'لدى الورشة' },
            { id: 'تم الاستلام', label: 'المكتمل' },
          ].map(m => (
            <button
              key={m.id}
              onClick={() => setStatusFilter(m.id)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${statusFilter === m.id ? 'bg-brand-bg2 text-brand-blue shadow-sm' : 'text-brand-text3 hover:text-brand-text2'}`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tasks List */}
      <div className="flex flex-col gap-4 pb-10">
        <AnimatePresence mode="popLayout">
          {filteredTasks.map((task) => (
            <motion.div
              layout
              key={task.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`glass-panel group hover:border-brand-blue/30 transition-all duration-300 ${activeMenuId === task.id ? 'z-50 relative' : 'relative z-0'}`}
            >
              <div className="p-4 lg:p-5 flex flex-col md:flex-row gap-5">
                {/* Status and Icon */}
                <div className="flex md:flex-col items-center md:justify-center gap-3 shrink-0 md:bg-brand-bg2 md:rounded-2xl md:p-3 md:border md:border-brand-border">
                  <div className="w-12 h-12 rounded-2xl bg-brand-blue-dim border border-brand-blue/20 flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-brand-blue" />
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold border flex items-center gap-1.5 ${getStatusStyle(task.status)}`}>
                    {getStatusIcon(task.status)}
                    {task.status}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-brand-text">{task.workshopName}</h3>
                        <span className="text-[10px] bg-brand-bg2 border border-brand-border px-2 py-0.5 rounded text-brand-text3 font-bold uppercase tracking-wider text-number">{task.id}</span>
                        {new Date(task.expectedDate.replace(/\//g, '-')) < new Date(new Date().setHours(0,0,0,0)) && (
                          <span className="flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded bg-brand-red-dim text-brand-red border border-brand-red-brd animate-pulse">
                            <AlertCircle className="w-3 h-3" />
                            تأخير استلام
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs">
                        <span className="text-brand-text2 font-bold px-2 py-0.5 bg-white/5 rounded border border-brand-border">{task.serviceType}</span>
                        <div className="flex items-center gap-1.5 text-brand-text3">
                          <ExternalLink className="w-3 h-3" />
                          <span className="font-bold">طلب: {task.orderId}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-left bg-brand-bg2/50 border border-brand-border rounded-xl px-4 py-2 shrink-0">
                      <div className="text-[9px] text-brand-text3 font-bold uppercase mb-0.5">التكلفة</div>
                      <div className="text-sm font-black text-brand-blue text-number">{task.cost.toLocaleString()} ج.م</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-3 border-t border-brand-border">
                    <div>
                      <div className="text-[10px] text-brand-text3 font-bold mb-1">العميل</div>
                      <div className="text-[11px] font-bold text-brand-text truncate">{task.customerName}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-brand-text3 font-bold mb-1">تاريخ الإرسال</div>
                      <div className="text-[11px] font-bold text-brand-text2 text-number flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        {task.sentDate}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-brand-text3 font-bold mb-1">المتوقع</div>
                      <div className="text-[11px] font-bold text-brand-blue text-number flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {task.expectedDate}
                      </div>
                    </div>
                    <div className="hidden lg:block">
                      <div className="text-[10px] text-brand-text3 font-bold mb-1">ملاحظات</div>
                      <div className="text-[11px] font-medium text-brand-text3 line-clamp-1 italic">"{task.notes}"</div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex md:flex-col items-center justify-end gap-2 shrink-0">
                  <button 
                    onClick={() => {
                      if (task.status === 'بانتظار الإرسال') handleUpdateStatus(task.id, 'لدى الورشة');
                      else if (task.status === 'لدى الورشة') handleUpdateStatus(task.id, 'تم الاستلام');
                      else startEdit(task);
                    }}
                    className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all hover:scale-105 ${task.status === 'تم الاستلام' ? 'bg-brand-bg2 text-brand-text3' : 'bg-brand-blue text-brand-bg'}`}
                  >
                    {task.status === 'بانتظار الإرسال' ? 'إرسال للورشة' : task.status === 'لدى الورشة' ? 'تأكيد الاستلام' : 'تعديل'}
                  </button>
                  <div className="relative">
                    <button 
                      onClick={() => setActiveMenuId(activeMenuId === task.id ? null : task.id)}
                      className="p-2 hover:bg-white/5 rounded-lg text-brand-text3 transition-colors"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>

                    <AnimatePresence>
                      {activeMenuId === task.id && (
                        <>
                          <div className="fixed inset-0 z-[60]" onClick={() => setActiveMenuId(null)} />
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: -10 }}
                            className="absolute left-0 top-full mt-2 w-40 bg-brand-card border border-brand-border rounded-xl shadow-2xl z-[70] overflow-hidden"
                          >
                            <div className="p-1.5 flex flex-col gap-1">
                              <button 
                                onClick={() => startEdit(task)}
                                className="flex items-center justify-between gap-2 px-3 py-2.5 text-[11px] font-bold text-brand-text hover:bg-white/5 rounded-lg transition-colors text-right"
                              >
                                <div className="flex items-center gap-2">
                                  <Edit2 className="w-3.5 h-3.5 text-brand-blue" />
                                  <span>تعديل البيانات</span>
                                </div>
                              </button>
                              <div className="h-px bg-brand-border/50 mx-2" />
                              <button 
                                onClick={() => handleDeleteTask(task.id)}
                                className="flex items-center justify-between gap-2 px-3 py-2.5 text-[11px] font-bold text-brand-red hover:bg-brand-red/10 rounded-lg transition-colors text-right"
                              >
                                <div className="flex items-center gap-2">
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>حذف السجل</span>
                                </div>
                              </button>
                            </div>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredTasks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-brand-card border border-brand-border flex items-center justify-center mb-4 text-brand-text3">
              <Search className="w-8 h-8" />
            </div>
            <h3 className="text-brand-text font-bold mb-1">لا توجد أعمال خارجية</h3>
            <p className="text-brand-text3 text-xs">جرب البحث بكلمات أخرى أو تغيير الفلتر</p>
          </div>
        )}
      </div>

      {/* Add Task Modal */}
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
              <div className="p-3.5 border-b border-brand-border flex justify-between items-center bg-brand-bg3/50 backdrop-blur-md">
                <h2 className="text-sm font-black text-brand-text flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-brand-blue" />
                  {editingTask ? 'تعديل البيانات' : 'إرسال شغل لورشة'}
                </h2>
                <button 
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingTask(null);
                    setNewTask({ workshopName: WORKSHOPS[0], status: 'بانتظار الإرسال', cost: 0 });
                  }}
                  className="p-1 hover:bg-white/5 rounded-lg text-brand-text3 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddTask} className="p-4 space-y-3 max-h-[75vh] overflow-y-auto scrollbar-hide">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1 relative">
                    <label className="text-[9px] font-bold text-brand-text3 pr-1 uppercase tracking-wider">رقم الطلب</label>
                    <div className="relative">
                      <input 
                        required
                        type="text" 
                        placeholder="ORD-5500"
                        className="w-full bg-brand-bg2 border border-brand-border rounded-lg py-1.5 px-3 text-[12px] focus:outline-none focus:border-brand-blue transition-all"
                        value={newTask.orderId || ''}
                        onChange={(e) => {
                          setNewTask({...newTask, orderId: e.target.value});
                          setShowOrderResults(true);
                        }}
                        onFocus={() => setShowOrderResults(true)}
                      />
                    </div>

                    {/* Order Results Dropdown */}
                    <AnimatePresence>
                      {showOrderResults && (
                        <motion.div 
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="absolute z-50 top-full left-0 right-0 mt-1 bg-brand-card border border-brand-border rounded-lg shadow-2xl overflow-hidden"
                        >
                          {existingOrders.filter(o => o.id.includes(newTask.orderId || '')).map((o) => (
                            <button
                              key={o.id}
                              type="button"
                              onClick={() => handleLinkOrder(o)}
                              className="w-full p-2 text-right hover:bg-brand-blue/10 border-b border-brand-border last:border-0 flex items-center justify-between"
                            >
                              <div className="flex flex-col">
                                <span className="text-[10px] font-black text-brand-text">{o.id}</span>
                                <span className="text-[8px] text-brand-text3">{o.customerName}</span>
                              </div>
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-brand-text3 pr-1 uppercase tracking-wider">اسم العميل</label>
                    <input 
                      required
                      type="text" 
                      placeholder="اسم العميل"
                      className="w-full bg-brand-bg2 border border-brand-border rounded-lg py-1.5 px-3 text-[12px] focus:outline-none focus:border-brand-blue transition-all"
                      value={newTask.customerName || ''}
                      onChange={(e) => setNewTask({...newTask, customerName: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-brand-text3 pr-1 uppercase tracking-wider">الورشة</label>
                    <select 
                      value={newTask.workshopName}
                      onChange={(e) => setNewTask({...newTask, workshopName: e.target.value})}
                      className="w-full bg-brand-bg2 border border-brand-border rounded-lg py-1.5 px-3 text-[11px] focus:outline-none focus:border-brand-blue transition-all outline-none appearance-none cursor-pointer text-brand-text font-bold"
                    >
                      {WORKSHOPS.map(w => (
                        <option key={w} value={w}>{w}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-brand-text3 pr-1 uppercase tracking-wider">الحالة</label>
                    <select 
                      value={newTask.status}
                      onChange={(e) => setNewTask({...newTask, status: e.target.value as any})}
                      className="w-full bg-brand-bg2 border border-brand-border rounded-lg py-1.5 px-3 text-[11px] focus:outline-none focus:border-brand-blue transition-all outline-none appearance-none cursor-pointer text-brand-text font-bold"
                    >
                      <option value="بانتظار الإرسال">بانتظار الإرسال</option>
                      <option value="لدى الورشة">لدى الورشة</option>
                      <option value="تم الاستلام">تم الاستلام</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-brand-text3 pr-1 uppercase tracking-wider">نوع الخدمة / العمل</label>
                  <input 
                    required
                    type="text" 
                    placeholder="طلاء، صب، حفر..."
                    className="w-full bg-brand-bg2 border border-brand-border rounded-lg py-1.5 px-3 text-[12px] focus:outline-none focus:border-brand-blue transition-all"
                    value={newTask.serviceType || ''}
                    onChange={(e) => setNewTask({...newTask, serviceType: e.target.value})}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-brand-text3 pr-1 uppercase tracking-wider">التكلفة (ج.م)</label>
                  <input 
                    required
                    type="number" 
                    className="w-full bg-brand-bg2 border border-brand-border rounded-lg py-1.5 px-3 text-[12px] text-number focus:outline-none focus:border-brand-blue transition-all font-bold text-brand-blue"
                    value={newTask.cost || ''}
                    onChange={(e) => setNewTask({...newTask, cost: Number(e.target.value)})}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-brand-text3 pr-1 uppercase tracking-wider">ملاحظات</label>
                  <textarea 
                    rows={1}
                    placeholder="أية تعليمات خاصة..."
                    className="w-full bg-brand-bg2 border border-brand-border rounded-lg py-1.5 px-3 text-[12px] focus:outline-none focus:border-brand-blue transition-all resize-none"
                    value={newTask.notes || ''}
                    onChange={(e) => setNewTask({...newTask, notes: e.target.value})}
                  />
                </div>

                <div className="pt-2 flex gap-3">
                  <button 
                    type="submit"
                    className="flex-[2] bg-brand-blue text-brand-bg py-2 rounded-lg font-black text-xs hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-brand-blue/20"
                  >
                    إرسال الطلب
                  </button>
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
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
    </div>
  );
}

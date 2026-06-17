import React, { useState, useMemo } from 'react';
import { 
  AlertCircle, 
  AlertTriangle, 
  Info, 
  CheckCircle2, 
  Trash2, 
  Search, 
  Filter, 
  Clock, 
  BellRing,
  MoreVertical,
  FlaskConical,
  Hammer,
  Truck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info' | 'success';
  category: 'orders' | 'inventory' | 'finance' | 'system' | 'outsource';
  title: string;
  description: string;
  time: string;
  isRead: boolean;
  metadata?: any;
}

export function AlertsContent() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'critical' | 'warning' | 'info'>('all');
  const [activeCategory, setActiveCategory] = useState<'all' | 'orders' | 'inventory' | 'finance' | 'system'>('all');
  
  // Load data to generate dynamic alerts
  const orders = useMemo(() => JSON.parse(localStorage.getItem('workshop_orders') || '[]'), []);
  const inventory = useMemo(() => JSON.parse(localStorage.getItem('workshop_inventory') || '[]'), []);
  const outsourced = useMemo(() => JSON.parse(localStorage.getItem('workshop_outsource') || '[]'), []);

  // Generate dynamic alerts based on real data
  const generatedAlerts: Alert[] = useMemo(() => {
    const alerts: Alert[] = [];

    // 1. Late Orders
    orders.forEach((o: any) => {
      const orderDate = new Date(o.date);
      const diffDays = Math.floor((new Date().getTime() - orderDate.getTime()) / (1000 * 3600 * 24));
      
      if (o.phase < 10) { // Not delivered
        if (diffDays > 5) {
          alerts.push({
            id: `ord-late-${o.id}`,
            type: diffDays > 8 ? 'critical' : 'warning',
            category: 'orders',
            title: `تأخير حرج: الطلب #${o.id}`,
            description: `الطلب الخاص بـ ${o.customerName} متوقف في مرحلة "${o.status}" منذ ${diffDays} أيام. يتطلب تدخل فوري.`,
            time: `منذ ${diffDays} أيام`,
            isRead: false,
            metadata: { orderId: o.id }
          });
        }
      } else if (o.phase === 9) { // Ready for delivery
        alerts.push({
          id: `ord-ready-${o.id}`,
          type: 'success',
          category: 'orders',
          title: `طلب جاهز للتسليم #${o.id}`,
          description: `الطلب الخاص بـ ${o.customerName} مكتمل وجاهز في الصالة. يرجى التواصل مع العميل.`,
          time: 'اليوم',
          isRead: false,
          metadata: { orderId: o.id }
        });
      }
    });

    // 2. Low Inventory
    inventory.forEach((i: any) => {
      if (i.quantity <= i.minQuantity) {
        alerts.push({
          id: `inv-low-${i.id}`,
          type: i.quantity === 0 ? 'critical' : 'warning',
          category: 'inventory',
          title: i.quantity === 0 ? `نفاد كمية ${i.name}` : `نقص مخزون ${i.name}`,
          description: i.quantity === 0 
            ? `لقد نفدت المادة الخام "${i.name}" تماماً من المخزن. يجب طلب توريد جديد فوراً.` 
            : `الكمية المتوفرة من "${i.name}" هي ${i.quantity} ${i.unit} فقط. (الحد الأدنى: ${i.minQuantity}).`,
          time: 'الآن',
          isRead: false,
          metadata: { itemId: i.id }
        });
      }
    });

    // 3. Outsourced Work Alerts
    outsourced.forEach((t: any) => {
      if (t.status === 'delayed') {
        alerts.push({
          id: `out-late-${t.id}`,
          type: 'critical',
          category: 'outsource',
          title: `تأخر عمل خارجي: ${t.task}`,
          description: `القطعة المرسلة لـ "${t.workshop}" لم يتم استلامها في الموعد المحدد.`,
          time: 'منذ يومين',
          isRead: false,
          metadata: { outsourceId: t.id }
        });
      }
    });

    // 4. System Alerts
    alerts.push({
      id: 'sys-backup',
      type: 'success',
      category: 'system',
      title: 'أمن البيانات: النسخ الاحتياطي',
      description: 'تم الانتهاء بنجاح من مزامنة كافة البيانات والطلبات مع الخادم السحابي المؤمن.',
      time: 'منذ ساعتين',
      isRead: true
    });

    return alerts.sort((a, b) => {
      if (a.type === 'critical' && b.type !== 'critical') return -1;
      if (b.type === 'critical' && a.type !== 'critical') return 1;
      return 0;
    });
  }, [orders, inventory, outsourced]);

  const [notifications, setNotifications] = useState<Alert[]>(generatedAlerts);

  const filteredNotifications = notifications.filter(n => {
    const matchesSearch = n.title.includes(searchTerm) || n.description.includes(searchTerm);
    const matchesPriority = activeFilter === 'all' || n.type === activeFilter;
    const matchesCategory = activeCategory === 'all' || n.category === activeCategory;
    return matchesSearch && matchesPriority && matchesCategory;
  });

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const deleteNotification = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
  };

  const getAlertStyles = (type: Alert['type']) => {
    switch (type) {
      case 'critical': return { icon: AlertCircle, color: 'text-brand-red', bg: 'bg-brand-red-dim', brd: 'border-brand-red/20' };
      case 'warning': return { icon: AlertTriangle, color: 'text-brand-yellow', bg: 'bg-brand-yellow-dim', brd: 'border-brand-yellow/20' };
      case 'info': return { icon: Info, color: 'text-brand-blue', bg: 'bg-brand-blue-dim', brd: 'border-brand-blue/20' };
      case 'success': return { icon: CheckCircle2, color: 'text-brand-green', bg: 'bg-brand-green-dim', brd: 'border-brand-green/20' };
    }
  };

  const getCategoryIcon = (cat: Alert['category']) => {
    switch (cat) {
      case 'orders': return <Clock className="w-3.5 h-3.5" />;
      case 'inventory': return <FlaskConical className="w-3.5 h-3.5" />;
      case 'finance': return <MoreVertical className="w-3.5 h-3.5" />;
      case 'outsource': return <Hammer className="w-3.5 h-3.5" />;
      case 'system': return <BellRing className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-brand-text flex items-center gap-2">
            <BellRing className="w-5 h-5 text-brand-blue" />
            مركز التنبيهات
          </h2>
          <p className="text-brand-text3 text-[10px] mt-0.5 font-bold">إشعارات الإنتاج والمخزون والمالية</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={markAllRead}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-card border border-brand-border rounded-lg text-[10px] font-bold text-brand-text2 hover:text-brand-text transition-all"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            تمييز الكل كمقروء
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <button 
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all ${activeFilter === 'all' ? 'bg-brand-blue text-white shadow-md shadow-brand-blue/20' : 'bg-brand-card border border-brand-border text-brand-text3 hover:text-brand-text'}`}
          >
            الأولوية: الكل
          </button>
          <button 
            onClick={() => setActiveFilter('critical')}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all ${activeFilter === 'critical' ? 'bg-brand-red text-white shadow-md shadow-brand-red/20' : 'bg-brand-card border border-brand-border text-brand-text3 hover:text-brand-text'}`}
          >
            حرجة ({notifications.filter(n => n.type === 'critical').length})
          </button>
          <button 
            onClick={() => setActiveFilter('warning')}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all ${activeFilter === 'warning' ? 'bg-brand-yellow text-[#0A0C0F] shadow-md shadow-brand-yellow/20' : 'bg-brand-card border border-brand-border text-brand-text3 hover:text-brand-text'}`}
          >
            تحذيرات ({notifications.filter(n => n.type === 'warning').length})
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-2.5">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
            <button 
              onClick={() => setActiveCategory('all')}
              className={`px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${activeCategory === 'all' ? 'bg-brand-text text-brand-bg' : 'bg-brand-card border border-brand-border text-brand-text3 hover:text-brand-text'}`}
            >
              جميع الأقسام
            </button>
            <button 
              onClick={() => setActiveCategory('orders')}
              className={`px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${activeCategory === 'orders' ? 'bg-brand-blue/20 text-brand-blue border border-brand-blue/30' : 'bg-brand-card border border-brand-border text-brand-text3 hover:text-brand-text'}`}
            >
              الطلبات
            </button>
            <button 
              onClick={() => setActiveCategory('inventory')}
              className={`px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${activeCategory === 'inventory' ? 'bg-brand-green/20 text-brand-green border border-brand-green/30' : 'bg-brand-card border border-brand-border text-brand-text3 hover:text-brand-text'}`}
            >
              المخزون
            </button>
          </div>
          <div className="relative min-w-[200px]">
            <Search className="absolute right-2.5 top-2 w-3.5 h-3.5 text-brand-text3" />
            <input 
              type="text" 
              placeholder="بحث في التنبيهات..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-brand-card border border-brand-border rounded-lg py-1.5 pr-8 pl-3 text-[10px] focus:outline-none focus:border-brand-blue transition-all"
            />
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="flex flex-col gap-3">
        <AnimatePresence mode="popLayout">
          {filteredNotifications.map((n) => {
            const styles = getAlertStyles(n.type);
            const Icon = styles.icon;
            
            return (
              <motion.div
                key={n.id}
                layout
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className={`group glass-panel p-3 flex gap-3 items-start transition-all ${!n.isRead ? 'border-r-2 border-r-brand-blue shadow-sm shadow-brand-blue/5' : ''}`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${styles.bg} ${styles.color}`}>
                  <Icon className="w-4 h-4" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center gap-1.5">
                       <span className={`px-1 py-0.5 rounded uppercase text-[7px] font-black tracking-widest bg-white/5 text-brand-text3 flex items-center gap-0.5`}>
                        {getCategoryIcon(n.category)}
                        {n.category === 'orders' ? 'طلب' : n.category === 'inventory' ? 'مخزون' : n.category === 'finance' ? 'مالية' : 'نظام'}
                       </span>
                       <h4 className={`text-[12.5px] font-black truncate ${!n.isRead ? 'text-brand-text' : 'text-brand-text2'}`}>{n.title}</h4>
                    </div>
                    <span className="text-[9px] text-brand-text3 font-medium shrink-0">{n.time}</span>
                  </div>
                  <p className="text-[11px] text-brand-text2 leading-normal mb-2 line-clamp-1 group-hover:line-clamp-none transition-all">{n.description}</p>
                  
                  <div className="flex items-center gap-2.5">
                    {!n.isRead && (
                      <button 
                        onClick={() => markAsRead(n.id)}
                        className="text-[9px] font-black text-brand-blue hover:underline"
                      >
                        تمييز كمقروء
                      </button>
                    )}
                    <button 
                      onClick={() => deleteNotification(n.id)}
                      className="text-[9px] font-black text-brand-text3 hover:text-brand-red transition-colors"
                    >
                      إزالة
                    </button>
                    {n.metadata?.orderId && (
                       <button className="text-[9px] font-black text-brand-green hover:underline">عرض الطلب</button>
                    )}
                  </div>
                </div>

                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                   <button 
                    onClick={() => deleteNotification(n.id)}
                    className="p-1.5 text-brand-text3 hover:text-brand-red hover:bg-brand-red-dim rounded-lg transition-all"
                   >
                     <Trash2 className="w-4 h-4" />
                   </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filteredNotifications.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-brand-card border border-brand-border flex items-center justify-center mb-4 text-brand-text3">
              <BellRing className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-brand-text mb-1">لا توجد تنبيهات</h3>
            <p className="text-brand-text3 text-sm">كل شيء تحت السيطرة. لا توجد تنبيهات جديدة حالياً.</p>
          </div>
        )}
      </div>
    </div>
  );
}

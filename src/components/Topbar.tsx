import React, { useState, useEffect, useRef } from 'react';
import { Bell, ArrowUpRight, Calendar, CheckCircle2, AlertCircle, Info, Trash2, CheckCheck, X } from 'lucide-react';
import { useNotifications } from './NotificationProvider';
import { motion, AnimatePresence } from 'motion/react';
import { MarketPricesDrawer } from './MarketPricesDrawer';
import { PriceTicker } from './PriceTicker';

interface TopbarProps {
  onMenuClick: () => void;
  userRole?: string;
}

export function Topbar({ onMenuClick, userRole = 'Admin' }: TopbarProps) {
  const [dateStr, setDateStr] = useState('');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMarketOpen, setIsMarketOpen] = useState(false);
  const { notifications, unreadCount, markAllAsRead, markAsRead, clearAll } = useNotifications();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const updateDate = () => {
      const now = new Date();
      const days = ['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
      const months = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليوز','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
      setDateStr(`${days[now.getDay()]} ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`);
    };
    updateDate();
    const int = setInterval(updateDate, 60000);
    return () => clearInterval(int);
  }, []);

  return (
    <header className="h-12 flex items-center justify-between px-3 lg:px-4 bg-[rgba(15,17,21,0.95)] border-b border-brand-border sticky top-0 z-30 backdrop-blur-xl shrink-0">
      <div>
        <div className="text-[12px] lg:text-[13px] font-black text-brand-text">مركز تحكم الورشة</div>
        <div className="text-[9px] text-brand-text2 mt-0.5">إدارة إنتاج الفضة والنحاس</div>
      </div>
      
      <div className="flex items-center gap-2">
        <div className="hidden lg:flex items-center gap-1 px-2 py-1 bg-brand-green-dim border border-brand-green-brd rounded-full text-[9px] font-bold text-brand-green">
          <div className="w-1.5 h-1.5 rounded-full bg-brand-green animate-[pulse_2s_infinite] shadow-[0_0_0_0_rgba(0,200,150,0.5)]"></div>
          النشاط: متصل
        </div>

        <PriceTicker userRole={userRole} onClick={() => setIsMarketOpen(true)} />
        
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 bg-brand-card border border-brand-border rounded-lg text-[9px] text-brand-text2 font-inter">
          <Calendar className="w-2.5 h-2.5" /> <span suppressHydrationWarning>{dateStr || '—'}</span>
        </div>
        
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className={`w-8 h-8 border rounded-lg flex items-center justify-center transition-all relative ${
              isNotificationsOpen ? 'bg-brand-green text-[#0A0C0F] border-brand-green' : 'bg-brand-card border-brand-border text-brand-text2 hover:border-brand-green hover:text-brand-green'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            {unreadCount > 0 && (
              <div className="absolute -top-1 -right-1 min-w-[16px] h-[16px] bg-brand-red text-white text-[9px] font-black rounded-full border-2 border-brand-bg flex items-center justify-center px-1 animate-in zoom-in duration-300">
                {unreadCount}
              </div>
            )}
          </button>

          <AnimatePresence>
            {isNotificationsOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute left-0 mt-2 w-[280px] sm:w-[340px] bg-brand-card border border-brand-border rounded-2xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.6)] z-50 overflow-hidden origin-top-left"
              >
                <div className="p-4 border-b border-brand-border flex items-center justify-between bg-brand-bg3/50">
                  <h3 className="text-xs font-black text-brand-text uppercase tracking-widest">التنبيهات</h3>
                  <div className="flex gap-2">
                    <button 
                      onClick={markAllAsRead}
                      className="p-2 text-brand-text3 hover:text-brand-green transition-colors"
                      title="تحديد الكل كمقروء"
                    >
                      <CheckCheck className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={clearAll}
                      className="p-2 text-brand-text3 hover:text-brand-red transition-colors"
                      title="مسح الكل"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="max-h-[400px] overflow-y-auto scrollbar-hide">
                  {notifications.length > 0 ? (
                    notifications.map((n) => (
                      <div 
                        key={n.id} 
                        onClick={() => markAsRead(n.id)}
                        className={`p-4 border-b border-brand-border/30 last:border-0 flex gap-4 transition-colors group relative cursor-pointer ${!n.isRead ? 'bg-brand-blue/5' : 'hover:bg-white/5'}`}
                      >
                        {!n.isRead && <div className="absolute top-4 right-4 w-2 h-2 bg-brand-blue rounded-full"></div>}
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          n.type === 'success' ? 'bg-brand-green/10 text-brand-green' :
                          n.type === 'error' ? 'bg-brand-red/10 text-brand-red' :
                          'bg-brand-blue/10 text-brand-blue'
                        }`}>
                          {n.type === 'success' && <CheckCircle2 className="w-5 h-5" />}
                          {n.type === 'error' && <AlertCircle className="w-5 h-5" />}
                          {n.type === 'info' && <Info className="w-5 h-5" />}
                        </div>
                        <div className="flex-1">
                          <p className={`text-sm font-bold mb-1 ${!n.isRead ? 'text-brand-text' : 'text-brand-text2'}`}>
                            {n.message}
                          </p>
                          <p className="text-[10px] text-brand-text3 font-medium">
                            {new Date(n.timestamp).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-12 flex flex-col items-center justify-center text-center px-8">
                      <div className="w-16 h-16 rounded-full bg-brand-bg3 flex items-center justify-center mb-4 opacity-50">
                        <Bell className="w-8 h-8 text-brand-text3" />
                      </div>
                      <p className="text-sm font-bold text-brand-text3">لا توجد تنبيهات جديدة</p>
                      <p className="text-[10px] text-brand-text3 mt-1">سيتم عرض جميع التنبيهات والعمليات هنا</p>
                    </div>
                  )}
                </div>

                {notifications.length > 0 && (
                  <div className="p-3 bg-brand-bg3/50 text-center border-t border-brand-border">
                    <button 
                      onClick={() => setIsNotificationsOpen(false)}
                      className="text-[10px] font-black text-brand-text3 hover:text-brand-text transition-colors uppercase tracking-widest"
                    >
                      إغلاق القائمة
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <button 
          id="silver-price-drawer-btn"
          onClick={() => setIsMarketOpen(true)}
          className="hidden lg:flex w-8 h-8 bg-brand-card border border-brand-border rounded-lg items-center justify-center text-brand-text2 hover:border-brand-green hover:text-brand-green transition-colors"
          title="تحديث سعر الفضة اليوم"
        >
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>

        <MarketPricesDrawer isOpen={isMarketOpen} onClose={() => setIsMarketOpen(false)} userRole={userRole} />

        <button 
          onClick={onMenuClick}
          className="lg:hidden w-8 h-8 bg-brand-card border border-brand-border rounded-lg flex flex-col items-center justify-center gap-1 p-[8px] hover:border-brand-green transition-colors"
        >
          <span className="block w-[16px] h-0.5 bg-brand-text2 rounded-sm" />
          <span className="block w-[16px] h-0.5 bg-brand-text2 rounded-sm" />
          <span className="block w-[16px] h-0.5 bg-brand-text2 rounded-sm" />
        </button>
      </div>
    </header>
  );
}

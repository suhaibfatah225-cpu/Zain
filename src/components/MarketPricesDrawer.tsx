import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, Save, Coins, Sparkles, AlertCircle, History, RefreshCw, Lock } from 'lucide-react';
import { useNotifications } from './NotificationProvider';

interface MarketPricesProps {
  isOpen: boolean;
  onClose: () => void;
  userRole?: string;
}

export function MarketPricesDrawer({ isOpen, onClose, userRole = 'Admin' }: MarketPricesProps) {
  const { addNotification } = useNotifications();
  const [silverPrice, setSilverPrice] = useState<string>('');
  const [history, setHistory] = useState<{ date: string; price: number }[]>([]);

  const normalizedRole = (userRole || '').toLowerCase();
  const isAllowedToEdit = normalizedRole.includes('admin') || 
                          normalizedRole.includes('مدير') || 
                          normalizedRole.includes('worker') || 
                          normalizedRole.includes('ورشة') || 
                          normalizedRole.includes('فني') ||
                          normalizedRole.includes('sales') ||
                          normalizedRole.includes('مبيعات');

  // Load current price and history on open
  useEffect(() => {
    if (isOpen) {
      const savedPrice = localStorage.getItem('workshop_silver_price');
      setSilverPrice(savedPrice || '45');

      const savedHistory = localStorage.getItem('workshop_silver_history');
      if (savedHistory) {
        try {
          const parsed = JSON.parse(savedHistory);
          if (Array.isArray(parsed)) {
            setHistory(parsed);
          } else {
            throw new Error('Parsed history is not an array');
          }
        } catch (err) {
          console.error('Error parsing silver history:', err);
          const defaultHistory = [
            { date: '2026-05-22', price: 45 },
            { date: '2026-05-21', price: 44 },
            { date: '2026-05-20', price: 43 },
          ];
          localStorage.setItem('workshop_silver_history', JSON.stringify(defaultHistory));
          setHistory(defaultHistory);
        }
      } else {
        // Create initial default history
        const defaultHistory = [
          { date: '2026-05-22', price: 45 },
          { date: '2026-05-21', price: 44 },
          { date: '2026-05-20', price: 43 },
        ];
        localStorage.setItem('workshop_silver_history', JSON.stringify(defaultHistory));
        setHistory(defaultHistory);
      }
    }
  }, [isOpen]);

  const handleSavePrice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAllowedToEdit) {
      addNotification('عذراً، لا تمتلك الصلاحية لتعديل الأسعار', 'error');
      return;
    }
    const priceNum = parseFloat(silverPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      addNotification('يرجى إدخال سعر صحيح أكبر من الصفر', 'error');
      return;
    }

    // Save to localStorage with try-catch error handling
    try {
      localStorage.setItem('workshop_silver_price', String(priceNum));

      // Support a clean price update history
      const todayStr = new Date().toLocaleDateString('en-CA');
      const updatedHistory = [
        { date: todayStr, price: priceNum },
        ...history.filter(item => item.date !== todayStr) // Avoid duplicate for same day
      ].slice(0, 10); // Keep last 10 updates

      localStorage.setItem('workshop_silver_history', JSON.stringify(updatedHistory));
      setHistory(updatedHistory);

      // Notify other components
      window.dispatchEvent(new Event('silver-price-updated'));
      addNotification(`تم تحديث سعر الفضة اليوم إلى ${priceNum} ج.م بنجاح`, 'success');
    } catch (error) {
      console.error('Error saving silver price:', error);
      addNotification('حدث خطأ أثناء حفظ السعر، يرجى إعادة المحاولة', 'error');
    }
  };

  if (typeof window === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex justify-end">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-brand-bg/80 backdrop-blur-sm cursor-pointer"
          />
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative h-full w-full max-w-[340px] bg-brand-bg border-l border-brand-border flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="p-4 border-b border-brand-border flex items-center justify-between bg-brand-bg2/30">
              <div className="flex items-center gap-3 text-right">
                <div className="w-10 h-10 rounded-2xl bg-slate-500/15 flex items-center justify-center text-slate-300 border border-slate-500/10">
                  <Coins className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-brand-text">سعر الفضة اليوم</h3>
                  <p className="text-[9px] text-brand-text3 font-medium">تحديث السعر وحساب طلبات العملاء</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-brand-card rounded-xl text-brand-text3 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-hide text-right">
              
              {/* Manual Entry Form */}
              <form onSubmit={handleSavePrice} className="space-y-4">
                <div className="bg-brand-card border border-brand-border p-4 rounded-3xl space-y-3 shadow-md relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-16 h-16 bg-brand-green/5 rounded-full blur-xl -translate-x-3 -translate-y-3" />
                  <div className="flex items-center justify-between">
                    <span className="text-[8px] font-black text-brand-text3 uppercase tracking-widest">معدل يدوي مباشر</span>
                    <Sparkles className="w-3.5 h-3.5 text-brand-green opacity-75" />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-brand-text3 pr-1">سعر جرام الفضة اليوم (ج.م)</label>
                    <div className="relative">
                      <input 
                        type="number"
                        step="0.01"
                        required
                        disabled={!isAllowedToEdit}
                        placeholder="أدخل السعر، مثلاً: 45"
                        className={`w-full bg-brand-bg2 border border-brand-border focus:border-brand-green rounded-2xl py-3 pr-4 pl-12 text-center text-xl font-black text-number focus:outline-none transition-all shadow-inner ${!isAllowedToEdit ? 'text-brand-text3 opacity-60 cursor-not-allowed' : 'text-brand-text'}`}
                        value={silverPrice}
                        onChange={(e) => setSilverPrice(e.target.value)}
                      />
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-brand-text3">ج.م / جرام</span>
                    </div>
                  </div>

                  {isAllowedToEdit ? (
                    <button 
                      type="submit"
                      className="w-full bg-brand-green hover:bg-brand-green/90 text-brand-bg py-2.5 rounded-xl font-black text-xs hover:scale-[1.01] active:scale-95 transition-all shadow-md flex items-center justify-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      تحديث السعر الحالي
                    </button>
                  ) : (
                    <div className="p-3 bg-brand-red/10 border border-brand-red/20 rounded-xl flex items-start gap-2 text-right">
                      <Lock className="w-4 h-4 text-brand-red shrink-0 mt-0.5" />
                      <span className="text-[10px] text-brand-red font-black leading-relaxed">
                        عذراً، لا تمتلك صلاحية تعديل السعر اليومي. التعديل مسموح فقط لمدراء الورشة، الفنيين، والمبيعات.
                      </span>
                    </div>
                  )}
                </div>
              </form>

              {/* Informative Help Alert */}
              <div className="bg-brand-blue/5 border border-brand-blue/10 p-3.5 rounded-2xl flex gap-3 align-start">
                <AlertCircle className="w-5 h-5 text-brand-blue shrink-0 mt-0.5" />
                <div className="text-right">
                  <h4 className="text-[11px] font-black text-brand-blue mb-0.5">التسعير التلقائي للطلبات</h4>
                  <p className="text-[10px] text-brand-text3 font-medium leading-relaxed">
                    عند تسجيل طلب فضة جديد وإدخال وزن الفضة (بالجرام)، سيقوم النظام بحساب السعر الإجمالي تلقائياً بضرب الوزن في سعر الجرام الحالي المُسجل هنا.
                  </p>
                </div>
              </div>

              {/* History Section */}
              <div className="space-y-3 pt-2">
                <h4 className="text-[10px] font-black text-brand-text3 flex items-center gap-1.5 opacity-60 uppercase tracking-widest justify-end">
                  سجل التحديثات للفضة
                  <History className="w-3.5 h-3.5" />
                </h4>

                <div className="space-y-2 max-h-[220px] overflow-y-auto scrollbar-hide pr-0.5">
                  {history.map((item, idx) => (
                    <div 
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-xl bg-brand-card/50 border border-brand-border/30 hover:border-brand-border hover:bg-brand-card transition-all"
                    >
                      <span className="text-[9px] text-brand-text3 font-inter">{item.date}</span>
                      <div className="flex items-center gap-1.5 font-bold">
                        <span className="text-xs font-black text-brand-text text-number">{item.price}</span>
                        <span className="text-[8px] text-brand-text3 opacity-75">ج.م / جرام</span>
                      </div>
                    </div>
                  ))}
                  {history.length === 0 && (
                    <div className="py-8 flex flex-col items-center justify-center border border-dashed border-brand-border/40 rounded-xl opacity-50">
                      <span className="text-[10px] text-brand-text3">لا توجد تحديثات سابقة</span>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

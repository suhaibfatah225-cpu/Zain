import React from 'react';
import { useNotifications } from './NotificationProvider';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export function NotificationCenter() {
  const { activeNotifications: notifications, removeNotification } = useNotifications();

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[200] flex flex-col gap-2 min-w-[280px] max-w-[90vw]">
      <AnimatePresence mode="popLayout">
        {notifications.map((n) => (
          <motion.div
            key={n.id}
            initial={{ y: 50, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.9 }}
            className={`flex items-center gap-3 p-3 rounded-xl border shadow-xl backdrop-blur-xl ${
              n.type === 'success' 
                ? 'bg-brand-card/95 border-brand-green/20' 
                : n.type === 'error'
                  ? 'bg-brand-card/95 border-brand-red/20'
                  : 'bg-brand-card/95 border-brand-blue/20'
            }`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
              n.type === 'success' ? 'bg-brand-green/10 text-brand-green' :
              n.type === 'error' ? 'bg-brand-red/10 text-brand-red' :
              'bg-brand-blue/10 text-brand-blue'
            }`}>
              {n.type === 'success' && <CheckCircle2 className="w-5 h-5" />}
              {n.type === 'error' && <AlertCircle className="w-5 h-5" />}
              {n.type === 'info' && <Info className="w-5 h-5" />}
            </div>
            
            <div className="flex-1 mr-1">
              <p className="text-[8px] font-black text-brand-text3 uppercase mb-0.5 tracking-widest">
                {n.type === 'success' ? 'عملية ناجحة' : n.type === 'error' ? 'خطأ' : 'تنبيه'}
              </p>
              <p className="text-[12.5px] font-black text-brand-text leading-tight">{n.message}</p>
            </div>

            <button 
              onClick={() => removeNotification(n.id)}
              className="w-7 h-7 flex items-center justify-center text-brand-text3 hover:text-white transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

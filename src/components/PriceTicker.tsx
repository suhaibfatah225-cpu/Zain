import React, { useState, useEffect } from 'react';
import { Coins, Edit2, Lock } from 'lucide-react';
import { motion } from 'motion/react';

export function PriceTicker({ userRole = 'Admin', onClick }: { userRole?: string; onClick?: () => void }) {
  const [silverPrice, setSilverPrice] = useState<number>(() => {
    const saved = localStorage.getItem('workshop_silver_price');
    return saved ? Number(saved) : 45;
  });

  const normalizedRole = (userRole || '').toLowerCase();
  const isAllowedToEdit = normalizedRole.includes('admin') || 
                          normalizedRole.includes('مدير') || 
                          normalizedRole.includes('worker') || 
                          normalizedRole.includes('ورشة') || 
                          normalizedRole.includes('فني') ||
                          normalizedRole.includes('sales') ||
                          normalizedRole.includes('مبيعات');

  useEffect(() => {
    const handlePriceChange = () => {
      const saved = localStorage.getItem('workshop_silver_price');
      if (saved) {
        setSilverPrice(Number(saved));
      }
    };

    window.addEventListener('silver-price-updated', handlePriceChange);
    // Also listen to storage events
    window.addEventListener('storage', handlePriceChange);

    return () => {
      window.removeEventListener('silver-price-updated', handlePriceChange);
      window.removeEventListener('storage', handlePriceChange);
    };
  }, []);

  const triggerDrawerOpen = () => {
    if (onClick) {
      onClick();
      return;
    }
    // Generate a click event on the drawer button
    const drawerBtn = document.getElementById('silver-price-drawer-btn');
    if (drawerBtn) {
      drawerBtn.click();
    }
  };

  return (
    <div 
      onClick={triggerDrawerOpen}
      className="flex items-center gap-2 px-3 py-1 bg-brand-bg2 hover:bg-brand-card border border-brand-border hover:border-brand-green/30 rounded-full h-8 cursor-pointer transition-all active:scale-95 text-right font-bold"
      title={isAllowedToEdit ? "تعديل سعر الفضة اليوم" : "عرض سعر الفضة اليوم (للقراءة فقط)"}
    >
      <div className="w-4 h-4 rounded-full bg-slate-500/20 text-slate-300 flex items-center justify-center shrink-0">
        <Coins className="w-2.5 h-2.5" />
      </div>
      <div className="flex items-center gap-1">
        <span className="text-[10px] text-brand-text3">سعر الفضة اليوم:</span>
        <span className="text-[11px] text-brand-text text-number tracking-tight">{silverPrice}</span>
        <span className="text-[8px] text-brand-text3 opacity-80">ج.م / جرام</span>
      </div>
      {isAllowedToEdit ? (
        <Edit2 className="w-2.5 h-2.5 text-brand-text3 opacity-40 hover:opacity-100 transition-opacity ml-0.5" />
      ) : (
        <Lock className="w-2.5 h-2.5 text-brand-red/50 ml-0.5" />
      )}
    </div>
  );
}

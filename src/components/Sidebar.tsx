import React, { useState, useEffect } from 'react';
import { LayoutDashboard, ClipboardList, Wallet, Wrench, Package, BarChart3, Settings, AlertCircle, User, MessageCircle, LogOut } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
  userRole?: string;
}

export function Sidebar({ isOpen, onClose, activeTab, onTabChange, onLogout, userRole = 'Admin' }: SidebarProps) {
  const [whatsappPhone, setWhatsappPhone] = useState('01006817218');

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'Admin': return 'مدير الورشة';
      case 'Sales': return 'مسؤول مبيعات';
      case 'Worker': return 'فني إنتاج';
      default: return 'موظف';
    }
  };
  const [adminInfo, setAdminInfo] = useState({
    name: 'أحمد زين',
    avatar: null as string | null
  });

  useEffect(() => {
    const updateSettings = () => {
      try {
        const savedWhatsapp = localStorage.getItem('workshop_whatsapp');
        if (savedWhatsapp) {
          const settings = JSON.parse(savedWhatsapp);
          if (settings.phone) {
            setWhatsappPhone(settings.phone.replace(/\D/g, ''));
          }
        }

        const savedInfo = localStorage.getItem('workshop_info');
        if (savedInfo) {
          const info = JSON.parse(savedInfo);
          setAdminInfo({
            name: info.adminName || 'أحمد زين',
            avatar: info.adminAvatar || null
          });
        }
      } catch (e) {
        console.error('Error reading settings:', e);
      }
    };

    updateSettings();
    window.addEventListener('workshop_settings_updated', updateSettings);
    return () => window.removeEventListener('workshop_settings_updated', updateSettings);
  }, []);

  const switchTab = (tab: string) => {
    onTabChange(tab);
    onClose();
  };

  const getTabClass = (tab: string) => {
    return `flex items-center gap-2 px-2 py-2 rounded-xl cursor-pointer transition-all text-[11.5px] font-semibold w-full text-right ${activeTab === tab ? 'bg-brand-green-dim text-brand-green border border-brand-green-brd' : 'text-brand-text2 border border-transparent hover:bg-white/5 hover:text-brand-text'}`;
  };

  return (
    <>
      <div 
        className={`fixed inset-0 bg-black/60 z-40 backdrop-blur-sm lg:hidden transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      
      <aside className={`fixed top-0 bottom-0 right-0 w-[220px] lg:w-[200px] bg-[#070910] border-l border-brand-border flex flex-col z-50 transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${isOpen ? 'translate-x-0 shadow-[-8px_0_32px_rgba(0,0,0,0.6)]' : 'translate-x-full lg:translate-x-0'}`}>
        <div className="p-3.5 border-b border-brand-border shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-brand-green to-[#007A5E] rounded-lg flex items-center justify-center shrink-0 shadow-[0_4px_16px_rgba(0,200,150,0.3)]">
              <Settings className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <div className="text-[11px] font-black text-brand-text">ورشة ERP</div>
              <div className="text-[8px] text-brand-text3 mt-0.5 tracking-wide uppercase font-bold">نظام الإدارة</div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pt-2 px-2.5 pb-4 flex flex-col gap-0.5 scrollbar-hide">
          <div className="px-3 pt-3 pb-1 text-[9px] tracking-widest uppercase text-brand-text3 font-semibold">الرئيسية</div>
          <button 
            onClick={() => switchTab('dashboard')}
            className={getTabClass('dashboard')}
          >
            <LayoutDashboard className="w-[18px] h-[18px] shrink-0" />
            لوحة التحكم
          </button>
          <button 
             onClick={() => switchTab('orders')}
            className={getTabClass('orders')}
          >
            <ClipboardList className="w-[18px] h-[18px] shrink-0" />
            الطلبات
            <span className="mr-auto px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-brand-red text-white text-number">7</span>
          </button>
          
          {userRole !== 'Worker' && (
            <button 
               onClick={() => switchTab('customers')}
              className={getTabClass('customers')}
            >
              <User className="w-[18px] h-[18px] shrink-0" />
              العملاء
            </button>
          )}

          {userRole === 'Admin' && (
            <button 
               onClick={() => switchTab('finance')}
              className={getTabClass('finance')}
            >
              <Wallet className="w-[18px] h-[18px] shrink-0" />
              المالية
            </button>
          )}

          <div className="px-3 pt-3 pb-1 text-[9px] tracking-widest uppercase text-brand-text3 font-semibold mt-2">العمليات</div>
          <button 
             onClick={() => switchTab('outsource')}
            className={getTabClass('outsource')}
          >
            <Wrench className="w-[18px] h-[18px] shrink-0" />
            الأعمال الخارجية
            <span className="mr-auto px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-brand-yellow text-[#0A0C0F] text-number">3</span>
          </button>
          <button 
            onClick={() => switchTab('inventory')}
            className={getTabClass('inventory')}
          >
            <Package className="w-[18px] h-[18px] shrink-0" />
            المخزون
          </button>
          
          {userRole !== 'Worker' && (
            <button 
              onClick={() => switchTab('analytics')}
              className={getTabClass('analytics')}
            >
              <BarChart3 className="w-[18px] h-[18px] shrink-0" />
              التحليلات
            </button>
          )}

          <div className="px-3 pt-3 pb-1 text-[9px] tracking-widest uppercase text-brand-text3 font-semibold mt-2">النظام</div>
          <button 
             onClick={() => {
               const cleanPhone = whatsappPhone.startsWith('0') ? '2' + whatsappPhone : whatsappPhone;
               window.open(`https://wa.me/${cleanPhone}`, '_blank');
             }}
             className="flex items-center gap-2 px-2 py-2 rounded-xl cursor-pointer transition-all text-[11.5px] font-semibold w-full text-right text-brand-green bg-brand-green/5 border border-brand-green/20 hover:bg-brand-green/10 mb-1"
          >
            <MessageCircle className="w-[17px] h-[17px] shrink-0" />
            واتساب الشغل
          </button>

          {userRole === 'Admin' && (
            <button 
              onClick={() => switchTab('settings')}
              className={getTabClass('settings')}
            >
              <Settings className="w-[18px] h-[18px] shrink-0" />
              الإعدادات
            </button>
          )}
          <button 
            onClick={() => switchTab('alerts')}
            className={getTabClass('alerts')}
          >
            <AlertCircle className="w-[18px] h-[18px] shrink-0" />
            التنبيهات
            <span className="mr-auto px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-brand-red text-white text-number">4</span>
          </button>
        </div>

        <div className="p-3.5 border-t border-brand-border shrink-0 flex flex-col gap-2">
          <div className="glass-panel-2 p-2.5 flex items-center gap-2.5">
            <div className="w-[34px] h-[34px] rounded-lg bg-gradient-to-br from-[#4D9EFF] to-[#7C3AED] flex items-center justify-center shrink-0 overflow-hidden">
              {adminInfo.avatar ? (
                <img src={adminInfo.avatar} alt="Admin" className="w-full h-full object-cover" />
              ) : (
                <User className="w-5 h-5 text-white" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold truncate">{adminInfo.name}</div>
              <div className="text-[10px] text-brand-text3 mt-0.5 capitalize">{getRoleLabel(userRole)}</div>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-brand-red hover:bg-brand-red-dim border border-transparent hover:border-brand-red/20 transition-all text-xs font-bold w-full"
          >
            <LogOut className="w-4 h-4" />
            تسجيل الخروج
          </button>
        </div>
      </aside>
    </>
  );
}

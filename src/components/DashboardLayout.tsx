import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { DashboardContent } from './DashboardContent';
import { AnalyticsContent } from './AnalyticsContent';
import { OrdersContent } from './OrdersContent';
import { FinancialsContent } from './FinancialsContent';
import { OutsourceContent } from './OutsourceContent';
import { InventoryContent } from './InventoryContent';
import { SettingsContent } from './SettingsContent';
import { AlertsContent } from './AlertsContent';
import { LayoutDashboard, ClipboardList, Wallet, Wrench, Package, BarChart3, Settings, AlertCircle, FileSearch, Users } from 'lucide-react';
import { CustomersContent } from './CustomersContent';
import { NotificationCenter } from './NotificationCenter';

const TABS = [
  { id: 'dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
  { id: 'orders', label: 'الطلبات', icon: ClipboardList },
  { id: 'customers', label: 'العملاء', icon: Users },
  { id: 'finance', label: 'المالية', icon: Wallet },
  { id: 'outsource', label: 'الأعمال الخارجية', icon: Wrench },
  { id: 'inventory', label: 'المخزون', icon: Package },
  { id: 'analytics', label: 'التحليلات', icon: BarChart3 },
  { id: 'settings', label: 'الإعدادات', icon: Settings },
  { id: 'alerts', label: 'التنبيهات', icon: AlertCircle },
];

function PlaceholderContent({ title, icon: Icon }: { title: string, icon: any }) {
  return (
    <div className="h-[60vh] flex flex-col items-center justify-center text-center">
      <div className="w-16 h-16 rounded-2xl bg-brand-card border border-brand-border flex items-center justify-center mb-4 text-brand-text3">
        <Icon className="w-8 h-8" />
      </div>
      <h2 className="text-xl font-bold text-brand-text mb-2">{title}</h2>
      <p className="text-brand-text2 text-sm max-w-[300px]">
        جاري تطوير هذه الصفحة. ستظهر بيانات <span className="font-bold text-brand-green">{title}</span> هنا قريباً.
      </p>
    </div>
  );
}

export function DashboardLayout({ onLogout, userRole = 'Admin', userEmail }: { onLogout: () => void, userRole?: string, userEmail?: string }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [orderFilter, setOrderFilter] = useState<string | undefined>(undefined);
  const [selectedOrderId, setSelectedOrderId] = useState<string | undefined>(undefined);

  const filteredTabs = TABS.filter(tab => {
    if (userRole === 'Worker') {
      return !['finance', 'analytics', 'settings', 'customers'].includes(tab.id);
    }
    if (userRole === 'Sales') {
      return !['finance', 'settings'].includes(tab.id);
    }
    return true;
  });

  const handleNavigate = (tab: string, filter?: string, orderId?: string) => {
    setActiveTab(tab);
    if (tab === 'orders') {
      setOrderFilter(filter);
      setSelectedOrderId(orderId);
    } else {
      setOrderFilter(undefined);
      setSelectedOrderId(undefined);
    }
  };

  return (
    <div className="min-h-screen flex text-brand-text bg-brand-bg font-cairo" dir="rtl">
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        activeTab={activeTab}
        onTabChange={(tab) => handleNavigate(tab)}
        onLogout={onLogout}
        userRole={userRole}
      />
      
      <main className="flex-1 flex flex-col min-h-screen lg:mr-[200px] transition-all overflow-hidden text-[13.5px]">
        <Topbar onMenuClick={() => setIsSidebarOpen(true)} userRole={userRole} />
        
        <div className="p-1.5 lg:p-2.5 flex-1 overflow-x-hidden flex flex-col">
          {/* Tabs UI */}
          <div className="flex gap-1 bg-brand-card border border-brand-border rounded-xl p-1 w-full overflow-x-auto mb-2 relative z-10 scrollbar-hide shrink-0 snap-x">
            {filteredTabs.map(tab => (
              <button 
                key={tab.id}
                onClick={() => handleNavigate(tab.id)}
                className={`snap-center flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[9px] sm:text-[11px] font-bold transition-all whitespace-nowrap flex-none ${activeTab === tab.id ? 'bg-brand-green text-[#0A0C0F]' : 'text-brand-text2 hover:text-brand-text'}`}
              >
                <tab.icon className="w-3 h-3" />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 fill-mode-both flex-1">
            {activeTab === 'dashboard' && <DashboardContent onNavigate={handleNavigate} userRole={userRole} />}
            {activeTab === 'analytics' && <AnalyticsContent />}
            {activeTab === 'orders' && <OrdersContent initialStatusFilter={orderFilter} initialOrderId={selectedOrderId} userRole={userRole} />}
            {activeTab === 'customers' && <CustomersContent onNavigate={handleNavigate} />}
            {activeTab === 'finance' && <FinancialsContent />}
            {activeTab === 'outsource' && <OutsourceContent />}
            {activeTab === 'inventory' && <InventoryContent />}
            {activeTab === 'settings' && <SettingsContent userRole={userRole} />}
            {activeTab === 'alerts' && <AlertsContent />}
            {activeTab !== 'dashboard' && activeTab !== 'analytics' && activeTab !== 'orders' && activeTab !== 'customers' && activeTab !== 'finance' && activeTab !== 'outsource' && activeTab !== 'inventory' && activeTab !== 'settings' && activeTab !== 'alerts' && (
              <PlaceholderContent 
                title={TABS.find(t => t.id === activeTab)?.label || 'صفحة جديدة'} 
                icon={TABS.find(t => t.id === activeTab)?.icon || FileSearch} 
              />
            )}
          </div>
        </div>
      </main>
      <NotificationCenter />
    </div>
  );
}

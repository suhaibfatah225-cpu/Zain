import React, { useState } from 'react';
import { ClipboardList, Banknote, TrendingUp, AlertTriangle, PenTool, Scissors, Zap, Settings, Droplets, Palette, Link as LinkIcon, Truck, Factory, CheckCircle, AlertOctagon, Hexagon, Gem, FlaskConical, Hammer, AlertCircle, Info, ChevronLeft, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNotifications } from './NotificationProvider';

export function DashboardContent({ onNavigate, userRole = 'Admin' }: { onNavigate: (tab: string, filter?: string, orderId?: string) => void, userRole?: string }) {
  const orders = JSON.parse(localStorage.getItem('workshop_orders') || '[]');
  const inventory = JSON.parse(localStorage.getItem('workshop_inventory') || '[]');
  const workshopInfo = JSON.parse(localStorage.getItem('workshop_info') || '{}');

  return (
    <div className="space-y-3">
      <KpiGrid orders={orders} onNavigate={onNavigate} userRole={userRole} />
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-3">
        <div className="flex flex-col gap-3">
          <ProductionFlow orders={orders} onNavigate={onNavigate} />
          <OrdersTable orders={orders} onNavigate={onNavigate} userRole={userRole} />
        </div>
        <div className="flex flex-col gap-3">
          {userRole !== 'Worker' && <FinancePanel orders={orders} onNavigate={onNavigate} />}
          <OutsourcePanel onNavigate={onNavigate} />
          <InventoryPanel inventory={inventory} onNavigate={onNavigate} />
          <AlertsPanel orders={orders} inventory={inventory} onNavigate={onNavigate} />
        </div>
      </div>
    </div>
  );
}

function KpiGrid({ orders, onNavigate, userRole }: { orders: any[], onNavigate: (tab: string, filter?: string) => void, userRole: string }) {
  const [activeId, setActiveId] = useState<number | null>(null);

  const totalOrders = orders.length;
  const activeOrders = orders.filter(o => o.phase < 9).length;
  const readyOrders = orders.filter(o => o.phase === 8).length;
  const revenue = orders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
  const profit = revenue * 0.35; // Assuming 35% average margin
  const lateOrders = orders.filter(o => {
    const orderDate = new Date(o.date);
    const diff = (new Date().getTime() - orderDate.getTime()) / (1000 * 3600 * 24);
    return diff > 5 && o.phase < 9;
  }).length;

  const stats = [
    { id: 0, icon: <ClipboardList className="w-4.5 h-4.5 text-brand-green" />, bg: 'bg-brand-green-dim', border: 'before:from-brand-green', val: totalOrders.toString(), label: 'الطلبات (هذا الشهر)', trend: '↑ نشط', trendColor: 'text-brand-green', detail: `${activeOrders} طلب قيد التنفيذ · ${readyOrders} جاهزة`, filter: 'all' },
    { id: 3, icon: <AlertTriangle className="w-4.5 h-4.5 text-brand-red" />, bg: 'bg-brand-red-dim', border: 'before:from-brand-red', val: lateOrders.toString(), label: 'الطلبات المتأخرة', trend: lateOrders > 0 ? '↑ حرجة' : '✓ مستقر', trendColor: lateOrders > 0 ? 'text-brand-red' : 'text-brand-green', detail: `${lateOrders} طلبات متجاوزة`, filter: 'late' },
  ];

  const financialStats = userRole === 'Worker' ? [] : [
    { id: 1, icon: <Banknote className="w-4.5 h-4.5 text-brand-blue" />, bg: 'bg-brand-blue-dim', border: 'before:from-brand-blue', val: `${(revenue/1000).toFixed(1)}K ج.م`, label: 'الإيرادات المستهدفة', trend: '↑ دقيق', trendColor: 'text-brand-green', detail: `بناءً على ${totalOrders} طلب`, filter: '' },
    { id: 2, icon: <TrendingUp className="w-4.5 h-4.5 text-brand-yellow" />, bg: 'bg-brand-yellow-dim', border: 'before:from-brand-yellow', val: `${(profit/1000).toFixed(1)}K ج.م`, label: 'صافي الربح المتوقع', trend: '↑ 35%', trendColor: 'text-brand-green', detail: 'الهامش التقديري (35%)', filter: '' },
  ];

  const displayStats = [...stats, ...financialStats].sort((a,b) => a.id - b.id);

  return (
    <div className={`grid grid-cols-2 ${userRole === 'Worker' ? 'lg:grid-cols-2' : 'lg:grid-cols-4'} gap-2 mb-2 border-r-0`}>
      {displayStats.map((s) => (
        <div 
          key={s.id}
          onClick={() => {
            if (s.id === 0) onNavigate('orders');
            else if (s.id === 3) onNavigate('orders', 'late');
            else setActiveId(activeId === s.id ? null : s.id);
          }}
          className={`glass-panel-2 p-2 relative overflow-hidden group hover:-translate-y-0.5 hover:border-white/10 transition-all cursor-pointer before:absolute before:inset-x-0 before:top-0 before:h-0.5 before:bg-gradient-to-l ${s.border} before:to-transparent ${activeId === s.id ? 'border-white/20 shadow-xl' : ''}`}
        >
          <div className="flex items-center justify-between mb-1">
            <div className={`w-6 h-6 rounded-lg ${s.bg} flex items-center justify-center text-[12px]`}>
              {s.icon}
            </div>
            <div className="flex items-center gap-1">
              <div className={`flex items-center gap-1 text-[8px] font-bold px-1.5 py-0.5 rounded-md ${s.trendColor} bg-white/5`}>{s.trend}</div>
            </div>
          </div>
          <div className={`text-[16px] md:text-[20px] font-black leading-none mb-0.5 text-number ${s.id === 3 ? 'text-brand-red' : ''}`}>{s.val}</div>
          <div className="text-[8.5px] text-brand-text2 font-bold uppercase tracking-tight truncate">{s.label}</div>
          
          <AnimatePresence>
            {(activeId === s.id || (typeof window !== 'undefined' && window.innerWidth >= 768)) && (
              <motion.div 
                initial={activeId === s.id ? { opacity: 0, height: 0 } : {}}
                animate={{ opacity: 1, height: 'auto' }}
                className={`${activeId === s.id ? 'block' : 'hidden md:block'} text-[10px] text-brand-text3 mt-2.5 pt-2.5 border-t border-brand-border overflow-hidden`}
              >
                {s.detail}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}

function SectionCard({ title, dotColor, actionRight, onActionClick, children }: any) {
  const dots = {
    green: 'bg-brand-green',
    yellow: 'bg-brand-yellow',
    red: 'bg-brand-red',
    blue: 'bg-brand-blue',
  };
  return (
    <div className="glass-panel p-2.5">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-[10.5px] font-black text-brand-text uppercase tracking-wide">
          <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${dots[dotColor as keyof typeof dots]}`}></div>
          {title}
        </div>
        {actionRight && (
          <div 
            onClick={onActionClick}
            className="text-[8.5px] text-brand-green cursor-pointer border border-brand-green-brd px-1.5 py-0.5 rounded-md hover:bg-brand-green-dim transition-colors font-bold"
          >
            {actionRight}
          </div>
        )}
      </div>
      <div>{children}</div>
    </div>
  );
}

function ProductionFlow({ orders, onNavigate }: { orders: any[], onNavigate: (tab: string, filter?: string) => void }) {
  const PHASES = [
    'استلام الطلب',
    'التصميم',
    'المنشار',
    'الليزر',
    'اللحام',
    'التشطيب',
    'الطلاء',
    'المينا',
    'جاهز للتسليم',
    'تم التسليم'
  ];

  const steps = [
    { id: 1, label: 'التصميم', phase: 1, count: `${orders.filter(o => o.phase === 1).length} قطعة`, status: orders.some(o => o.phase === 1) ? 'active' : (orders.some(o => o.phase > 1) ? 'done' : 'idle'), icon: <PenTool className="w-5 h-5" /> },
    { id: 2, label: 'المنشار', phase: 2, count: `${orders.filter(o => o.phase === 2).length} قطعة`, status: orders.some(o => o.phase === 2) ? 'active' : (orders.some(o => o.phase > 2) ? 'done' : 'idle'), icon: <Scissors className="w-5 h-5" /> },
    { id: 3, label: 'الليزر', phase: 3, count: `${orders.filter(o => o.phase === 3).length} قطعة`, status: orders.some(o => o.phase === 3) ? 'active' : (orders.some(o => o.phase > 3) ? 'done' : 'idle'), icon: <Zap className="w-5 h-5" /> },
    { id: 4, label: 'اللحام', phase: 4, count: `${orders.filter(o => o.phase === 4).length} قطعة`, status: orders.some(o => o.phase === 4) ? 'active' : (orders.some(o => o.phase > 4) ? 'done' : 'idle'), icon: <Hammer className="w-5 h-5" /> },
    { id: 5, label: 'التشطيب', phase: 5, count: `${orders.filter(o => o.phase === 5).length} قطعة`, status: orders.some(o => o.phase === 5) ? 'active' : (orders.some(o => o.phase > 5) ? 'done' : 'idle'), icon: <Droplets className="w-5 h-5" /> },
    { id: 6, label: 'الطلاء', phase: 6, count: `${orders.filter(o => o.phase === 6).length} قطعة`, status: orders.some(o => o.phase === 6) ? 'active' : (orders.some(o => o.phase > 6) ? 'done' : 'idle'), icon: <Droplets className="w-5 h-5" /> },
    { id: 7, label: 'المينا', phase: 7, count: `${orders.filter(o => o.phase === 7).length} قطعة`, status: orders.some(o => o.phase === 7) ? 'active' : (orders.some(o => o.phase > 7) ? 'done' : 'idle'), icon: <Palette className="w-5 h-5" /> },
    { id: 8, label: 'التسليم', phase: 9, count: `${orders.filter(o => o.phase === 9).length} قطعة`, status: orders.some(o => o.phase === 9) ? 'done' : 'idle', icon: <Truck className="w-5 h-5" /> },
  ];

  return (
    <SectionCard 
      title="سير الإنتاج – الحالة الحية" 
      dotColor="yellow" 
      actionRight="عرض الكل"
      onActionClick={() => onNavigate('orders')}
    >
      <div className="overflow-x-auto pb-1.5 scrollbar-hide">
        <div className="flex items-center min-w-max gap-0">
          {steps.map((step, idx) => {
            const isLast = idx === steps.length - 1;
            const isDone = step.status === 'done';
            const isActive = step.status === 'active';
            const isBlocked = step.status === 'blocked';
            const isIdle = step.status === 'idle';
            
            // Connection line style to the NEXT node
            let nextConnClass = 'bg-brand-border';
            if (isDone && steps[idx + 1]?.status === 'done') nextConnClass = 'bg-brand-green';
            else if (isDone && steps[idx + 1]?.status === 'active') nextConnClass = 'bg-gradient-to-r from-brand-yellow to-brand-green';
            else if (steps[idx + 1]?.status === 'blocked') nextConnClass = 'bg-brand-red';

            return (
              <React.Fragment key={step.id}>
                <div 
                  onClick={() => onNavigate('orders', PHASES[step.phase])}
                  className="flex flex-col items-center cursor-pointer hover:-translate-y-0.5 transition-transform"
                >
                  <div className={`w-8 md:w-9 h-8 md:h-9 rounded-lg flex items-center justify-center text-[15px] md:text-[17px] border-2 mb-1.5 z-10 relative 
                    ${isDone ? 'bg-brand-green-dim border-brand-green' : ''}
                    ${isActive ? 'bg-brand-yellow-dim border-brand-yellow shadow-[0_0_15px_rgba(255,176,32,0.3)] animate-[glow_2s_infinite]' : ''}
                    ${isBlocked ? 'bg-brand-red-dim border-brand-red' : ''}
                    ${isIdle ? 'bg-brand-card2 border-brand-border text-brand-text3' : ''}
                  `}>
                    {step.icon}
                  </div>
                  <div className="text-[8.5px] text-brand-text2 font-bold text-center leading-tight">{step.label}</div>
                  <div className="text-[7.5px] text-brand-text3 text-center mt-px text-number">{step.count}</div>
                  <div className={`text-[7.5px] font-black px-1.5 py-0.5 rounded-md mt-1 uppercase tracking-tighter
                    ${isDone ? 'text-brand-green bg-brand-green-dim' : ''}
                    ${isActive ? 'text-brand-yellow bg-brand-yellow-dim' : ''}
                    ${isBlocked ? 'text-brand-red bg-brand-red-dim' : ''}
                    ${isIdle ? 'text-brand-text3 bg-white/5' : ''}
                  `}>
                    {isDone && 'مكتمل'}
                    {isActive && 'جارٍ'}
                    {isBlocked && 'محظور'}
                    {isIdle && (step.label === 'الطلاء' ? 'انتظار' : 'معلق')}
                  </div>
                </div>
                {!isLast && (
                  <div className={`w-4 md:w-5 h-0.5 -mt-[44px] shrink-0 ${nextConnClass}`}></div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
      <div className="flex gap-5 flex-wrap mt-3.5 pt-3 border-t border-brand-border">
        <div className="flex items-center gap-1.5 text-[10px] text-brand-text2">
          <div className="w-2.5 h-2.5 rounded-sm bg-brand-green"></div>مكتمل (3)
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-brand-text2">
          <div className="w-2.5 h-2.5 rounded-sm bg-brand-yellow"></div>جارٍ (1)
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-brand-text2">
          <div className="w-2.5 h-2.5 rounded-sm bg-brand-red"></div>محظور (1)
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-brand-text2">
          <div className="w-2.5 h-2.5 rounded-sm bg-brand-border"></div>معلق (3)
        </div>
      </div>
    </SectionCard>
  );
}

function OrdersTable({ orders, onNavigate, userRole }: { orders: any[], onNavigate: (tab: string) => void, userRole: string }) {
  const recentOrders = orders.slice(0, 5);
  const showPrice = userRole !== 'Worker';

  const getStatusKey = (phase: number) => {
    if (phase >= 10) return 'done';
    if (phase >= 1) return 'prod';
    return 'pend';
  };

  const STATUS_MAP: Record<string, string> = {
    late: 'متأخر',
    prod: 'قيد الإنتاج',
    pend: 'معلق',
    done: 'مكتمل'
  };

  return (
    <SectionCard 
      title="أحدث الطلبات المسجلة" 
      dotColor="green" 
      actionRight="عرض الكل ←"
      onActionClick={() => onNavigate('orders')}
    >
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="text-[10px] text-brand-text3 text-right py-1.5 px-2.5 tracking-wide border-b border-brand-border font-bold">العميل</th>
              <th className="hidden md:table-cell text-[10px] text-brand-text3 text-right py-1.5 px-2.5 tracking-wide border-b border-brand-border font-bold">المنتج</th>
              {showPrice && <th className="hidden sm:table-cell text-[10px] text-brand-text3 text-right py-1.5 px-2.5 tracking-wide border-b border-brand-border font-bold">السعر</th>}
              <th className="hidden sm:table-cell text-[10px] text-brand-text3 text-right py-1.5 px-2.5 tracking-wide border-b border-brand-border font-bold">التاريخ</th>
              <th className="text-[10px] text-brand-text3 text-right py-1.5 px-2.5 tracking-wide border-b border-brand-border font-bold">الحالة</th>
            </tr>
          </thead>
          <tbody>
            {recentOrders.map((o, i) => (
              <tr key={i} className="hover:bg-white/5 group border-b border-white/5 last:border-b-0">
                <td className="py-2 px-2.5 text-[10px] text-brand-text2 font-bold">{o.customerName}</td>
                <td className="hidden md:table-cell py-2 px-2.5 text-[10px] text-brand-text2 truncate max-w-[120px]">{o.productDetails}</td>
                {showPrice && <td className="hidden sm:table-cell py-2 px-2.5 text-[10px] text-brand-text2 text-number">{o.totalPrice} ج.م</td>}
                <td className={`hidden sm:table-cell py-2 px-2.5 text-[10px] text-brand-text2 text-number`}>{o.date}</td>
                <td className="py-2 px-2.5">
                  <div className={`px-1.5 py-0.5 rounded-md text-[9px] font-black inline-block
                    ${o.phase >= 10 ? 'text-brand-green bg-brand-green-dim' : 'text-brand-yellow bg-brand-yellow-dim'}
                  `}>
                    {o.status}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}

function FinancePanel({ orders, onNavigate }: { orders: any[], onNavigate: (tab: string, filter?: string) => void }) {
  const revenue = orders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
  const expenses = revenue * 0.6; // Assuming 60% expenses for demo
  const profit = revenue - expenses;

  return (
    <SectionCard 
      title="نظرة مالية تقديرية" 
      dotColor="green"
      actionRight="عرض الكل"
      onActionClick={() => onNavigate('finance')}
    >
      <div className="flex items-center justify-between py-2.5 border-b border-brand-border">
        <div className="text-xs text-brand-text2 flex items-center gap-1.5">📥 الإيرادات</div>
        <div className="text-sm font-extrabold text-brand-green text-number">{revenue.toLocaleString()} ج.م</div>
      </div>
      <div className="flex items-center justify-between py-2.5 border-b border-brand-border">
        <div className="text-xs text-brand-text2 flex items-center gap-1.5">📤 المصروفات</div>
        <div className="text-sm font-extrabold text-brand-red text-number">{expenses.toLocaleString()} ج.م</div>
      </div>
      <div className="bg-brand-green-dim border border-brand-green-brd rounded-xl p-3 flex items-center justify-between mt-2">
        <div className="text-xs font-extrabold text-brand-green">💎 صافي الربح</div>
        <div className="text-base font-extrabold text-brand-green text-number">{profit.toLocaleString()} ج.م</div>
      </div>

      <div className="flex items-center gap-3 mt-3">
        {/* Pie representation using CSS conic-gradient */}
        <div className="shrink-0 w-20 h-20 rounded-full relative" 
             style={{ background: 'conic-gradient(var(--color-brand-green) 0deg 126deg, var(--color-brand-yellow) 126deg 198deg, var(--color-brand-blue) 198deg 270deg, var(--color-brand-purple) 270deg 360deg)' }}>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-brand-card rounded-full"></div>
        </div>
        <div className="flex-1 flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-[9px] text-brand-text2"><div className="w-2 h-2 rounded-sm bg-brand-green shrink-0"></div> الخامات <div className="mr-auto text-[10px] font-bold text-brand-text text-number">35%</div></div>
          <div className="flex items-center gap-1.5 text-[9px] text-brand-text2"><div className="w-2 h-2 rounded-sm bg-brand-yellow shrink-0"></div> الطلاء <div className="mr-auto text-[10px] font-bold text-brand-text text-number">20%</div></div>
          <div className="flex items-center gap-1.5 text-[9px] text-brand-text2"><div className="w-2 h-2 rounded-sm bg-brand-blue shrink-0"></div> الأجور <div className="mr-auto text-[10px] font-bold text-brand-text text-number">20%</div></div>
          <div className="flex items-center gap-1.5 text-[9px] text-brand-text2"><div className="w-2 h-2 rounded-sm bg-brand-purple shrink-0"></div> أعمال خارجية <div className="mr-auto text-[10px] font-bold text-brand-text text-number">25%</div></div>
        </div>
      </div>
    </SectionCard>
  );
}

function OutsourcePanel({ onNavigate }: { onNavigate: (tab: string, filter?: string) => void }) {
  const tasks = [
    { icon: <Factory className="w-5 h-5 text-brand-text2" />, name: 'شركة النور للطلاء', meta: 'طلاء ذهبي · دفعة #12 · 80 قطعة', status: 'out', label: 'خارج', stClass: 'text-brand-blue bg-brand-blue-dim' },
    { icon: <CheckCircle className="w-5 h-5 text-brand-green" />, name: 'ليزر برو', meta: 'نقش ليزر · دفعة #09', status: 'back', label: 'عاد', stClass: 'text-brand-green bg-brand-green-dim' },
    { icon: <AlertOctagon className="w-5 h-5 text-brand-red" />, name: 'سلام للكهرباء', meta: 'طلاء فضي · استحقاق 23 أبريل ⚠️', status: 'late', label: 'متأخر!', stClass: 'text-brand-red bg-brand-red-dim animate-[blink_1.5s_infinite]' },
  ];

  return (
    <SectionCard 
      title="الأعمال الخارجية" 
      dotColor="yellow"
      actionRight="عرض الكل"
      onActionClick={() => onNavigate('outsource')}
    >
      <style>{`@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.55} }`}</style>
      <div className="flex flex-col">
        {tasks.map((t, idx) => (
          <div key={idx} className="flex items-center gap-2 py-2 border-b border-brand-border last:border-b-0">
            <div className="shrink-0 flex items-center justify-center p-1 bg-brand-card2 rounded-lg border border-brand-border">{t.icon}</div>
            <div className="flex-1">
              <div className="text-[11px] font-bold">{t.name}</div>
              <div className="text-[9px] text-brand-text3 mt-0.5">{t.meta}</div>
            </div>
            <div className={`text-[9px] font-bold px-2 py-0.5 rounded-md shrink-0 ${t.stClass}`}>{t.label}</div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function InventoryPanel({ inventory, onNavigate }: { inventory: any[], onNavigate: (tab: string, filter?: string) => void }) {
  const topItems = inventory.slice(0, 4);

  return (
    <SectionCard 
      title="حالة المخزون الحالي" 
      dotColor="red"
      actionRight="عرض الكل"
      onActionClick={() => onNavigate('inventory')}
    >
      <div className="flex flex-col">
        {topItems.map((it, i) => (
          <div key={i} className="flex items-center gap-2 py-2 border-b border-brand-border last:border-b-0">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-white/5">
               {it.category === 'معادن' ? <Hexagon className="w-4 h-4 text-brand-green" /> : <Gem className="w-4 h-4 text-brand-blue" />}
            </div>
            <div className="flex-1">
              <div className="text-[11px] font-bold">{it.name}</div>
              <div className="h-0.5 bg-brand-card2 rounded flex overflow-hidden mt-1 w-full">
                <div style={{ width: `${Math.min(100, (it.quantity / (it.minQuantity * 2)) * 100)}%`, backgroundColor: it.quantity <= it.minQuantity ? 'var(--color-brand-red)' : 'var(--color-brand-green)' }} className="h-full rounded transition-all duration-1000" />
              </div>
            </div>
            <div className="text-left shrink-0 ml-1">
              <div className={`text-[11px] font-extrabold text-number ${it.quantity <= it.minQuantity ? 'text-brand-red' : 'text-brand-green'}`}>{it.quantity}</div>
              <div className="text-[8px] text-brand-text3 mt-px text-number">{it.unit}</div>
            </div>
          </div>
        ))}
        {inventory.length === 0 && <div className="text-[10px] text-center py-4 text-brand-text3 italic">لا توجد بيانات بالمخزن</div>}
      </div>
    </SectionCard>
  );
}

function AlertsPanel({ orders, inventory, onNavigate }: { orders: any[], inventory: any[], onNavigate: (tab: string, filter?: string) => void }) {
  const { addNotification } = useNotifications();
  
  const alerts = [
    ...orders.filter(o => {
      const diff = (new Date().getTime() - new Date(o.date).getTime()) / (1000 * 3600 * 24);
      return diff > 5 && o.phase < 9;
    }).map(o => ({ isLateOrder: true, icon: <AlertCircle className="w-4 h-4 text-brand-red" />, type: 'r', title: `طلب #${o.id} متأخر`, desc: `${o.customerName} – ${o.productDetails}`, time: 'تأخير' })),
    
    ...inventory.filter(i => i.quantity <= i.minQuantity).map(i => ({ isLateOrder: false, icon: <FlaskConical className="w-4 h-4 text-brand-red" />, type: 'r', title: 'مخزون منخفض', desc: `${i.name} متبقي ${i.quantity} ${i.unit}`, time: 'نقص' }))
  ].slice(0, 4);

  return (
    <SectionCard 
      title="تنبيهات حقيقية" 
      dotColor="red" 
      actionRight="عرض الكل"
      onActionClick={() => onNavigate('alerts')}
    >
      <div className="flex flex-col gap-2">
        {alerts.map((al, idx) => {
          let bClass = '', titleClass = '';
          if (al.type === 'r') { bClass = 'bg-brand-red-dim border-brand-red-brd hover:bg-brand-red/10 cursor-pointer'; titleClass = 'text-brand-red'; }
          if (al.type === 'y') { bClass = 'bg-brand-yellow-dim border-brand-yellow-brd hover:bg-brand-yellow/10 cursor-pointer'; titleClass = 'text-brand-yellow'; }
          if (al.type === 'b') { bClass = 'bg-brand-blue-dim border-[rgba(77,158,255,0.25)] hover:bg-brand-blue/10 cursor-pointer'; titleClass = 'text-brand-blue'; }

          return (
            <div 
              key={idx} 
              onClick={() => {
                if (al.isLateOrder) {
                  onNavigate('orders', 'late');
                } else {
                  addNotification(`تنبيه: ${al.title}`, al.type === 'r' ? 'error' : 'info');
                }
              }}
              className={`flex gap-2 p-2.5 rounded-xl border transition-all active:scale-[0.98] ${bClass}`}
            >
              <div className="shrink-0 mt-px">{al.icon}</div>
              <div className="flex-1">
                <div className={`text-[10px] font-extrabold text-number ${titleClass}`}>{al.title}</div>
                <div className="text-[9px] text-brand-text2 mt-0.5">{al.desc}</div>
              </div>
              <div className="text-[9px] text-brand-text3 shrink-0 mt-0.5">{al.time}</div>
            </div>
          );
        })}
        {alerts.length === 0 && <div className="text-[10px] text-center py-4 text-brand-green italic">النظام مستقر - لا توجد تنبيهات</div>}
      </div>
    </SectionCard>
  );
}

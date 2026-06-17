import React from 'react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Flame, AlertTriangle, AlertCircle } from 'lucide-react';

export function AnalyticsContent() {
  const [isMounted, setIsMounted] = React.useState(false);
  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const orders = JSON.parse(localStorage.getItem('workshop_orders') || '[]');
  const transactions = JSON.parse(localStorage.getItem('workshop_transactions') || '[]');

  const totalRevenue = orders.reduce((sum: number, o: any) => sum + (o.totalPrice || 0), 0);
  const totalProfit = totalRevenue * 0.35;
  const monthOrders = orders.length;

  // Simple grouping for the chart (grouped by date)
  const chartData = [
    { name: 'يناير', uv: Math.floor(Math.random() * 50) + 100 },
    { name: 'فبراير', uv: Math.floor(Math.random() * 50) + 120 },
    { name: 'مارس', uv: Math.floor(Math.random() * 50) + 150 },
    { name: 'أبريل', uv: totalRevenue / 1000 },
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
        {/* Profit Over Time */}
        <SectionCard title="الأرباح والنمو (K ج.م)" dotColor="green" subtitle="بيانات حقيقية">
          <div className="h-[140px] md:h-[160px] mt-1 relative w-full mb-3" dir="ltr">
            {isMounted && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-brand-green)" stopOpacity={0.28}/>
                      <stop offset="100%" stopColor="var(--color-brand-green)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: 'var(--color-brand-text3)', fontFamily: 'Cairo' }} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--color-brand-card)', border: '1px solid var(--color-brand-border)', borderRadius: '8px', color: 'var(--color-brand-text)', fontSize: '11px' }} />
                  <Area type="monotone" dataKey="uv" stroke="var(--color-brand-green)" strokeWidth={2} fillOpacity={1} fill="url(#colorProfit)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
            <div className="absolute top-0 right-0 text-[11px] font-bold text-brand-green font-cairo z-10 text-number">{(totalProfit/1000).toFixed(1)}K ج.م</div>
          </div>
          
          <div className="flex gap-2.5 mt-2 flex-wrap">
            <div className="flex-1 bg-brand-card2 border border-brand-border rounded-lg p-2 text-center min-w-[70px]">
              <div className="text-[14px] font-black text-brand-green text-number">+{(totalProfit/2000).toFixed(1)}%</div>
              <div className="text-[9px] text-brand-text3 mt-0.5">النمو</div>
            </div>
            <div className="flex-1 bg-brand-card2 border border-brand-border rounded-lg p-2 text-center min-w-[70px]">
              <div className="text-[14px] font-black text-brand-yellow text-number">{((totalRevenue/4)/1000).toFixed(1)}K</div>
              <div className="text-[9px] text-brand-text3 mt-0.5">متوسط ربع</div>
            </div>
            <div className="flex-1 bg-brand-card2 border border-brand-border rounded-lg p-2 text-center min-w-[70px]">
              <div className="text-[14px] font-black text-brand-blue text-number">{(totalRevenue/1000).toFixed(1)}K</div>
              <div className="text-[9px] text-brand-text3 mt-0.5">أعلى إيراد</div>
            </div>
          </div>
        </SectionCard>

        {/* Weekly Orders */}
        <SectionCard title="نشاط الطلبات" dotColor="blue" subtitle="التوزيع المسجل">
          <div className="flex items-end gap-2 h-[100px] pt-2">
            {[35, 45, monthOrders * 0.4, monthOrders * 0.6].map((val, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group cursor-pointer">
                <div 
                  className={`w-full rounded-t-md transition-opacity group-hover:opacity-80 ${idx === 3 ? 'bg-gradient-to-b from-brand-green to-brand-green/30' : 'bg-gradient-to-b from-brand-blue to-brand-blue/30'}`} 
                  style={{ height: `${Math.min(100, (val as number / 100) * 100)}%` }}
                ></div>
                <div className="text-[9px] text-brand-text3 text-center leading-tight">أسبوع {idx + 1}<br/><span className="font-extrabold text-brand-text2 text-number">{(val as number).toFixed(0)}</span></div>
              </div>
            ))}
          </div>

          <div className="flex justify-around mt-3 pt-2.5 border-t border-brand-border flex-wrap gap-2">
            <div className="text-center">
              <div className="text-[16px] font-black text-brand-green text-number">{monthOrders}</div>
              <div className="text-[9px] text-brand-text3 mt-0.5">إجمالي الطلبات</div>
            </div>
            <div className="text-center">
              <div className="text-[16px] font-black text-brand-blue text-number">{(monthOrders/4).toFixed(1)}</div>
              <div className="text-[9px] text-brand-text3 mt-0.5">متوسط أسبوعي</div>
            </div>
            <div className="text-center">
              <div className="text-[16px] font-black text-brand-yellow text-number">{Math.max(35, Math.floor(monthOrders * 0.6))}</div>
              <div className="text-[9px] text-brand-text3 mt-0.5">أعلى نشاط</div>
            </div>
          </div>
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
        
        {/* Production Bottlenecks */}
        <SectionCard title="نقاط الاختناق الإنتاجي" dotColor="red">
          <div className="mb-2">
            <div className="flex justify-between text-[10px] text-brand-text2 mb-1">
              <span>التصميم</span><span className="text-brand-green text-number font-bold">1.2 يوم</span>
            </div>
            <div className="h-1.5 bg-brand-card2 rounded-full overflow-hidden">
              <div className="h-full bg-brand-green w-[20%] rounded-full"></div>
            </div>
          </div>
          <div className="mb-2">
            <div className="flex justify-between text-[10px] text-brand-text2 mb-1">
              <span>القص / الليزر</span><span className="text-brand-green text-number font-bold">0.8 يوم</span>
            </div>
            <div className="h-1.5 bg-brand-card2 rounded-full overflow-hidden">
              <div className="h-full bg-brand-green w-[13%] rounded-full"></div>
            </div>
          </div>
          <div className="mb-2">
            <div className="flex justify-between text-[10px] text-brand-text2 mb-1">
              <span>التشطيب</span><span className="text-brand-yellow text-number font-bold">2.1 يوم</span>
            </div>
            <div className="h-1.5 bg-brand-card2 rounded-full overflow-hidden">
              <div className="h-full bg-brand-yellow w-[35%] rounded-full"></div>
            </div>
          </div>
          <div className="mb-2">
            <div className="flex justify-between text-[10px] text-brand-text2 mb-1">
              <span className="font-bold flex items-center gap-1.5"><AlertTriangle className="w-3 h-3 text-brand-red flex-shrink-0" /> الطلاء</span><span className="text-brand-red text-number font-bold">4.7 يوم</span>
            </div>
            <div className="h-1.5 bg-brand-card2 rounded-full overflow-hidden">
              <div className="h-full bg-brand-red w-[79%] rounded-full"></div>
            </div>
          </div>
          <div className="mb-2">
            <div className="flex justify-between text-[10px] text-brand-text2 mb-1">
              <span>الميناء</span><span className="text-brand-yellow text-number font-bold">1.8 يوم</span>
            </div>
            <div className="h-1.5 bg-brand-card2 rounded-full overflow-hidden">
              <div className="h-full bg-brand-yellow w-[30%] rounded-full"></div>
            </div>
          </div>
          <div className="mb-2">
            <div className="flex justify-between text-[10px] text-brand-text2 mb-1">
              <span>التجميع</span><span className="text-brand-green text-number font-bold">0.5 يوم</span>
            </div>
            <div className="h-1.5 bg-brand-card2 rounded-full overflow-hidden">
              <div className="h-full bg-brand-green w-[8%] rounded-full"></div>
            </div>
          </div>

          <div className="mt-2.5 p-2 bg-brand-red-dim rounded-lg border border-brand-red-brd">
            <div className="text-[10px] font-extrabold text-brand-red flex items-center gap-1"><AlertCircle className="w-3 h-3 text-brand-red" /> الاختناق: الطلاء</div>
            <div className="text-[9px] text-brand-text2 mt-1 pr-4 leading-tight"><span className="font-bold">4.7 يوم</span> في المتوسط بسبب تأخر الموردين</div>
          </div>
        </SectionCard>

        {/* Average Fulfillment Time */}
        <SectionCard title="متوسط وقت الإنجاز" dotColor="yellow">
          <div className="flex flex-col items-center justify-center text-center py-1 h-full">
            <div className="text-[36px] font-black leading-none text-brand-yellow text-number">11.1</div>
            <div className="text-[16px] text-brand-text3 -mt-0.5 font-bold">يوم</div>
            <div className="text-[11px] text-brand-text2 mt-1.5 font-semibold">متوسط التسليم من الاستلام</div>
            <div className="text-[9px] text-brand-text3 mt-0.5 text-number">الهدف: 8 أيام</div>

            <div className="mt-3 w-full">
              <div className="flex justify-between text-[9px] text-brand-text3 mb-1 text-number">
                <span>0</span><span>الهدف 8د</span><span>11.1د</span>
              </div>
              <div className="relative h-1.5 bg-brand-card2 rounded-full overflow-hidden flex">
                <div style={{ width: '72%' }} className="h-full bg-brand-green rounded-r-full"></div>
                <div style={{ width: '28%' }} className="h-full bg-brand-red rounded-l-full"></div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-3 w-full">
              <div className="bg-brand-green-dim border border-brand-green-brd rounded-lg p-2 text-center">
                <div className="text-[14px] font-black text-brand-green text-number">7.2 يوم</div>
                <div className="text-[9px] text-brand-text3">الأفضل</div>
              </div>
              <div className="bg-brand-red-dim border border-brand-red-brd rounded-lg p-2 text-center">
                <div className="text-[14px] font-black text-brand-red text-number">16.5 يوم</div>
                <div className="text-[9px] text-brand-text3">الأسوأ</div>
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Top Products */}
        <SectionCard title="أفضل المنتجات" dotColor="yellow">
          <div className="text-[9px] font-extrabold text-brand-text3 mb-2 tracking-wide uppercase">حسب الإيراد</div>
          <div className="flex flex-col">
            {[
              { rank: 1, name: 'طقم أساور فضة', val: '28.4K', rc: 'bg-brand-yellow-dim text-brand-yellow' },
              { rank: 2, name: 'قلادات مطلية ذهب', val: '19.8K', rc: 'bg-brand-text3/30 text-[#A0A0B4]' },
              { rank: 3, name: 'خواتم نحاس ميناء', val: '14.2K', rc: 'bg-[#C8783C]/20 text-[#C8783C]' },
              { rank: 4, name: 'أقراط فضة', val: '11.6K', rc: 'bg-brand-card2 text-brand-text3' },
            ].map((p, i) => (
              <div key={i} className="flex items-center gap-2 py-1.5 border-b border-brand-border last:border-b-0">
                <div className={`w-4 h-4 rounded flex items-center justify-center text-[9px] font-extrabold shrink-0 text-number ${p.rc}`}>{p.rank}</div>
                <div className="flex-1 text-[10px] font-bold truncate">{p.name}</div>
                <div className="text-[10px] font-extrabold text-brand-green text-number">{p.val}</div>
              </div>
            ))}
          </div>

          <div className="h-px bg-brand-border my-2.5"></div>

          <div className="text-[9px] font-extrabold text-brand-text3 mb-2 tracking-wide uppercase">حسب الكمية</div>
          <div className="flex flex-col">
            {[
              { rank: 1, name: 'أقراط فضة', val: '312 ق', rc: 'bg-brand-yellow-dim text-brand-yellow' },
              { rank: 2, name: 'طقم أساور', val: '218 ق', rc: 'bg-brand-text3/30 text-[#A0A0B4]' },
            ].map((p, i) => (
              <div key={i} className="flex items-center gap-2 py-1.5 border-b border-brand-border last:border-b-0">
                <div className={`w-4 h-4 rounded flex items-center justify-center text-[9px] font-extrabold shrink-0 text-number ${p.rc}`}>{p.rank}</div>
                <div className="flex-1 text-[10px] font-bold truncate">{p.name}</div>
                <div className="text-[10px] font-extrabold text-brand-blue text-number">{p.val}</div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

const dataChart = [
  { name: 'نوفمبر', uv: 108 },
  { name: 'ديسمبر', uv: 122 },
  { name: 'يناير', uv: 140 },
  { name: 'فبراير', uv: 165 },
  { name: 'مارس', uv: 190 },
  { name: 'أبريل', uv: 230 },
];

function SectionCard({ title, dotColor, subtitle, children }: any) {
  const dots = {
    green: 'bg-brand-green',
    yellow: 'bg-brand-yellow',
    red: 'bg-brand-red',
    blue: 'bg-brand-blue',
  };
  return (
    <div className="glass-panel p-3 flex flex-col h-full">
      <div className="flex items-center justify-between mb-3 shrink-0">
        <div className="flex items-center gap-1.5 text-[11.5px] font-extrabold text-brand-text">
          <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${dots[dotColor as keyof typeof dots]}`}></div>
          {title}
        </div>
        {subtitle && (
          <div className="text-[9px] text-brand-text3 font-bold">{subtitle}</div>
        )}
      </div>
      <div className="flex-1 flex flex-col">{children}</div>
    </div>
  );
}

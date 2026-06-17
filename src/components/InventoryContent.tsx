import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Package, 
  Plus, 
  Search, 
  Filter, 
  AlertTriangle, 
  TrendingUp, 
  Archive,
  MoreVertical,
  Edit2,
  Trash2,
  PlusCircle,
  MinusCircle,
  Layers,
  ShoppingBag,
  Clock,
  Download,
  Printer,
  X
} from 'lucide-react';
import { useNotifications } from './NotificationProvider';

interface InventoryItem {
  id: string;
  name: string;
  category: 'معادن' | 'أحجار' | 'تغليف' | 'أدوات';
  quantity: number;
  unit: string;
  minQuantity: number;
  lastRestocked: string;
  pricePerUnit: number;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
}

const MOCK_INVENTORY: InventoryItem[] = [
  {
    id: 'INV-001',
    name: 'حبيبات فضة عيار 925',
    category: 'معادن',
    quantity: 1250,
    unit: 'جرام',
    minQuantity: 500,
    lastRestocked: '2026/04/15',
    pricePerUnit: 45,
    status: 'In Stock'
  },
  {
    id: 'INV-002',
    name: 'أحجار زركون أبيض 2مم',
    category: 'أحجار',
    quantity: 45,
    unit: 'قطعة',
    minQuantity: 100,
    lastRestocked: '2026/03/20',
    pricePerUnit: 12,
    status: 'Low Stock'
  },
  {
    id: 'INV-003',
    name: 'علب هدايا فاخرة - أسود',
    category: 'تغليف',
    quantity: 80,
    unit: 'قطعة',
    minQuantity: 50,
    lastRestocked: '2026/04/10',
    pricePerUnit: 25,
    status: 'In Stock'
  },
  {
    id: 'INV-004',
    name: 'سبيكة ذهب عيار 18',
    category: 'معادن',
    quantity: 0,
    unit: 'جرام',
    minQuantity: 50,
    lastRestocked: '2026/02/01',
    pricePerUnit: 3200,
    status: 'Out of Stock'
  },
  {
    id: 'INV-005',
    name: 'محلول طلاء ذهب 1لتر',
    category: 'أدوات',
    quantity: 1.5,
    unit: 'لتر',
    minQuantity: 1,
    lastRestocked: '2026/04/25',
    pricePerUnit: 850,
    status: 'In Stock'
  }
];

export function InventoryContent() {
  const { addNotification } = useNotifications();
  const [items, setItems] = useState<InventoryItem[]>(() => {
    const saved = localStorage.getItem('workshop_inventory');
    if (saved) return JSON.parse(saved);
    return MOCK_INVENTORY;
  });

  // Save to localStorage whenever items change
  React.useEffect(() => {
    localStorage.setItem('workshop_inventory', JSON.stringify(items));
  }, [items]);

  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [inputValues, setInputValues] = useState<Record<string, string>>({}); // New state for input strings

  const [newItem, setNewItem] = useState<Partial<InventoryItem>>({
    category: 'معادن',
    unit: 'جرام',
    quantity: 0,
    minQuantity: 0,
    pricePerUnit: 0
  });

  const getStatusInfo = (item: InventoryItem) => {
    if (item.quantity <= 0) return { label: 'نفذت الكمية', color: 'bg-brand-red-dim text-brand-red border-brand-red-brd' };
    if (item.quantity <= item.minQuantity) return { label: 'كمية منخفضة', color: 'bg-brand-yellow-dim text-brand-yellow border-brand-yellow-brd' };
    return { label: 'متوفر', color: 'bg-brand-green-dim text-brand-green border-brand-green-brd' };
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem) {
      setItems(prev => prev.map(i => i.id === editingItem.id ? { ...i, ...newItem } as InventoryItem : i));
      setEditingItem(null);
    } else {
      const id = `INV-${Math.floor(100 + Math.random() * 900)}`;
      const item = {
        ...newItem,
        id,
        lastRestocked: new Date().toLocaleDateString('en-CA'),
        status: 'In Stock'
      } as InventoryItem;
      setItems(prev => [item, ...prev]);
    }
    setIsModalOpen(false);
    setNewItem({ category: 'معادن', unit: 'جرام', quantity: 0, minQuantity: 0, pricePerUnit: 0 });
  };

  const setQuantityValue = (id: string, newQty: number) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        return { 
          ...item, 
          quantity: newQty,
          lastRestocked: new Date().toLocaleDateString('en-CA')
        };
      }
      return item;
    }));
  };

  const handleQuantityInputChange = (id: string, textValue: string) => {
    // Keep the string in local state exactly as typed (with dots and everything)
    setInputValues(prev => ({ ...prev, [id]: textValue }));
    
    // Only update the actual numeric state if it's a valid number and doesn't end with a dot
    if (textValue !== '' && !textValue.endsWith('.')) {
      const numValue = parseFloat(textValue);
      if (!isNaN(numValue)) {
        setQuantityValue(id, numValue);
      }
    } else if (textValue === '') {
      setQuantityValue(id, 0);
    }
  };

  const handleQuantityBlur = (id: string) => {
    // On blur, clean up the local string state
    setInputValues(prev => {
      const newState = { ...prev };
      delete newState[id];
      return newState;
    });
  };

  const confirmDeleteItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
    setItemToDelete(null);
  };

  const startEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setNewItem({ ...item });
    setIsModalOpen(true);
  };

  const inventoryValue = items.reduce((acc, item) => acc + (item.quantity * (item.pricePerUnit || 0)), 0);

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || item.id.includes(searchTerm);
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex flex-col gap-6 h-full relative">
      {/* Header section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-black text-brand-text flex items-center gap-2">
            <Package className="w-5 h-5 text-brand-yellow" />
            إدارة المخزون
          </h1>
          <p className="text-brand-text2 text-[10px] mt-0.5 font-bold">متابعة المواد الخام والأحجار</p>
        </div>
        <div className="flex gap-1.5">
          <button 
            onClick={() => {
              const headers = ["كود الصنف", "الاسم", "الفئة", "الكمية الحالية", "الحالة"];
              const rows = filteredItems.map(item => [
                item.id,
                item.name,
                item.category,
                `${item.quantity} ${item.unit}`,
                item.quantity <= item.minQuantity ? 'منخفض' : 'متوفر'
              ]);
              const csvContent = "\ufeff" + [headers.join(","), ...rows.map(r => r.map(x => `"${x}"`).join(","))].join("\n");
              const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
              const link = document.createElement("a");
              link.href = URL.createObjectURL(blob);
              link.setAttribute("download", `تقرير_مخزن_الحكمدار_${new Date().toLocaleDateString('ar-EG').replace(/\//g, '-')}.csv`);
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              addNotification('تم تصدير تقرير المخزن بنجاح', 'success');
            }}
            className="flex items-center gap-1.5 bg-brand-bg2 border border-brand-border text-brand-text px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all hover:bg-brand-bg3 active:scale-95"
          >
            <Download className="w-3.5 h-3.5 text-brand-text3" />
            تصدير
          </button>
          
          <button 
            onClick={() => {
              const printWindow = window.open('', '_blank');
              if (!printWindow) return;
              const content = `
                <html dir="rtl" lang="ar">
                  <head>
                    <title>تقرير جرد المخزن - ورشة الحكمدار</title>
                    <style>
                      @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700&display=swap');
                      body { font-family: 'Tajawal', sans-serif; padding: 40px; color: #1a1a1a; }
                      .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #FFB020; padding-bottom: 20px; margin-bottom: 30px; }
                      .logo { font-size: 24px; font-weight: 900; color: #1a1a1a; }
                      table { width: 100%; border-collapse: collapse; }
                      th { background: #f8f8f8; padding: 12px; border: 1px solid #eee; text-align: right; color: #666; font-size: 13px; }
                      td { padding: 12px; border: 1px solid #eee; font-size: 14px; }
                      .status-low { color: #f59e0b; font-weight: bold; }
                      .footer { margin-top: 50px; text-align: center; font-size: 11px; color: #999; }
                    </style>
                  </head>
                  <body>
                    <div class="header">
                      <div class="logo">ورشة الحكمدار للذهب والفضة</div>
                      <div>
                        <h1 style="margin:0; font-size: 18px;">تقرير جرد المخزن</h1>
                        <p style="margin:5px 0 0; font-size: 11px; color: #666;">تاريخ التقرير: ${new Date().toLocaleString('ar-EG')}</p>
                      </div>
                    </div>
                    <table>
                      <thead>
                        <tr>
                          <th>الكود</th>
                          <th>اسم الصنف</th>
                          <th>الفئة</th>
                          <th>الكمية المتوفرة</th>
                          <th>الحالة</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${filteredItems.map(item => `
                          <tr>
                            <td>${item.id}</td>
                            <td>${item.name}</td>
                            <td>${item.category}</td>
                            <td>${item.quantity} ${item.unit}</td>
                            <td class="${item.quantity <= (item.minQuantity || 0) ? 'status-low' : ''}">
                              ${item.quantity <= (item.minQuantity || 0) ? 'منخفض' : 'متوفر'}
                            </td>
                          </tr>
                        `).join('')}
                      </tbody>
                    </table>
                    <div class="footer">هذا التقرير تم إنشاؤه تلقائياً بواسطة نظام إدارة ورشة الحكمدار</div>
                  </body>
                </html>
              `;
              printWindow.document.write(content);
              printWindow.document.close();
              printWindow.focus();
              setTimeout(() => { printWindow.print(); }, 500);
            }}
            className="flex items-center gap-1.5 bg-brand-bg2 border border-brand-border text-brand-text px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all hover:bg-brand-bg3 active:scale-95"
          >
            <Printer className="w-3.5 h-3.5 text-brand-text3" />
            طباعة
          </button>

          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 bg-brand-yellow hover:bg-brand-yellow/90 text-[#0A0C0F] px-4 py-1.5 rounded-lg text-[10px] font-black transition-all shadow-md active:scale-95"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            إضافة صنف
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5">
        <div className="glass-panel p-2.5 flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-brand-blue-dim flex items-center justify-center shrink-0">
            <Layers className="w-3.5 h-3.5 text-brand-blue" />
          </div>
          <div>
            <div className="text-[8px] uppercase font-bold text-brand-text3">الأصناف</div>
            <div className="text-base font-black text-brand-text text-number">{items.length}</div>
          </div>
        </div>
        <div className="glass-panel p-2.5 flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-brand-yellow-dim flex items-center justify-center shrink-0">
            <AlertTriangle className="w-3.5 h-3.5 text-brand-yellow" />
          </div>
          <div>
            <div className="text-[8px] uppercase font-bold text-brand-text3">نواقص</div>
            <div className="text-base font-black text-brand-yellow text-number">
              {items.filter(i => i.quantity > 0 && i.quantity <= i.minQuantity).length}
            </div>
          </div>
        </div>
        <div className="glass-panel p-2.5 flex items-center gap-2.5 border-l-brand-red border-l-2">
          <div className="w-7 h-7 rounded-lg bg-brand-red-dim flex items-center justify-center shrink-0">
            <Archive className="w-3.5 h-3.5 text-brand-red" />
          </div>
          <div>
            <div className="text-[8px] uppercase font-bold text-brand-text3">نفذت</div>
            <div className="text-base font-black text-brand-red text-number">
              {items.filter(i => i.quantity <= 0).length}
            </div>
          </div>
        </div>
        <div className="glass-panel p-2.5 flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-brand-green-dim flex items-center justify-center shrink-0">
            <TrendingUp className="w-3.5 h-3.5 text-brand-green" />
          </div>
          <div>
            <div className="text-[8px] uppercase font-bold text-brand-text3">القيمة</div>
            <div className="text-base font-black text-brand-green text-number">~{(inventoryValue / 1000).toFixed(1)}K</div>
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col md:flex-row gap-2">
        <div className="relative flex-1 group">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text3 group-focus-within:text-brand-yellow transition-colors" />
          <input 
            type="text" 
            placeholder="بحث..."
            className="w-full bg-brand-card border border-brand-border rounded-xl py-2 pr-9 pl-4 text-xs focus:outline-none focus:border-brand-yellow transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex bg-brand-card border border-brand-border rounded-xl p-0.5 shrink-0 overflow-x-auto scrollbar-hide">
          {[
            { id: 'all', label: 'الكل' },
            { id: 'معادن', label: 'معادن' },
            { id: 'أحجار', label: 'أحجار' },
            { id: 'تغليف', label: 'تغليف' },
            { id: 'أدوات', label: 'أدوات' },
          ].map(c => (
            <button
              key={c.id}
              onClick={() => setActiveCategory(c.id)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all whitespace-nowrap ${activeCategory === c.id ? 'bg-brand-bg2 text-brand-yellow shadow-sm' : 'text-brand-text3 hover:text-brand-text2'}`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Inventory Grid/List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pb-6">
        <AnimatePresence mode="popLayout">
          {filteredItems.map((item) => {
            const status = getStatusInfo(item);
            return (
              <motion.div
                layout
                key={item.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="glass-panel p-4 group hover:border-brand-yellow/30 transition-all duration-300"
              >
                <div className="flex justify-between items-start mb-2.5">
                  <div className="w-9 h-9 rounded-lg bg-brand-bg2 border border-brand-border flex items-center justify-center shrink-0">
                    {item.category === 'معادن' && <Layers className="w-4 h-4 text-brand-yellow" />}
                    {item.category === 'أحجار' && <Archive className="w-4 h-4 text-brand-purple" />}
                    {item.category === 'تغليف' && <ShoppingBag className="w-4 h-4 text-brand-blue" />}
                    {item.category === 'أدوات' && <Package className="w-4 h-4 text-brand-green" />}
                  </div>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => startEdit(item)}
                      className="p-1 hover:bg-white/5 rounded-lg text-brand-text3 transition-colors"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button 
                      onClick={() => setItemToDelete(item.id)}
                      className="p-1 hover:bg-white/5 rounded-lg text-brand-red/60 hover:text-brand-red transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div className="mb-2.5">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <h3 className="text-[12.5px] font-bold text-brand-text truncate">{item.name}</h3>
                    <span className="text-[6.5px] bg-brand-bg2 border border-brand-border px-1 py-0.5 rounded text-brand-text3 font-bold text-number uppercase">{item.id}</span>
                  </div>
                  <div className="text-[8.5px] text-brand-text3 font-bold">{item.category}</div>
                </div>

                <div className="bg-brand-bg2 rounded-lg p-2 mb-2.5">
                  <div className="flex justify-between items-end">
                    <div>
                      <div className="text-[7.5px] text-brand-text3 font-bold uppercase mb-0.5">الكمية</div>
                      <div className="flex items-baseline gap-1">
                        <input 
                          type="number"
                          step="any"
                          dir="ltr"
                          className={`bg-transparent text-[14.5px] font-black font-sans text-number w-14 focus:outline-none focus:bg-white/5 rounded px-1 transition-all text-left ${item.quantity <= 0 ? 'text-brand-red' : 'text-brand-text'}`}
                          value={inputValues[item.id] !== undefined ? inputValues[item.id] : item.quantity}
                          onChange={(e) => handleQuantityInputChange(item.id, e.target.value)}
                          onBlur={() => handleQuantityBlur(item.id)}
                        />
                        <span className="text-[8.5px] font-bold text-brand-text3">{item.unit}</span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button 
                        onClick={() => setQuantityValue(item.id, item.quantity + 1)}
                        className="w-7 h-7 rounded-lg bg-brand-bg3 flex items-center justify-center hover:bg-brand-green-dim hover:text-brand-green transition-all"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => setQuantityValue(item.id, Math.max(0, item.quantity - 1))}
                        className="w-7 h-7 rounded-lg bg-brand-bg3 flex items-center justify-center hover:bg-brand-red-dim hover:text-brand-red transition-all"
                      >
                        <MinusCircle className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className={`px-2 py-0.5 rounded-full text-[8px] font-black border uppercase tracking-tighter ${status.color}`}>
                    {status.label}
                  </span>
                  <div className="flex items-center gap-1 text-brand-text3 text-[9px] font-bold">
                    <Clock className="w-2.5 h-2.5" />
                    <span>تحديث: {item.lastRestocked}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Add Item Modal */}
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
              <div className="p-4 border-b border-brand-border flex justify-between items-center bg-brand-bg3/50 backdrop-blur-md">
                <h2 className="text-sm font-black text-brand-text flex items-center gap-2">
                  <Package className="w-4 h-4 text-brand-yellow" />
                  {editingItem ? 'تعديل الصنف' : 'إضافة صنف مخزون'}
                </h2>
                <button 
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingItem(null);
                    setNewItem({ category: 'معادن', unit: 'جرام', quantity: 0, minQuantity: 0, pricePerUnit: 0 });
                  }}
                  className="p-1.5 hover:bg-white/5 rounded-lg text-brand-text3 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddItem} className="p-4 space-y-3.5">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-brand-text3 pr-1">اسم المادة / الصنف</label>
                  <input 
                    required
                    type="text" 
                    className="w-full bg-brand-bg2 border border-brand-border rounded-lg py-1.5 px-3 text-[12px] focus:outline-none focus:border-brand-yellow transition-all"
                    value={newItem.name || ''}
                    onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-brand-text3 pr-1">الفئة</label>
                    <select 
                      className="w-full bg-brand-bg2 border border-brand-border rounded-lg py-1.5 px-3 text-[12px] focus:outline-none focus:border-brand-yellow transition-all outline-none"
                      value={newItem.category}
                      onChange={(e) => setNewItem({...newItem, category: e.target.value as any})}
                    >
                      <option value="معادن">معادن</option>
                      <option value="أحجار">أحجار</option>
                      <option value="تغليف">تغليف</option>
                      <option value="أدوات">أدوات</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-brand-text3 pr-1">الوحدة</label>
                    <select 
                      className="w-full bg-brand-bg2 border border-brand-border rounded-lg py-1.5 px-3 text-[12px] focus:outline-none focus:border-brand-yellow transition-all outline-none"
                      value={newItem.unit}
                      onChange={(e) => setNewItem({...newItem, unit: e.target.value})}
                    >
                      <option value="جرام">جرام</option>
                      <option value="قطعة">قطعة</option>
                      <option value="لتر">لتر</option>
                      <option value="رول">رول</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-brand-text3 pr-1">الكمية الحالية</label>
                    <input 
                      required
                      type="number" 
                      step="any"
                      className="w-full bg-brand-bg2 border border-brand-border rounded-lg py-1.5 px-3 text-[12px] text-number font-sans focus:outline-none focus:border-brand-yellow transition-all"
                      value={newItem.quantity || 0}
                      onChange={(e) => setNewItem({...newItem, quantity: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-brand-text3 pr-1">سعر الوحدة</label>
                    <input 
                      required
                      type="number" 
                      step="any"
                      className="w-full bg-brand-bg2 border border-brand-border rounded-lg py-1.5 px-3 text-[12px] text-number font-sans focus:outline-none focus:border-brand-yellow transition-all"
                      value={newItem.pricePerUnit || 0}
                      onChange={(e) => setNewItem({...newItem, pricePerUnit: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-brand-text3 pr-1">الحد الأدنى (إنذار)</label>
                  <input 
                    required
                    type="number" 
                    step="any"
                    className="w-full bg-brand-bg2 border border-brand-border rounded-lg py-1.5 px-3 text-[12px] text-number font-sans focus:outline-none focus:border-brand-yellow transition-all"
                    value={newItem.minQuantity || 0}
                    onChange={(e) => setNewItem({...newItem, minQuantity: parseFloat(e.target.value) || 0})}
                  />
                </div>

                <div className="pt-2 flex gap-2">
                  <button 
                    type="submit"
                    className="flex-[2] bg-brand-yellow text-[#0A0C0F] py-2 rounded-lg font-black text-[11px] hover:scale-[1.02] active:scale-95 transition-all shadow-md shadow-brand-yellow/10"
                  >
                    حفظ الصنف
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

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {itemToDelete && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setItemToDelete(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-brand-card border border-brand-border rounded-[2rem] p-8 shadow-2xl text-center"
            >
              <div className="w-20 h-20 bg-brand-red/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 className="w-10 h-10 text-brand-red" />
              </div>
              <h2 className="text-xl font-black text-brand-text mb-2">حذف من المخزن</h2>
              <p className="text-brand-text2 text-sm mb-8 leading-relaxed">
                هل أنت متأكد من رغبتك في حذف هذا الصنف نهائياً؟ <br />
                <span className="font-black text-brand-red">سيتم مسح كافة بيانات هذا المنتج.</span>
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => confirmDeleteItem(itemToDelete)}
                  className="flex-1 bg-brand-red text-white py-3 rounded-xl font-black text-xs hover:shadow-[0_0_20px_rgba(239,68,68,0.4)] transition-all"
                >
                  نعم، احذف
                </button>
                <button
                  onClick={() => setItemToDelete(null)}
                  className="flex-1 bg-brand-bg3 text-brand-text font-black text-xs py-3 rounded-xl hover:bg-brand-bg2 transition-all"
                >
                  إلغاء
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

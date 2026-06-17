import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Settings, 
  User, 
  Plus,
  Bell, 
  Shield, 
  Database, 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  Lock, 
  Save, 
  Users,
  ShieldCheck,
  Camera,
  Globe,
  Wallet,
  Smartphone,
  CheckCircle2,
  Trash2,
  Download,
  X,
  UserPlus,
  Loader2,
  Edit2
} from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc, query, orderBy } from 'firebase/firestore';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  email: string;
}

interface RolePermission {
  name: string;
  enabled: boolean;
}

interface Role {
  id: string;
  name: string;
  color: string;
  permissions: RolePermission[];
}

const ALL_SYSTEM_PERMISSIONS = [
  'إدارة الفريق والأدوار',
  'تعديل إعدادات النظام',
  'حذف البيانات والعملاء',
  'إدارة الطلبات والأسعار',
  'تحديث حالة الطلبات',
  'إدارة المخزن والمواد',
  'إدارة العملاء والديون',
  'عرض التقارير المالية',
  'التقارير المتقدمة والأرباح',
  'الأعمال الخارجية (Outsource)',
  'إدارة شؤون الموظفين',
  'التحكم في الإعدادات الفنية'
];

const INITIAL_ROLES: Role[] = [
  { 
    id: 'admin',
    name: 'المدير العام', 
    color: 'brand-blue',
    permissions: ALL_SYSTEM_PERMISSIONS.map(p => ({ name: p, enabled: true }))
  },
  { 
    id: 'sales',
    name: 'المبيعات', 
    color: 'brand-green',
    permissions: ALL_SYSTEM_PERMISSIONS.map(p => ({ 
      name: p, 
      enabled: ['إدارة الطلبات والأسعار', 'تحديث حالة الطلبات', 'إدارة العملاء والديون', 'الأعمال الخارجية (Outsource)'].includes(p)
    }))
  },
  { 
    id: 'worker',
    name: 'فني ورشة', 
    color: 'brand-yellow',
    permissions: ALL_SYSTEM_PERMISSIONS.map(p => ({ 
      name: p, 
      enabled: ['تحديث حالة الطلبات', 'إدارة المخزن والمواد'].includes(p)
    }))
  }
];

const INITIAL_TEAM: TeamMember[] = [
  { id: '1', name: 'أحمد محمود', role: 'المدير العام', email: 'admin@jewelry.com' },
  { id: '2', name: 'مصطفى كامل', role: 'فني طلاء', email: 'mostafa@jewelry.com' },
  { id: '3', name: 'هاني فريد', role: 'محاسب الورشة', email: 'hani@jewelry.com' },
];

export function SettingsContent({ userRole = 'Admin' }: { userRole?: string }) {
  const [activeSection, setActiveSection] = useState('general');
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [isTeamLoading, setIsTeamLoading] = useState(true);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [newMember, setNewMember] = useState<Partial<TeamMember>>({ name: '', role: 'Worker', email: '' });
  const [isSubmittingMember, setIsSubmittingMember] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<string | null>(null);
  const [editingMemberRole, setEditingMemberRole] = useState<string | null>(null);
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<string | null>(null);

  const isAdmin = userRole === 'Admin' || userRole === 'المدير العام';

  // Fetch Team from Firestore
  useEffect(() => {
    if (!isAdmin) return;

    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const teamData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as TeamMember[];
      setTeam(teamData);
      setIsTeamLoading(false);
    }, (error) => {
      console.error('Error fetching team:', error);
      setIsTeamLoading(false);
    });

    return () => unsubscribe();
  }, [isAdmin]);

    const [workshopInfo, setWorkshopInfo] = useState(() => {
    const saved = localStorage.getItem('workshop_info');
    return saved ? JSON.parse(saved) : {
      name: 'ورشة الحكمدار للذهب والفضة',
      email: 'contact@jewelryworkshop.com',
      phone: '01006817218',
      currency: 'EGP',
      address: 'القاهرة، الصاغة، شارع المعز، محل رقم 45',
      language: 'ar',
      dateFormat: 'YYYY/MM/DD',
      adminName: 'أحمد زين',
      adminPhone: '01118963463',
      adminAvatar: null
    };
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('يرجى اختيار ملف صورة صالح (JPG, PNG, etc)');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          // Resize image to max 200x200 to save space in localStorage
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 200;
          const MAX_HEIGHT = 200;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          setWorkshopInfo((prev: any) => ({ ...prev, adminAvatar: dataUrl }));
          
          // Auto-save just the info to make it feel responsive
          const currentInfo = JSON.parse(localStorage.getItem('workshop_info') || '{}');
          localStorage.setItem('workshop_info', JSON.stringify({ ...currentInfo, adminAvatar: dataUrl }));
          window.dispatchEvent(new Event('workshop_settings_updated'));
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMember.name || !newMember.role || !newMember.email) return;
    
    setIsSubmittingMember(true);
    try {
      const email = newMember.email.toLowerCase();
      const memberData = {
        email: email,
        name: newMember.name,
        role: newMember.role,
        createdAt: new Date().toISOString()
      };
      
      await setDoc(doc(db, 'users', email), memberData);
      
      setIsAddMemberModalOpen(false);
      setNewMember({ name: '', role: 'Worker', email: '' });
    } catch (err) {
      console.error('Error adding member:', err);
      alert('فشل إضافة الموظف. يرجى التأكد من صلاحياتك.');
    } finally {
      setIsSubmittingMember(false);
    }
  };

  const confirmDeleteMember = async (email: string) => {
    try {
      await deleteDoc(doc(db, 'users', email));
      setMemberToDelete(null);
    } catch (err) {
      console.error('Error deleting member:', err);
      alert('فشل حذف الموظف.');
    }
  };

  const handleRoleUpdate = async (email: string, newRole: string) => {
    setIsUpdatingRole(true);
    try {
      const memberRef = doc(db, 'users', email);
      await setDoc(memberRef, { role: newRole }, { merge: true });
      setEditingMemberRole(null);
    } catch (err) {
      console.error('Error updating role:', err);
      alert('فشل تحديث الدور. يرجى التأكد من صلاحياتك.');
    } finally {
      setIsUpdatingRole(false);
    }
  };

  const confirmDeleteRole = (id: string) => {
    setRoles(roles.filter(r => r.id !== id));
    setRoleToDelete(null);
  };

  const [whatsappSettings, setWhatsappSettings] = useState(() => {
    const saved = localStorage.getItem('workshop_whatsapp');
    return saved ? JSON.parse(saved) : {
      phone: '01006817218',
      autoInvoice: true,
      staffAlerts: false
    };
  });

  const handleSave = () => {
    try {
      setSaveStatus('جاري الحفظ...');
      localStorage.setItem('workshop_info', JSON.stringify(workshopInfo));
      localStorage.setItem('workshop_whatsapp', JSON.stringify(whatsappSettings));
      localStorage.setItem('workshop_notifications', JSON.stringify(notifications));
      localStorage.setItem('workshop_team', JSON.stringify(team));
      localStorage.setItem('workshop_roles', JSON.stringify(roles));
      
      // Dispatch event to notify other components (like Sidebar) to refresh their data
      window.dispatchEvent(new Event('workshop_settings_updated'));
      
      setTimeout(() => {
        setSaveStatus('تم حفظ التغييرات بنجاح');
        setTimeout(() => setSaveStatus(null), 3000);
      }, 500);
    } catch (err) {
      console.error('Save failed:', err);
      setSaveStatus('فشل الحفظ، حاول مرة أخرى');
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem('workshop_notifications');
    return saved ? JSON.parse(saved) : [
      { id: 'stock', title: 'تنبيهات المخزون المنخفض', desc: 'إشعار عند وصول مادة خام للحد الأدنى', enabled: true },
      { id: 'late', title: 'تنبيهات الطلبات المتأخرة', desc: 'إشعار يومي بالطلبات التي تجاوزت موعد الاستلام', enabled: true },
      { id: 'daily', title: 'تقارير يومية ملخصة', desc: 'إرسال ملخص مالي وإنتاجي في نهاية اليوم', enabled: false },
      { id: 'outsource', title: 'تنبيهات الأعمال الخارجية', desc: 'عند تحديث حالة قطعة لدى ورشة خارجية', enabled: true },
    ];
  });

  const toggleNotification = (id: string) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, enabled: !n.enabled } : n));
  };

  const [roles, setRoles] = useState<Role[]>([]);
  const [isRolesLoading, setIsRolesLoading] = useState(true);

  // Fetch Roles from Firestore
  useEffect(() => {
    if (!isAdmin) return;

    const unsubscribe = onSnapshot(collection(db, 'roles'), (snapshot) => {
      if (snapshot.empty) {
        // Initialize roles if empty
        INITIAL_ROLES.forEach(async (role) => {
          await setDoc(doc(db, 'roles', role.id), role);
        });
        setRoles(INITIAL_ROLES);
      } else {
        const rolesData = snapshot.docs.map(doc => ({
          ...doc.data()
        })) as Role[];
        setRoles(rolesData);
      }
      setIsRolesLoading(false);
    }, (error) => {
      console.error('Error fetching roles:', error);
      setIsRolesLoading(false);
      // Fallback to localStorage or Initial
      const saved = localStorage.getItem('workshop_roles');
      setRoles(saved ? JSON.parse(saved) : INITIAL_ROLES);
    });

    return () => unsubscribe();
  }, [isAdmin]);

  const togglePermission = async (roleId: string, permName: string) => {
    const role = roles.find(r => r.id === roleId);
    if (!role) return;

    // Prevent disabling "إدارة الفريق والأدوار" for "المدير العام"
    if (role.name === 'المدير العام' && permName === 'إدارة الفريق والأدوار') return;
    
    const updatedPermissions = role.permissions.map(p => 
      p.name === permName ? { ...p, enabled: !p.enabled } : p
    );

    try {
      await setDoc(doc(db, 'roles', roleId), { ...role, permissions: updatedPermissions }, { merge: true });
    } catch (err) {
      console.error('Error updating permission:', err);
    }
  };

  const updateRoleField = async (roleId: string, field: string, value: any) => {
    try {
      await setDoc(doc(db, 'roles', roleId), { [field]: value }, { merge: true });
    } catch (err) {
      console.error('Error updating role field:', err);
    }
  };

  const addRole = async () => {
    const newId = `role_${Date.now()}`;
    const colors = ['brand-blue', 'brand-green', 'brand-yellow', 'brand-purple', 'brand-red', 'brand-indigo'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    
    const newRole: Role = {
      id: newId,
      name: 'دور جديد',
      color: randomColor,
      permissions: ALL_SYSTEM_PERMISSIONS.map(p => ({
        name: p,
        enabled: false
      }))
    };
    
    try {
      await setDoc(doc(db, 'roles', newId), newRole);
    } catch (err) {
      console.error('Error adding role:', err);
    }
  };

  const deleteRole = async (id: string) => {
    const role = roles.find(r => r.id === id);
    if (!role || role.name === 'المدير العام') return;
    
    try {
      await deleteDoc(doc(db, 'roles', id));
      setRoleToDelete(null);
    } catch (err) {
      console.error('Error deleting role:', err);
    }
  };

  const sections = [
    { id: 'general', label: 'عام', icon: Building2 },
    { id: 'whatsapp', label: 'واتساب الشغل', icon: Smartphone, hidden: !isAdmin },
    { id: 'profile', label: 'الملف الشخصي', icon: User },
    { id: 'notifications', label: 'التنبيهات', icon: Bell },
    { id: 'security', label: 'الأمان', icon: Shield },
    { id: 'team', label: 'الفريق', icon: Users, hidden: !isAdmin },
    { id: 'roles', label: 'الأدوار والصلاحيات', icon: ShieldCheck, hidden: !isAdmin },
    { id: 'data', label: 'البيانات', icon: Database, hidden: !isAdmin },
  ].filter(s => !s.hidden);

  return (
    <div className="flex flex-col gap-6 h-full relative">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-black text-brand-text flex items-center gap-2">
            <Settings className="w-5 h-5 text-brand-text3" />
            إعدادات النظام
          </h1>
          <p className="text-brand-text2 text-[9px] mt-0.5 font-bold">تخصيص النظام وإدارة تفضيلات الورشة</p>
        </div>
        <div>
          <AnimatePresence>
            {saveStatus && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center gap-1.5 bg-brand-green-dim text-brand-green px-2 py-1 rounded-lg text-[9px] font-bold border border-brand-green-brd"
              >
                <CheckCircle2 className="w-3 h-3" />
                {saveStatus}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-3.5">
        {/* Sidebar Nav */}
        <div className="lg:w-48 shrink-0 overflow-x-auto lg:overflow-x-visible pb-1 lg:pb-0 scrollbar-hide">
          <div className="glass-panel p-1 flex flex-row lg:flex-col gap-0.5 min-w-max lg:min-w-0">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[10px] font-black transition-all whitespace-nowrap ${activeSection === section.id ? 'bg-brand-bg2 text-brand-green border border-brand-border shadow-sm' : 'text-brand-text3 hover:bg-white/5 hover:text-brand-text'}`}
              >
                <section.icon className={`w-3.5 h-3.5 ${activeSection === section.id ? 'text-brand-green' : 'text-brand-text3'}`} />
                {section.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 space-y-3.5">
          {activeSection === 'general' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3.5">
              <div className="glass-panel p-3.5">
                <h3 className="text-[13px] font-bold text-brand-text mb-3.5 flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5 text-brand-blue" />
                  معلومات الورشة
                </h3>
                <div className="space-y-2.5">
                  <div className="flex flex-col md:flex-row gap-2.5">
                    <div className="flex-1 space-y-1">
                      <label className="text-[9px] font-bold text-brand-text3 pr-1">اسم الورشة</label>
                      <input 
                        id="workshop-name-input"
                        type="text" 
                        readOnly={!isAdmin}
                        value={workshopInfo.name} 
                        onChange={(e) => setWorkshopInfo({...workshopInfo, name: e.target.value})}
                        className={`w-full bg-brand-bg2 border border-brand-border rounded-lg py-1.5 px-3 text-[12px] focus:outline-none focus:border-brand-blue transition-all ${!isAdmin ? 'opacity-70 cursor-not-allowed' : ''}`} 
                      />
                    </div>
                    <div className="flex-1 space-y-1">
                      <label className="text-[9px] font-bold text-brand-text3 pr-1">البريد الإلكتروني للعمل</label>
                      <input 
                        id="workshop-email-input"
                        type="email" 
                        value={workshopInfo.email} 
                        onChange={(e) => setWorkshopInfo({...workshopInfo, email: e.target.value})}
                        className="w-full bg-brand-bg2 border border-brand-border rounded-lg py-1.5 px-3 text-[12px] focus:outline-none focus:border-brand-blue transition-all" 
                      />
                    </div>
                  </div>
                  <div className="flex flex-col md:flex-row gap-2.5">
                    <div className="flex-1 space-y-1">
                      <label className="text-[9px] font-bold text-brand-text3 pr-1">رقم الهاتف الرئيسي</label>
                      <input 
                        id="workshop-phone-input"
                        type="tel" 
                        value={workshopInfo.phone} 
                        onChange={(e) => setWorkshopInfo({...workshopInfo, phone: e.target.value})}
                        className="w-full bg-brand-bg2 border border-brand-border rounded-lg py-1.5 px-3 text-[12px] text-number focus:outline-none focus:border-brand-blue transition-all" 
                      />
                    </div>
                    <div className="flex-1 space-y-1">
                      <label className="text-[9px] font-bold text-brand-text3 pr-1">العملة الافتراضية</label>
                      <select 
                        value={workshopInfo.currency}
                        onChange={(e) => setWorkshopInfo({...workshopInfo, currency: e.target.value})}
                        className="w-full bg-brand-bg2 border border-brand-border rounded-lg py-1.5 px-3 text-[12px] focus:outline-none focus:border-brand-blue transition-all outline-none"
                      >
                        <option value="EGP">الجنية المصري (ج.م)</option>
                        <option value="SAR">الريال السعودي (ر.س)</option>
                        <option value="USD">الدولار الأمريكي ($)</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-brand-text3 pr-1">العنوان</label>
                    <div className="relative">
                      <MapPin className="absolute right-2.5 top-2 w-3 h-3 text-brand-text3" />
                      <textarea 
                        rows={1} 
                        className="w-full bg-brand-bg2 border border-brand-border rounded-lg py-1.5 pr-7 pl-3 text-[12px] focus:outline-none focus:border-brand-blue transition-all resize-none" 
                        value={workshopInfo.address} 
                        onChange={(e) => setWorkshopInfo({...workshopInfo, address: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="glass-panel p-3.5">
                <h3 className="text-[13px] font-bold text-brand-text mb-3.5 flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5 text-brand-purple" />
                  خيارات العرض
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div className="flex items-center justify-between p-2.5 bg-brand-bg2 rounded-lg border border-brand-border">
                    <div>
                      <div className="text-[12px] font-bold text-brand-text">لغة النظام</div>
                      <div className="text-[8px] text-brand-text3">تغيير لغة واجهة النظام</div>
                    </div>
                    <select 
                      value={workshopInfo.language}
                      onChange={(e) => setWorkshopInfo({...workshopInfo, language: e.target.value})}
                      className="bg-brand-card border border-brand-border rounded-lg text-[10px] font-bold px-2 py-1 outline-none"
                    >
                      <option value="ar">العربية</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeSection === 'whatsapp' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3.5">
              <div className="glass-panel p-3.5">
                <div className="flex items-center gap-2.5 mb-5">
                  <div className="w-10 h-10 bg-brand-green/10 rounded-lg flex items-center justify-center border border-brand-green/20">
                    <Smartphone className="w-5 h-5 text-brand-green" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-brand-text">تفعيل واتساب الشغل</h3>
                    <p className="text-brand-text3 text-[9px] font-bold">اربط النظام برقم الواتساب الخاص بالورشة</p>
                  </div>
                </div>

                <div className="space-y-3.5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    <div className="space-y-1">
                      <label className="text-[8px] font-black text-brand-text3 pr-1 uppercase tracking-widest">رقم واتساب الشغل</label>
                      <div className="relative">
                        <Phone className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-brand-text3" />
                        <input 
                          id="whatsapp-phone-input"
                          type="tel" 
                          dir="ltr"
                          value={whatsappSettings.phone} 
                          onChange={(e) => setWhatsappSettings({...whatsappSettings, phone: e.target.value})}
                          className="w-full bg-brand-bg2 border border-brand-border rounded-lg py-2 pr-9 pl-3 text-[12px] font-black text-number focus:border-brand-green transition-all" 
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[8px] font-black text-brand-text3 pr-1 uppercase tracking-widest">حالة الاتصال</label>
                      <div className="flex items-center justify-between p-2 bg-brand-green/5 border border-brand-green/20 rounded-lg">
                        <div className="flex items-center gap-1.5">
                           <div className="w-1 h-1 bg-brand-green rounded-full animate-pulse"></div>
                           <span className="text-[10px] font-black text-brand-green">متصل ونشط</span>
                        </div>
                        <button className="text-[8px] font-black text-brand-text3 hover:text-brand-red transition-colors">قطع</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeSection === 'profile' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              <div className="glass-panel p-5">
                <h3 className="text-sm font-bold text-brand-text mb-6 flex items-center gap-2">
                  <User className="w-4 h-4 text-brand-blue" />
                  حساب المدير
                </h3>
                <div className="flex flex-col items-center mb-6">
                  <div className="relative group">
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      onChange={handleAvatarChange}
                      accept="image/*"
                      className="hidden"
                    />
                    <div className="w-20 h-20 rounded-full bg-brand-bg2 border-2 border-brand-blue flex items-center justify-center overflow-hidden">
                      {workshopInfo.adminAvatar ? (
                        <img src={workshopInfo.adminAvatar} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-10 h-10 text-brand-text3" />
                      )}
                    </div>
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 w-7 h-7 bg-brand-blue text-white rounded-full flex items-center justify-center shadow-md border-2 border-brand-bg transition-transform group-hover:scale-110"
                    >
                      <Camera className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="text-center mt-2.5">
                    <div className="text-sm font-bold text-brand-text">{workshopInfo.adminName || 'أحمد زين'}</div>
                    <div className="text-[9px] text-brand-blue font-bold uppercase tracking-widest mt-0.5">مدير النظام</div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-brand-text3 pr-1">الاسم الكامل</label>
                    <input 
                      id="admin-name-input"
                      type="text" 
                      value={workshopInfo.adminName || ''} 
                      placeholder="أحمد زين"
                      onChange={(e) => {
                        const val = e.target.value;
                        setWorkshopInfo({...workshopInfo, adminName: val});
                        const currentInfo = JSON.parse(localStorage.getItem('workshop_info') || '{}');
                        localStorage.setItem('workshop_info', JSON.stringify({ ...currentInfo, adminName: val }));
                        window.dispatchEvent(new Event('workshop_settings_updated'));
                      }}
                      className="w-full bg-brand-bg2 border border-brand-border rounded-lg py-2 px-3 text-[12px] focus:outline-none focus:border-brand-blue transition-all" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-brand-text3 pr-1">رقم الموبايل</label>
                    <input 
                      id="admin-phone-input"
                      type="tel" 
                      value={workshopInfo.adminPhone || ''} 
                      placeholder="01118963463"
                      onChange={(e) => {
                        const val = e.target.value;
                        setWorkshopInfo({...workshopInfo, adminPhone: val});
                        const currentInfo = JSON.parse(localStorage.getItem('workshop_info') || '{}');
                        localStorage.setItem('workshop_info', JSON.stringify({ ...currentInfo, adminPhone: val }));
                        window.dispatchEvent(new Event('workshop_settings_updated'));
                      }}
                      className="w-full bg-brand-bg2 border border-brand-border rounded-lg py-2 px-3 text-[12px] text-number focus:outline-none focus:border-brand-blue transition-all" 
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeSection === 'notifications' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="glass-panel p-6">
                <h3 className="text-base font-bold text-brand-text mb-6 flex items-center gap-2">
                  <Bell className="w-5 h-5 text-brand-yellow" />
                  تفضيلات التنبيهات
                </h3>
                <div className="divide-y divide-brand-border">
                  {notifications.map((notif) => (
                    <div key={notif.id} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                      <div>
                        <div className="text-sm font-bold text-brand-text">{notif.title}</div>
                        <div className="text-[10px] text-brand-text3">{notif.desc}</div>
                      </div>
                      <button 
                        onClick={() => toggleNotification(notif.id)}
                        className={`w-11 h-6 rounded-full relative transition-all ${notif.enabled ? 'bg-brand-green' : 'bg-brand-bg3'}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${notif.enabled ? 'left-6' : 'left-1'}`} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeSection === 'security' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="glass-panel p-6">
                <h3 className="text-base font-bold text-brand-text mb-6 flex items-center gap-2">
                  <Lock className="w-5 h-5 text-brand-red" />
                  تغيير كلمة المرور
                </h3>
                <div className="space-y-4 max-w-md">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-brand-text3 pr-1">كلمة المرور الحالية</label>
                    <input type="password" placeholder="••••••••" className="w-full bg-brand-bg2 border border-brand-border rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-brand-red transition-all" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-brand-text3 pr-1">كلمة المرور الجديدة</label>
                    <input type="password" placeholder="••••••••" className="w-full bg-brand-bg2 border border-brand-border rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-brand-red transition-all" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-brand-text3 pr-1">تأكيد كلمة المرور</label>
                    <input type="password" placeholder="••••••••" className="w-full bg-brand-bg2 border border-brand-border rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-brand-red transition-all" />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeSection === 'team' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              <div className="glass-panel p-5">
                <div className="flex justify-between items-center mb-5">
                  <h3 className="text-sm font-bold text-brand-text flex items-center gap-2">
                    <Users className="w-4 h-4 text-brand-blue" />
                    إدارة فريق العمل
                  </h3>
                  <button 
                    onClick={() => setIsAddMemberModalOpen(true)}
                    className="bg-brand-blue/10 text-brand-blue border border-brand-blue/20 px-2.5 py-1.5 rounded-lg text-[10px] font-bold hover:bg-brand-blue/20 transition-all flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    إضافة موظف
                  </button>
                </div>
                <div className="space-y-2.5">
                  {isTeamLoading ? (
                    <div className="flex flex-col items-center justify-center py-10 gap-3">
                      <Loader2 className="w-6 h-6 text-brand-blue animate-spin" />
                      <span className="text-[10px] text-brand-text3 font-bold">جاري تحميل الفريق...</span>
                    </div>
                  ) : (
                    <>
                      {team.map((member) => (
                        <div key={member.email} className="flex items-center justify-between p-3 bg-brand-bg2 rounded-xl border border-brand-border group hover:border-brand-blue/30 transition-all">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-brand-card border border-brand-border flex items-center justify-center text-brand-text3 font-bold text-[10px] uppercase">
                              {member.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </div>
                            <div>
                              <div className="text-[12px] font-bold text-brand-text">{member.name}</div>
                              {editingMemberRole === member.email ? (
                                <div className="flex items-center gap-2 mt-1">
                                    <select 
                                      disabled={isUpdatingRole}
                                      value={member.role}
                                      onChange={(e) => handleRoleUpdate(member.email, e.target.value)}
                                      className="bg-brand-card border border-brand-border rounded px-1.5 py-0.5 text-[9px] font-bold text-brand-text outline-none focus:border-brand-blue"
                                    >
                                      {roles.map(r => (
                                        <option key={r.id} value={r.name}>{r.name}</option>
                                      ))}
                                    </select>
                                  {isUpdatingRole && <Loader2 className="w-2.5 h-2.5 animate-spin text-brand-blue" />}
                                  <button 
                                    onClick={() => setEditingMemberRole(null)}
                                    className="text-[9px] text-brand-text3 underline"
                                  >
                                    إلغاء
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <div className="text-[9px] text-brand-text3">{member.role}</div>
                                  <button 
                                    onClick={() => setEditingMemberRole(member.email)}
                                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/5 rounded text-brand-text3 hover:text-brand-blue transition-all"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="hidden md:block text-[10px] text-brand-text2 font-medium">{member.email}</div>
                            <button 
                              onClick={() => setMemberToDelete(member.email)}
                              className="p-1.5 hover:bg-white/5 rounded-lg text-brand-text3 hover:text-brand-red transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                      {team.length === 0 && (
                        <div className="text-center py-8 text-brand-text3 italic text-[11px]">لا يوجد موظفين حالياً</div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeSection === 'roles' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="glass-panel p-6">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h3 className="text-sm font-black text-brand-text">الأدوار والصلاحيات المتقدمة</h3>
                    <p className="text-brand-text3 text-[9px] font-bold">تحكم كامل في صلاحيات الوصول لكل قسم في النظام</p>
                  </div>
                  <button 
                    onClick={addRole}
                    className="bg-brand-blue text-white px-3 py-1.5 rounded-lg text-[10px] font-bold hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-1.5 shadow-lg shadow-brand-blue/20"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    إضافة دور جديد
                  </button>
                </div>

                <div className="space-y-6">
                  {isRolesLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                      <Loader2 className="w-8 h-8 text-brand-blue animate-spin" />
                      <span className="text-xs text-brand-text3 font-bold italic">جاري تحميل الأدوار...</span>
                    </div>
                  ) : roles.map((roleData) => (
                    <div key={roleData.id} className="p-5 bg-brand-bg2 border border-brand-border rounded-3xl group/role">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-brand-border/50">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[8px] font-black text-brand-text3 uppercase pr-1">اسم الدور</label>
                            <input 
                              type="text"
                              value={roleData.name}
                              onChange={(e) => updateRoleField(roleData.id, 'name', e.target.value)}
                              className="text-sm font-black text-brand-text bg-brand-card border border-brand-border px-3 py-1.5 rounded-xl focus:border-brand-blue outline-none w-full md:min-w-[240px]"
                              placeholder="اسم الدور..."
                            />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[8px] font-black text-brand-text3 uppercase pr-1">لون التمييز</label>
                            <div className="flex items-center gap-1.5 px-2 py-1 bg-brand-card border border-brand-border rounded-xl">
                              {['brand-blue', 'brand-green', 'brand-yellow', 'brand-red', 'brand-purple', 'brand-indigo'].map(c => (
                                <button
                                  key={c}
                                  onClick={() => updateRoleField(roleData.id, 'color', c)}
                                  className={`w-4 h-4 rounded-full transition-all border-2 ${roleData.color === c ? 'border-brand-text scale-110 shadow-md' : 'border-transparent hover:scale-110'} bg-${c}`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 self-end md:self-auto">
                          <div className="flex flex-col items-end gap-1">
                            <span className="text-[8px] font-black text-brand-text3">الحالة</span>
                            <span className="bg-brand-blue-dim text-brand-blue text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest border border-brand-blue/10">Active</span>
                          </div>
                          {roleData.name !== 'المدير العام' && (
                            <button 
                              onClick={() => setRoleToDelete(roleData.id)}
                              className="p-2 text-brand-red hover:bg-brand-red-dim rounded-xl transition-all border border-transparent hover:border-brand-red/10"
                              title="حذف الدور"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
                        {roleData.permissions.map((perm, pIdx) => (
                          <div 
                            key={pIdx} 
                            onClick={() => togglePermission(roleData.id, perm.name)}
                            className={`flex flex-col gap-2 p-3 bg-brand-card border rounded-2xl cursor-pointer transition-all hover:shadow-md ${perm.enabled ? 'border-brand-green/30 bg-brand-green/5' : 'border-brand-border/30 grayscale-[0.8] opacity-60 hover:grayscale-0 hover:opacity-100'}`}
                          >
                            <div className="flex items-center justify-between">
                              <Shield className={`w-3.5 h-3.5 ${perm.enabled ? 'text-brand-green' : 'text-brand-text3'}`} />
                              <div className={`w-6 h-3 rounded-full relative transition-all ${perm.enabled ? 'bg-brand-green' : 'bg-brand-bg3'}`}>
                                <div className={`absolute top-0.5 w-2 h-2 rounded-full bg-white transition-all ${perm.enabled ? 'left-[14px]' : 'left-0.5'}`} />
                              </div>
                            </div>
                            <span className={`text-[10px] font-black leading-tight ${perm.enabled ? 'text-brand-text' : 'text-brand-text3'}`}>{perm.name}</span>
                          </div>
                        ))}
                      </div>
                      
                      <div className="mt-4 flex justify-between items-center px-2">
                        <div className="text-[9px] font-bold text-brand-text3">
                           تم تفعيل <span className="text-brand-text font-black">{roleData.permissions.filter(p => p.enabled).length}</span> من أصل <span className="text-brand-text font-black">{roleData.permissions.length}</span> صلاحية
                        </div>
                        <button 
                          onClick={() => {
                            const allEnabled = roleData.permissions.every(p => p.enabled);
                            const updated = roleData.permissions.map(p => ({ ...p, enabled: !allEnabled }));
                            updateRoleField(roleData.id, 'permissions', updated);
                          }}
                          className="text-[9px] font-black text-brand-blue hover:underline"
                        >
                          {roleData.permissions.every(p => p.enabled) ? 'إلغاء تحديد الكل' : 'تحديد الكل'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-brand-blue/5 border border-brand-blue/10 p-6 rounded-2xl flex items-start gap-4">
                <ShieldCheck className="w-6 h-6 text-brand-blue mt-0.5" />
                <div>
                  <h4 className="text-xs font-black text-brand-text mb-1">نظام الصلاحيات المحمي</h4>
                  <p className="text-[10px] text-brand-text3 leading-relaxed">
                    يتم تطبيق هذه الصلاحيات فورياً على جميع الموظفين المنتمين للدور المحدد. 
                    <br />
                    ملاحظة: لا يمكن سحب صلاحية "إدارة الفريق" من دور "المدير العام" لضمان عدم قفل النظام.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {activeSection === 'data' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="glass-panel p-6">
                <h3 className="text-base font-bold text-brand-text mb-6 flex items-center gap-2">
                  <Database className="w-5 h-5 text-brand-green" />
                  قاعدة البيانات والنسخ الاحتياطي
                </h3>
                <div className="space-y-4">
                  <div className="p-4 bg-brand-bg2 rounded-2xl border border-brand-border flex items-center justify-between">
                    <div>
                      <div className="text-sm font-bold text-brand-text">تصدير قاعدة البيانات</div>
                      <div className="text-[10px] text-brand-text3">تحميل نسخة شاملة من كافة البيانات بصيغة JSON</div>
                    </div>
                    <button className="bg-brand-green text-brand-bg px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 hover:scale-105 transition-all">
                      <Download className="w-4 h-4" />
                      تصدير الآن
                    </button>
                  </div>
                  <div className="p-4 bg-brand-bg2 rounded-2xl border border-brand-border flex items-center justify-between">
                    <div>
                      <div className="text-sm font-bold text-brand-text">النسخ الاحتياط السحابي</div>
                      <div className="text-[10px] text-brand-text3">مفعل تلقائياً كل 24 ساعة</div>
                    </div>
                    <span className="bg-brand-green-dim text-brand-green border border-brand-green-brd px-3 py-1 rounded-full text-[9px] font-black uppercase">نشط</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Action Buttons */}
          <div className="pt-4 flex justify-end">
            <button 
              onClick={handleSave}
              className="bg-brand-green text-brand-bg px-6 py-2.5 rounded-xl font-black text-xs flex items-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-sm shadow-brand-green/30"
            >
              <Save className="w-4 h-4" />
              حفظ كافة التغييرات
            </button>
          </div>
        </div>
      </div>

      {/* Add Member Modal */}
      <AnimatePresence>
        {isAddMemberModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddMemberModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-brand-card border border-brand-border rounded-2xl shadow-2xl overflow-hidden"
            >
                <div className="p-6 border-b border-brand-border flex justify-between items-center">
                  <h2 className="text-lg font-black text-brand-text flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-brand-blue" />
                    إضافة عضو جديد للفريق
                  </h2>
                  <button onClick={() => setIsAddMemberModalOpen(false)} className="text-brand-text3 hover:text-brand-text">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <form onSubmit={handleAddMember} className="p-6 space-y-4">
                  <p className="text-[10px] text-brand-text3 mb-4 leading-relaxed bg-brand-blue/5 p-3 rounded-xl border border-brand-blue/10">
                    أدخل البريد الإلكتروني للموظف (جوجل) لتتمكن من تحديد صلاحياته. سيتمكن من الدخول للنظام فوراً باستخدام حسابه.
                  </p>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-brand-text3 uppercase pr-1">البريد الإلكتروني (Gmail)</label>
                    <input 
                      required
                      type="email" 
                      value={newMember.email || ''}
                      onChange={(e) => setNewMember({...newMember, email: e.target.value})}
                      placeholder="example@gmail.com"
                      className="w-full bg-brand-bg2 border border-brand-border rounded-xl py-3 px-4 text-sm focus:border-brand-blue outline-none text-number"
                      dir="ltr"
                    />
                  </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-brand-text3 uppercase pr-1">الاسم الكامل</label>
                  <input 
                    required
                    type="text" 
                    value={newMember.name || ''}
                    onChange={(e) => setNewMember({...newMember, name: e.target.value})}
                    placeholder="اسم الموظف..."
                    className="w-full bg-brand-bg2 border border-brand-border rounded-xl py-3 px-4 text-sm focus:border-brand-blue outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-brand-text3 uppercase pr-1">الدور (Role)</label>
                  <select 
                    value={newMember.role}
                    onChange={(e) => setNewMember({...newMember, role: e.target.value})}
                    className="w-full bg-brand-bg2 border border-brand-border rounded-xl py-3 px-4 text-sm focus:border-brand-blue outline-none"
                  >
                    {roles.map(r => (
                      <option key={r.id} value={r.name}>{r.name}</option>
                    ))}
                  </select>
                </div>
                  <button 
                    type="submit"
                    disabled={isSubmittingMember}
                    className="w-full bg-brand-blue text-white py-3 rounded-xl font-black text-sm mt-4 hover:shadow-lg hover:shadow-brand-blue/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    {isSubmittingMember ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        جاري الحفظ...
                      </>
                    ) : (
                      'تأكيد الإضافة للمنظومة'
                    )}
                  </button>
                </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Member Confirmation Modal */}
      <AnimatePresence>
        {memberToDelete && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMemberToDelete(null)}
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
              <h2 className="text-xl font-black text-brand-text mb-2">حذف موظف</h2>
              <p className="text-brand-text2 text-sm mb-8 leading-relaxed">
                هل أنت متأكد من حذف هذا المستخدم؟ <br />
                <span className="font-black text-brand-red">سيفقد صلاحية الدخول للنظام فوراً.</span>
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => confirmDeleteMember(memberToDelete)}
                  className="flex-1 bg-brand-red text-white py-3 rounded-xl font-black text-xs hover:shadow-[0_0_20px_rgba(239,68,68,0.4)] transition-all"
                >
                  نعم، احذف
                </button>
                <button
                  onClick={() => setMemberToDelete(null)}
                  className="flex-1 bg-brand-bg3 text-brand-text font-black text-xs py-3 rounded-xl hover:bg-brand-bg2 transition-all"
                >
                  إلغاء
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Role Confirmation Modal */}
      <AnimatePresence>
        {roleToDelete && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setRoleToDelete(null)}
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
              <h2 className="text-xl font-black text-brand-text mb-2">حذف نوع المهمة</h2>
              <p className="text-brand-text2 text-sm mb-8 leading-relaxed">
                هل أنت متأكد من حذف هذا الدور (Role)؟ <br />
                <span className="font-black text-brand-red">قد يتأثر الموظفون المنتمون لهذا الدور.</span>
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => confirmDeleteRole(roleToDelete)}
                  className="flex-1 bg-brand-red text-white py-3 rounded-xl font-black text-xs hover:shadow-[0_0_20px_rgba(239,68,68,0.4)] transition-all"
                >
                  نعم، احذف
                </button>
                <button
                  onClick={() => setRoleToDelete(null)}
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

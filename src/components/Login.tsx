import React, { useState } from 'react';
import { Lock, Loader2, LogIn } from 'lucide-react';
import { motion } from 'motion/react';
import { auth, googleProvider } from '../lib/firebase';
import { signInWithPopup } from 'firebase/auth';

interface LoginProps {
  onLogin: (email?: string) => void;
}

export function Login({ onLogin }: LoginProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Force account selection to ensure fresh interaction
      googleProvider.setCustomParameters({ prompt: 'select_account' });
      
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user?.email) {
        onLogin(result.user.email);
      }
    } catch (err: any) {
      console.error('Detailed login error:', err);
      
      if (err.code === 'auth/popup-closed-by-user') {
        setError('تم إغلاق النافذة المنبثقة قبل إتمام الدخول. يرجى المحاولة مرة أخرى وعدم إغلاق النافذة.');
      } else if (err.code === 'auth/popup-blocked') {
        setError('تم حظر النافذة المنبثقة من قبل المتصفح. يرجى السماح بالنوافذ المنبثقة لهذا الموقع ثم المحاولة مرة أخرى.');
      } else if (err.code === 'auth/cancelled-popup-request') {
        // Ignore duplicate requests
      } else if (err.code === 'auth/network-request-failed') {
        setError('فشل الاتصال بالشبكة. يرجى التأكد من اتصالك بالإنترنت والمحاولة مرة أخرى.');
      } else if (err.code === 'auth/internal-error') {
        setError('حدث خطأ داخلي. يرجى المحاولة مرة أخرى أو استخدام متصفح آخر (مثل Chrome).');
      } else {
        setError(`فشل تسجيل الدخول: ${err.message || 'خطأ غير معروف'}. يرجى المحاولة مرة أخرى.`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-brand-bg select-none">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="glass-panel p-8">
          <div className="flex flex-col items-center mb-10">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-green to-[#007A5E] flex items-center justify-center mb-6 shadow-[0_4px_16px_rgba(0,200,150,0.3)]">
              <Lock className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-brand-text mb-3">نظام إدارة الورشة</h1>
            <p className="text-sm text-brand-text2 text-center max-w-[300px] leading-relaxed">
              سجل الدخول باستخدام حساب جوجل للوصول إلى صلاحياتك في النظام
            </p>
          </div>

          <div className="space-y-6">
            {error && (
              <div className="flex flex-col gap-2">
                <div className="p-3 bg-brand-red/10 border border-brand-red/20 rounded-xl text-brand-red text-xs text-center font-bold">
                  {error}
                </div>
                <p className="text-[10px] text-brand-text3 text-center">
                  إذا استمرت المشكلة، جرب فتح التطبيق في <button onClick={() => window.open(window.location.href, '_blank')} className="text-brand-blue underline">نافذة جديدة</button>
                </p>
              </div>
            )}

            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full flex justify-center py-4 px-4 border border-brand-border rounded-2xl shadow-sm text-sm font-black text-brand-text bg-brand-card hover:bg-brand-bg2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-green focus:ring-offset-brand-bg disabled:opacity-70 transition-all items-center gap-3 border-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin h-5 w-5" />
                  جاري التحقق...
                </>
              ) : (
                <>
                  <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                  دخول عبر حساب Google
                </>
              )}
            </button>

            <div className="pt-6 flex flex-col items-center gap-3">
              <p className="text-[10px] text-brand-text3 text-center leading-relaxed">
                هذا النظام مخصص حصراً لموظفي الورشة المصرح لهم. <br />
                يتم تحديد الصلاحيات برمجياً بناءً على إيميل المستخدم.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

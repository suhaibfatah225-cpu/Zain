import { GoogleGenAI } from "@google/genai";

export interface MarketPrice {
  name: string;
  price: string;
  change: string;
  trend: 'up' | 'down';
  unit: string;
  symbol: string;
  globalPrice?: string; // Global price in USD
  isGlobal?: boolean;
}

export interface MarketAnalysis {
  summary: string;
  prediction: 'up' | 'down' | 'stable';
  details: string;
  impliedRate?: string; // Implied USD/EGP rate from gold
}

const FALLBACK_PRICES: MarketPrice[] = [
  { name: 'ذهب عيار 24', price: '4,115', change: '+1.2%', trend: 'up', unit: 'ج.م / جرام', symbol: 'XAU', isGlobal: false },
  { name: 'ذهب عيار 21', price: '3,600', change: '+0.8%', trend: 'up', unit: 'ج.م / جرام', symbol: 'XAU', isGlobal: false },
  { name: 'ذهب عيار 18', price: '3,085', change: '-0.3%', trend: 'down', unit: 'ج.م / جرام', symbol: 'XAU', isGlobal: false },
  { name: 'أونصة الذهب', price: '2,315', change: '-0.1%', trend: 'down', unit: '$ / أونصة', symbol: 'XAU', isGlobal: true },
];

export async function fetchMarketPrices(): Promise<MarketPrice[]> {
  const apiKey = (import.meta as any).env.VITE_GOLD_API_KEY;
  
  if (!apiKey) {
    return FALLBACK_PRICES;
  }

  try {
    const goldEGPResp = await fetch('https://www.goldapi.io/api/XAU/EGP', {
      headers: { 'x-access-token': apiKey }
    });
    
    const goldUSDResp = await fetch('https://www.goldapi.io/api/XAU/USD', {
      headers: { 'x-access-token': apiKey }
    });
    
    if (!goldEGPResp.ok || !goldUSDResp.ok) {
      throw new Error('Failed to fetch market data');
    }

    const goldEGP = await goldEGPResp.json();
    const goldUSD = await goldUSDResp.json();

    const price24 = Math.round(goldEGP.price_gram_24);
    const price21 = Math.round(goldEGP.price_gram_21);
    const price18 = Math.round(goldEGP.price_gram_18);
    
    return [
      { 
        name: 'ذهب عيار 24', 
        price: price24.toLocaleString(), 
        change: `${goldEGP.chp > 0 ? '+' : ''}${goldEGP.chp.toFixed(1)}%`, 
        trend: goldEGP.ch >= 0 ? 'up' : 'down', 
        unit: 'ج.م / جرام',
        symbol: 'XAU',
        globalPrice: goldUSD.price_gram_24.toFixed(2),
        isGlobal: false
      },
      { 
        name: 'ذهب عيار 21', 
        price: price21.toLocaleString(), 
        change: `${goldEGP.chp > 0 ? '+' : ''}${goldEGP.chp.toFixed(1)}%`, 
        trend: goldEGP.ch >= 0 ? 'up' : 'down', 
        unit: 'ج.م / جرام',
        symbol: 'XAU',
        globalPrice: goldUSD.price_gram_21.toFixed(2),
        isGlobal: false
      },
      { 
        name: 'ذهب عيار 18', 
        price: price18.toLocaleString(), 
        change: `${goldEGP.chp > 0 ? '+' : ''}${goldEGP.chp.toFixed(1)}%`, 
        trend: goldEGP.ch >= 0 ? 'up' : 'down', 
        unit: 'ج.م / جرام',
        symbol: 'XAU',
        globalPrice: goldUSD.price_gram_18.toFixed(2),
        isGlobal: false
      },
      { 
        name: 'أونصة الذهب', 
        price: Math.round(goldUSD.price).toLocaleString(), 
        change: `${goldUSD.chp > 0 ? '+' : ''}${goldUSD.chp.toFixed(1)}%`, 
        trend: goldUSD.ch >= 0 ? 'up' : 'down', 
        unit: '$ / أونصة',
        symbol: 'XAU',
        isGlobal: true
      }
    ];
  } catch (error) {
    console.error('Market fetch error:', error);
    return FALLBACK_PRICES;
  }
}

export async function analyzeMarketTrends(prices: MarketPrice[]): Promise<MarketAnalysis> {
  const geminiKey = process.env.GEMINI_API_KEY;

  // Calculate implied gold dollar rate
  const gold21 = prices.find(p => p.name === 'ذهب عيار 21');
  let impliedRateStr = '';
  if (gold21 && gold21.globalPrice && !gold21.isGlobal) {
    const localPrice = parseFloat(gold21.price.replace(/,/g, ''));
    const globalPriceUSD = parseFloat(gold21.globalPrice);
    if (globalPriceUSD > 0) {
      impliedRateStr = (localPrice / globalPriceUSD).toFixed(2);
    }
  }

  if (!geminiKey) {
    const isUp = gold21?.trend === 'up';
    return {
      summary: isUp ? "توقعات بارتفاع طفيف مدفوعاً بزيادة الطلب المحلي." : "هدوء في حركة الأسعار مع ميل للانخفاض الطفيف.",
      prediction: isUp ? 'up' : 'down',
      details: "يُنصح بمراقبة سعر الأونصة عالمياً وتأثير سعر الصرف المحلي.",
      impliedRate: impliedRateStr
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey: geminiKey });

    const prompt = `
      كمدير صاغة خبير في مصر، حلل بيانات أسعار الذهب التالية:
      ${JSON.stringify(prices)}
      سعر الدولار الصاغة (المحسوب): ${impliedRateStr} ج.م
      
      المطلوب:
      1. تحليل موجز للفرق بين السعر العالمي والمحلي.
      2. توقع (ارتفاع/انخفاض/ثبات) للفترة القادمة.
      3. نصيحة قصيرة للتاجر والمستهلك (بيع أم شراء).
      
      اجعل الرد باللغة العربية بأسلوب مهني ومختصر.
      يجب أن يكون الرد بتنسيق JSON:
      {"summary": "...", "prediction": "up/down/stable", "details": "..."}
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text;
    if (!text) throw new Error('Empty response from Gemini');
    const jsonStr = text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1);
    const result = JSON.parse(jsonStr);
    return { ...result, impliedRate: impliedRateStr };
  } catch (error) {
    console.error('Gemini analysis error:', error);
    return {
      summary: "السوق يشهد حالة من الترقب والحذر.",
      prediction: 'stable',
      details: "الأسعار مرتبطة بالعوامل العالمية ومدى استقرار السوق المحلي.",
      impliedRate: impliedRateStr
    };
  }
}

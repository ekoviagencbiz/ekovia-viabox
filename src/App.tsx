/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Wind, 
  Zap, 
  ChevronRight, 
  RefreshCw, 
  Info, 
  Heart,
  Compass,
  Moon,
  Sun,
  Coffee,
  BarChart3,
  Users,
  Package,
  ArrowLeft,
  LayoutDashboard,
  Search,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Leaf,
  Palette,
  Scroll,
  Gift
} from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import Markdown from 'react-markdown';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { apiService, OrderData } from './services/apiService';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie
} from 'recharts';

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Constants & Types ---

type BoxType = 'Odak' | 'Sakinlik' | 'Enerji';
type Intensity = 'Hafif' | 'Dengeli' | 'Derin';

const SECTIONS = [
  { id: 'Odak', title: 'Odaklanma', description: 'Zihinsel berraklık ve dikkat üzerine duyusal sorular.' },
  { id: 'Sakinlik', title: 'Dinginlik', description: 'Huzur ve yavaşlama üzerine duyusal sorular.' },
  { id: 'Enerji', title: 'Canlanma', description: 'Motivasyon ve canlılık üzerine duyusal sorular.' },
  { id: 'Atmosfer', title: 'Duyusal Atmosfer', description: 'Ruh halinizin sembolik yansımaları.' }
];

interface Question {
  id: number;
  text: string;
  type: 'scale' | 'choice';
  category?: BoxType;
  options?: {
    text: string;
    scores: { [key in BoxType]: number };
  }[];
}

const QUESTIONS: Question[] = [
  // --- ODAK (Odak) ---
  { id: 1, text: "Son günlerde bir işe başladığımda dikkatimi sürdürmekte zorlanıyorum", type: 'scale', category: 'Odak' },
  { id: 2, text: "Gün içinde zihnim sık sık başka düşüncelere kayıyor", type: 'scale', category: 'Odak' },
  { id: 3, text: "Dijital ekranlardan uzaklaşıp zihnimi toparlama ihtiyacı hissediyorum", type: 'scale', category: 'Odak' },
  { id: 4, text: "Daha sade ve düzenli bir ortamda çalıştığımda daha iyi odaklanıyorum", type: 'scale', category: 'Odak' },
  { id: 5, text: "Kısa molalar verdiğimde zihnim yeniden toparlanıyor", type: 'scale', category: 'Odak' },
  // --- SAKİNLİK (Sakinlik) ---
  { id: 6, text: "Son zamanlarda zihinsel yorgunluk hissediyorum", type: 'scale', category: 'Sakinlik' },
  { id: 7, text: "Gün içinde biraz yavaşlamaya ihtiyaç duyuyorum", type: 'scale', category: 'Sakinlik' },
  { id: 8, text: "Rahatlatıcı kokular beni dengeler", type: 'scale', category: 'Sakinlik' },
  { id: 9, text: "Gün içinde bilinçli olarak mola vermek bana iyi gelebilir", type: 'scale', category: 'Sakinlik' },
  { id: 10, text: "Akşamları zihnimi gevşetmekte zorlanıyorum", type: 'scale', category: 'Sakinlik' },
  // --- ENERJİ (Enerji) ---
  { id: 11, text: "Son günlerde motivasyonum düşük", type: 'scale', category: 'Enerji' },
  { id: 12, text: "Daha enerjik hissetmeye ihtiyaç duyuyorum", type: 'scale', category: 'Enerji' },
  { id: 13, text: "Ferah ve canlı kokular beni canlandırır", type: 'scale', category: 'Enerji' },
  { id: 14, text: "Ortamımı değiştirmek ruh halimi yükseltir", type: 'scale', category: 'Enerji' },
  { id: 15, text: "Küçük estetik detaylar bana enerji verir", type: 'scale', category: 'Enerji' },
  // --- ATMOSFER (Choice) ---
  {
    id: 16,
    text: "Şu an zihninin gökyüzü nasıl görünüyor?",
    type: 'choice',
    options: [
      { text: "Dağınık bulutlar arasında bir ışık arıyorum", scores: { Odak: 3, Sakinlik: 1, Enerji: 1 } },
      { text: "Fırtına sonrası durulmaya ihtiyacı olan bir deniz gibi", scores: { Odak: 1, Sakinlik: 3, Enerji: 1 } },
      { text: "Sabah güneşini bekleyen uykulu bir vadi gibi", scores: { Odak: 1, Sakinlik: 1, Enerji: 3 } }
    ]
  },
  {
    id: 17,
    text: "Ellerin bugün neye dokunmak istiyor?",
    type: 'choice',
    options: [
      { text: "Toprağın serinliğine ve köklenmeye", scores: { Odak: 1, Sakinlik: 3, Enerji: 1 } },
      { text: "İnce bir nakışın sabrına ve detayına", scores: { Odak: 3, Sakinlik: 1, Enerji: 1 } },
      { text: "Rüzgarın hızla savrulan bir kumaşa", scores: { Odak: 1, Sakinlik: 1, Enerji: 3 } }
    ]
  },
  {
    id: 18,
    text: "Ruhun hangi Anadolu motifinde kendini buluyor?",
    type: 'choice',
    options: [
      { text: "Hayat Ağacı: Sabır ve derinlik", scores: { Odak: 3, Sakinlik: 1, Enerji: 1 } },
      { text: "Su Yolu: Akış ve huzur", scores: { Odak: 1, Sakinlik: 3, Enerji: 1 } },
      { text: "Koçboynuzu: Güç ve bereket", scores: { Odak: 1, Sakinlik: 1, Enerji: 3 } }
    ]
  },
  {
    id: 19,
    text: "Günün hangi saati senin için en kıymetli?",
    type: 'choice',
    options: [
      { text: "Şafak vakti", scores: { Odak: 2, Sakinlik: 1, Enerji: 3 } },
      { text: "Öğle zamanı", scores: { Odak: 3, Sakinlik: 1, Enerji: 1 } },
      { text: "Gün batımı", scores: { Odak: 1, Sakinlik: 3, Enerji: 1 } }
    ]
  }
];

interface AssessmentResult {
  primaryType: BoxType;
  secondaryType?: BoxType;
  intensity: Intensity;
  user_feedback: string;
  recommendation: {
    theme: string;
    main_product: string;
    scent_profile: string;
    color_palette: string;
    motif_card: string;
    contents: string[];
  };
  admin_summary: string;
  purchase_invitation: string;
  fields_needed: string[];
}

interface SurveyRecord {
  id: string;
  timestamp: number;
  primaryType: BoxType;
  secondaryType?: BoxType;
  intensity: Intensity;
  motif_card: string;
  scent_profile: string;
}

interface PurchaseRequest extends OrderData {}

// --- Mock Data for Dashboard ---
const MOCK_SURVEYS: SurveyRecord[] = [
  { id: '1', timestamp: Date.now() - 86400000 * 2, primaryType: 'Odak', intensity: 'Dengeli', motif_card: 'Hayat Ağacı', scent_profile: 'Biberiye' },
  { id: '2', timestamp: Date.now() - 86400000 * 1, primaryType: 'Sakinlik', intensity: 'Derin', motif_card: 'Su Yolu', scent_profile: 'Lavanta' },
  { id: '3', timestamp: Date.now() - 43200000, primaryType: 'Enerji', intensity: 'Hafif', motif_card: 'Koçboynuzu', scent_profile: 'Narenciye' },
  { id: '4', timestamp: Date.now() - 3600000, primaryType: 'Odak', intensity: 'Derin', motif_card: 'Hayat Ağacı', scent_profile: 'Sedir' },
  { id: '5', timestamp: Date.now() - 1800000, primaryType: 'Sakinlik', intensity: 'Dengeli', motif_card: 'Su Yolu', scent_profile: 'Adaçayı' },
];

const MOCK_REQUESTS: PurchaseRequest[] = [
  { 
    orderId: 'req1', 
    createdAt: new Date(Date.now() - 86400000).toISOString(), 
    dominantNeed: 'Odak', 
    intensity: 'Dengeli', 
    fullName: 'Ayşe Yılmaz',
    city: 'İstanbul',
    email: 'ayse@email.com',
    phone: '0532 123 45 67',
    address: 'Kadıköy, İstanbul',
    note: 'Hediye paketi olsun lütfen.',
    vBoxTheme: 'Zihinsel Berraklık',
    recommendationSummary: 'Aromatik Odak Taşı ve Biberiye Yağı ile zihinsel berraklık.',
    recommendationRaw: JSON.stringify({
      theme: 'Zihinsel Berraklık',
      main_product: 'Aromatik Odak Taşı',
      contents: ['Odak Taşı', 'Biberiye Yağı', 'Günlük Plan Kartı']
    })
  }
];

// --- Components ---

const IntensitySelector = ({ selected, onSelect }: { selected: Intensity; onSelect: (i: Intensity) => void }) => {
  const intensities: Intensity[] = ['Hafif', 'Dengeli', 'Derin'];
  return (
    <div className="flex gap-4 mt-8">
      {intensities.map((i) => (
        <button
          key={i}
          onClick={() => onSelect(i)}
          className={cn(
            "flex-1 py-3 px-4 rounded-full border transition-all duration-300 text-sm font-medium",
            selected === i 
              ? "bg-ekovia-olive text-white border-ekovia-olive shadow-lg" 
              : "bg-transparent text-ekovia-olive border-stone-300 hover:border-ekovia-sand"
          )}
        >
          {i}
        </button>
      ))}
    </div>
  );
};

export default function App() {
  const [step, setStep] = useState<'intro' | 'test' | 'intensity' | 'loading' | 'result' | 'purchase' | 'dashboard' | 'thank_you'>('intro');
  const [currentPage, setCurrentPage] = useState(0);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [scores, setScores] = useState<{ [key in BoxType]: number }>({ Odak: 0, Sakinlik: 0, Enerji: 0 });
  const [intensity, setIntensity] = useState<Intensity>('Dengeli');
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Admin State
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [adminPin, setAdminPin] = useState('');
  const [pinError, setPinError] = useState(false);
  
  // Dashboard State
  const [surveys, setSurveys] = useState<SurveyRecord[]>(() => {
    const saved = localStorage.getItem('ekovia_surveys');
    return saved ? JSON.parse(saved) : MOCK_SURVEYS;
  });
  const [requests, setRequests] = useState<PurchaseRequest[]>(() => {
    const saved = localStorage.getItem('ekovia_orders_active');
    return saved ? JSON.parse(saved) : MOCK_REQUESTS;
  });
  const [archivedRequests, setArchivedRequests] = useState<PurchaseRequest[]>(() => {
    const saved = localStorage.getItem('ekovia_orders_archive');
    return saved ? JSON.parse(saved) : [];
  });
  const [dashboardTab, setDashboardTab] = useState<'active' | 'archived' | 'analysis'>('active');
  const [archiveSearch, setArchiveSearch] = useState('');
  const [archiveSort, setArchiveSort] = useState<'newest' | 'oldest'>('newest');
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Persistence
  useEffect(() => {
    localStorage.setItem('ekovia_surveys', JSON.stringify(surveys));
  }, [surveys]);

  useEffect(() => {
    localStorage.setItem('ekovia_orders_active', JSON.stringify(requests));
  }, [requests]);

  useEffect(() => {
    localStorage.setItem('ekovia_orders_archive', JSON.stringify(archivedRequests));
  }, [archivedRequests]);

  // Fetch data (Keep for compatibility but prioritize local for demo)
  const refreshData = async () => {
    setIsLoadingData(true);
    try {
      // For demo, we rely on localStorage which is already in state.
      // But we can still try to sync if needed.
      const savedActive = localStorage.getItem('ekovia_orders_active');
      const savedArchive = localStorage.getItem('ekovia_orders_archive');
      if (savedActive) setRequests(JSON.parse(savedActive));
      if (savedArchive) setArchivedRequests(JSON.parse(savedArchive));
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    if (step === 'dashboard') {
      refreshData();
    }
  }, [step]);

  // Scroll to top on step or page change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step, currentPage]);

  const filteredArchivedRequests = useMemo(() => {
    let result = [...archivedRequests];
    
    if (archiveSearch) {
      const search = archiveSearch.toLowerCase();
      result = result.filter(r => 
        r.fullName.toLowerCase().includes(search) || 
        r.city.toLowerCase().includes(search) ||
        r.email.toLowerCase().includes(search)
      );
    }

    result.sort((a, b) => {
      const dateA = new Date(a.archivedAt || 0).getTime();
      const dateB = new Date(b.archivedAt || 0).getTime();
      return archiveSort === 'newest' ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [archivedRequests, archiveSearch, archiveSort]);

  // Admin Command Listener
  useEffect(() => {
    let buffer = "";
    const handleKeyDown = (e: KeyboardEvent) => {
      buffer += e.key.toLowerCase();
      if (buffer.length > 50) buffer = buffer.slice(-50);
      
      if (buffer.includes("admin paneli aç") || buffer.includes("admin dashboard")) {
        setStep('dashboard');
        buffer = "";
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Persist Data
  useEffect(() => {
    localStorage.setItem('ekovia_surveys', JSON.stringify(surveys));
  }, [surveys]);

  useEffect(() => {
    localStorage.setItem('ekovia_requests', JSON.stringify(requests));
  }, [requests]);

  useEffect(() => {
    localStorage.setItem('ekovia_archived_requests', JSON.stringify(archivedRequests));
  }, [archivedRequests]);

  const [selectedRequest, setSelectedRequest] = useState<PurchaseRequest | null>(null);
  const [aiAssistantLoading, setAiAssistantLoading] = useState(false);
  const [aiAssistantSuggestion, setAiAssistantSuggestion] = useState<any>(null);

  // Purchase Form State
  const [purchaseForm, setPurchaseForm] = useState<Record<string, string>>({});

  const handleAnswer = (questionId: number, answerScores: { [key in BoxType]: number }) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answerScores
    }));
  };

  const handleScaleAnswer = (questionId: number, value: number) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const nextPage = () => {
    if (currentPage < 3) {
      setCurrentPage(prev => prev + 1);
    } else {
      // Calculate final scores before moving to intensity
      const finalScores = { Odak: 0, Sakinlik: 0, Enerji: 0 };
      QUESTIONS.forEach(q => {
        const ans = answers[q.id];
        if (ans !== undefined) {
          if (q.type === 'scale') {
            finalScores[q.category!] += ans;
          } else {
            finalScores.Odak += (ans.Odak || 0);
            finalScores.Sakinlik += (ans.Sakinlik || 0);
            finalScores.Enerji += (ans.Enerji || 0);
          }
        }
      });
      setScores(finalScores);
      setStep('intensity');
    }
  };

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
    } else {
      setStep('intro');
    }
  };

  const generateResult = async () => {
    setStep('loading');
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      
      // Determine primary and secondary types
      const sortedTypes = (Object.entries(scores) as [BoxType, number][])
        .sort((a, b) => b[1] - a[1]);
      
      const primaryType = sortedTypes[0][0];
      const secondaryType = sortedTypes[1][1] > sortedTypes[0][1] * 0.7 ? sortedTypes[1][0] : undefined;

      const prompt = `
        You are the AI experience engine of the EKOVIA ViaBox system.
        Your role is to analyze users' sensory and emotional responses and generate a personalized ViaBox experience recommendation.

        1. ANALYSIS MODEL:
        - Focus (Odak): ${scores.Odak}
        - Calm (Sakinlik): ${scores.Sakinlik}
        - Energy (Enerji): ${scores.Enerji}
        Determine which category has the highest score.

        2. EXPERIENCE INTENSITY:
        - Preferred Intensity: ${intensity} (Soft: Yumuşak, Balance: Dengeli, Deep: Derin)
        Adjust the strength of the suggested experience based on this value.

        3. ATMOSPHERIC QUESTIONS:
        Use the user's metaphorical answers to adjust the aesthetic tone, color palette, and atmosphere.

        4. VIA BOX COMPONENTS:
        - Theme: Short poetic theme name.
        - Main Sensory Object: One primary item.
        - Scent Profile: Describe the scent mood.
        - Color Palette: 3-4 colors.
        - Motif Card: One Anatolian motif.
        - Possible Box Contents: List of items.

        STYLE RULES:
        - Tone: Calm, minimal, elegant, sensory oriented.
        - Language: Turkish (Türkçe).
        - Avoid technical language.
        - Format: JSON.

        ADMIN DATA TAG:
        RESULT_TYPE: [Focus/Calm/Energy]
        INTENSITY: [Soft/Balance/Deep]

        JSON Structure:
        {
          "user_feedback": "Duyusal ihtiyaç açıklaması (Experience Note)",
          "recommendation": {
            "theme": "Tema adı",
            "main_product": "Ana duyusal ürün",
            "scent_profile": "Koku profili",
            "color_palette": "Renk paleti",
            "motif_card": "Anadolu motifi",
            "contents": ["item 1", "item 2", "..."]
          },
          "admin_summary": "Üretim özeti (ADMIN DATA TAG included here)",
          "purchase_invitation": "Satın alma davet metni",
          "fields_needed": ["Ad Soyad", "Şehir", "E-mail Adresi", "Telefon Numarası", "Teslimat adresi", "Özel not"]
        }
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              user_feedback: { type: Type.STRING },
              recommendation: {
                type: Type.OBJECT,
                properties: {
                  theme: { type: Type.STRING },
                  main_product: { type: Type.STRING },
                  scent_profile: { type: Type.STRING },
                  color_palette: { type: Type.STRING },
                  motif_card: { type: Type.STRING },
                  contents: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  }
                },
                required: ["theme", "main_product", "scent_profile", "color_palette", "motif_card", "contents"]
              },
              admin_summary: { type: Type.STRING },
              purchase_invitation: { type: Type.STRING },
              fields_needed: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ["user_feedback", "recommendation", "admin_summary", "purchase_invitation", "fields_needed"]
          }
        }
      });

      const data = JSON.parse(response.text || '{}');
      
      const newResult: AssessmentResult = {
        primaryType,
        secondaryType,
        intensity,
        user_feedback: data.user_feedback,
        recommendation: data.recommendation,
        admin_summary: data.admin_summary,
        purchase_invitation: data.purchase_invitation,
        fields_needed: data.fields_needed
      };

      setResult(newResult);
      
      // Save survey record
      const newSurvey: SurveyRecord = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: Date.now(),
        primaryType,
        secondaryType,
        intensity,
        motif_card: data.recommendation.motif_card,
        scent_profile: data.recommendation.scent_profile
      };
      setSurveys(prev => [newSurvey, ...prev]);
      
      // Save to Google Sheets
      apiService.saveSurvey({
        primaryType,
        intensity,
        answers: scores
      });
      
      setStep('result');
    } catch (err) {
      console.error(err);
      setError("Bir şeyler ters gitti. Lütfen tekrar dene.");
      setStep('intensity');
    }
  };

  const handlePurchaseSubmit = async () => {
    if (!result) return;
    
    const email = purchaseForm['email'] || '';
    const name = purchaseForm['name'] || '';
    const city = purchaseForm['city'] || '';
    const address = purchaseForm['address'] || '';
    
    if (!name || !city || !email || !address) {
      setError("Lütfen zorunlu alanları doldurunuz.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Lütfen geçerli bir e-posta adresi giriniz.");
      return;
    }

    setError(null);
    setStep('loading'); // Show loading while saving
    
    const newRequest: PurchaseRequest = {
      orderId: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      fullName: name,
      city: city,
      email: email,
      phone: purchaseForm['phone'] || '',
      address: address,
      note: purchaseForm['note'] || '',
      vBoxTheme: result.recommendation.theme,
      dominantNeed: result.primaryType,
      intensity: result.intensity,
      recommendationSummary: result.admin_summary,
      recommendationRaw: JSON.stringify(result.recommendation)
    };
    
    // Save to localStorage (Primary for demo)
    setRequests(prev => [newRequest, ...prev]);
    
    // Optional: Sync to Sheets
    apiService.createOrder(newRequest).catch(console.error);
    
    setStep('thank_you');
  };

  const getAssistantSuggestion = async (request: PurchaseRequest) => {
    setAiAssistantLoading(true);
    setAiAssistantSuggestion(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const prompt = `
        Sen EKOVIA ViaBox üretim asistanısın. Bir yönetici şu an bir kutu hazırlıyor.
        Kullanıcı Bilgileri:
        Sonuç: ${request.dominantNeed}
        Yoğunluk: ${request.intensity}
        Tema: ${request.vBoxTheme}
        Not: ${request.note}

        GÖREV: Yöneticiye kutuyu hızlıca hazırlaması için en ideal önerileri sun.
        Yanıtı JSON formatında ver:
        {
          "theme": "Önerilen Tema",
          "main_product": "Ana Ürün",
          "scent_profile": "Koku Profili",
          "color_palette": "Renk Paleti",
          "contents": ["Ürün 1", "Ürün 2", "Ürün 3"]
        }
      `;
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });
      setAiAssistantSuggestion(JSON.parse(response.text || '{}'));
    } catch (err) {
      console.error(err);
    } finally {
      setAiAssistantLoading(false);
    }
  };

  const reset = () => {
    setStep('intro');
    setCurrentPage(0);
    setAnswers({});
    setScores({ Odak: 0, Sakinlik: 0, Enerji: 0 });
    setIntensity('Dengeli');
    setResult(null);
    setPurchaseForm({});
  };

  const downloadCSV = (data: PurchaseRequest[], type: 'active' | 'archive') => {
    if (data.length === 0) {
      alert("İndirilecek kayıt bulunamadı.");
      return;
    }

    const headers = [
      "orderId", "createdAt", "fullName", "city", "email", "phone", 
      "address", "note", "vBoxTheme", "dominantNeed", "intensity", 
      "recommendationSummary", "archivedAt"
    ];

    const csvRows = data.map(row => {
      return headers.map(header => {
        const val = (row as any)[header] || "";
        const escaped = String(val).replace(/"/g, '""');
        return `"${escaped}"`;
      }).join(",");
    });

    const csvContent = [headers.join(","), ...csvRows].join("\n");
    
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    const date = new Date().toISOString().split('T')[0];
    link.setAttribute("href", url);
    link.setAttribute("download", `ekovia_orders_${type}_${date}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAdminLogin = () => {
    if (adminPin === '1234') {
      setStep('dashboard');
      setIsAdminModalOpen(false);
      setAdminPin('');
      setPinError(false);
    } else {
      setPinError(true);
      setAdminPin('');
    }
  };

  return (
    <div className="min-h-screen bg-ekovia-bg text-ekovia-green selection:bg-ekovia-gold/20">
      {/* Navigation / Header */}
      <header className={cn(
        "flex justify-between items-center border-b border-stone-100 bg-white/50 backdrop-blur-sm sticky top-0 z-50",
        step === 'intro' ? "p-3" : "p-4"
      )}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-ekovia-green rounded-full flex items-center justify-center">
            <Compass className="text-ekovia-bg w-5 h-5" />
          </div>
          <span className="text-sm font-bold tracking-widest uppercase text-ekovia-green">EKOVIA DUYUSAL KEŞİF</span>
        </div>
        <div className="flex items-center gap-4">
          {step === 'test' && (
            <div className="text-[10px] uppercase tracking-widest opacity-50 font-bold">
              Bölüm {currentPage + 1} / 4
            </div>
          )}
          <button 
            onClick={() => setIsAdminModalOpen(true)}
            className="p-2 text-stone-400 hover:text-ekovia-green transition-colors"
            title="Yönetici Girişi"
          >
            <LayoutDashboard className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Admin Login Modal */}
      <AnimatePresence>
        {isAdminModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white p-10 rounded-[40px] shadow-2xl max-w-sm w-full space-y-8"
            >
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-light text-ekovia-green">Yönetici Girişi</h3>
                <p className="text-stone-400 text-xs uppercase tracking-widest">Lütfen PIN kodunu giriniz</p>
              </div>
              
              <div className="space-y-4">
                <input 
                  type="password" 
                  value={adminPin}
                  onChange={(e) => setAdminPin(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAdminLogin()}
                  placeholder="PIN"
                  className={cn(
                    "w-full px-6 py-4 rounded-2xl border bg-stone-50 text-center text-2xl tracking-[1em] focus:ring-0 transition-all",
                    pinError ? "border-red-300 animate-shake" : "border-stone-100 focus:border-ekovia-gold"
                  )}
                  autoFocus
                />
                {pinError && <p className="text-red-500 text-[10px] text-center font-bold uppercase tracking-widest">Hatalı PIN kodu</p>}
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => {
                    setIsAdminModalOpen(false);
                    setAdminPin('');
                    setPinError(false);
                  }}
                  className="flex-1 py-4 rounded-2xl font-bold text-[10px] uppercase tracking-widest text-stone-400 hover:bg-stone-50 transition-colors"
                >
                  İptal
                </button>
                <button 
                  onClick={handleAdminLogin}
                  className="flex-1 py-4 bg-ekovia-green text-ekovia-bg rounded-2xl font-bold text-[10px] uppercase tracking-widest hover:bg-black transition-colors"
                >
                  Giriş Yap
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className={cn(
        "mx-auto px-6",
        step === 'dashboard' ? "max-w-7xl py-8 md:py-12" : 
        step === 'intro' ? "max-w-5xl py-12 md:py-24" : 
        step === 'test' ? "max-w-4xl py-8 md:py-12" : 
        step === 'result' ? "max-w-6xl py-12 md:py-20" : "max-w-xl py-8 md:py-12"
      )}>
        <AnimatePresence mode="wait">
          {step === 'dashboard' && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-12 pb-24"
            >
              {/* Dashboard Header */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-1">
                  <h1 className="text-4xl font-light text-ekovia-green">EKOVIA YÖNETİCİ PANELİ</h1>
                  <p className="text-stone-400 text-sm tracking-widest uppercase">Duyusal Veri & Talep Yönetimi</p>
                </div>
                <button 
                  onClick={reset}
                  className="flex items-center gap-2 text-stone-400 hover:text-ekovia-green transition-colors font-bold text-xs uppercase tracking-widest"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Uygulamaya Dön
                </button>
              </div>

              {/* Tab Navigation */}
              <div className="flex border-b border-stone-100">
                {[
                  { id: 'active', label: 'Aktif Siparişler', icon: Package },
                  { id: 'archived', label: 'Arşivlenmiş Siparişler', icon: CheckCircle2 },
                  { id: 'analysis', label: 'Anket Analizi', icon: BarChart3 },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setDashboardTab(tab.id as any)}
                    className={cn(
                      "flex items-center gap-2 px-8 py-4 text-xs font-bold uppercase tracking-widest transition-all relative",
                      dashboardTab === tab.id 
                        ? "text-ekovia-green" 
                        : "text-stone-400 hover:text-stone-600"
                    )}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                    {dashboardTab === tab.id && (
                      <motion.div 
                        layoutId="activeTab"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-ekovia-gold"
                      />
                    )}
                  </button>
                ))}
              </div>

              {dashboardTab === 'analysis' && (
                <div className="space-y-12">
                  {/* 1️⃣ GENEL İSTATİSTİKLER */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-ekovia-gold/10 rounded-full flex items-center justify-center text-ekovia-gold font-bold text-sm">1</div>
                      <h2 className="text-xl font-light text-ekovia-green">GENEL İSTATİSTİKLER</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <div className="bg-white p-8 rounded-[32px] shadow-sm border border-stone-100 space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase tracking-widest text-stone-400 font-bold">Toplam Anket</span>
                          <Users className="w-5 h-5 text-ekovia-gold" />
                        </div>
                        <p className="text-4xl font-light text-ekovia-green">{surveys.length}</p>
                      </div>
                      {(['Odak', 'Sakinlik', 'Enerji'] as BoxType[]).map(type => (
                        <div key={type} className="bg-white p-8 rounded-[32px] shadow-sm border border-stone-100 space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] uppercase tracking-widest text-stone-400 font-bold">{type} Sonucu</span>
                            {type === 'Odak' && <Coffee className="w-5 h-5 text-ekovia-gold" />}
                            {type === 'Sakinlik' && <Wind className="w-5 h-5 text-ekovia-gold" />}
                            {type === 'Enerji' && <Zap className="w-5 h-5 text-ekovia-gold" />}
                          </div>
                          <p className="text-4xl font-light text-ekovia-green">
                            {surveys.filter(s => s.primaryType === type).length}
                          </p>
                        </div>
                      ))}
                    </div>
                    <div className="bg-white p-10 rounded-[40px] shadow-sm border border-stone-100">
                      <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={[
                            { name: 'Odak', count: surveys.filter(s => s.primaryType === 'Odak').length },
                            { name: 'Sakinlik', count: surveys.filter(s => s.primaryType === 'Sakinlik').length },
                            { name: 'Enerji', count: surveys.filter(s => s.primaryType === 'Enerji').length },
                          ]}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                            <Tooltip cursor={{ fill: '#f9f8f6' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                            <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                              { [0,1,2].map((_, index) => (
                                <Cell key={index} fill={['#C5A059', '#4A5D4E', '#141414'][index % 3]} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  {/* 2️⃣ YOĞUNLUK ANALİZİ */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-ekovia-gold/10 rounded-full flex items-center justify-center text-ekovia-gold font-bold text-sm">2</div>
                      <h2 className="text-xl font-light text-ekovia-green">YOĞUNLUK ANALİZİ</h2>
                    </div>
                    <div className="bg-white p-10 rounded-[40px] shadow-sm border border-stone-100">
                      <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={[
                                { name: 'Soft', value: surveys.filter(s => s.intensity === 'Hafif').length },
                                { name: 'Balance', value: surveys.filter(s => s.intensity === 'Dengeli').length },
                                { name: 'Deep', value: surveys.filter(s => s.intensity === 'Derin').length },
                              ]}
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              <Cell fill="#E5E7EB" />
                              <Cell fill="#C5A059" />
                              <Cell fill="#4A5D4E" />
                            </Pie>
                            <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="flex justify-center gap-8 text-[10px] uppercase tracking-widest font-bold text-stone-400">
                          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-stone-200" /> Soft</div>
                          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-ekovia-gold" /> Balance</div>
                          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-ekovia-green" /> Deep</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Product Development Analysis */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-stone-50 p-8 rounded-[32px] border border-stone-100 space-y-4">
                    <span className="text-[10px] uppercase tracking-widest text-stone-400 font-bold">En Çok Seçilen Motif</span>
                    <p className="text-xl font-light text-ekovia-green">Hayat Ağacı</p>
                  </div>
                  <div className="bg-stone-50 p-8 rounded-[32px] border border-stone-100 space-y-4">
                    <span className="text-[10px] uppercase tracking-widest text-stone-400 font-bold">En Çok Seçilen Koku</span>
                    <p className="text-xl font-light text-ekovia-green">Biberiye & Sedir</p>
                  </div>
                  <div className="bg-stone-50 p-8 rounded-[32px] border border-stone-100 space-y-4">
                    <span className="text-[10px] uppercase tracking-widest text-stone-400 font-bold">En Çok Tercih Edilen Yoğunluk</span>
                    <p className="text-xl font-light text-ekovia-green">Dengeli</p>
                  </div>
                </div>
              </div>
            )}

            {dashboardTab === 'active' && (
                <div className="space-y-12">
                  {/* 3️⃣ VIA BOX TALEPLERİ */}
                  <div className="space-y-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-ekovia-gold/10 rounded-full flex items-center justify-center text-ekovia-gold font-bold text-sm">3</div>
                        <h2 className="text-xl font-light text-ekovia-green uppercase tracking-wide">AKTİF TALEPLER</h2>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => downloadCSV(requests, 'active')}
                          className="flex items-center gap-2 px-4 py-2 bg-white border border-stone-100 rounded-xl text-[10px] font-bold uppercase tracking-widest text-stone-500 hover:text-ekovia-gold hover:border-ekovia-gold transition-all"
                        >
                          <Download className="w-3 h-3" />
                          CSV İndir
                        </button>
                        <button 
                          onClick={() => downloadCSV(requests, 'active')}
                          className="flex items-center gap-2 px-4 py-2 bg-white border border-stone-100 rounded-xl text-[10px] font-bold uppercase tracking-widest text-stone-500 hover:text-ekovia-gold hover:border-ekovia-gold transition-all"
                        >
                          <FileSpreadsheet className="w-3 h-3" />
                          Excel İndir
                        </button>
                      </div>
                    </div>
                    <div className="bg-white rounded-[40px] shadow-sm border border-stone-100 overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                          <thead>
                            <tr className="bg-stone-50/50 text-stone-400 uppercase tracking-widest text-[10px] font-bold">
                              <th className="px-10 py-6">Ad Soyad</th>
                              <th className="px-6 py-6">Şehir</th>
                              <th className="px-6 py-6">E-mail</th>
                              <th className="px-6 py-6">Telefon</th>
                              <th className="px-6 py-6">Sonuç</th>
                              <th className="px-6 py-6">Yoğunluk</th>
                              <th className="px-6 py-6">Önerilen Tema</th>
                              <th className="px-10 py-6">İşlem</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-stone-50">
                            {isLoadingData ? (
                              <tr>
                                <td colSpan={8} className="px-10 py-12 text-center text-stone-400 italic">Veriler yükleniyor...</td>
                              </tr>
                            ) : requests.length === 0 ? (
                              <tr>
                                <td colSpan={8} className="px-10 py-12 text-center text-stone-400 italic">Aktif sipariş bulunmuyor.</td>
                              </tr>
                            ) : requests.map(req => (
                              <tr key={req.orderId} className="hover:bg-stone-50/30 transition-colors group">
                                <td className="px-10 py-6">
                                  <div className="font-medium text-ekovia-green">{req.fullName}</div>
                                  <div className="text-[10px] text-stone-400 uppercase tracking-tighter">{new Date(req.createdAt).toLocaleDateString('tr-TR')}</div>
                                </td>
                                <td className="px-6 py-6 text-stone-500">{req.city}</td>
                                <td className="px-6 py-6 text-stone-500">{req.email}</td>
                                <td className="px-6 py-6 text-stone-500">{req.phone || '-'}</td>
                                <td className="px-6 py-6">
                                  <span className="px-3 py-1 bg-stone-100 rounded-full text-[10px] font-bold text-stone-500 uppercase tracking-widest">
                                    {req.dominantNeed}
                                  </span>
                                </td>
                                <td className="px-6 py-6">
                                  <span className="px-3 py-1 bg-ekovia-gold/10 rounded-full text-[10px] font-bold text-ekovia-gold uppercase tracking-widest">
                                    {req.intensity}
                                  </span>
                                </td>
                                <td className="px-6 py-6 text-stone-500 italic">{req.vBoxTheme}</td>
                                <td className="px-10 py-6">
                                  <button 
                                    onClick={() => {
                                      setSelectedRequest(req);
                                      getAssistantSuggestion(req);
                                      setTimeout(() => {
                                        document.getElementById('admin-detail-section')?.scrollIntoView({ behavior: 'smooth' });
                                      }, 100);
                                    }}
                                    className="px-4 py-2 bg-stone-900 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-ekovia-gold transition-all"
                                  >
                                    Detay & Hazırla
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* 4️⃣ & 5️⃣ KULLANICI DETAYI & KUTU HAZIRLAMA ÖNERİSİ */}
                  <AnimatePresence>
                    {selectedRequest && (
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="space-y-8"
                        id="admin-detail-section"
                      >
                        <div className="bg-white p-10 md:p-14 rounded-[50px] shadow-xl border border-stone-100 space-y-12 relative overflow-hidden">
                          <div className="flex justify-between items-start">
                            <div className="space-y-2">
                              <h3 className="text-3xl font-light text-ekovia-green">Sipariş Hazırlama Paneli</h3>
                              <p className="text-stone-400 text-xs uppercase tracking-widest">Müşteri: {selectedRequest.fullName}</p>
                            </div>
                            <button 
                              onClick={() => setSelectedRequest(null)}
                              className="p-3 bg-stone-50 hover:bg-stone-100 text-stone-400 hover:text-ekovia-green rounded-full transition-all"
                            >
                              <RefreshCw className="w-5 h-5" />
                            </button>
                          </div>

                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                            {/* 4️⃣ KULLANICI DETAYI */}
                            <div className="space-y-8">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-ekovia-gold/10 rounded-full flex items-center justify-center text-ekovia-gold font-bold text-sm">4</div>
                                <h4 className="text-lg font-light text-ekovia-green uppercase tracking-wide">KULLANICI DETAYI</h4>
                              </div>
                              
                              <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="bg-stone-50 p-5 rounded-3xl border border-stone-100">
                                    <p className="text-[10px] text-stone-400 uppercase tracking-widest font-bold mb-1">Duyusal Sonuç</p>
                                    <p className="text-lg font-light text-ekovia-green">{selectedRequest.dominantNeed}</p>
                                  </div>
                                  <div className="bg-stone-50 p-5 rounded-3xl border border-stone-100">
                                    <p className="text-[10px] text-stone-400 uppercase tracking-widest font-bold mb-1">Yoğunluk Tercihi</p>
                                    <p className="text-lg font-light text-ekovia-green">{selectedRequest.intensity}</p>
                                  </div>
                                </div>

                                <div className="bg-stone-50 p-6 rounded-3xl border border-stone-100 space-y-4">
                                  <p className="text-[10px] text-stone-400 uppercase tracking-widest font-bold">AI Tarafından Önerilen ViaBox İçeriği</p>
                                  <div className="space-y-3">
                                    <p className="text-sm font-medium text-ekovia-green italic">"{selectedRequest.vBoxTheme}"</p>
                                    <ul className="grid grid-cols-1 gap-2">
                                      {JSON.parse(selectedRequest.recommendationRaw).contents?.map((c: string, i: number) => (
                                        <li key={i} className="text-xs text-stone-500 flex items-center gap-2">
                                          <div className="w-1 h-1 rounded-full bg-ekovia-gold" />
                                          {c}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                </div>

                                <div className="space-y-4 px-2">
                                  <div className="space-y-1">
                                    <p className="text-[10px] text-stone-400 uppercase tracking-widest font-bold">İletişim Bilgileri</p>
                                    <p className="text-sm text-stone-600">E-mail: {selectedRequest.email}</p>
                                    <p className="text-sm text-stone-600">Telefon: {selectedRequest.phone || 'Girilmedi'}</p>
                                    <p className="text-sm text-stone-600">Şehir: {selectedRequest.city}</p>
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-[10px] text-stone-400 uppercase tracking-widest font-bold">Teslimat Adresi</p>
                                    <p className="text-sm text-stone-600 leading-relaxed">{selectedRequest.address}</p>
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-[10px] text-stone-400 uppercase tracking-widest font-bold">Özel Not</p>
                                    <p className="text-sm text-stone-500 italic leading-relaxed">"{selectedRequest.note || 'Özel not bulunmuyor.'}"</p>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* 5️⃣ KUTU HAZIRLAMA ÖNERİSİ */}
                            <div className="space-y-8">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-ekovia-gold/10 rounded-full flex items-center justify-center text-ekovia-gold font-bold text-sm">5</div>
                                <h4 className="text-lg font-light text-ekovia-green uppercase tracking-wide">KUTU HAZIRLAMA ÖNERİSİ</h4>
                              </div>

                              <div className="bg-ekovia-green text-ekovia-bg p-8 rounded-[40px] shadow-xl space-y-8 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-6 opacity-5">
                                  <Sparkles className="w-24 h-24" />
                                </div>
                                
                                {aiAssistantLoading ? (
                                  <div className="flex flex-col items-center justify-center py-12 space-y-4">
                                    <RefreshCw className="w-8 h-8 animate-spin text-ekovia-gold" />
                                    <p className="text-[10px] uppercase tracking-widest text-ekovia-bg/50">AI Üretim Önerileri Hazırlanıyor...</p>
                                  </div>
                                ) : aiAssistantSuggestion ? (
                                  <div className="space-y-6 relative z-10">
                                    <div className="grid grid-cols-2 gap-6">
                                      <div className="space-y-1">
                                        <p className="text-[10px] text-ekovia-bg/40 uppercase tracking-widest font-bold">Önerilen Tema</p>
                                        <p className="text-sm font-medium">{aiAssistantSuggestion.theme}</p>
                                      </div>
                                      <div className="space-y-1">
                                        <p className="text-[10px] text-ekovia-bg/40 uppercase tracking-widest font-bold">Ana Ürün</p>
                                        <p className="text-sm font-medium">{aiAssistantSuggestion.main_product}</p>
                                      </div>
                                      <div className="space-y-1">
                                        <p className="text-[10px] text-ekovia-bg/40 uppercase tracking-widest font-bold">Koku Profili</p>
                                        <p className="text-sm font-medium">{aiAssistantSuggestion.scent_profile}</p>
                                      </div>
                                      <div className="space-y-1">
                                        <p className="text-[10px] text-ekovia-bg/40 uppercase tracking-widest font-bold">Renk Paleti</p>
                                        <p className="text-sm font-medium">{aiAssistantSuggestion.color_palette}</p>
                                      </div>
                                    </div>
                                    <div className="pt-6 border-t border-white/10">
                                      <p className="text-[10px] text-ekovia-bg/40 uppercase tracking-widest font-bold mb-4">Kutuda Bulunabilecek Ürünler</p>
                                      <ul className="space-y-3">
                                        {aiAssistantSuggestion.contents.map((item: string, i: number) => (
                                          <li key={i} className="text-xs text-ekovia-bg/80 flex items-center gap-3">
                                            <div className="w-1.5 h-1.5 rounded-full bg-ekovia-gold shadow-[0_0_8px_rgba(197,160,89,0.5)]" />
                                            {item}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                    
                                    <div className="pt-6">
                                      <button 
                                        onClick={async () => {
                                          const orderToArchive = requests.find(r => r.orderId === selectedRequest.orderId);
                                          if (orderToArchive) {
                                            const archivedOrder = {
                                              ...orderToArchive,
                                              archivedAt: new Date().toISOString()
                                            };
                                            setArchivedRequests(prev => [archivedOrder, ...prev]);
                                            setRequests(prev => prev.filter(r => r.orderId !== selectedRequest.orderId));
                                            
                                            // Sync to Sheets
                                            apiService.archiveOrder(selectedRequest.orderId).catch(console.error);
                                            
                                            setSelectedRequest(null);
                                            alert('Sipariş tamamlandı ve arşivlendi.');
                                          }
                                        }}
                                        className="w-full bg-ekovia-gold text-ekovia-green py-4 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-white transition-all shadow-lg"
                                      >
                                        Siparişi Tamamla & Arşivle
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-center py-12 text-ekovia-bg/30 text-xs">Öneri alınamadı.</div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {dashboardTab === 'archived' && (
                <div className="space-y-8">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-ekovia-gold/10 rounded-full flex items-center justify-center text-ekovia-gold font-bold text-sm">A</div>
                      <h2 className="text-xl font-light text-ekovia-green uppercase tracking-wide">ARŞİVLENMİŞ SİPARİŞLER</h2>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => downloadCSV(filteredArchivedRequests, 'archive')}
                          className="flex items-center gap-2 px-4 py-2 bg-white border border-stone-100 rounded-xl text-[10px] font-bold uppercase tracking-widest text-stone-500 hover:text-ekovia-gold hover:border-ekovia-gold transition-all"
                        >
                          <Download className="w-3 h-3" />
                          CSV İndir
                        </button>
                        <button 
                          onClick={() => downloadCSV(filteredArchivedRequests, 'archive')}
                          className="flex items-center gap-2 px-4 py-2 bg-white border border-stone-100 rounded-xl text-[10px] font-bold uppercase tracking-widest text-stone-500 hover:text-ekovia-gold hover:border-ekovia-gold transition-all"
                        >
                          <FileSpreadsheet className="w-3 h-3" />
                          Excel İndir
                        </button>
                      </div>

                      <div className="relative flex-1 md:flex-none">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                        <input 
                          type="text"
                          placeholder="İsim, Şehir veya E-mail..."
                          value={archiveSearch}
                          onChange={(e) => setArchiveSearch(e.target.value)}
                          className="pl-11 pr-4 py-2 rounded-xl border border-stone-100 bg-white text-xs focus:border-ekovia-gold focus:ring-0 transition-all w-full"
                        />
                      </div>
                      <select 
                        value={archiveSort}
                        onChange={(e) => setArchiveSort(e.target.value as any)}
                        className="px-4 py-2 rounded-xl border border-stone-100 bg-white text-xs focus:border-ekovia-gold focus:ring-0 transition-all outline-none"
                      >
                        <option value="newest">En Yeni Arşiv</option>
                        <option value="oldest">En Eski Arşiv</option>
                      </select>
                    </div>
                  </div>

                  <div className="bg-white rounded-[40px] shadow-sm border border-stone-100 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="bg-stone-50/50 text-stone-400 uppercase tracking-widest text-[10px] font-bold">
                            <th className="px-10 py-6">Ad Soyad</th>
                            <th className="px-6 py-6">Şehir</th>
                            <th className="px-6 py-6">İletişim</th>
                            <th className="px-6 py-6">Tema</th>
                            <th className="px-6 py-6">Sipariş Tarihi</th>
                            <th className="px-6 py-6">Arşiv Tarihi</th>
                            <th className="px-10 py-6">Detay</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-50">
                          {isLoadingData ? (
                            <tr>
                              <td colSpan={7} className="px-10 py-12 text-center text-stone-400 italic">Veriler yükleniyor...</td>
                            </tr>
                          ) : filteredArchivedRequests.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="px-10 py-12 text-center text-stone-400 italic">Arşivlenmiş sipariş bulunmuyor.</td>
                            </tr>
                          ) : filteredArchivedRequests.map(req => (
                            <tr key={req.orderId} className="hover:bg-stone-50/30 transition-colors group">
                              <td className="px-10 py-6">
                                <div className="font-medium text-ekovia-green">{req.fullName}</div>
                                <div className="text-[10px] text-stone-400 uppercase tracking-tighter">{req.dominantNeed} - {req.intensity}</div>
                              </td>
                              <td className="px-6 py-6 text-stone-500">{req.city}</td>
                              <td className="px-6 py-6">
                                <div className="text-xs text-stone-600">{req.email}</div>
                                <div className="text-[10px] text-stone-400">{req.phone || '-'}</div>
                              </td>
                              <td className="px-6 py-6 text-stone-500 italic">{req.vBoxTheme}</td>
                              <td className="px-6 py-6 text-stone-400 text-xs">
                                {new Date(req.createdAt).toLocaleDateString('tr-TR')}
                              </td>
                              <td className="px-6 py-6 text-ekovia-gold text-xs font-medium">
                                {req.archivedAt ? new Date(req.archivedAt).toLocaleDateString('tr-TR') : '-'}
                              </td>
                              <td className="px-10 py-6">
                                <button 
                                  onClick={() => {
                                    alert(`Adres: ${req.address}\nNot: ${req.note || '-'}`);
                                  }}
                                  className="p-2 bg-stone-50 rounded-lg text-stone-400 hover:text-ekovia-gold transition-colors"
                                >
                                  <Info className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {step === 'intro' && (
            <motion.div 
              key="intro"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] text-center p-4"
            >
              <div className="bg-[#F5F2ED] p-8 md:p-16 rounded-[40px] shadow-sm border border-stone-200 max-w-3xl w-full space-y-6">
                <div className="flex justify-center">
                  <div className="w-12 h-12 bg-ekovia-gold/10 rounded-full flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-ekovia-gold" />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h1 className="text-2xl md:text-3xl font-serif font-medium tracking-[0.2em] text-ekovia-green uppercase">
                    EKOVIA VIABOX
                  </h1>
                  
                  <div className="space-y-4 text-sm md:text-base text-stone-700 leading-relaxed max-w-xl mx-auto">
                    <p className="font-normal">
                      Anadolu'nun kadim bilgeliği ve modern duyusal bilimlerin buluştuğu noktada, size özel bir deneyim tasarlıyoruz.
                    </p>
                    <p className="font-normal">
                      EKOVIA ViaBox, zihninizin ve duyularınızın o anki ihtiyacına göre şekillenen, el yapımı objelerle dolu kişiselleştirilmiş bir keşif kutusudur.
                    </p>
                  </div>
                </div>

                <div className="pt-4">
                  <button 
                    onClick={() => setStep('test')}
                    className="group relative inline-flex items-center gap-4 bg-ekovia-olive text-white px-10 py-4 rounded-full overflow-hidden transition-all hover:shadow-xl hover:scale-105"
                  >
                    <span className="font-bold tracking-[0.2em] uppercase text-[10px]">Duyusal Keşfe Başla</span>
                    <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </button>
                </div>
              </div>
              
              <div className="mt-8 flex justify-center gap-8 opacity-20">
                <Wind className="w-5 h-5" />
                <Zap className="w-5 h-5" />
                <Coffee className="w-5 h-5" />
              </div>
            </motion.div>
          )}

          {step === 'test' && (
            <motion.div 
              key="test"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-10"
            >
              {/* Progress Header */}
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-ekovia-gold">Bölüm {currentPage + 1} / 4</span>
                    <h2 className="text-2xl font-normal text-ekovia-green">{SECTIONS[currentPage].title}</h2>
                  </div>
                  <span className="text-[10px] text-stone-400 font-medium uppercase tracking-widest">
                    {currentPage === 3 ? 'Sembolik Seçimler' : 'Duyusal Ölçek'}
                  </span>
                </div>
                <div className="w-full h-[2px] bg-stone-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${((currentPage + 1) / 4) * 100}%` }}
                    className="h-full bg-ekovia-gold/40"
                  />
                </div>
                <p className="text-xs text-stone-500 italic">{SECTIONS[currentPage].description}</p>
              </div>

              <div className="space-y-12">
                {QUESTIONS.filter(q => {
                  if (currentPage < 3) return q.category === SECTIONS[currentPage].id;
                  return q.type === 'choice';
                }).map((question, qIdx) => (
                  <div key={question.id} className="bg-white p-8 md:p-12 rounded-[18px] shadow-sm border border-stone-100 space-y-10">
                    <div className="text-center space-y-2">
                      <span className="text-[10px] text-stone-300 font-serif italic uppercase tracking-widest">Soru 0{qIdx + 1}</span>
                      <h3 className="text-base md:text-lg font-normal leading-relaxed text-ekovia-green max-w-2xl mx-auto">
                        {question.text}
                      </h3>
                    </div>
                    
                    {question.type === 'scale' ? (
                      <div className="space-y-8">
                        <div className="flex justify-between items-center max-w-2xl mx-auto px-4">
                          {[1, 2, 3, 4, 5].map((val) => {
                            const isSelected = answers[question.id] === val;
                            return (
                              <button
                                key={val}
                                onClick={() => handleScaleAnswer(question.id, val)}
                                className={cn(
                                  "w-12 h-12 rounded-full border transition-all duration-300 flex items-center justify-center text-sm font-medium",
                                  isSelected 
                                    ? "bg-ekovia-olive text-white border-ekovia-olive shadow-md" 
                                    : "bg-transparent text-stone-400 border-ekovia-sand hover:border-ekovia-olive/30"
                                )}
                              >
                                {val}
                              </button>
                            );
                          })}
                        </div>
                        <div className="flex justify-between text-[10px] uppercase tracking-[0.2em] text-stone-400 font-medium max-w-2xl mx-auto px-4">
                          <span>Hiç katılmıyorum</span>
                          <span>Kesinlikle katılıyorum</span>
                        </div>
                      </div>
                    ) : (
                      <div className="grid gap-4 pt-4">
                        {question.options?.map((option, idx) => {
                          const isSelected = JSON.stringify(answers[question.id]) === JSON.stringify(option.scores);
                          return (
                            <button
                              key={idx}
                              onClick={() => handleAnswer(question.id, option.scores)}
                              className={cn(
                                "w-full text-left p-6 rounded-[18px] border transition-all duration-500 group flex items-center justify-between relative overflow-hidden",
                                isSelected
                                  ? "bg-ekovia-olive text-white border-ekovia-olive shadow-md"
                                  : "bg-stone-50/50 border-stone-100 hover:border-ekovia-olive/20"
                              )}
                            >
                              <div className="flex items-center gap-6 relative z-10">
                                <div className={cn(
                                  "w-2 h-2 rounded-full transition-all duration-700",
                                  isSelected ? "bg-white scale-125" : "bg-stone-300 group-hover:bg-ekovia-olive/30"
                                )} />
                                <span className={cn(
                                  "text-[15px] font-normal leading-relaxed transition-colors duration-500",
                                  isSelected ? "text-white font-medium" : "text-stone-500 group-hover:text-ekovia-olive"
                                )}>{option.text}</span>
                              </div>
                              
                              {isSelected && (
                                <motion.div 
                                  layoutId={`choice-check-${question.id}`}
                                  initial={{ opacity: 0, x: 10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                >
                                  <Sparkles className="w-4 h-4 text-white/40" />
                                </motion.div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="pt-12 flex items-center justify-between gap-4">
                <button 
                  onClick={prevPage}
                  className="px-8 py-4 rounded-full border border-stone-200 text-stone-400 text-[10px] font-bold uppercase tracking-widest hover:bg-stone-50 transition-all"
                >
                  Geri
                </button>
                
                <button 
                  disabled={(() => {
                    const pageQuestions = QUESTIONS.filter(q => {
                      if (currentPage < 3) return q.category === SECTIONS[currentPage].id;
                      return q.type === 'choice';
                    });
                    return !pageQuestions.every(q => answers[q.id] !== undefined);
                  })()}
                  onClick={nextPage}
                  className={cn(
                    "flex-1 bg-ekovia-olive text-white px-10 py-5 rounded-full font-bold tracking-widest uppercase text-[10px] transition-all flex items-center justify-center gap-3",
                    (() => {
                      const pageQuestions = QUESTIONS.filter(q => {
                        if (currentPage < 3) return q.category === SECTIONS[currentPage].id;
                        return q.type === 'choice';
                      });
                      return !pageQuestions.every(q => answers[q.id] !== undefined);
                    })() ? "opacity-30 cursor-not-allowed grayscale" : "hover:bg-black hover:shadow-xl hover:scale-[1.02]"
                  )}
                >
                  {currentPage === 3 ? 'Analizi Tamamla' : 'Devam Et'}
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 'intensity' && (
            <motion.div 
              key="intensity"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              className="text-center space-y-10"
            >
              <div className="space-y-4">
                <div className="flex justify-center">
                  <div className="p-3 rounded-full bg-ekovia-gold/10">
                    <Info className="w-6 h-6 text-ekovia-gold" />
                  </div>
                </div>
                <h2 className="text-2xl md:text-3xl font-normal text-ekovia-green">Deneyim Yoğunluğu</h2>
                <p className="text-sm text-stone-500">Bu kez ViaBox'ta hangi yoğunluk sana daha iyi gelir?</p>
              </div>
              
              <IntensitySelector selected={intensity} onSelect={setIntensity} />

              <div className="pt-6">
                <button 
                  onClick={generateResult}
                  className="bg-ekovia-olive text-white px-12 py-4 rounded-full font-bold tracking-widest uppercase text-xs shadow-lg hover:bg-black transition-all hover:scale-105"
                >
                  Sonucu Gör
                </button>
              </div>
              {error && <p className="text-red-500 text-xs">{error}</p>}
            </motion.div>
          )}

          {step === 'loading' && (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-24 space-y-10"
            >
              <div className="relative">
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="w-32 h-32 border-t-2 border-ekovia-gold rounded-full"
                />
                <Compass className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 text-ekovia-gold opacity-50" />
              </div>
              <div className="text-center space-y-3">
                <h3 className="text-2xl font-normal italic text-ekovia-green">Toprak Mührü okunuyor...</h3>
                <p className="text-stone-400 text-sm animate-pulse tracking-widest uppercase">Duyularınızın haritası çıkarılıyor.</p>
              </div>
            </motion.div>
          )}

          {step === 'purchase' && result && (
            <motion.div 
              key="purchase"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-12"
            >
              <div className="text-center space-y-6">
                <div className="flex justify-center">
                  <div className="p-4 rounded-full bg-ekovia-gold/10">
                    <Heart className="w-8 h-8 text-ekovia-gold" />
                  </div>
                </div>
                <h2 className="text-3xl md:text-4xl font-normal text-ekovia-green">ViaBox Sipariş</h2>
                <div className="prose prose-stone max-w-none text-lg text-stone-600">
                  <Markdown>{result.purchase_invitation}</Markdown>
                </div>
              </div>

              <div className="bg-white p-8 md:p-12 rounded-[40px] shadow-xl border border-stone-100 space-y-8">
                <div className="grid gap-6">
                  {/* Ad Soyad */}
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-stone-400 font-bold ml-2">
                      Ad Soyad *
                    </label>
                    <input 
                      type="text" 
                      value={purchaseForm['name'] || ''}
                      onChange={(e) => setPurchaseForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Adınız ve Soyadınız"
                      className="w-full px-6 py-4 rounded-2xl border border-stone-100 bg-stone-50 focus:border-ekovia-gold focus:ring-0 transition-all text-sm"
                    />
                  </div>

                  {/* Şehir */}
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-stone-400 font-bold ml-2">
                      Şehir *
                    </label>
                    <input 
                      type="text" 
                      value={purchaseForm['city'] || ''}
                      onChange={(e) => setPurchaseForm(prev => ({ ...prev, city: e.target.value }))}
                      placeholder="Yaşadığınız Şehir"
                      className="w-full px-6 py-4 rounded-2xl border border-stone-100 bg-stone-50 focus:border-ekovia-gold focus:ring-0 transition-all text-sm"
                    />
                  </div>

                  {/* E-mail */}
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-stone-400 font-bold ml-2">
                      E-mail Adresi *
                    </label>
                    <input 
                      type="email" 
                      value={purchaseForm['email'] || ''}
                      onChange={(e) => setPurchaseForm(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="ornek@email.com"
                      className="w-full px-6 py-4 rounded-2xl border border-stone-100 bg-stone-50 focus:border-ekovia-gold focus:ring-0 transition-all text-sm"
                    />
                    <p className="text-[9px] text-stone-400 ml-2 italic">E-mail adresi, EKOVIA ekibinin sizinle iletişime geçebilmesi için gereklidir.</p>
                  </div>

                  {/* Telefon */}
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-stone-400 font-bold ml-2">
                      Telefon Numarası (Opsiyonel)
                    </label>
                    <input 
                      type="tel" 
                      value={purchaseForm['phone'] || ''}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        setPurchaseForm(prev => ({ ...prev, phone: val }));
                      }}
                      placeholder="05XX XXX XX XX"
                      className="w-full px-6 py-4 rounded-2xl border border-stone-100 bg-stone-50 focus:border-ekovia-gold focus:ring-0 transition-all text-sm"
                    />
                  </div>

                  {/* Adres */}
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-stone-400 font-bold ml-2">
                      Teslimat Adresi *
                    </label>
                    <textarea 
                      value={purchaseForm['address'] || ''}
                      onChange={(e) => setPurchaseForm(prev => ({ ...prev, address: e.target.value }))}
                      placeholder="Açık Adresiniz"
                      rows={3}
                      className="w-full px-6 py-4 rounded-2xl border border-stone-100 bg-stone-50 focus:border-ekovia-gold focus:ring-0 transition-all text-sm resize-none"
                    />
                  </div>

                  {/* Not */}
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-stone-400 font-bold ml-2">
                      Özel Not
                    </label>
                    <textarea 
                      value={purchaseForm['note'] || ''}
                      onChange={(e) => setPurchaseForm(prev => ({ ...prev, note: e.target.value }))}
                      placeholder="Eklemek istediğiniz notlar..."
                      rows={2}
                      className="w-full px-6 py-4 rounded-2xl border border-stone-100 bg-stone-50 focus:border-ekovia-gold focus:ring-0 transition-all text-sm resize-none"
                    />
                  </div>
                </div>

                {error && <p className="text-red-500 text-xs text-center">{error}</p>}
                
                <button 
                  onClick={handlePurchaseSubmit}
                  className="w-full bg-ekovia-olive text-white py-5 rounded-full font-bold tracking-widest uppercase text-sm hover:bg-black transition-all shadow-lg"
                >
                  Siparişi Tamamla
                </button>
              </div>

              <div className="flex justify-center">
                <button 
                  onClick={() => setStep('result')}
                  className="text-stone-400 hover:text-ekovia-green transition-colors text-xs font-bold uppercase tracking-widest"
                >
                  Geri Dön
                </button>
              </div>
            </motion.div>
          )}
          {step === 'result' && result && (
            <motion.div 
              key="result"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-16"
            >
              {/* Result Header */}
              <div className="text-center space-y-8">
                <div className="flex justify-center">
                  <div className="p-6 rounded-full bg-white shadow-xl border border-stone-100">
                    {result.primaryType === 'Odak' && <Coffee className="w-10 h-10 text-ekovia-gold" />}
                    {result.primaryType === 'Sakinlik' && <Wind className="w-10 h-10 text-ekovia-gold" />}
                    {result.primaryType === 'Enerji' && <Zap className="w-10 h-10 text-ekovia-gold" />}
                  </div>
                </div>
                <div className="space-y-4">
                  <h2 className="text-[40px] md:text-[42px] font-semibold text-[#2B2B2B] leading-tight font-serif">
                    Duyusal Analiz Sonucu
                  </h2>
                  <p className="text-[20px] text-ekovia-olive font-normal">
                    {result.primaryType === 'Odak' ? 'Odaklanma' : result.primaryType === 'Sakinlik' ? 'Dinginlik' : 'Canlanma'} {result.secondaryType ? `& ${result.secondaryType === 'Odak' ? 'Odaklanma' : result.secondaryType === 'Sakinlik' ? 'Dinginlik' : 'Canlanma'}` : ''} Dengesi
                  </p>
                </div>
                <div className="inline-block px-6 py-2 rounded-full border border-ekovia-sand/30 text-[10px] uppercase tracking-[0.3em] font-bold text-ekovia-sand bg-ekovia-sand/5">
                  {result.intensity} Deneyim
                </div>
              </div>

              {/* User Feedback Card */}
              <div className="bg-white/80 backdrop-blur-sm p-10 md:p-[48px] rounded-[24px] shadow-xl border border-stone-100 relative overflow-hidden group">
                <div className="absolute -top-10 -right-10 opacity-5 transition-transform group-hover:scale-110 duration-1000">
                  <Heart className="w-64 h-64 text-ekovia-gold" />
                </div>
                <div className="relative z-10 space-y-6">
                  <h3 className="text-[22px] font-medium text-[#2B2B2B] border-b border-stone-100 pb-4">
                    Mevcut İhtiyacınız
                  </h3>
                  <div className="prose prose-stone max-w-none text-[16px] leading-[1.6] text-[#444444] font-normal">
                    <Markdown>{result.user_feedback}</Markdown>
                  </div>
                </div>
              </div>

              {/* Recommendation Details */}
              <div className="space-y-12">
                <div className="flex items-center gap-8">
                  <div className="h-px flex-1 bg-stone-200" />
                  <h3 className="text-[13px] tracking-[3px] font-medium text-[#6E6E6E] uppercase">──────── VIA BOX ÖNERİSİ ────────</h3>
                  <div className="h-px flex-1 bg-stone-200" />
                </div>

                <div className="grid grid-cols-1 gap-8">
                  {/* Recommendation Card with Glassmorphism */}
                  <div className="bg-white/85 backdrop-blur-md p-10 md:p-[48px] rounded-[18px] shadow-2xl border border-white/50 relative overflow-hidden">
                    {/* Decorative element */}
                    <div className="absolute top-0 left-0 w-full h-[2px] opacity-60 rounded-[2px] bg-gradient-to-r from-ekovia-sand/0 via-ekovia-sand to-ekovia-sand/0" />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-10">
                      {/* Left Column */}
                      <div className="space-y-10">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-[#6E6E6E]">
                            <Sparkles className="w-4 h-4" />
                            <span className="text-[13px] tracking-[2px] font-medium uppercase">Tema</span>
                          </div>
                          <p className="text-[22px] font-medium text-[#2B2B2B] leading-tight">{result.recommendation.theme}</p>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-[#6E6E6E]">
                            <Leaf className="w-4 h-4" />
                            <span className="text-[13px] tracking-[2px] font-medium uppercase">Koku Profili</span>
                          </div>
                          <p className="text-[16px] leading-[1.6] text-[#444444] font-normal italic">{result.recommendation.scent_profile}</p>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-[#6E6E6E]">
                            <Scroll className="w-4 h-4" />
                            <span className="text-[13px] tracking-[2px] font-medium uppercase">Motif Kartı</span>
                          </div>
                          <p className="text-[16px] leading-[1.6] text-[#444444] font-normal">{result.recommendation.motif_card}</p>
                        </div>
                      </div>

                      {/* Right Column */}
                      <div className="space-y-10">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-[#6E6E6E]">
                            <Gift className="w-4 h-4" />
                            <span className="text-[13px] tracking-[2px] font-medium uppercase">Ana Ürün</span>
                          </div>
                          <p className="text-[22px] font-medium text-[#2B2B2B] leading-tight">{result.recommendation.main_product}</p>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-[#6E6E6E]">
                            <Palette className="w-4 h-4" />
                            <span className="text-[13px] tracking-[2px] font-medium uppercase">Renk Paleti</span>
                          </div>
                          <p className="text-[16px] leading-[1.6] text-[#444444] font-normal italic">{result.recommendation.color_palette}</p>
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center gap-2 text-[#6E6E6E]">
                            <Package className="w-4 h-4" />
                            <span className="text-[13px] tracking-[2px] font-medium italic">Kutuda neler olabilir</span>
                          </div>
                          <ul className="space-y-[10px]">
                            {result.recommendation.contents.map((item, idx) => (
                              <li key={idx} className="flex items-start gap-3 text-[16px] font-normal text-[#444444] leading-[1.6]">
                                <span className="text-ekovia-sand mt-1">•</span>
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Final CTA Button */}
                  <div className="flex justify-center pt-8">
                    <button 
                      onClick={() => setStep('purchase')}
                      className="bg-ekovia-olive text-white px-12 py-5 rounded-full font-bold text-sm tracking-widest uppercase hover:bg-black transition-all shadow-xl hover:scale-105"
                    >
                      ViaBox'ımı Hazırla
                    </button>
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex flex-col items-center gap-8 pt-12">
                <div className="flex flex-wrap justify-center gap-6">
                  <button 
                    onClick={reset}
                    className="flex items-center gap-3 text-stone-400 hover:text-ekovia-gold transition-all text-xs font-bold uppercase tracking-[0.2em]"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Yeniden Değerlendir
                  </button>
                  <button 
                    onClick={() => setIsAdminModalOpen(true)}
                    className="flex items-center gap-3 text-stone-400 hover:text-ekovia-gold transition-all text-xs font-bold uppercase tracking-[0.2em]"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Yönetici Paneli
                  </button>
                </div>
                <div className="flex flex-col items-center gap-4">
                  <Compass className="w-10 h-10 text-ekovia-green opacity-20" />
                  <p className="text-[10px] text-stone-400 text-center max-w-xs uppercase tracking-widest leading-loose font-medium">
                    EKOVIA genç üreticiler tarafından Anadolu'nun kalbinde tasarlanmıştır.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
          {step === 'thank_you' && (
            <motion.div 
              key="thank_you"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center min-h-[60vh] text-center"
            >
              <div className="bg-white p-12 md:p-20 rounded-[50px] shadow-xl border border-stone-100 max-w-2xl w-full space-y-10">
                <div className="flex justify-center">
                  <div className="w-20 h-20 bg-ekovia-green/5 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-10 h-10 text-ekovia-green" />
                  </div>
                </div>
                
                <div className="space-y-6">
                  <h2 className="text-3xl font-normal text-ekovia-green italic">Teşekkür Ederiz</h2>
                  <div className="space-y-4 text-stone-600 leading-relaxed">
                    <p className="text-xl">ViaBox talebinizi aldık.</p>
                    <p className="text-sm opacity-70">EKOVIA ekibi kısa süre içinde e-posta adresiniz üzerinden sizinle iletişime geçecektir.</p>
                  </div>
                </div>

                <div className="pt-6">
                  <button 
                    onClick={reset}
                    className="bg-ekovia-green text-ekovia-bg px-12 py-4 rounded-full font-bold tracking-widest uppercase text-xs hover:bg-black transition-all shadow-lg"
                  >
                    Ana Sayfaya Dön
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Decorative Elements */}
      <div className="fixed bottom-0 left-0 p-10 pointer-events-none opacity-20 hidden lg:block">
        <div className="writing-vertical-rl text-[10px] uppercase tracking-[0.6em] font-bold text-ekovia-green">
          Anadolu'nun Duyusal Mirası
        </div>
      </div>
      <div className="fixed top-1/2 right-0 -translate-y-1/2 p-10 pointer-events-none opacity-10 hidden lg:block">
        <div className="flex flex-col gap-16">
          <Sun className="w-6 h-6 text-ekovia-gold" />
          <div className="w-px h-24 bg-ekovia-gold/30 mx-auto" />
          <Moon className="w-6 h-6 text-ekovia-green" />
        </div>
      </div>
    </div>
  );
}

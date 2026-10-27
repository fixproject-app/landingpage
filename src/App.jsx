import React, { useState, useEffect, useRef } from 'react';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import {
  ShoppingBag, Sparkles, CheckCircle2, Star, ShieldCheck, Clock,
  MessageCircle, ArrowRight, Upload, Lock, LogOut, Search, Eye,
  Check, X, Trash2, Plus, BarChart3, Package, Gift, HelpCircle,
  Settings, Users, Image as ImageIcon, RefreshCw, Copy, ChevronDown, ChevronUp
} from 'lucide-react';

const formatIDR = (val) => 'Rp ' + Number(val || 0).toLocaleString('id-ID');

export default function App() {
  // Navigasi Halaman: 'sales' | 'thankyou' | 'upload_proof' | 'privacy' | 'login' | 'admin'
  const [view, setView] = useState('sales');
  const [adminTab, setAdminTab] = useState('orders');
  const [butterflyOn, setButterflyOn] = useState(true);

  // State Auth & Role ('owner' | 'admin')
  const [session, setSession] = useState(null);
  const [userProfile, setUserProfile] = useState({ full_name: 'Owner DIGIPRO', role: 'owner' });
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // State Data Publik & Admin
  const [settings, setSettings] = useState({
    brand_name: 'DIGIPRO',
    whatsapp_number: '6281234567890',
    payment_methods: [
      { type: 'QRIS', name: 'QRIS All Payment (Instan)', number: 'NMID: ID102030405060', holder: 'DIGIPRO OFFICIAL' },
      { type: 'BANK', name: 'Bank BCA', number: '8720-1928-37', holder: 'PT Digital Kreasi Nusantara' },
      { type: 'BANK', name: 'Bank Mandiri', number: '137-00-9827162-4', holder: 'PT Digital Kreasi Nusantara' }
    ],
    privacy_policy_text: 'Data pribadi Anda (Nama, Nomor WhatsApp, dan Email) hanya digunakan untuk pengiriman akses produk dan konfirmasi pembayaran.',
    footer_text: '© 2026 DIGIPRO Indonesia. All rights reserved.'
  });

  const [products, setProducts] = useState([
    {
      id: 'default-prod-1',
      name: 'Digital Product Mastery Bundle v4.0',
      slug: 'digital-product-mastery-v4',
      tagline: 'Sistem Lengkap Bangun & Jual Produk Digital Otomatis',
      description: 'Panduan langkah demi langkah + 50+ Template Siap Pakai untuk meluncurkan produk digital pertama Anda dalam 48 jam.',
      price: 997000,
      discount_price: 249000,
      features: [
        '12 Modul Video HD Step-by-Step',
        '50+ Template Notion & Canva Siap Jual',
        'Script Copywriting Sales Page Konversi Tinggi',
        'Akses Grup Komunitas & Update Seumur Hidup'
      ],
      is_active: true
    }
  ]);

  const [heroSlides, setHeroSlides] = useState([
    { id: 1, headline: 'Ubah Keahlian Anda Menjadi Mesin Penghasilan Digital 24/7', image_path: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1000&q=80' },
    { id: 2, headline: '50+ Template Produk Digital Siap Pakai & Lisensi Jual Kembali', image_path: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1000&q=80' }
  ]);
  const [activeSlide, setActiveSlide] = useState(0);

  const [bonuses, setBonuses] = useState([
    { id: 1, title: '100+ Hook Iklan Meta & TikTok Ads', description: 'Copy-paste formula hook iklan yang sudah teruji menghasilkan ROAS tinggi.', value_label: 'Senilai Rp 350.000' },
    { id: 2, title: 'Kalkulator Pricing & Profit Otomatis', description: 'Spreadsheet otomatis untuk menghitung harga jual dan komisi.', value_label: 'Senilai Rp 250.000' }
  ]);

  const [testimonials, setTestimonials] = useState([
    { id: 1, name: 'Rizky Pratama', rating: 5, short_text: 'Hanya 3 hari setelah pasang sales page baru, 42 paket terjual tanpa perang harga!', full_text: 'Sebelumnya saya jualan lewat link biasa dan konversinya di bawah 1%. Setelah pakai template & alur dari DIGIPRO, pembeli langsung transfer tanpa banyak tanya.' },
    { id: 2, name: 'Nadia Kusuma', rating: 5, short_text: 'Admin CS saya jauh lebih tenang karena orderan masuk rapi dan realtime!', full_text: 'Biasanya rekap order lewat chat WA selalu berantakan. Sekarang semua bukti transfer terdata rapi dengan kode unik masing-masing.' }
  ]);
  const [selectedTesti, setSelectedTesti] = useState(null);

  const [faqs, setFaqs] = useState([
    { id: 1, question: 'Apakah cocok untuk pemula yang belum punya produk?', answer: 'Sangat cocok! Di dalam paket sudah tersedia 50+ template produk digital siap pakai (PLR) yang bisa langsung Anda ubah namanya dan jual kembali.' },
    { id: 2, question: 'Bagaimana cara mendapatkan akses filenya setelah bayar?', answer: 'Setelah Anda mengunggah bukti pembayaran dan diverifikasi oleh Admin kami, link akses akan langsung dikirimkan ke WhatsApp dan Email Anda.' }
  ]);
  const [openFaq, setOpenFaq] = useState(0);

  // State Pesanan (Orders)
  const [orders, setOrders] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedOrder, setSelectedOrder] = useState(null);

  // State Form Order Publik
  const [buyerName, setBuyerName] = useState('');
  const [buyerWhatsapp, setBuyerWhatsapp] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [createdOrder, setCreatedOrder] = useState(null);

  // State Konfirmasi Bukti Bayar
  const [proofOrderCode, setProofOrderCode] = useState('');
  const [proofFile, setProofFile] = useState(null);
  const [uploadingProof, setUploadingProof] = useState(false);

  // Toast Notification
  const [toast, setToast] = useState(null);
  const showToast = (title, message) => {
    setToast({ title, message });
    setTimeout(() => setToast(null), 4000);
  };

  // State Kupu-kupu Penjejak Kursor (US-11)
  const [cursorPos, setCursorPos] = useState({ x: -100, y: -100, angle: 0 });
  const orderSectionRef = useRef(null);

  useEffect(() => {
    if (!butterflyOn) return;
    let lastX = 0;
    let lastY = 0;
    const handleMove = (e) => {
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);
      lastX = e.clientX;
      lastY = e.clientY;
      setCursorPos({ x: e.clientX, y: e.clientY, angle });
    };
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, [butterflyOn]);

  // Auto Slideshow Hero (US-02)
  useEffect(() => {
    if (heroSlides.length <= 1) return;
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % heroSlides.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [heroSlides]);

  // Load Data dari Supabase & Aktifkan Realtime
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    // 1. Catat Kunjungan Anonim ke page_views (US-20)
    const sid = localStorage.getItem('digipro_sid') || ('s_' + Math.random().toString(36).substring(2, 10));
    localStorage.setItem('digipro_sid', sid);
    supabase.from('page_views').insert({ session_id: sid, source: 'landing_page' }).then();

    // 2. Muat Konten Publik dari Supabase
    async function fetchPublicData() {
      const { data: prodData } = await supabase.from('products').select('*').eq('is_active', true).order('sort_order');
      if (prodData && prodData.length > 0) {
        setProducts(prodData);
        setSelectedProductId(prodData[0].id);
      }

      const { data: slideData } = await supabase.from('hero_slides').select('*').eq('is_active', true).order('sort_order');
      if (slideData && slideData.length > 0) setHeroSlides(slideData);

      const { data: bonusData } = await supabase.from('bonuses').select('*').eq('is_active', true);
      if (bonusData && bonusData.length > 0) setBonuses(bonusData);

      const { data: testiData } = await supabase.from('testimonials').select('*').eq('is_active', true).order('sort_order');
      if (testiData && testiData.length > 0) setTestimonials(testiData);

      const { data: faqData } = await supabase.from('faqs').select('*').eq('is_active', true).order('sort_order');
      if (faqData && faqData.length > 0) setFaqs(faqData);

      const { data: setRow } = await supabase.from('site_settings').select('*').eq('id', 1).maybeSingle();
      if (setRow) setSettings(setRow);
    }
    fetchPublicData();

    // 3. Cek Session Login Admin/Owner
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchUserProfile(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchUserProfile(session.user.id);
    });

    // 4. Realtime Listener untuk Tabel Orders (US-17)
    const channel = supabase
      .channel('realtime-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setOrders((prev) => [payload.new, ...prev]);
          showToast('Order Baru Masuk!', `${payload.new.buyer_name} (${payload.new.order_code})`);
        } else if (payload.eventType === 'UPDATE') {
          setOrders((prev) => prev.map((o) => (o.id === payload.new.id ? payload.new : o)));
        } else if (payload.eventType === 'DELETE') {
          setOrders((prev) => prev.filter((o) => o.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchUserProfile(userId) {
    if (!supabase) return;
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    if (data) setUserProfile(data);
    fetchOrders();
  }

  async function fetchOrders() {
    if (!supabase) return;
    const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (data) setOrders(data);
  }

  const activeProduct = products.find((p) => p.id === selectedProductId) || products[0];

  // Fungsi Submit Order oleh Pembeli (US-12)
  const handleCreateOrder = async (e) => {
    e.preventDefault();
    if (!buyerName.trim() || !buyerWhatsapp.trim()) {
      return showToast('Validasi Gagal', 'Nama dan Nomor WhatsApp wajib diisi.');
    }
    setSubmittingOrder(true);
    const generatedCode = 'ORD-' + Math.random().toString(36).substring(2, 8).toUpperCase();

    const newOrderPayload = {
      order_code: generatedCode,
      buyer_name: buyerName.trim(),
      buyer_whatsapp: buyerWhatsapp.trim(),
      buyer_email: buyerEmail.trim() || null,
      product_id: activeProduct.id.startsWith('default') ? null : activeProduct.id,
      product_name: activeProduct.name,
      price_paid: activeProduct.discount_price,
      payment_status: 'menunggu'
    };

    try {
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase.from('orders').insert([newOrderPayload]);
        if (error) throw error;
      } else {
        setOrders((prev) => [{ id: Date.now().toString(), created_at: new Date().toISOString(), ...newOrderPayload }, ...prev]);
      }
      setCreatedOrder(newOrderPayload);
      setProofOrderCode(generatedCode);
      setView('thankyou');
      showToast('Pesanan Berhasil Dibuat!', `Kode Order Anda: ${generatedCode}`);
    } catch (err) {
      showToast('Gagal Membuat Order', err.message);
    } finally {
      setSubmittingOrder(false);
    }
  };

  // Fungsi Unggah Bukti Bayar oleh Pembeli (US-14)
  const handleUploadProof = async (e) => {
    e.preventDefault();
    if (!proofOrderCode.trim() || !proofFile) {
      return showToast('Lengkapi Data', 'Masukkan kode order dan pilih file gambar bukti transfer.');
    }
    setUploadingProof(true);
    try {
      const cleanCode = proofOrderCode.trim().toUpperCase();
      let filePath = `${cleanCode}/${Date.now()}_${proofFile.name}`;

      if (isSupabaseConfigured && supabase) {
        const { error: upErr } = await supabase.storage.from('payment-proofs').upload(filePath, proofFile);
        if (upErr) throw upErr;

        const { data: rpcRes, error: rpcErr } = await supabase.rpc('submit_payment_proof', {
          p_order_code: cleanCode,
          p_proof_path: filePath
        });
        if (rpcErr) throw rpcErr;
        if (rpcRes && !rpcRes.success) throw new Error(rpcRes.message);
      } else {
        setOrders((prev) =>
          prev.map((o) => (o.order_code === cleanCode ? { ...o, payment_status: 'bukti_diunggah', payment_proof_path: filePath } : o))
        );
      }
      showToast('Bukti Bayar Terkirim!', 'Admin kami akan segera memverifikasi pembayaran Anda.');
      setProofFile(null);
      setView('sales');
    } catch (err) {
      showToast('Gagal Mengunggah', err.message);
    } finally {
      setUploadingProof(false);
    }
  };

  // Fungsi Login Staff (US-16)
  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    try {
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase.auth.signInWithPassword({
          email: loginEmail,
          password: loginPassword
        });
        if (error) throw error;
      }
      setView('admin');
      showToast('Login Berhasil', 'Selamat datang di Panel Admin DIGIPRO.');
    } catch (err) {
      showToast('Login Gagal', err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  // Fungsi Ubah Status Bayar di Admin (US-18)
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase.from('orders').update({ payment_status: newStatus }).eq('id', orderId);
        if (error) throw error;
        fetchOrders();
      } else {
        setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, payment_status: newStatus } : o)));
      }
      showToast('Status Diperbarui', `Status pesanan diubah menjadi ${newStatus.toUpperCase()}`);
    } catch (err) {
      showToast('Gagal Update', err.message);
    }
  };

  // Fungsi Lihat Bukti Bayar via Signed URL (US-17)
  const handleViewProof = async (proofPath) => {
    if (!proofPath) return showToast('Belum Ada Bukti', 'Pembeli belum mengunggah bukti bayar.');
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.storage.from('payment-proofs').createSignedUrl(proofPath, 300);
      if (error) return showToast('Gagal Membuka Bukti', error.message);
      window.open(data.signedUrl, '_blank');
    } else {
      showToast('Mode Demo', `Path file: ${proofPath}`);
    }
  };

  const filteredOrders = orders.filter((o) => {
    const matchStatus = statusFilter === 'ALL' || o.payment_status === statusFilter;
    const q = searchQuery.toLowerCase();
    const matchSearch =
      !q ||
      (o.buyer_name && o.buyer_name.toLowerCase().includes(q)) ||
      (o.buyer_whatsapp && o.buyer_whatsapp.toLowerCase().includes(q)) ||
      (o.order_code && o.order_code.toLowerCase().includes(q));
    return matchStatus && matchSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 relative">
      {/* KUPU-KUPU INTERAKTIF PENJEJAK KURSOR (US-11) */}
      {butterflyOn && (
        <div
          className="pointer-events-none fixed z-50 transition-transform duration-150 ease-out hidden md:block"
          style={{
            left: cursorPos.x + 14,
            top: cursorPos.y + 14,
            transform: `rotate(${cursorPos.angle + 45}deg)`
          }}
        >
          <span className="text-2xl inline-block animate-bounce drop-shadow-md">🦋</span>
        </div>
      )}

      {/* TOAST NOTIFIKASI */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-5 py-4 rounded-2xl shadow-2xl border border-slate-700 max-w-sm">
          <div className="font-bold text-sm text-amber-400">{toast.title}</div>
          <div className="text-xs text-slate-200 mt-1">{toast.message}</div>
        </div>
      )}

      {/* TOP BAR KONTROL CEPAT */}
      <div className="bg-slate-900 text-slate-300 text-xs py-2 px-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${isSupabaseConfigured ? 'bg-emerald-400' : 'bg-amber-400'}`} />
          <span>{isSupabaseConfigured ? 'Terhubung ke Supabase Live' : 'Mode Pratinjau Lokal (Isi .env untuk koneksi Supabase)'}</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setButterflyOn(!butterflyOn)} className="hover:text-white">
            🦋 Kupu-kupu: {butterflyOn ? 'ON' : 'OFF'}
          </button>
          <button onClick={() => setView('sales')} className="hover:text-white font-medium">Sales Page</button>
          <button onClick={() => setView('upload_proof')} className="hover:text-white font-medium">Unggah Bukti Bayar</button>
          <button onClick={() => setView(session ? 'admin' : 'login')} className="bg-indigo-600 text-white px-3 py-1 rounded-full font-semibold hover:bg-indigo-500">
            {session ? 'Panel Admin' : 'Login Staff'}
          </button>
        </div>
      </div>

      {/* =====================================================================
          VIEW 1: HALAMAN PENJUALAN PUBLIK (SALES PAGE)
      ===================================================================== */}
      {view === 'sales' && (
        <div>
          {/* Sticky Header (US-01) */}
          <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
            <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
              <div className="font-heading font-black text-xl text-indigo-600 flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-amber-500" />
                {settings.brand_name}
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setView('upload_proof')}
                  className="text-xs sm:text-sm font-semibold text-slate-600 hover:text-indigo-600 px-3 py-2"
                >
                  Cek / Upload Bukti
                </button>
                <button
                  onClick={() => orderSectionRef.current?.scrollIntoView({ behavior: 'smooth' })}
                  className="btn-shimmer bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-full shadow-lg shadow-orange-500/30 hover:scale-105 transition"
                >
                  Beli Sekarang
                </button>
              </div>
            </div>
          </header>

          {/* Hero Section dengan Slideshow Otomatis (US-02) */}
          <section className="bg-gradient-to-br from-indigo-950 via-indigo-900 to-purple-900 text-white py-14 sm:py-20 px-4">
            <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-10 items-center">
              <div>
                <span className="inline-flex items-center gap-1.5 bg-amber-400/20 text-amber-300 border border-amber-400/30 px-3.5 py-1 rounded-full text-xs font-bold mb-5">
                  🔥 PENAWARAN TERBATAS HARI INI
                </span>
                <h1 className="font-heading font-black text-3xl sm:text-5xl leading-tight mb-5">
                  {heroSlides[activeSlide]?.headline || activeProduct.tagline}
                </h1>
                <p className="text-indigo-100 text-base sm:text-lg mb-8 leading-relaxed">
                  {activeProduct.description}
                </p>
                <div className="flex flex-wrap gap-4">
                  <button
                    onClick={() => orderSectionRef.current?.scrollIntoView({ behavior: 'smooth' })}
                    className="btn-shimmer bg-gradient-to-r from-amber-500 to-orange-600 text-white font-extrabold px-8 py-4 rounded-2xl shadow-xl shadow-orange-500/30 flex items-center gap-2 text-base"
                  >
                    Ambil Promo Sekarang <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="relative">
                <div className="rounded-3xl overflow-hidden shadow-2xl border-4 border-white/15 bg-slate-900 aspect-video relative">
                  <img
                    src={heroSlides[activeSlide]?.image_path}
                    alt="Hero Slide"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex justify-center gap-2 mt-4">
                  {heroSlides.map((s, idx) => (
                    <button
                      key={s.id || idx}
                      onClick={() => setActiveSlide(idx)}
                      className={`h-2.5 rounded-full transition-all ${activeSlide === idx ? 'w-8 bg-amber-400' : 'w-2.5 bg-white/40'}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Problem & Solution Card Produk (US-03, US-04, US-05) */}
          <section className="py-16 px-4 max-w-5xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="font-heading font-black text-2xl sm:text-4xl text-slate-900 mb-3">
                Semua yang Anda Butuhkan Dalam Satu Paket Lengkap
              </h2>
              <p className="text-slate-600">
                Tidak perlu mulai dari nol. Gunakan produk & kerangka yang sudah terbukti menghasilkan konversi tinggi.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-xl border-2 border-indigo-100 hover:border-indigo-500 transition group">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                    Produk Unggulan
                  </span>
                  <h3 className="font-heading font-black text-2xl sm:text-3xl mt-3 mb-2">{activeProduct.name}</h3>
                  <p className="text-slate-600 text-sm mb-6">{activeProduct.description}</p>
                  <div className="space-y-3">
                    {(activeProduct.features || []).map((feat, i) => (
                      <div key={i} className="flex items-start gap-2.5 text-sm font-medium text-slate-700">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-gradient-to-br from-indigo-50 to-amber-50 p-6 rounded-2xl border border-indigo-100 text-center">
                  <div className="text-sm text-slate-500 line-through">{formatIDR(activeProduct.price)}</div>
                  <div className="font-heading font-black text-4xl text-indigo-600 my-2">
                    {formatIDR(activeProduct.discount_price)}
                  </div>
                  <div className="text-xs text-emerald-700 font-bold mb-6">⚡ Sekali Bayar • Akses Selamanya</div>
                  <button
                    onClick={() => orderSectionRef.current?.scrollIntoView({ behavior: 'smooth' })}
                    className="w-full btn-shimmer bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl shadow-lg"
                  >
                    Pesan Paket Ini Sekarang
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Bonus Terbatas (US-07) */}
          <section className="py-14 px-4 bg-amber-50/70 border-y border-amber-200/60">
            <div className="max-w-5xl mx-auto">
              <h2 className="font-heading font-black text-2xl sm:text-3xl text-center mb-8">
                🎁 Bonus Spesial Jika Anda Pesan Hari Ini
              </h2>
              <div className="grid sm:grid-cols-2 gap-6">
                {bonuses.map((b, i) => (
                  <div key={b.id || i} className="bg-white p-6 rounded-2xl shadow-md border border-amber-200">
                    <span className="text-xs font-extrabold bg-amber-100 text-amber-800 px-3 py-1 rounded-full">
                      GRATIS • {b.value_label}
                    </span>
                    <h3 className="font-heading font-bold text-lg mt-3 mb-1">{b.title}</h3>
                    <p className="text-sm text-slate-600">{b.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Testimoni Pembeli (US-06) */}
          <section className="py-16 px-4 max-w-5xl mx-auto">
            <h2 className="font-heading font-black text-2xl sm:text-3xl text-center mb-10">
              Apa Kata Mereka yang Sudah Membuktikan?
            </h2>
            <div className="grid sm:grid-cols-2 gap-6">
              {testimonials.map((t, i) => (
                <div
                  key={t.id || i}
                  onClick={() => setSelectedTesti(t)}
                  className="cursor-pointer bg-white p-6 rounded-2xl shadow-md border border-slate-200 hover:border-indigo-500 hover:shadow-xl transition"
                >
                  <div className="flex items-center gap-1 text-amber-400 mb-3">
                    {Array.from({ length: t.rating || 5 }).map((_, idx) => (
                      <Star key={idx} className="w-4 h-4 fill-amber-400" />
                    ))}
                  </div>
                  <p className="font-semibold text-slate-800 mb-3">"{t.short_text}"</p>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-bold text-slate-900">{t.name}</span>
                    <span className="text-indigo-600 font-semibold">Klik baca lengkap →</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Pop-up Lightbox Testimoni */}
          {selectedTesti && (
            <div
              onClick={() => setSelectedTesti(null)}
              className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4"
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-heading font-bold text-xl">{selectedTesti.name}</h4>
                    <div className="text-xs text-emerald-600 font-semibold">Pembeli Terverifikasi</div>
                  </div>
                  <button onClick={() => setSelectedTesti(null)} className="p-1 text-slate-400 hover:text-slate-700">
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <p className="text-slate-700 leading-relaxed text-sm sm:text-base mb-6">"{selectedTesti.full_text}"</p>
                <button
                  onClick={() => setSelectedTesti(null)}
                  className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl"
                >
                  Tutup
                </button>
              </div>
            </div>
          )}

          {/* Form Order Langsung Tanpa Akun (US-07 & US-12) */}
          <section ref={orderSectionRef} className="py-16 px-4 bg-slate-900 text-white">
            <div className="max-w-xl mx-auto bg-white text-slate-900 rounded-3xl p-6 sm:p-10 shadow-2xl">
              <div className="text-center mb-6">
                <span className="bg-emerald-100 text-emerald-800 text-xs font-extrabold px-3 py-1 rounded-full">
                  FORM PEMESANAN INSTAN
                </span>
                <h2 className="font-heading font-black text-2xl sm:text-3xl mt-2">
                  Lengkapi Data & Ambil Diskon
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Tidak perlu buat akun. Isi kurang dari 1 menit.
                </p>
              </div>

              <form onSubmit={handleCreateOrder} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Nama Lengkap *</label>
                  <input
                    type="text"
                    required
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    placeholder="Contoh: Budi Santoso"
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Nomor WhatsApp Aktif *</label>
                  <input
                    type="tel"
                    required
                    value={buyerWhatsapp}
                    onChange={(e) => setBuyerWhatsapp(e.target.value)}
                    placeholder="Contoh: 081234567890"
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Alamat Email (Opsional)</label>
                  <input
                    type="email"
                    value={buyerEmail}
                    onChange={(e) => setBuyerEmail(e.target.value)}
                    placeholder="budi@email.com"
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-600 outline-none"
                  />
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-slate-500">Total Pembayaran Promo:</div>
                    <div className="font-heading font-black text-2xl text-indigo-600">
                      {formatIDR(activeProduct.discount_price)}
                    </div>
                  </div>
                  <div className="text-right text-xs text-slate-400 line-through">
                    {formatIDR(activeProduct.price)}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submittingOrder}
                  className="w-full btn-shimmer bg-gradient-to-r from-amber-500 to-orange-600 text-white font-extrabold py-4 rounded-2xl shadow-xl text-base hover:opacity-95 transition"
                >
                  {submittingOrder ? 'Memproses Pesanan...' : 'Kirim Pesanan Sekarang →'}
                </button>
              </form>
            </div>
          </section>

          {/* FAQ Accordion (US-08) */}
          <section className="py-16 px-4 max-w-3xl mx-auto">
            <h2 className="font-heading font-black text-2xl sm:text-3xl text-center mb-8">
              Pertanyaan yang Sering Diajukan (FAQ)
            </h2>
            <div className="space-y-3">
              {faqs.map((f, idx) => (
                <div key={f.id || idx} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(openFaq === idx ? -1 : idx)}
                    className="w-full px-6 py-4 text-left font-bold flex items-center justify-between"
                  >
                    <span>{f.question}</span>
                    {openFaq === idx ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>
                  {openFaq === idx && (
                    <div className="px-6 pb-4 text-sm text-slate-600 border-t border-slate-100 pt-3">
                      {f.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Footer (US-09) */}
          <footer className="bg-slate-950 text-slate-400 py-10 px-4 text-center text-xs sm:text-sm">
            <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>{settings.footer_text}</div>
              <div className="flex gap-4">
                <button onClick={() => setView('privacy')} className="hover:text-white underline">
                  Kebijakan Privasi
                </button>
                <button onClick={() => setView('upload_proof')} className="hover:text-white underline">
                  Konfirmasi Pembayaran
                </button>
              </div>
            </div>
          </footer>

          {/* Tombol WhatsApp Mengambang (US-10) */}
          <a
            href={`https://wa.me/${settings.whatsapp_number}?text=${encodeURIComponent('Halo CS ' + settings.brand_name + ', saya ingin bertanya tentang ' + activeProduct.name)}`}
            target="_blank"
            rel="noreferrer"
            className="fixed bottom-5 right-5 z-40 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-3 rounded-full shadow-2xl flex items-center gap-2 font-bold text-sm"
          >
            <MessageCircle className="w-5 h-5" /> Chat CS WhatsApp
          </a>
        </div>
      )}

      {/* =====================================================================
          VIEW 2: HALAMAN TERIMA KASIH & INSTRUKSI BAYAR (US-13)
      ===================================================================== */}
      {view === 'thankyou' && createdOrder && (
        <div className="max-w-xl mx-auto my-12 bg-white p-8 rounded-3xl shadow-xl border border-slate-200">
          <div className="text-center">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="font-heading font-black text-2xl">Terima Kasih, {createdOrder.buyer_name}!</h2>
            <p className="text-sm text-slate-600 mt-1">Simpan Kode Order Anda untuk mengunggah bukti pembayaran:</p>
            <div className="my-5 bg-indigo-50 border-2 border-dashed border-indigo-300 rounded-2xl p-4 font-mono-code text-2xl font-bold text-indigo-700">
              {createdOrder.order_code}
            </div>
            <div className="text-lg font-bold text-slate-800 mb-6">
              Total Tagihan: <span className="text-indigo-600">{formatIDR(createdOrder.price_paid)}</span>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <div className="text-xs font-bold uppercase text-slate-500">Pilih Metode Transfer:</div>
            {(settings.payment_methods || []).map((pm, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm">
                <div className="font-bold text-slate-900">{pm.name}</div>
                <div className="font-mono-code text-indigo-600 font-bold">{pm.number}</div>
                <div className="text-xs text-slate-500">a.n {pm.holder}</div>
              </div>
            ))}
          </div>

          <button
            onClick={() => setView('upload_proof')}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl mb-3"
          >
            Unggah Bukti Pembayaran Sekarang →
          </button>
          <button onClick={() => setView('sales')} className="w-full text-slate-500 text-sm py-2">
            ← Kembali ke Halaman Utama
          </button>
        </div>
      )}

      {/* =====================================================================
          VIEW 3: KONFIRMASI PEMBAYARAN VIA KODE ORDER (US-14)
      ===================================================================== */}
      {view === 'upload_proof' && (
        <div className="max-w-md mx-auto my-12 bg-white p-8 rounded-3xl shadow-xl border border-slate-200">
          <h2 className="font-heading font-black text-2xl mb-2">Konfirmasi Pembayaran</h2>
          <p className="text-xs text-slate-500 mb-6">
            Masukkan Kode Order Anda dan unggah foto/screenshot bukti transfer.
          </p>
          <form onSubmit={handleUploadProof} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Kode Order *</label>
              <input
                type="text"
                required
                value={proofOrderCode}
                onChange={(e) => setProofOrderCode(e.target.value.toUpperCase())}
                placeholder="ORD-XXXXXX"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 font-mono-code uppercase"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">File Bukti Bayar (JPG/PNG/WebP) *</label>
              <input
                type="file"
                accept="image/*"
                required
                onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                className="w-full text-sm border border-slate-300 rounded-xl p-2.5"
              />
            </div>
            <button
              type="submit"
              disabled={uploadingProof}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl"
            >
              {uploadingProof ? 'Mengunggah...' : 'Kirim Bukti Pembayaran'}
            </button>
            <button type="button" onClick={() => setView('sales')} className="w-full text-slate-500 text-sm py-2">
              ← Kembali ke Halaman Penjualan
            </button>
          </form>
        </div>
      )}

      {/* =====================================================================
          VIEW 4: KEBIJAKAN PRIVASI (US-09)
      ===================================================================== */}
      {view === 'privacy' && (
        <div className="max-w-2xl mx-auto my-12 bg-white p-8 rounded-3xl shadow-xl border border-slate-200">
          <h2 className="font-heading font-black text-2xl mb-4">Kebijakan Privasi</h2>
          <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line mb-6">
            {settings.privacy_policy_text}
          </p>
          <button onClick={() => setView('sales')} className="bg-slate-900 text-white px-6 py-2.5 rounded-xl text-sm font-bold">
            ← Kembali
          </button>
        </div>
      )}

      {/* =====================================================================
          VIEW 5: LOGIN STAFF ADMIN / OWNER (US-16)
      ===================================================================== */}
      {view === 'login' && (
        <div className="max-w-md mx-auto my-16 bg-white p-8 rounded-3xl shadow-xl border border-slate-200">
          <div className="flex items-center gap-2 font-heading font-black text-xl text-indigo-600 mb-2">
            <Lock className="w-5 h-5" /> Login Staff Panel
          </div>
          <p className="text-xs text-slate-500 mb-6">Khusus Owner dan Admin/CS. Pembeli tidak memerlukan akun.</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Email Staff</label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="owner@digipro.id"
                className="w-full px-4 py-3 rounded-xl border border-slate-300"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Kata Sandi</label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl border border-slate-300"
              />
            </div>
            <button
              type="submit"
              disabled={authLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl"
            >
              {authLoading ? 'Memverifikasi...' : 'Masuk ke Panel Admin'}
            </button>
          </form>
        </div>
      )}

      {/* =====================================================================
          VIEW 6: PANEL ADMIN & OWNER (US-17 s.d. US-21)
      ===================================================================== */}
      {view === 'admin' && (
        <div className="max-w-6xl mx-auto p-4 sm:p-8">
          <div className="bg-white rounded-3xl p-6 shadow-md border border-slate-200 mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="font-heading font-black text-2xl">Panel Admin & CMS</h1>
              <p className="text-xs text-slate-500">
                Masuk sebagai: <strong className="uppercase text-indigo-600">{userProfile.role}</strong> ({userProfile.full_name})
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={fetchOrders}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold flex items-center gap-1.5"
              >
                <RefreshCw className="w-4 h-4" /> Refresh Data
              </button>
              <button
                onClick={async () => {
                  if (supabase) await supabase.auth.signOut();
                  setView('sales');
                }}
                className="px-4 py-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 text-xs font-bold flex items-center gap-1.5"
              >
                <LogOut className="w-4 h-4" /> Keluar
              </button>
            </div>
          </div>

          {/* Tabel Daftar Pesanan Realtime (US-17 & US-18) */}
          <div className="bg-white rounded-3xl p-6 shadow-md border border-slate-200">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari kode order, nama, atau WhatsApp..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold"
              >
                <option value="ALL">Semua Status</option>
                <option value="menunggu">Menunggu</option>
                <option value="bukti_diunggah">Bukti Diunggah</option>
                <option value="lunas">Lunas</option>
                <option value="ditolak">Ditolak</option>
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase text-slate-400">
                    <th className="py-3 px-3">Kode Order</th>
                    <th className="py-3 px-3">Pembeli</th>
                    <th className="py-3 px-3">Nominal</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Bukti</th>
                    <th className="py-3 px-3">Aksi Verifikasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-8 text-slate-400">
                        Belum ada data pesanan.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((o) => (
                      <tr key={o.id || o.order_code} className="hover:bg-slate-50">
                        <td className="py-3.5 px-3 font-mono-code font-bold text-indigo-600">{o.order_code}</td>
                        <td className="py-3.5 px-3">
                          <div className="font-bold text-slate-900">{o.buyer_name}</div>
                          <div className="text-xs text-slate-500">{o.buyer_whatsapp}</div>
                        </td>
                        <td className="py-3.5 px-3 font-bold">{formatIDR(o.price_paid)}</td>
                        <td className="py-3.5 px-3">
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase bg-slate-100 text-slate-700">
                            {o.payment_status}
                          </span>
                        </td>
                        <td className="py-3.5 px-3">
                          {o.payment_proof_path ? (
                            <button
                              onClick={() => handleViewProof(o.payment_proof_path)}
                              className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"
                            >
                              <Eye className="w-3.5 h-3.5" /> Lihat Bukti
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400">Belum ada</span>
                          )}
                        </td>
                        <td className="py-3.5 px-3 flex items-center gap-2">
                          <button
                            onClick={() => handleUpdateOrderStatus(o.id, 'lunas')}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold"
                          >
                            Set Lunas
                          </button>
                          <button
                            onClick={() => handleUpdateOrderStatus(o.id, 'ditolak')}
                            className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold"
                          >
                            Tolak
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

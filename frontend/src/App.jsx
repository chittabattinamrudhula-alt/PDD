import React, { useState, useEffect, useCallback } from 'react';

const API_BASE = 'http://localhost:5000/api';

// ─── Supported currencies ───────────────────────────────────────────────────
const CURRENCIES = [
  { code: 'USD', symbol: '$',  name: 'US Dollar' },
  { code: 'EUR', symbol: '€',  name: 'Euro' },
  { code: 'GBP', symbol: '£',  name: 'British Pound' },
  { code: 'INR', symbol: '₹',  name: 'Indian Rupee' },
  { code: 'JPY', symbol: '¥',  name: 'Japanese Yen' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc' },
  { code: 'CNY', symbol: '¥',  name: 'Chinese Yuan' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
];

function App() {
  const [user, setUser]             = useState(null);
  const [authMode, setAuthMode]     = useState('landing');
  const [activeTab, setActiveTab]   = useState('dashboard');
  const [properties, setProperties] = useState([]);
  const [ledger, setLedger]         = useState([]);
  const [bookings, setBookings]     = useState([]);
  const [marketTrends, setMarketTrends] = useState({});
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen]     = useState(false);
  const [isVetting, setIsVetting]               = useState(false);

  // ── Currency state ─────────────────────────────────────────────────────────
  // exchangeRates holds USD → X rates, e.g. { EUR: 0.92, INR: 83.4, ... }
  const [exchangeRates, setExchangeRates] = useState({});
  const [ratesLoading, setRatesLoading]   = useState(false);

  // ── Auth form ──────────────────────────────────────────────────────────────
  const [authForm, setAuthForm] = useState({
    email: '', password: '', name: '',
    role: 'Buyer',
  });
  const [authError, setAuthError]     = useState('');
  const [authSuccess, setAuthSuccess] = useState('');

  // ── Add-property form ──────────────────────────────────────────────────────
  const [addForm, setAddForm] = useState({
    title: '', description: '', location: 'Suburbs',
    sqft: 1500, bedrooms: 3, bathrooms: 2, age: 5,
    condition: 'Good', amenities: [], listingPrice: 320000,
    titleVerified: true, imageUrl: '',
  });

  // ── Valuation calculator ───────────────────────────────────────────────────
  const [calcForm, setCalcForm] = useState({
    location: 'Downtown', sqft: 1200, bedrooms: 2,
    bathrooms: 2, age: 5, condition: 'Excellent',
    amenities: [], listingPrice: 500000,
  });
  const [calcResult, setCalcResult]     = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // ── Fetch exchange rates from Frankfurter (no API key needed) ─────────────
  const fetchExchangeRates = useCallback(async () => {
    setRatesLoading(true);
    try {
      const res  = await fetch('https://api.frankfurter.app/latest?from=USD');
      const data = await res.json();
      // data.rates contains all currencies vs USD; add USD itself
      setExchangeRates({ USD: 1, ...data.rates });
    } catch {
      // Fallback static rates so the app never breaks offline
      setExchangeRates({
        USD: 1, EUR: 0.92, GBP: 0.79, INR: 83.4,
        JPY: 149.5, AUD: 1.53, CAD: 1.36, CHF: 0.89,
        CNY: 7.23, AED: 3.67,
      });
    } finally {
      setRatesLoading(false);
    }
  }, []);

  // Helper: convert a USD amount to the user's preferred currency
  const convertPrice = useCallback((usdAmount) => {
    if (!usdAmount) return 0;
    const code = user?.currency || 'USD';
    const rate = exchangeRates[code] ?? 1;
    return Math.round(usdAmount * rate);
  }, [user, exchangeRates]);

  // Helper: format a converted price with correct symbol
  const formatPrice = useCallback((usdAmount) => {
    const code     = user?.currency || 'USD';
    const currency = CURRENCIES.find(c => c.code === code) || CURRENCIES[0];
    const amount   = convertPrice(usdAmount);
    // For JPY / INR avoid decimals; others also integer for real-estate
    return `${currency.symbol}${amount.toLocaleString()}`;
  }, [user, convertPrice]);

  // ── Initial data load ──────────────────────────────────────────────────────
  useEffect(() => {
    fetchMarketTrends();
    fetchPropertiesAndLedger();
    fetchExchangeRates();
  }, []);

  useEffect(() => {
    if (user) fetchBookings();
  }, [user]);

  useEffect(() => { handleCalculate(null, true); }, []);

  // ── Data fetchers ──────────────────────────────────────────────────────────
  const fetchPropertiesAndLedger = async () => {
    try {
      const [propsRes, ledgerRes] = await Promise.all([
        fetch(`${API_BASE}/properties`),
        fetch(`${API_BASE}/blockchain/ledger`),
      ]);
      setProperties(await propsRes.json());
      setLedger(await ledgerRes.json());
    } catch (err) { console.error('Error fetching listings:', err); }
  };

  const fetchMarketTrends = async () => {
    try {
      const res  = await fetch(`${API_BASE}/market/trends`);
      setMarketTrends(await res.json());
    } catch (err) { console.error('Error loading trends:', err); }
  };

  const fetchBookings = async () => {
    try {
      let url = `${API_BASE}/bookings`;
      if (user?.role === 'Buyer') url += `?buyerId=${user.id}`;
      setBookings(await (await fetch(url)).json());
    } catch (err) { console.error('Error fetching bookings:', err); }
  };

  const handleCalculate = async (e, isInitial = false) => {
    if (e) e.preventDefault();
    setIsCalculating(true);
    try {
      const res  = await fetch(`${API_BASE}/valuation/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(calcForm),
      });
      setCalcResult(await res.json());
    } catch (err) { console.error('Calculation error:', err); }
    finally { setIsCalculating(false); }
  };

  // ── Auth ───────────────────────────────────────────────────────────────────
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');
    const endpoint = authMode === 'login' ? 'login' : 'signup';
    try {
      const res  = await fetch(`${API_BASE}/auth/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authForm),
      });
      const data = await res.json();
      if (!res.ok) { setAuthError(data.error || 'Authentication failed.'); return; }

      if (authMode === 'signup') {
        // After signup → redirect to login with success message
        setAuthMode('login');
        setAuthSuccess(`Account created successfully! Sign in to continue, ${data.name}.`);
        setAuthForm({ email: authForm.email, password: '', name: '', role: 'Buyer' });
      } else {
        // Login → go to dashboard
        setUser({ ...data, currency: 'USD' });
        setAuthMode('app');
        setActiveTab('dashboard');
      }
    } catch { setAuthError('Connection error to backend server.'); }
  };

  const handleLogout = () => {
    setUser(null);
    setAuthMode('landing');
    setActiveTab('dashboard');
    setBookings([]);
    setSelectedProperty(null);
    setIsAddModalOpen(false);
    setAuthError('');
    setAuthSuccess('');
    setAuthForm({ email: '', password: '', name: '', role: 'Buyer' });
  };

  // ── Booking ────────────────────────────────────────────────────────────────
  const handleBookProperty = async (property) => {
    if (!user) { setAuthMode('login'); return; }
    try {
      const res = await fetch(`${API_BASE}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId: property.id || property._id,
          buyerId: user.id, buyerName: user.name, buyerEmail: user.email,
        }),
      });
      if (res.ok) {
        setSelectedProperty(null);
        fetchPropertiesAndLedger();
        fetchBookings();
        alert('Booking confirmed! Ownership reservation has been mined on the blockchain ledger.');
      } else {
        const data = await res.json();
        alert(`Booking failed: ${data.error}`);
      }
    } catch { alert('Network error confirming booking.'); }
  };

  // ── Admin vetting ──────────────────────────────────────────────────────────
  const handleVetProperty = async (propertyId, titleVerified, vetAnomalies) => {
    setIsVetting(true);
    try {
      const res = await fetch(`${API_BASE}/properties/${propertyId}/vet`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titleVerified, vetAnomalies }),
      });
      if (res.ok) {
        setSelectedProperty(await res.json());
        fetchPropertiesAndLedger();
        alert('Admin Vetting Action Completed! Ledger mined and listing records updated.');
      } else { alert('Failed to complete vetting actions.'); }
    } catch { alert('Network error executing admin commands.'); }
    finally { setIsVetting(false); }
  };

  // ── Add property ───────────────────────────────────────────────────────────
  const handleAddPropertySubmit = async (e) => {
    e.preventDefault();
    try {
      const defaultImages = [
        'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?auto=format&fit=crop&w=800&q=80',
      ];
      const payload = {
        ...addForm,
        ownerName: user?.name || 'Unknown',
        imageUrl: addForm.imageUrl || defaultImages[Math.floor(Math.random() * defaultImages.length)],
      };
      const res = await fetch(`${API_BASE}/properties`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setIsAddModalOpen(false);
        setAddForm({ title: '', description: '', location: 'Suburbs', sqft: 1500, bedrooms: 3, bathrooms: 2, age: 5, condition: 'Good', amenities: [], listingPrice: 320000, titleVerified: true, imageUrl: '' });
        fetchPropertiesAndLedger();
      }
    } catch (err) { console.error('Error listing property:', err); }
  };

  // ── Amenity toggles ────────────────────────────────────────────────────────
  const toggleAddAmenity = (amenity) => {
    const arr = [...addForm.amenities];
    const i   = arr.indexOf(amenity);
    if (i === -1) arr.push(amenity); else arr.splice(i, 1);
    setAddForm({ ...addForm, amenities: arr });
  };
  const toggleCalcAmenity = (amenity) => {
    const arr = [...calcForm.amenities];
    const i   = arr.indexOf(amenity);
    if (i === -1) arr.push(amenity); else arr.splice(i, 1);
    setCalcForm({ ...calcForm, amenities: arr });
  };

  // ── Dashboard helpers ──────────────────────────────────────────────────────
  const totalVerified  = properties.filter(p => p.blockchainTxHash).length;
  const totalAnomalies = properties.filter(p => p.anomalies?.isSuspicious).length;
  const avgSqftPrice   = properties.length > 0
    ? Math.round(properties.reduce((s, p) => s + (p.valuation?.pricePerSqft || 0), 0) / properties.length)
    : 0;

  // ── SVG Trend Chart ────────────────────────────────────────────────────────
  const renderTrendChart = () => {
    const trendData = marketTrends[calcForm.location] || [];
    if (!trendData.length) return null;
    const W = 500, H = 180, P = 35;
    const prices = trendData.map(d => d.pricePerSqft);
    const minVal = Math.min(...prices) * 0.95;
    const maxVal = Math.max(...prices) * 1.05;
    const getX = i => P + (i / (trendData.length - 1)) * (W - 2 * P);
    const getY = v => H - P - ((v - minVal) / (maxVal - minVal)) * (H - 2 * P);
    let dPath = `M ${getX(0)} ${getY(trendData[0].pricePerSqft)}`;
    for (let i = 1; i < trendData.length; i++) dPath += ` L ${getX(i)} ${getY(trendData[i].pricePerSqft)}`;
    const dArea = `${dPath} L ${getX(trendData.length - 1)} ${H - P} L ${getX(0)} ${H - P} Z`;
    return (
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto' }}>
        <defs>
          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#06B6D4" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 0.25, 0.5, 0.75, 1].map((r, i) => {
          const v = minVal + r * (maxVal - minVal);
          return (
            <g key={i}>
              <line x1={P} y1={getY(v)} x2={W - P} y2={getY(v)} stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />
              <text x={P - 5} y={getY(v) + 4} fill="#6B7280" fontSize="10" textAnchor="end">${Math.round(v)}</text>
            </g>
          );
        })}
        <path d={dArea} fill="url(#chartGradient)" />
        <path d={dPath} fill="none" stroke="#06B6D4" strokeWidth="3" strokeLinecap="round" />
        {trendData.map((d, i) => (
          <g key={i}>
            <circle cx={getX(i)} cy={getY(d.pricePerSqft)} r="4" fill="#080511" stroke="#06B6D4" strokeWidth="2.5" />
            <text x={getX(i)} y={H - 10} fill="#9CA3AF" fontSize="10" textAnchor="middle">{d.year}</text>
          </g>
        ))}
      </svg>
    );
  };

  const getGaugeRotation = (rating) => {
    const map = { 'Strong Buy': -72, 'Buy': -36, 'Hold / Fair Value': 0, 'Neutral / Overpriced': 36, 'Strong Sell': 72 };
    return map[rating] ?? 0;
  };

  // Current currency meta
  const activeCurrency = CURRENCIES.find(c => c.code === (user?.currency || 'USD')) || CURRENCIES[0];

  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div className="glass-container">

      {/* ── NAVBAR ─────────────────────────────────────────────────────────── */}
      <header className="glass-navbar">
        <div className="nav-logo" style={{ cursor: 'pointer' }} onClick={() => { if (!user) setAuthMode('landing'); }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="url(#logoGrad)" strokeWidth="3">
            <defs>
              <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8B5CF6" /><stop offset="100%" stopColor="#06B6D4" />
              </linearGradient>
            </defs>
            <path d="M3 21h18M3 10l9-7 9 7v9H3V10z" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M9 21V12h6v9" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          PropAI
        </div>

        {user ? (
          <>
            <nav className="nav-links">
              {['dashboard','properties','valuation','ledger','bookings','profile'].map(tab => (
                <button
                  key={tab}
                  className={`nav-link ${activeTab === tab ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab === 'bookings'
                    ? (user.role === 'Buyer' ? 'My Bookings' : user.role === 'Seller' ? 'Sales Ledger' : 'Global Bookings')
                    : tab === 'profile' ? '👤 Profile'
                    : tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </nav>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {/* Currency pill */}
              <div className="currency-pill" title={`Displaying prices in ${activeCurrency.name}`}>
                {ratesLoading ? '…' : `${activeCurrency.symbol} ${activeCurrency.code}`}
              </div>

              {(user.role === 'Seller' || user.role === 'Admin') && (
                <button className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }} onClick={() => setIsAddModalOpen(true)}>
                  + Add Listing
                </button>
              )}

              <div className="user-profile-badge">
                <span className={`role-indicator role-${user.role.toLowerCase()}`}>{user.role}</span>
                <span style={{ fontWeight: 600 }}>{user.name}</span>
              </div>

              <button className="btn btn-logout" onClick={handleLogout}>
                ⏻ Logout
              </button>
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn btn-secondary" onClick={() => setAuthMode('login')}>Login</button>
            <button className="btn btn-primary" onClick={() => setAuthMode('signup')}>Sign Up</button>
          </div>
        )}
      </header>

      {/* ── LANDING ────────────────────────────────────────────────────────── */}
      {!user && authMode === 'landing' && (
        <div>
          <section className="landing-hero">
            <span className="badge badge-info" style={{ marginBottom: '1.5rem', padding: '0.5rem 1.2rem', fontSize: '0.8rem' }}>AI + Blockchain Vetted Appraisals</span>
            <h1 className="hero-tagline">Secure Real Estate Appraisals & Verified Title Deed Reserves</h1>
            <p className="hero-subtitle">
              PropAI uses localized neural pricing estimators and secure block registries to audit listing validity, calculate 5-year ROI forecasts, and reservation logs instantly.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button className="btn btn-primary" style={{ padding: '0.9rem 2rem', fontSize: '1.05rem' }} onClick={() => setAuthMode('signup')}>
                Register Vetted Account
              </button>
              <button className="btn btn-secondary" style={{ padding: '0.9rem 2rem', fontSize: '1.05rem' }} onClick={() => setAuthMode('login')}>
                Portal Login
              </button>
            </div>
            <div className="features-grid" style={{ width: '100%', maxWidth: '1100px' }}>
              {[
                { badge: 'Valuation Models', title: 'AI Price Forecasting', desc: 'Input coordinates, conditions, and custom specifications to generate neighborhood pricing appraisals and projected ROI lines.' },
                { badge: 'Audit Scans', title: 'Listing Anomaly Flags', desc: 'Our anomaly detector filters listings for fake dimensions, missing verification certificates, and suspicious cost layouts.' },
                { badge: 'Cryptographic Deeds', title: 'On-Chain Verification', desc: 'Deed ownerships and title reservation receipts are structured cryptographically into blocks using SHA-256 signatures.' },
              ].map(f => (
                <div key={f.title} className="glass-card" style={{ padding: '2rem' }}>
                  <span className="feature-badge">{f.badge}</span>
                  <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem' }}>{f.title}</h3>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', lineHeight: '1.5' }}>{f.desc}</p>
                </div>
              ))}
            </div>
          </section>
          <section className="glass-card" style={{ padding: '3rem', margin: '4rem auto 2rem auto', maxWidth: '1000px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.75rem', marginBottom: '1rem' }}>Secure Your Real Estate Acquisitions</h2>
            <p style={{ color: 'var(--color-text-muted)', maxWidth: '650px', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '2rem' }}>
              "PropAI simplifies title checks. I checked the valuation projection, reviewed the blockchain registry block logs, and reserved the villa in under 150 milliseconds."
            </p>
            <div>
              <strong style={{ display: 'block', color: 'white' }}>Vitalik Buterin</strong>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-secondary)' }}>PropAI Platinum Buyer</span>
            </div>
          </section>
        </div>
      )}

      {/* ── LOGIN / SIGNUP ──────────────────────────────────────────────────── */}
      {!user && (authMode === 'login' || authMode === 'signup') && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem 1rem' }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '480px', padding: '2.5rem 2rem' }}>
            <h2 style={{ fontSize: '1.8rem', marginBottom: '0.5rem', fontFamily: 'Outfit', textAlign: 'center' }}>
              {authMode === 'login' ? 'Welcome Back' : 'Create Vetted Profile'}
            </h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', textAlign: 'center', marginBottom: '2rem' }}>
              {authMode === 'login' ? 'Access your real estate analytics vault.' : 'Configure your account to get on-chain titles.'}
            </p>

            {authError && (
              <div style={{ padding: '0.75rem 1rem', background: 'rgba(239,68,68,0.05)', border: '1px solid var(--error-border)', color: '#FCA5A5', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                {authError}
              </div>
            )}

            {authSuccess && (
              <div style={{ padding: '0.75rem 1rem', background: 'rgba(16,185,129,0.05)', border: '1px solid var(--success-border)', color: 'var(--success-text)', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                ✓ {authSuccess}
              </div>
            )}

            <form onSubmit={handleAuthSubmit}>
              {authMode === 'signup' && (
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input type="text" required className="form-control" placeholder="e.g. John Doe"
                    value={authForm.name} onChange={e => setAuthForm({ ...authForm, name: e.target.value })} />
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input type="email" required className="form-control" placeholder="e.g. buyer@propai.com"
                  value={authForm.email} onChange={e => setAuthForm({ ...authForm, email: e.target.value })} />
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <input type="password" required className="form-control" placeholder="••••••••"
                  value={authForm.password} onChange={e => setAuthForm({ ...authForm, password: e.target.value })} />
              </div>

              {/* ── Role selection (signup only) ── */}
              {authMode === 'signup' && (
                <div className="form-group">
                  <label className="form-label">Account Role Type</label>
                  <div className="role-selection-grid">
                    {['Buyer', 'Seller'].map(roleOpt => (
                      <div key={roleOpt} className={`role-card ${authForm.role === roleOpt ? 'selected' : ''}`}
                        onClick={() => setAuthForm({ ...authForm, role: roleOpt })}>
                        <div className="role-title">{roleOpt}</div>
                        <div className="role-desc">{roleOpt === 'Buyer' ? 'Acquire & Book' : 'List & Sell'}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.8rem', marginTop: '1rem' }}>
                {authMode === 'login' ? 'Sign In to Portal' : 'Register New Vetted Profile'}
              </button>
            </form>

            <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.85rem' }}>
              {authMode === 'login' ? (
                <span style={{ color: 'var(--color-text-muted)' }}>
                  Don't have an account?{' '}
                  <a style={{ color: 'var(--color-secondary)', cursor: 'pointer', fontWeight: 600 }}
                    onClick={() => { setAuthMode('signup'); setAuthError(''); setAuthSuccess(''); }}>Sign Up</a>
                </span>
              ) : (
                <span style={{ color: 'var(--color-text-muted)' }}>
                  Already have an account?{' '}
                  <a style={{ color: 'var(--color-secondary)', cursor: 'pointer', fontWeight: 600 }}
                    onClick={() => { setAuthMode('login'); setAuthError(''); setAuthSuccess(''); }}>Log In</a>
                </span>
              )}
            </div>

            <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.04)', fontSize: '0.8rem' }}>
              <strong style={{ color: 'white', display: 'block', marginBottom: '0.5rem' }}>Quick-Test Seed Accounts:</strong>
              <ul style={{ paddingLeft: '1.1rem', color: 'var(--color-text-muted)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <li>Buyer: <code>buyer@propai.com</code> / <code>password</code></li>
                <li>Seller: <code>seller@propai.com</code> / <code>password</code></li>
                <li>Admin: <code>admin@propai.com</code> / <code>password</code></li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ── AUTHENTICATED PORTAL ────────────────────────────────────────────── */}
      {user && (
        <>
          {/* ── DASHBOARD ── */}
          {activeTab === 'dashboard' && (
            <div className="dashboard-grid">
              <div className="col-4 glass-card">
                <h4 style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Database Listings</h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontSize: '2.5rem', fontWeight: 800 }}>{properties.length}</span>
                  <span className="badge badge-info">Vetted Listings</span>
                </div>
              </div>
              <div className="col-4 glass-card">
                <h4 style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Blockchain Title Deeds</h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--success-text)' }}>{totalVerified}</span>
                  <span className="badge badge-success">On-Chain Verified</span>
                </div>
              </div>
              <div className="col-4 glass-card">
                <h4 style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '0.5rem' }}>System Bookings</h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--color-secondary)' }}>{bookings.length}</span>
                  <span className="badge badge-success" style={{ background: 'rgba(6,182,212,0.15)', color: 'var(--color-secondary)', borderColor: 'rgba(6,182,212,0.3)' }}>Confirmed</span>
                </div>
              </div>

              <div className="col-8 glass-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.25rem' }}>Location Market Price Trends</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Historical price per sqft (USD)</p>
                  </div>
                  <select className="form-control" style={{ width: '150px', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                    value={calcForm.location} onChange={e => setCalcForm({ ...calcForm, location: e.target.value })}>
                    {['Downtown','Beachfront','Uptown','Suburbs','Rural'].map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                {renderTrendChart()}
              </div>

              <div className="col-4 glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>PropAI Market Diagnostics</h3>
                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
                    <li style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                      <span style={{ color: 'var(--color-text-muted)' }}>Avg Price / Sqft:</span>
                      <span style={{ fontWeight: 600 }}>${avgSqftPrice}</span>
                    </li>
                    <li style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                      <span style={{ color: 'var(--color-text-muted)' }}>Mined Blocks:</span>
                      <span style={{ fontWeight: 600, color: 'var(--color-secondary)' }}>{ledger.length} Blocks</span>
                    </li>
                    <li style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                      <span style={{ color: 'var(--color-text-muted)' }}>Anomalies Warning:</span>
                      <span style={{ fontWeight: 600, color: totalAnomalies > 0 ? 'var(--error-text)' : 'var(--success-text)' }}>{totalAnomalies} Flags</span>
                    </li>
                    <li style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--color-text-muted)' }}>Valuation Accuracy:</span>
                      <span style={{ fontWeight: 600, color: 'var(--success-text)' }}>98.2% Confidence</span>
                    </li>
                  </ul>
                </div>
                <button className="btn btn-secondary" style={{ width: '100%', marginTop: '1.5rem' }} onClick={() => setActiveTab('valuation')}>
                  Launch AI Estimator
                </button>
              </div>

              <div className="col-12">
                <h3 style={{ fontSize: '1.5rem', marginBottom: '1.25rem' }}>Featured Real Estate Listings</h3>
                <div className="property-cards-grid">
                  {properties.slice(0, 3).map((p, idx) => (
                    <PropertyCard key={p.id || idx} property={p} formatPrice={formatPrice} onClick={() => setSelectedProperty(p)} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── PROPERTIES EXPLORER ── */}
          {activeTab === 'properties' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.75rem' }}>Property Register Explorer</h2>
                  <p style={{ color: 'var(--color-text-muted)' }}>Vetted databases and blockchain receipts.</p>
                </div>
              </div>
              <div className="property-cards-grid">
                {properties.map((p, idx) => (
                  <PropertyCard key={p.id || idx} property={p} formatPrice={formatPrice} onClick={() => setSelectedProperty(p)} />
                ))}
              </div>
            </div>
          )}

          {/* ── AI VALUATION ── */}
          {activeTab === 'valuation' && (
            <div className="dashboard-grid">
              <div className="col-12">
                <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>AI-Powered Property Valuation Simulator</h2>
                <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>Input property specifications to calculate fair market values and estimate growth potentials.</p>
              </div>

              <div className="col-6 glass-card">
                <h3 style={{ fontSize: '1.2rem', marginBottom: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>Inputs</h3>
                <form onSubmit={handleCalculate}>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Location District</label>
                      <select className="form-control" value={calcForm.location} onChange={e => setCalcForm({ ...calcForm, location: e.target.value })}>
                        <option value="Downtown">Downtown (Core Metro)</option>
                        <option value="Beachfront">Beachfront (Premium Coast)</option>
                        <option value="Uptown">Uptown (Residential Urban)</option>
                        <option value="Suburbs">Suburbs (Family Outskirts)</option>
                        <option value="Rural">Rural (Countryside)</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Property Age (Years)</label>
                      <input type="number" className="form-control" value={calcForm.age} onChange={e => setCalcForm({ ...calcForm, age: parseInt(e.target.value) || 0 })} />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Built Area (SqFt)</label>
                      <input type="number" className="form-control" value={calcForm.sqft} onChange={e => setCalcForm({ ...calcForm, sqft: parseInt(e.target.value) || 0 })} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Structural Condition</label>
                      <select className="form-control" value={calcForm.condition} onChange={e => setCalcForm({ ...calcForm, condition: e.target.value })}>
                        {['Excellent','Good','Fair','Needs Work'].map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Bedrooms</label>
                      <input type="number" className="form-control" value={calcForm.bedrooms} onChange={e => setCalcForm({ ...calcForm, bedrooms: parseInt(e.target.value) || 0 })} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Bathrooms</label>
                      <input type="number" step="0.5" className="form-control" value={calcForm.bathrooms} onChange={e => setCalcForm({ ...calcForm, bathrooms: parseFloat(e.target.value) || 0 })} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Target Asking Price (USD)</label>
                    <input type="number" className="form-control" value={calcForm.listingPrice} onChange={e => setCalcForm({ ...calcForm, listingPrice: parseInt(e.target.value) || 0 })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Amenities</label>
                    <div className="amenities-checkbox-grid">
                      {['Pool','Gym','Garden','Smart_Home','Garage'].map(a => (
                        <label key={a} className={`checkbox-card ${calcForm.amenities.includes(a) ? 'selected' : ''}`}>
                          <input type="checkbox" checked={calcForm.amenities.includes(a)} onChange={() => toggleCalcAmenity(a)} />
                          {a.replace('_', ' ')}
                        </label>
                      ))}
                    </div>
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={isCalculating}>
                    {isCalculating ? 'Computing Models...' : 'Calculate Property Valuation'}
                  </button>
                </form>
              </div>

              <div className="col-6 glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <h3 style={{ fontSize: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>AI Appraisal Analysis</h3>
                {calcResult ? (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Appraised Fair Value</span>
                        <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-secondary)', marginTop: '0.25rem' }}>
                          {formatPrice(calcResult.valuation?.estimatedValue)}
                        </div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                          {formatPrice(calcResult.valuation?.pricePerSqft)}/sqft avg
                        </span>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Confidence Index</span>
                        <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--success-text)', marginTop: '0.25rem' }}>
                          {calcResult.valuation?.confidenceScore}%
                        </div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Based on parameters</span>
                      </div>
                    </div>
                    <div className="gauge-wrapper">
                      <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Investment Recommendation</span>
                      <div style={{ position: 'relative', width: '200px', height: '110px' }}>
                        <svg className="gauge-svg" viewBox="0 0 200 100">
                          <defs>
                            <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="0%" stopColor="#EF4444" /><stop offset="35%" stopColor="#F59E0B" />
                              <stop offset="65%" stopColor="#10B981" /><stop offset="100%" stopColor="#06B6D4" />
                            </linearGradient>
                          </defs>
                          <path d="M 20 90 A 80 80 0 0 1 180 90" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="15" strokeLinecap="round" />
                          <path d="M 20 90 A 80 80 0 0 1 180 90" fill="none" stroke="url(#gaugeGrad)" strokeWidth="15" strokeLinecap="round" />
                          <g className="gauge-needle" style={{ transform: `rotate(${getGaugeRotation(calcResult.recommendation?.rating)}deg)` }}>
                            <polygon points="98,90 102,90 100,20" fill="#FFF" />
                            <circle cx="100" cy="90" r="6" fill="#FFF" />
                          </g>
                        </svg>
                      </div>
                      <div style={{ textAlign: 'center', marginTop: '-15px' }}>
                        <div style={{ fontSize: '1.35rem', fontWeight: 800 }}>{calcResult.recommendation?.rating}</div>
                        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', maxWidth: '280px', margin: '0.5rem auto 0' }}>
                          {calcResult.recommendation?.explanation}
                        </p>
                      </div>
                    </div>
                    <div>
                      <h4 style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                        AI Appreciation Forecast (+{calcResult.valuation?.growthRatePercent}% YoY)
                      </h4>
                      <table className="custom-table" style={{ fontSize: '0.85rem' }}>
                        <thead><tr><th>Year</th><th>Projected Value</th><th>Net Gain</th></tr></thead>
                        <tbody>
                          {calcResult.valuation?.projectedAppreciation?.map(proj => {
                            const gain = proj.value - calcResult.valuation.estimatedValue;
                            return (
                              <tr key={proj.year}>
                                <td>{proj.year}</td>
                                <td style={{ fontWeight: 600, color: 'white' }}>{formatPrice(proj.value)}</td>
                                <td style={{ color: 'var(--success-text)' }}>+{formatPrice(gain)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </>
                ) : (
                  <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--color-text-muted)' }}>Fill inputs and run the simulator.</div>
                )}
              </div>
            </div>
          )}

          {/* ── BLOCKCHAIN LEDGER ── */}
          {activeTab === 'ledger' && (
            <div className="dashboard-grid">
              <div className="col-7 glass-card">
                <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Title Registry Blockchain Ledger</h2>
                <p style={{ color: 'var(--color-text-muted)', marginBottom: '2.5rem' }}>Cryptographic blocks proving deeds and purchase bookings registered globally.</p>
                <div className="blockchain-ledger-flow">
                  {ledger.map(block => {
                    const isGenesis = block.index === 0;
                    return (
                      <div key={block.index} className={`glass-card ledger-block ${isGenesis ? 'genesis' : ''}`}
                        style={{ cursor: 'pointer', padding: '1rem 1.25rem' }}
                        onClick={() => setSelectedProperty({
                          title: isGenesis ? 'Genesis Ledger Initializer' : block.data?.propertyName,
                          description: isGenesis ? 'Genesis record creating the PropAI cryptographic chain.' : `Blockchain transaction proof for: ${block.data?.propertyName}.`,
                          ownerName: isGenesis ? 'System Core' : block.data?.ownerName,
                          listingPrice: isGenesis ? 0 : block.data?.purchasePrice,
                          blockchainTxHash: block.hash,
                          blockchainBlockIndex: block.index,
                          customBlockDetails: block,
                        })}>
                        <div className="ledger-header">
                          <span style={{ fontWeight: 700, fontSize: '1.05rem', color: isGenesis ? 'var(--color-accent)' : 'white' }}>
                            Block #{block.index} {isGenesis ? '(Genesis)' : ''}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                            {new Date(block.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                          <span style={{ color: 'var(--color-text-muted)' }}>
                            {isGenesis ? 'Chain Initiated' : `Registration Type: ${block.data?.registrationType || 'Deed'}`}
                          </span>
                          <span className="hash-text">{block.hash.substring(0, 10)}...{block.hash.slice(-8)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="col-5 glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <h3 style={{ fontSize: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>Ledger Diagnostics</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.85rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Consensus</span>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '0.25rem' }}>Proof of Work</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.85rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Ledger Blocks</span>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '0.25rem' }}>{ledger.length} Mined</div>
                  </div>
                </div>
                <div style={{ padding: '1rem', background: 'rgba(16,185,129,0.05)', border: '1px solid var(--success-border)', borderRadius: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success-text)', fontWeight: 700, fontSize: '0.95rem' }}>
                    <span style={{ width: '8px', height: '8px', background: 'var(--success-text)', borderRadius: '50%', boxShadow: '0 0 8px var(--success-text)', display: 'inline-block' }}></span>
                    Chain Cryptographically Intact
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.4rem' }}>
                    Ledger validation sequence completed successfully.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── BOOKINGS ── */}
          {activeTab === 'bookings' && (
            <div className="glass-card">
              <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
                {user.role === 'Buyer' ? 'My Property Bookings' : user.role === 'Seller' ? 'Property Sales Reservations' : 'Global Reservation Registry'}
              </h2>
              <p style={{ color: 'var(--color-text-muted)', marginBottom: '2.5rem' }}>
                {user.role === 'Buyer' ? 'List of deeds and properties you reserved under escrow.' : 'List of your property assets currently booked or reserved by buyers.'}
              </p>
              {bookings.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--color-text-muted)' }}>No reservations or booking transactions found.</div>
              ) : (
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Property Details</th><th>Buyer Details</th>
                      <th>Transaction Value</th><th>Booking Date</th><th>Blockchain Tx Receipt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((b, idx) => (
                      <tr key={b.id || idx}>
                        <td>
                          <strong style={{ color: 'white' }}>{b.propertyTitle}</strong>
                          <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{b.propertyLocation}</span>
                        </td>
                        <td>
                          <span style={{ display: 'block', fontWeight: 600 }}>{b.buyerName}</span>
                          <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{b.buyerEmail}</span>
                        </td>
                        <td style={{ fontWeight: 700, color: 'var(--color-secondary)' }}>{formatPrice(b.price)}</td>
                        <td style={{ fontSize: '0.85rem' }}>{new Date(b.bookingDate).toLocaleDateString()}</td>
                        <td>
                          <span className="hash-text" title={b.blockchainTxHash}>
                            {b.blockchainTxHash?.substring(0, 10)}...{b.blockchainTxHash?.slice(-8)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* ── PROFILE PAGE ── */}
          {activeTab === 'profile' && (
            <div className="dashboard-grid">
              <div className="col-12">
                <h2 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>My Profile</h2>
                <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>Manage your account details and preferences.</p>
              </div>

              {/* Profile info card */}
              <div className="col-6 glass-card">
                <div className="profile-avatar-row">
                  <div className="profile-avatar">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.4rem', marginBottom: '0.25rem' }}>{user.name}</h3>
                    <span className={`role-indicator role-${user.role.toLowerCase()}`}>{user.role}</span>
                  </div>
                </div>

                <div className="profile-info-list">
                  <div className="profile-info-row">
                    <span className="profile-info-label">Email</span>
                    <span className="profile-info-value">{user.email}</span>
                  </div>
                  <div className="profile-info-row">
                    <span className="profile-info-label">Role</span>
                    <span className="profile-info-value">{user.role}</span>
                  </div>
                  <div className="profile-info-row">
                    <span className="profile-info-label">User ID</span>
                    <span className="profile-info-value" style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--color-secondary)' }}>{user.id}</span>
                  </div>
                  <div className="profile-info-row">
                    <span className="profile-info-label">Display Currency</span>
                    <span className="profile-info-value">{activeCurrency.symbol} {activeCurrency.code} — {activeCurrency.name}</span>
                  </div>
                  {user.role === 'Buyer' && (
                    <div className="profile-info-row">
                      <span className="profile-info-label">Total Bookings</span>
                      <span className="profile-info-value">{bookings.length}</span>
                    </div>
                  )}
                </div>

                <button className="btn btn-logout" style={{ width: '100%', marginTop: '2rem', padding: '0.75rem' }} onClick={handleLogout}>
                  ⏻ Sign Out of Portal
                </button>
              </div>

              {/* Currency preference card */}
              <div className="col-6 glass-card">
                <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Currency Preference</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
                  All property prices, valuations, and booking amounts will be displayed in your selected currency using live ECB exchange rates.
                </p>

                <div className="currency-grid">
                  {CURRENCIES.map(c => (
                    <div
                      key={c.code}
                      className={`currency-card ${user.currency === c.code ? 'selected' : ''}`}
                      onClick={() => setUser({ ...user, currency: c.code })}
                    >
                      <span className="currency-symbol">{c.symbol}</span>
                      <span className="currency-code">{c.code}</span>
                    </div>
                  ))}
                </div>

                {/* Rate info */}
                <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase', fontWeight: 600 }}>
                    Live Rate: 1 USD =
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.4rem' }}>
                    {CURRENCIES.filter(c => c.code !== 'USD').map(c => (
                      <div key={c.code} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', padding: '0.3rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <span style={{ color: 'var(--color-text-muted)' }}>{c.code}</span>
                        <span style={{ fontWeight: 600, color: user.currency === c.code ? 'var(--color-secondary)' : 'white' }}>
                          {ratesLoading ? '…' : (exchangeRates[c.code] ?? '—')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Activity summary */}
              {user.role === 'Buyer' && bookings.length > 0 && (
                <div className="col-12 glass-card">
                  <h3 style={{ fontSize: '1.2rem', marginBottom: '1.25rem' }}>Recent Booking Activity</h3>
                  <table className="custom-table" style={{ fontSize: '0.85rem' }}>
                    <thead><tr><th>Property</th><th>Location</th><th>Value</th><th>Date</th></tr></thead>
                    <tbody>
                      {bookings.slice(0, 5).map((b, i) => (
                        <tr key={i}>
                          <td><strong style={{ color: 'white' }}>{b.propertyTitle}</strong></td>
                          <td style={{ color: 'var(--color-text-muted)' }}>{b.propertyLocation}</td>
                          <td style={{ fontWeight: 700, color: 'var(--color-secondary)' }}>{formatPrice(b.price)}</td>
                          <td>{new Date(b.bookingDate).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ── PROPERTY DETAIL MODAL ───────────────────────────────────────────── */}
      {selectedProperty && (
        <div className="modal-overlay" onClick={() => setSelectedProperty(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.75rem' }}>
              <h2 style={{ fontSize: '1.4rem' }}>Audit Vetting Dashboard</h2>
              <button className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem' }} onClick={() => setSelectedProperty(null)}>✕ Close</button>
            </div>

            {selectedProperty.imageUrl && (
              <img src={selectedProperty.imageUrl} alt={selectedProperty.title}
                style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '12px', marginBottom: '1.25rem' }} />
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.5rem' }}>
              <h3 style={{ fontSize: '1.35rem' }}>{selectedProperty.title}</h3>
              {selectedProperty.listingPrice > 0 && (
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-secondary)' }}>
                    {formatPrice(selectedProperty.listingPrice)}
                  </span>
                  {user?.currency !== 'USD' && (
                    <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                      ${selectedProperty.listingPrice?.toLocaleString()} USD
                    </span>
                  )}
                </div>
              )}
            </div>

            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', display: 'block', marginBottom: '1.25rem' }}>{selectedProperty.description}</span>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
              <div className="glass-card" style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)' }}>
                <h4 style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Property Info</h4>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem' }}>
                  <li>Location: <strong>{selectedProperty.location || 'N/A'}</strong></li>
                  <li>Area Size: <strong>{selectedProperty.sqft || 0} sqft</strong></li>
                  <li>Layout: <strong>{selectedProperty.bedrooms || 0} Bed / {selectedProperty.bathrooms || 0} Bath</strong></li>
                  <li>Amenities: <strong>{selectedProperty.amenities?.join(', ') || 'None'}</strong></li>
                </ul>
              </div>
              <div className="glass-card" style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)' }}>
                <h4 style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>AI Diagnostics</h4>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem' }}>
                  <li>Appraised Value: <strong>{formatPrice(selectedProperty.valuation?.estimatedValue)}</strong></li>
                  <li>Confidence: <strong>{selectedProperty.valuation?.confidenceScore || 0}%</strong></li>
                  <li>Recommendation: <strong style={{ color: 'var(--color-secondary)' }}>{selectedProperty.recommendation?.rating || 'N/A'}</strong></li>
                  <li>Anomaly Alert: <strong style={{ color: selectedProperty.anomalies?.isSuspicious ? 'var(--error-text)' : 'var(--success-text)' }}>{selectedProperty.anomalies?.status || 'Clear'}</strong></li>
                </ul>
              </div>
            </div>

            {selectedProperty.blockchainTxHash ? (
              <div style={{ background: 'rgba(6,182,212,0.05)', border: '1px solid rgba(6,182,212,0.3)', borderRadius: '12px', padding: '1rem', marginBottom: '1.5rem' }}>
                <h4 style={{ color: 'var(--color-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: 700 }}>
                  ✓ Cryptographic Verification Receipt
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.8rem' }}>
                  <div>Block Registration Index: <strong>Block #{selectedProperty.blockchainBlockIndex}</strong></div>
                  <div>Record Owner Entity: <strong>{selectedProperty.ownerName || 'Verified Registrant'}</strong></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>Block Signature Hash:</span>
                    <span className="hash-text" style={{ fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis' }}>{selectedProperty.blockchainTxHash}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '12px', padding: '1rem', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                <strong>⚠ Unverified Real Estate Listing</strong>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                  This property does not have a recorded deed on the blockchain.
                </p>
              </div>
            )}

            {user && (
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.25rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                {user.role === 'Buyer' && (
                  <button className="btn btn-accent" disabled={selectedProperty.isBooked} onClick={() => handleBookProperty(selectedProperty)}>
                    {selectedProperty.isBooked ? 'Already Reserved' : 'Book Property (Escrow Reservation)'}
                  </button>
                )}
                {user.role === 'Admin' && (
                  <div style={{ display: 'flex', gap: '0.75rem', width: '100%', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                      <strong>Admin Console:</strong> Select actions to vet and audit parameters.
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {!selectedProperty.titleVerified && (
                        <button className="btn btn-primary" disabled={isVetting}
                          onClick={() => handleVetProperty(selectedProperty.id || selectedProperty._id, true, false)}>
                          Verify Deed On-Chain
                        </button>
                      )}
                      {selectedProperty.anomalies?.isSuspicious && (
                        <button className="btn btn-secondary" disabled={isVetting}
                          onClick={() => handleVetProperty(selectedProperty.id || selectedProperty._id, false, true)}>
                          Clear Anomalies
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {selectedProperty.customBlockDetails && (
              <div style={{ marginTop: '1.25rem', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <h4 style={{ color: 'white', fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Raw Block Metadata</h4>
                <pre style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--color-text-muted)', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                  {JSON.stringify(selectedProperty.customBlockDetails, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── ADD LISTING MODAL ───────────────────────────────────────────────── */}
      {isAddModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.75rem' }}>
              <h2 style={{ fontSize: '1.4rem' }}>Publish Vetted Deed Listing</h2>
              <button className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem' }} onClick={() => setIsAddModalOpen(false)}>✕ Close</button>
            </div>
            <form onSubmit={handleAddPropertySubmit}>
              <div className="form-group">
                <label className="form-label">Property Title</label>
                <input type="text" required className="form-control" placeholder="e.g. Waterfront Premium Studio"
                  value={addForm.title} onChange={e => setAddForm({ ...addForm, title: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Description Details</label>
                <textarea className="form-control" rows="3" placeholder="Enter details on rooms, building specs, unique features..."
                  value={addForm.description} onChange={e => setAddForm({ ...addForm, description: e.target.value })} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">District Location</label>
                  <select className="form-control" value={addForm.location} onChange={e => setAddForm({ ...addForm, location: e.target.value })}>
                    {['Downtown','Beachfront','Uptown','Suburbs','Rural'].map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Age of Building (Years)</label>
                  <input type="number" className="form-control" value={addForm.age} onChange={e => setAddForm({ ...addForm, age: parseInt(e.target.value) || 0 })} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Area (SqFt)</label>
                  <input type="number" required className="form-control" value={addForm.sqft} onChange={e => setAddForm({ ...addForm, sqft: parseInt(e.target.value) || 0 })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Structure Condition</label>
                  <select className="form-control" value={addForm.condition} onChange={e => setAddForm({ ...addForm, condition: e.target.value })}>
                    {['Excellent','Good','Fair','Needs Work'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Bedrooms</label>
                  <input type="number" required className="form-control" value={addForm.bedrooms} onChange={e => setAddForm({ ...addForm, bedrooms: parseInt(e.target.value) || 0 })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Bathrooms</label>
                  <input type="number" step="0.5" required className="form-control" value={addForm.bathrooms} onChange={e => setAddForm({ ...addForm, bathrooms: parseFloat(e.target.value) || 0 })} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Asking Price (USD)</label>
                <input type="number" required className="form-control" value={addForm.listingPrice} onChange={e => setAddForm({ ...addForm, listingPrice: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="form-group">
                <label className="checkbox-card selected" style={{ display: 'inline-flex', padding: '0.6rem 1rem', width: 'auto' }}>
                  <input type="checkbox" checked={addForm.titleVerified} onChange={e => setAddForm({ ...addForm, titleVerified: e.target.checked })} />
                  Verify Property Deed on Blockchain Registry
                </label>
              </div>
              <div className="form-group">
                <label className="form-label">Select Amenities</label>
                <div className="amenities-checkbox-grid">
                  {['Pool','Gym','Garden','Smart_Home','Garage'].map(a => (
                    <label key={a} className={`checkbox-card ${addForm.amenities.includes(a) ? 'selected' : ''}`}>
                      <input type="checkbox" checked={addForm.amenities.includes(a)} onChange={() => toggleAddAmenity(a)} />
                      {a.replace('_', ' ')}
                    </label>
                  ))}
                </div>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
                Mine block and Publish Property
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Property Card component (reusable) ────────────────────────────────────────
function PropertyCard({ property: p, formatPrice, onClick }) {
  return (
    <div className="glass-card property-card" onClick={onClick}>
      <div className="property-image-container">
        <img className="property-img" src={p.imageUrl} alt={p.title} />
        <div className="property-overlay-badges">
          {p.blockchainTxHash
            ? <span className="badge badge-success">✓ Verified Deed</span>
            : <span className="badge badge-warning">Unverified</span>}
          {p.isBooked
            ? <span className="badge badge-error" style={{ background: 'rgba(239,68,68,0.2)', borderColor: 'var(--error-border)', color: 'var(--error-text)' }}>Booked</span>
            : p.anomalies?.isSuspicious
              ? <span className="badge badge-error">⚠ Anomaly Flagged</span>
              : <span className="badge badge-info">{p.location}</span>}
        </div>
      </div>
      <div className="property-body">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
          <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--color-primary)', fontWeight: 600 }}>{p.location}</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Age: {p.age} yrs</span>
        </div>
        <h4 className="property-title">{p.title}</h4>
        <div className="property-price">{formatPrice(p.listingPrice)}</div>
        <div className="property-details">
          <div className="property-detail-item">🔲 {p.sqft} sqft</div>
          <div className="property-detail-item">🛏 {p.bedrooms} Bds</div>
          <div className="property-detail-item">🛁 {p.bathrooms} Bth</div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '8px', padding: '0.6rem', marginBottom: '1rem', fontSize: '0.85rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
            <span style={{ color: 'var(--color-text-muted)' }}>Appraisal Forecast:</span>
            <span style={{ fontWeight: 600, color: 'white' }}>{formatPrice(p.valuation?.estimatedValue)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--color-text-muted)' }}>Advice:</span>
            <span style={{ fontWeight: 600, color: p.recommendation?.action === 'BUY' ? 'var(--success-text)' : p.recommendation?.action === 'SELL' ? 'var(--error-text)' : 'var(--warning-text)' }}>
              {p.recommendation?.action} ({p.recommendation?.rating})
            </span>
          </div>
        </div>
        <div className="property-footer">
          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Owner: <span style={{ color: 'white' }}>{p.ownerName || 'Unknown'}</span></span>
          <button className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>Inspect Vetting</button>
        </div>
      </div>
    </div>
  );
}

export default App;

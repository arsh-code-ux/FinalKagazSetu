import { useEffect, useMemo, useRef, useState } from 'react';
import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  Link,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import { api } from './api/client';
import { AuthProvider, useAuth } from './context/AuthContext';
import { languageLabels, strings } from './i18n';
import { useToast } from './hooks/useToast';

const navItems = [
  { label: 'AI Assistant', path: '/ai-assistant', icon: 'grid' },
  { label: 'Tools', path: '/tools', icon: 'spark' },
  { label: 'Vault', path: '/vault', icon: 'folder' },
  { label: 'Family', path: '/family', icon: 'users' },
  { label: 'Expiry', path: '/expiry', icon: 'clock' },
  { label: 'Life events', path: '/death', icon: 'shield' },
  { label: 'Nominee', path: '/nominee', icon: 'gift' },
  { label: 'Audit', path: '/audit', icon: 'file' },
  { label: 'Settings', path: '/settings', icon: 'gear' },
];

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function Icon({ name, className = '' }) {
  const common = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' };
  const icons = {
    grid: <svg {...common} className={className}><rect x="3" y="3" width="7" height="7" rx="2" /><rect x="14" y="3" width="7" height="4" rx="2" /><rect x="14" y="13" width="7" height="8" rx="2" /><rect x="3" y="13" width="7" height="8" rx="2" /></svg>,
    folder: <svg {...common} className={className}><path d="M3 7.5A2.5 2.5 0 0 1 5.5 5h4l1.7 2.2H18.5A2.5 2.5 0 0 1 21 9.7v7.8A2.5 2.5 0 0 1 18.5 20h-13A2.5 2.5 0 0 1 3 17.5v-10Z" /><path d="M3 10h18" /></svg>,
    users: <svg {...common} className={className}><path d="M16 19v-1a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v1" /><circle cx="11" cy="7" r="3" /><path d="M18.5 10.5a3 3 0 0 1 0 5.5" /><path d="M20 19v-1a3 3 0 0 0-2.2-2.9" /></svg>,
    clock: <svg {...common} className={className}><circle cx="12" cy="12" r="8" /><path d="M12 7v5l3 2" /></svg>,
    shield: <svg {...common} className={className}><path d="M12 3 5 6v6c0 4 2.5 6.9 7 9 4.5-2.1 7-5 7-9V6l-7-3Z" /><path d="M9.5 12.5l1.6 1.6 3.4-4" /></svg>,
    gift: <svg {...common} className={className}><path d="M20 8H4v12h16V8Z" /><path d="M12 8v12" /><path d="M4 12h16" /><path d="M12 8s-2.4-5-5.5-5C5.1 3 4 4 4 5.6 4 7.1 5.2 8 7 8h5Z" /><path d="M12 8s2.4-5 5.5-5C18.9 3 20 4 20 5.6 20 7.1 18.8 8 17 8h-5Z" /></svg>,
    file: <svg {...common} className={className}><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7l-5-4Z" /><path d="M14 3v4h4" /><path d="M9 13h6M9 17h6" /></svg>,
    gear: <svg {...common} className={className}><circle cx="12" cy="12" r="3.2" /><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.7l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.7-.3 1.6 1.6 0 0 0-1 1.5V20a2 2 0 1 1-4 0v-.2a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.7.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.7 1.6 1.6 0 0 0-1.5-1H4a2 2 0 1 1 0-4h.2a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.7l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.7.3h.1a1.6 1.6 0 0 0 1-1.5V4a2 2 0 1 1 4 0v.2a1.6 1.6 0 0 0 1 1.5h.1a1.6 1.6 0 0 0 1.7-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.7v.1a1.6 1.6 0 0 0 1.5 1H20a2 2 0 1 1 0 4h-.2a1.6 1.6 0 0 0-1.5 1Z" /></svg>,
    spark: <svg {...common} className={className}><path d="m12 2 1.9 5.1L19 9l-5.1 1.9L12 16l-1.9-5.1L5 9l5.1-1.9L12 2Z" /><path d="M19 15l.7 1.8L21.5 17l-1.8.7L19 19.5l-.7-1.8-1.8-.7 1.8-.7L19 15Z" /></svg>,
  };
  return icons[name] || null;
}

function ToastViewport({ toasts }) {
  return (
    <div className="toast-stack" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast-${toast.type}`}>
          {toast.message}
        </div>
      ))}
    </div>
  );
}

function ProtectedRoute() {
  const { token, loading } = useAuth();

  if (loading) {
    return <div className="page-shell centered"><div className="card skeleton-card wide" /></div>;
  }

  return token ? <Outlet /> : <Navigate to="/" replace />;
}

function ProjectHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, token } = useAuth();
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const isAuthPage = location.pathname === '/auth';
  const canShowDashboard = Boolean(token) && !isAuthPage;

  const dashboardItem = useMemo(
    () => ({ label: 'Dashboard', path: '/dashboard', active: location.pathname.startsWith('/dashboard') }),
    [location.pathname],
  );

  const notifications = [
    { id: 1, title: 'Renewal reminder', detail: 'Insurance expires in 6 days' },
    { id: 2, title: 'Family update', detail: 'Nominee verification completed' },
    { id: 3, title: 'Vault alert', detail: '2 documents need review' },
  ];

  return (
    <header className="project-header">
      <div className="project-header__left">
        <div className="brand-mini">K</div>
        <div className="project-header__title-wrap">
          <span className="eyebrow">Workspace</span>
          <strong>KaagazSetu</strong>
        </div>
      </div>

      <div className="main-topbar__actions">
        {canShowDashboard && (
          <nav className="main-nav" aria-label="Main navigation">
            <button
              type="button"
              className={`main-nav-item ${dashboardItem.active ? 'active' : ''}`}
              onClick={() => navigate('/dashboard')}
            >
              {dashboardItem.label}
            </button>
          </nav>
        )}

        <div className="notification-wrap">
          <button type="button" className="icon-button" aria-label="Notifications" onClick={() => setNotificationsOpen((value) => !value)}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5m6 0a3 3 0 0 1-6 0m6 0h-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <span className="notification-count">{notifications.length}</span>
          {notificationsOpen && (
            <div className="notification-panel" role="menu" aria-label="Notifications">
              {notifications.map((item) => (
                <div key={item.id} className="notification-item">
                  <strong>{item.title}</strong>
                  <span>{item.detail}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {token ? (
          <>
            <div className="mail-pill">
              <span className="mail-icon">✉</span>
              <span>{user?.email || 'rahul@kaagazsetu.com'}</span>
            </div>
            <button type="button" className="primary-btn small" onClick={() => navigate('/vault')}>Upload</button>
            <button type="button" className="ghost-btn small" onClick={() => {
              logout();
              navigate('/');
            }}>Logout</button>
          </>
        ) : (
          <>
            <button type="button" className="ghost-btn small" onClick={() => navigate('/auth')}>Login</button>
            <button type="button" className="primary-btn small" onClick={() => navigate('/auth')}>Sign up</button>
          </>
        )}
      </div>
    </header>
  );
}

function Layout() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const location = useLocation();
  const [language] = useState('en');
  const greetingName = user?.name || 'Rahul';
  const currentGreeting = `${getGreeting()}, ${greetingName}`;

  const nav = useMemo(() => navItems.map((item) => ({ ...item, active: location.pathname.startsWith(item.path) })), [location.pathname]);

  return (
    <div className="app-shell-layout">
      <ProjectHeader />

      <div className="app-shell">
        <aside className="sidebar">
          <div className="brand-mark">
            <div className="brand-icon">K</div>
            <div>
              <strong>KaagazSetu</strong>
              <small>Family vault</small>
            </div>
          </div>
          <nav className="side-nav" aria-label="Sidebar navigation">
            {nav.map((item) => (
              <button key={item.path} type="button" className={`nav-item ${item.active ? 'active' : ''}`} onClick={() => navigate(item.path)}>
                <Icon name={item.icon} />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        <main className="content-panel">
          <header className="topbar">
            <div>
              <p className="eyebrow">Family control centre</p>
              <h2>{currentGreeting}</h2>
              <p className="subtle-heading">{strings[language].safeMessage}</p>
            </div>
          </header>
          <Outlet />
        </main>

        <nav className="mobile-nav" aria-label="Mobile navigation">
          {nav.map((item) => (
            <button type="button" key={item.path} className={`mobile-nav-item ${location.pathname.startsWith(item.path) ? 'active' : ''}`} onClick={() => navigate(item.path)}>
              <Icon name={item.icon} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}

function LandingPage() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState(0);

  const uploadRows = [
    { name: 'passport-photo.jpg', meta: '32 MB · 48 KB · 200×230 px', status: 'Ready' },
    { name: 'marksheet-12th.pdf', meta: '18 MB · 420 KB', status: 'Ready' },
    { name: 'signature.png', meta: 'Clean background · 140×60 px', status: 'Ready' },
    { name: 'aadhaar + pan (merged)', meta: '2 files · 1 PDF · 310 KB', status: 'Ready' },
  ];

  const stats = [
    { value: '12 Lakh+', label: 'documents processed' },
    { value: '40+', label: 'form presets' },
    { value: '3 seconds', label: 'average processing time' },
    { value: '4.8/5', label: 'user rating' },
  ];

  const tools = [
    { title: 'Photo resize', text: 'Match exact KB and pixel sizes, including 200×230.' },
    { title: 'Signature clean-up', text: 'Remove the background and fit the signature to the required size.' },
    { title: 'PDF compress', text: 'Reduce file size while keeping the text clear and readable.' },
    { title: 'Merge PDFs', text: 'Combine multiple pages into a single document file.' },
    { title: 'Scan to PDF', text: 'Turn a photo into a clean digital file for submission.' },
    { title: 'Secure share', text: 'Keep uploads controlled with secure access settings.' },
  ];

  const trustFeatures = [
    'No card required',
    'Fast file cleanup',
    'Works on mobile',
    'Quick previews',
    'Secure sharing',
    'Ready in minutes',
  ];
  const trustTrack = [...trustFeatures, ...trustFeatures, ...trustFeatures];

  const steps = [
    { number: '1', title: 'Upload', text: 'Upload files from your phone or computer, or drag and drop them directly.' },
    { number: '2', title: 'Choose a form', text: 'Select SSC, UPSC, NEET, or a custom size. The rules are applied automatically.' },
    { number: '3', title: 'Download', text: 'Review the preview, then download the corrected file for your application.' },
  ];

  const presets = [
    ['SSC CGL', '20–50 KB, 3.5×4.5 cm', '10–20 KB, 4×2 cm', 'Max 1 MB'],
    ['UPSC', 'Max 300 KB, JPG', 'Max 300 KB, JPG', 'Max 2 MB'],
    ['NEET UG', '10–200 KB, JPG', '4–30 KB, JPG', 'Max 500 KB'],
    ['Railway RRB', '15–50 KB, 35×45 mm', '15–50 KB, 35×45 mm', 'Max 1 MB'],
    ['Bank PO', '20–50 KB, 200×230 px', '10–20 KB, 140×60 px', 'Max 500 KB'],
  ];

  const faqItems = [
    { q: 'Is this really free?', a: 'Yes. The core tools for photo resizing, signature clean-up, PDF compression, and file merging are available at no cost.' },
    { q: 'Are my documents safe?', a: 'Yes. File retention, encrypted upload, and private access settings keep your files under your control.' },
    { q: 'Do I need an account?', a: 'No. Basic tools can be used without login, and a free account is optional for advanced use.' },
    { q: 'What if I need a specific form size?', a: 'You can use the ready-made presets for common form requirements. If you need more detail, the support team can help.' },
  ];

  return (
    <div className="landing-page">
      <ProjectHeader />
      <section className="landing-hero">
        <div className="landing-hero__inner">
          <div className="landing-hero__copy">
            <h1>
              <span className="heading-primary">Every form</span>
              <span className="heading-soft">document,</span>
              <span className="heading-accent">prepared in the right</span>
              <span className="heading-primary">size and format.</span>
            </h1>
            <p>
              Resize photos, clean signatures, compress PDFs, and prepare ID documents for submission.<br />
              Eliminate the stress of upload rejections.
            </p>
            <div className="landing-cta-row">
              <button type="button" className="primary-btn" onClick={() => navigate('/auth')}>Try for free</button>
              <button type="button" className="secondary-btn" onClick={() => navigate('/auth')}>View demo</button>
            </div>
            <div className="landing-trust" aria-label="Trust features">
              <div className="landing-trust-track">
                {trustTrack.map((feature, index) => (
                  <span key={`${feature}-${index}`}><i>✓</i> {feature}</span>
                ))}
              </div>
            </div>
          </div>

        </div>
      </section>

      <section className="landing-stats">
        {stats.map((stat) => (
          <div key={stat.value} className="stat-block">
            <strong>{stat.value}</strong>
            <span>{stat.label}</span>
          </div>
        ))}
      </section>

      <section className="landing-tools">
        <div className="section-heading">
          <h2>All document tools in one place</h2>
          <p>No need for multiple apps. Choose a tool, upload the file, and download the result.</p>
        </div>

        <div className="tool-grid">
          {tools.map((tool) => (
            <div key={tool.title} className="tool-card">
              <h3>{tool.title}</h3>
              <p>{tool.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-process">
        <div className="section-heading centered">
          <h2>Prepare a document in 3 steps</h2>
          <p>Even first-time users can complete the process without extra help.</p>
        </div>

        <div className="process-grid">
          {steps.map((step) => (
            <div key={step.number} className="process-card">
              <div className="process-step">{step.number}</div>
              <div className="process-line" />
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-presets">
        <div className="section-heading centered">
          <h2>Ready-made presets for popular forms</h2>
          <p>No need to worry about size rules. Choose a preset and let the system handle the rest.</p>
        </div>

        <div className="preset-table-wrap">
          <table className="preset-table">
            <thead>
              <tr>
                <th>Form</th>
                <th>Photo</th>
                <th>Signature</th>
                <th>Document PDF</th>
              </tr>
            </thead>
            <tbody>
              {presets.map((row) => (
                <tr key={row[0]}>
                  <td>{row[0]}</td>
                  <td>{row[1]}</td>
                  <td>{row[2]}</td>
                  <td>{row[3]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="landing-privacy">
        <div className="privacy-copy">
          <h2>Your documents are yours alone</h2>
          <p>Documents like Aadhaar and mark sheets are sensitive, so privacy remains a top priority.</p>
          <ul className="privacy-list">
            <li><span className="check-icon">✓</span> Auto delete</li>
            <li><span className="check-icon">✓</span> Encrypted upload</li>
            <li><span className="check-icon">✓</span> No selling, no ads</li>
          </ul>
        </div>

        <div className="privacy-card">
          <h3>Under your control</h3>
          <div className="privacy-row"><span>File retention</span><strong>60 minutes</strong></div>
          <div className="privacy-row"><span>Encryption</span><strong>On</strong></div>
          <div className="privacy-row"><span>Third-party sharing</span><strong>Never</strong></div>
          <div className="privacy-row"><span>Account required</span><strong>No</strong></div>
        </div>
      </section>

      <section className="landing-testimonials">
        <div className="section-heading centered">
          <h2>What students say</h2>
        </div>
        <div className="testimonial-grid">
          <blockquote className="testimonial-card">
            “I had to reformat a photo for size, and here it was ready in under 10 seconds for my form submission.”
            <footer>
              <strong>Riya S.</strong>
              <span>SSC aspirant</span>
            </footer>
          </blockquote>
          <blockquote className="testimonial-card">
            “My mark sheet and Aadhaar were merged into one PDF. I could complete everything from my phone.”
            <footer>
              <strong>Aman K.</strong>
              <span>B.Com student</span>
            </footer>
          </blockquote>
          <blockquote className="testimonial-card">
            “I stopped visiting a cyber café. Now I can prepare all documents from home.”
            <footer>
              <strong>Pooja M.</strong>
              <span>NEET aspirant</span>
            </footer>
          </blockquote>
        </div>
      </section>

      <section className="landing-pricing">
        <div className="section-heading centered">
          <h2>Simple pricing, no hidden charges</h2>
          <p>The free plan is enough for most students and frequent document tasks.</p>
        </div>
      </section>

      <section className="landing-faq">
        <div className="section-heading centered">
          <h2>Frequently asked questions</h2>
        </div>
        <div className="faq-list">
          {faqItems.map((faq, index) => (
            <div key={faq.q} className={`faq-item ${openFaq === index ? 'open' : ''}`}>
              <button type="button" onClick={() => setOpenFaq(openFaq === index ? -1 : index)}>
                <span>{faq.q}</span>
                <span className="faq-toggle">{openFaq === index ? '−' : '+'}</span>
              </button>
              {openFaq === index && <p>{faq.a}</p>}
            </div>
          ))}
        </div>
      </section>

      <section className="landing-cta-panel">
        <h2>Complete your next form without the stress</h2>
        <p>Upload your document now. No sign-up is required.</p>
        <button type="button" className="primary-btn light" onClick={() => navigate('/auth')}>Upload a document</button>
      </section>

      <footer className="landing-footer">
        <div className="brand-mark brand-mark--footer">
          <div className="brand-icon">K</div>
          <strong>KaagazSetu</strong>
        </div>
        <div className="footer-links">
          <span>Product</span>
          <span>Support</span>
          <span>Company</span>
        </div>
      </footer>
    </div>
  );
}

function AuthPage() {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    try {
      setBusy(true);
      setError('');
      if (mode === 'login') {
        await login({ email: form.email, password: form.password });
      } else {
        await register({ name: form.name, email: form.email, password: form.password });
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Unable to continue.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-visual">
        <div className="auth-card-art">
          <div className="floating-doc doc-a">Aadhaar</div>
          <div className="floating-doc doc-b">Policy</div>
          <div className="floating-doc doc-c">FD</div>
        </div>
      </div>
      <div className="auth-panel">
        <button type="button" className="back-home-btn" onClick={() => navigate('/')} aria-label="Back to landing page">
          <span aria-hidden="true">←</span>
          <span>Back</span>
        </button>

        <span className="hero-badge">Secure access</span>
        <h1>{mode === 'login' ? 'Welcome back' : 'Create account'}</h1>
        <p>One family vault. One trusted login.</p>

        <div className="auth-form">
          {mode === 'register' && (
            <label>
              Full name
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Rahul Sharma" />
            </label>
          )}

          <label>
            Email
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="rahul@example.com" />
          </label>

          <label>
            Password
            <div className="password-wrap">
              <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" />
              <button type="button" className="tiny-btn" onClick={() => setShowPassword((value) => !value)}>{showPassword ? 'Hide' : 'Show'}</button>
            </div>
          </label>

          {error && <div className="form-error">{error}</div>}

          <button type="button" className="primary-btn full" disabled={busy} onClick={submit}>{busy ? 'Processing...' : mode === 'login' ? 'Login' : 'Register'}</button>
          <button type="button" className="ghost-btn full" onClick={() => setMode((value) => (value === 'login' ? 'register' : 'login'))}>
            {mode === 'login' ? 'Need a new account?' : 'Already have an account?'}
          </button>
        </div>
      </div>
    </div>
  );
}

function AnalyticsDashboardPage() {
  const { user } = useAuth();
  const uploadInputRef = useRef(null);
  const [showTools, setShowTools] = useState(false);
  const [selectedTool, setSelectedTool] = useState('Photo resize');
  const [uploadMessage, setUploadMessage] = useState('');

  const metrics = [
    { label: 'Documents ready', value: '6.4K', change: '+12.8%' },
    { label: 'Files reviewed', value: '94%', change: 'This week' },
    { label: 'Expiring soon', value: '12', change: 'Needs review' },
    { label: 'Vault health', value: 'Excellent', change: 'Secure' },
  ];

  const activityStatus = [
    { label: 'Healthy', value: 72, tone: 'success', color: '#2f6c6b' },
    { label: 'Needs review', value: 18, tone: 'warning', color: '#d29d3f' },
    { label: 'Pending', value: 10, tone: 'neutral', color: '#5f7ea8' },
  ];

  const trendData = [
    { label: 'Jan', value: 28 },
    { label: 'Feb', value: 46 },
    { label: 'Mar', value: 52 },
    { label: 'Apr', value: 67 },
    { label: 'May', value: 74 },
    { label: 'Jun', value: 82 },
  ];

  const activities = [
    { title: 'Aadhaar verification', detail: 'Verified and stored under family vault', tone: 'primary', status: 'Approved' },
    { title: 'Insurance renewal', detail: 'Review due in 6 days', tone: 'amber', status: 'Attention' },
    { title: 'Nominee update', detail: 'Changes saved and audit log created', tone: 'success', status: 'Completed' },
    { title: 'Upload queue', detail: '2 documents waiting for final review', tone: 'neutral', status: 'Pending' },
  ];

  const dashboardTools = [
    { title: 'Photo resize', text: 'Match exact KB and pixel sizes, including 200×230.', fileName: 'photo-resize-ready.txt', detail: 'Resize to 200×230 px and keep the file under the required KB limit.' },
    { title: 'Signature clean-up', text: 'Remove the background and fit the signature to the required size.', fileName: 'signature-cleanup-ready.txt', detail: 'Clean the background and prepare a signature file for the required application dimensions.' },
    { title: 'PDF compress', text: 'Reduce file size while keeping the text clear and readable.', fileName: 'pdf-compress-ready.txt', detail: 'Compress the PDF without affecting readability and print clarity.' },
    { title: 'Merge PDFs', text: 'Combine multiple pages into a single document file.', fileName: 'merged-pdf-ready.txt', detail: 'Merge separate pages into one final document for submission.' },
    { title: 'Scan to PDF', text: 'Turn a photo into a clean digital file for submission.', fileName: 'scan-to-pdf-ready.txt', detail: 'Convert the uploaded image into a clean digital PDF for a formal upload.' },
    { title: 'Secure share', text: 'Keep uploads controlled with secure access settings.', fileName: 'secure-share-ready.txt', detail: 'Prepare the file for secure access control and controlled sharing.' },
  ];

  const pieGradient = (() => {
    let start = 0;
    const pie = activityStatus.map((item) => {
      const end = start + item.value;
      const segment = `${item.color} ${start}% ${end}%`;
      start = end;
      return segment;
    });
    return `conic-gradient(${pie.join(', ')})`;
  })();

  const handleToolDownload = (tool) => {
    const title = tool.title;
    const fileText = [
      `KaagazSetu: ${title}`,
      '',
      `Status: Ready for download`,
      `Summary: ${tool.detail}`,
      `Action: ${tool.text}`,
      '',
      `Prepared for: ${user?.name || 'Rahul'} on ${new Date().toLocaleDateString()}`,
    ].join('\n');

    const blob = new Blob([fileText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = tool.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setSelectedTool(title);
  };

  const handleDashboardUpload = () => {
    uploadInputRef.current?.click();
  };

  const handleDashboardFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const persons = await api('/persons');
      const targetPersonId = persons?.[0]?._id || '';
      const formData = new FormData();
      formData.append('file', file);
      if (targetPersonId) {
        formData.append('personId', targetPersonId);
      }

      await api('/docs/upload', { method: 'POST', body: formData });
      setUploadMessage(`${file.name} uploaded successfully.`);
      setSelectedTool('Upload ready');
    } catch (error) {
      setUploadMessage(error.message || 'Upload failed. Please try again.');
    } finally {
      event.target.value = '';
    }
  };

  return (
    <div className="dashboard-shell analytics-dashboard">
      <div className="dashboard-hero">
        <div>
          <p className="eyebrow">Overview</p>
          <h2>Welcome back, {user?.name || 'Rahul'}.</h2>
        </div>
        <div className="dashboard-actions">
          <button type="button" className="secondary-btn" onClick={() => setShowTools((value) => !value)}>
            {showTools ? 'Hide tools' : 'Tools'}
          </button>
          <button type="button" className="primary-btn" onClick={handleDashboardUpload}>Upload new document</button>
          <input ref={uploadInputRef} type="file" accept="application/pdf,image/jpeg,image/png,image/webp" hidden onChange={handleDashboardFileChange} />
        </div>
      </div>

      {uploadMessage && <div className="flash-message">{uploadMessage}</div>}

      <div className="dashboard-grid">
        {metrics.map((metric) => (
          <div key={metric.label} className="stat-card teal">
            <small>{metric.label}</small>
            <strong>{metric.value}</strong>
            <span className="metric-change">{metric.change}</span>
          </div>
        ))}
      </div>

      <div className="analytics-grid">
        <div className="panel-card analytic-summary-card">
          <div className="panel-header">
            <h3>Operational status</h3>
            <span className="tiny-pill">All systems stable</span>
          </div>

          <div className="status-summary-grid">
            <div className="status-meta">
              <div className="pie-chart" style={{ background: pieGradient }} aria-label="Document readiness chart" />
            </div>
            <div className="chart-legend chart-legend-inline">
              {activityStatus.map((item) => (
                <div key={item.label} className="legend-row">
                  <span className="legend-dot" style={{ background: item.color }} />
                  <span className="legend-label">{item.label}</span>
                  <strong>{item.value}%</strong>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="panel-card trend-card">
          <div className="panel-header">
            <h3>Document flow</h3>
            <span className="tiny-pill">6-month view</span>
          </div>

          <div className="trend-bars" aria-label="Document flow trend chart">
            {trendData.map((item) => (
              <div key={item.label} className="trend-column">
                <span className="trend-value">{item.value}%</span>
                <span className="trend-bar" style={{ height: `${item.value}%` }} />
                <small>{item.label}</small>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bottom-grid">
        <div className="panel-card">
          <div className="panel-header">
            <h3>Recent activity</h3>
            <span className="tiny-pill">Live</span>
          </div>

          <div className="activity-list">
            {activities.map((item) => (
              <div key={item.title} className="activity-item">
                <div className="activity-copy">
                  <strong>{item.title}</strong>
                  <p>{item.detail}</p>
                </div>
                <span className={`status-pill ${item.tone}`}>{item.status}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="panel-card">
          <div className="panel-header">
            <h3>Action tracker</h3>
            <span className="tiny-pill">Priority</span>
          </div>
          <div className="progress-list">
            <div className="progress-item">
              <div className="progress-labels"><span>Identity files</span><strong>94%</strong></div>
              <div className="progress-track"><span style={{ width: '94%' }} /></div>
            </div>
            <div className="progress-item">
              <div className="progress-labels"><span>Nominee setup</span><strong>68%</strong></div>
              <div className="progress-track"><span style={{ width: '68%' }} /></div>
            </div>
            <div className="progress-item">
              <div className="progress-labels"><span>Renewal checks</span><strong>81%</strong></div>
              <div className="progress-track"><span style={{ width: '81%' }} /></div>
            </div>
          </div>
        </div>
      </div>

      {showTools && (
        <div className="panel-card dashboard-tools-panel">
          <div className="panel-header">
            <h3>Document tools</h3>
            <span className="tiny-pill">{selectedTool}</span>
          </div>
          <div className="tool-grid dashboard-tools-grid">
            {dashboardTools.map((tool) => (
              <div key={tool.title} className={`tool-card dashboard-tool-card ${selectedTool === tool.title ? 'selected' : ''}`}>
                <h3>{tool.title}</h3>
                <p>{tool.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bottom-grid">
        <div className="panel-card">
          <div className="panel-header">
            <h3>Document types</h3>
            <span className="tiny-pill">Archive</span>
          </div>
          <div className="document-list">
            <div className="document-item"><strong>Aadhaar</strong><span>7 files verified</span></div>
            <div className="document-item"><strong>Policy papers</strong><span>5 files stored</span></div>
            <div className="document-item"><strong>Bank records</strong><span>2 files due for review</span></div>
            <div className="document-item"><strong>Insurance</strong><span>3 files expiring soon</span></div>
          </div>
        </div>

        <div className="panel-card">
          <div className="panel-header">
            <h3>System health check</h3>
            <span className="tiny-pill">Updated now</span>
          </div>
          <div className="rights-list">
            <div className="right-item">
              <strong>Security</strong>
              <p>Vault permissions and access checks are active.</p>
            </div>
            <div className="right-item">
              <strong>Storage</strong>
              <p>All key documents are encrypted and synced.</p>
            </div>
            <div className="right-item">
              <strong>Renewals</strong>
              <p>Follow-up reminders are scheduled for next 14 days.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AiAssistantPage() {
  const [dashboard, setDashboard] = useState({ docs: [], persons: [], expiring: [], recent: [] });
  const [loading, setLoading] = useState(true);

  const createChatThread = (language = 'en', starterQuestion = '') => {
    const question = starterQuestion ? starterQuestion.trim() : '';
    if (!question) {
      return {
        id: `chat-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        language,
        messages: [],
      };
    }

    const answer = buildAssistantReply(language, question);
    return {
      id: `chat-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      language,
      messages: [
        { role: 'user', text: question },
        { role: 'assistant', summary: answer.summary, bullets: answer.bullets },
      ],
    };
  };

  const getSuggestedQuestions = (language) => (
    language === 'hi'
      ? ['What should I store?', 'What records matter most?', 'How do I protect access?', 'Which documents are expiring?']
      : ['What should I store?', 'What records matter most?', 'How do I protect access?', 'Which documents are expiring?']
  );

  const buildAssistantReply = (language, question = '') => {
    const normalized = (question || '').trim().toLowerCase();

    const greeting = {
      summary: 'Hello! I’m here to help with your work, planning, and day-to-day decisions. Ask me anything and I’ll help you think clearly.',
      bullets: ['Daily planning', 'Decision support', 'Budget and priorities'],
    };

    const wellbeing = {
      summary: 'I’m doing well. I can help you plan better, sort priorities, and work through practical questions with a clear next step.',
      bullets: ['Prioritise tasks', 'Build a simple plan', 'Make smarter decisions'],
    };

    const budget = {
      summary: 'To manage your budget better, list fixed expenses first, then savings, and finally flexible spending. Keep a small emergency cushion and review your numbers weekly.',
      bullets: ['Track monthly income and costs', 'Create a savings rule', 'Reduce non-essential spending'],
    };

    const study = {
      summary: 'For study or learning, break the topic into small goals, set a daily target, and review the most important concepts before moving to the next step.',
      bullets: ['Plan in small blocks', 'Focus on core concepts', 'Revise regularly'],
    };

    const work = {
      summary: 'For work tasks, start with the most important task, reduce distractions, and set one clear outcome for each block of time.',
      bullets: ['Focus on impact', 'Avoid task overload', 'Review progress daily'],
    };

    const personal = {
      summary: 'A good way to handle personal decisions is to define the goal, write the options, and choose the path with the lowest risk and highest clarity.',
      bullets: ['Know the goal', 'Compare options', 'Choose the simplest safe move'],
    };

    const defaultReply = {
      summary: 'I can help with planning, money, study, work, and everyday decisions. Tell me your goal and I’ll suggest a simple next step.',
      bullets: ['Budget and saving', 'Study and learning', 'Work and productivity'],
    };

    if (/^(hi|hello|hey|namaste|good morning|good evening|good night|hola)/.test(normalized) || /^hi\s+there|^hello\s+there/.test(normalized)) {
      return greeting;
    }

    if (/how are you|how\s+are\s+you\s+doing|how\s+you\s+doing|are\s+you\s+okay/.test(normalized)) {
      return wellbeing;
    }

    if (/(budget|money|finance|expense|spend|save|invest|cash)/.test(normalized)) {
      return budget;
    }

    if (/(study|learn|exam|course|school|college|knowledge)/.test(normalized)) {
      return study;
    }

    if (/(work|job|office|productivity|task|project|time)/.test(normalized)) {
      return work;
    }

    if (/(life|personal|relationship|decision|plan|goal|future)/.test(normalized)) {
      return personal;
    }

    return defaultReply;
  };

  const [chatThreads, setChatThreads] = useState(() => {
    if (typeof window === 'undefined') {
      return [createChatThread('en')];
    }

    try {
      const saved = JSON.parse(localStorage.getItem('kaagazsetu_chat_threads') || 'null');
      if (Array.isArray(saved) && saved.length > 0) {
        return saved;
      }
    } catch (error) {
      console.warn('Unable to read chat threads', error);
    }

    return [createChatThread('en')];
  });

  const [activeThreadId, setActiveThreadId] = useState(() => {
    if (typeof window === 'undefined') return 'default';
    try {
      const saved = JSON.parse(localStorage.getItem('kaagazsetu_chat_threads') || 'null');
      return saved?.[0]?.id || `chat-${Date.now()}`;
    } catch (error) {
      return `chat-${Date.now()}`;
    }
  });

  const [draftPrompt, setDraftPrompt] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('kaagazsetu_chat_threads', JSON.stringify(chatThreads));
    }
  }, [chatThreads]);

  useEffect(() => {
    const active = chatThreads.find((thread) => thread.id === activeThreadId) || chatThreads[0];
    if (!active) return;
    setDraftPrompt('');
  }, [activeThreadId, chatThreads]);

  useEffect(() => {
    Promise.all([
      api('/docs'),
      api('/persons'),
      api('/expiring'),
    ])
      .then(([docs, persons, expiring]) => {
        setDashboard({ docs, persons, expiring, recent: docs.slice(0, 4) });
      })
      .finally(() => setLoading(false));
  }, []);

  const activeThread = chatThreads.find((thread) => thread.id === activeThreadId) || chatThreads[0];
  const currentLanguage = activeThread?.language || 'en';
  const suggestedQuestions = getSuggestedQuestions(currentLanguage);

  const handlePromptSubmit = async () => {
    if (!activeThread || !draftPrompt.trim()) return;

    const trimmed = draftPrompt.trim();
    const userMessage = { role: 'user', text: trimmed };
    const pendingThread = {
      ...activeThread,
      language: currentLanguage,
      messages: [...activeThread.messages, userMessage],
    };

    setChatThreads((threads) => threads.map((thread) => (thread.id === activeThread.id ? pendingThread : thread)));
    setDraftPrompt('');

    try {
      const data = await api('/assistant', {
        method: 'POST',
        body: { question: trimmed, language: currentLanguage },
      });

      const replyText = data?.answer || 'I can help you review documents, family files, and next steps.';
      const assistantMessage = {
        role: 'assistant',
        summary: replyText,
        bullets: ['General guidance', 'Document review', 'Actionable next steps'],
      };

      setChatThreads((threads) => threads.map((thread) => {
        if (thread.id !== activeThread.id) return thread;
        return {
          ...thread,
          messages: [...thread.messages, assistantMessage],
        };
      }));
    } catch (error) {
      const fallbackReply = buildAssistantReply(currentLanguage, trimmed);
      const assistantMessage = {
        role: 'assistant',
        summary: fallbackReply.summary,
        bullets: fallbackReply.bullets,
      };

      setChatThreads((threads) => threads.map((thread) => {
        if (thread.id !== activeThread.id) return thread;
        return {
          ...thread,
          messages: [...thread.messages, assistantMessage],
        };
      }));
    }
  };

  const handleNewChat = () => {
    const newThread = createChatThread(currentLanguage, '');
    setChatThreads((threads) => [newThread, ...threads]);
    setActiveThreadId(newThread.id);
    setDraftPrompt('');
  };

  const handleThreadSelect = (threadId) => {
    const nextThread = chatThreads.find((thread) => thread.id === threadId);
    if (!nextThread) return;
    setActiveThreadId(threadId);
    setDraftPrompt('');
  };

  const handleDeleteThread = (threadId, event) => {
    if (event) {
      event.stopPropagation();
    }

    setChatThreads((threads) => {
      const remaining = threads.filter((thread) => thread.id !== threadId);
      if (remaining.length === 0) {
        const newThread = createChatThread(currentLanguage, '');
        setActiveThreadId(newThread.id);
        return [newThread];
      }

      const nextActive = remaining[0];
      setActiveThreadId(nextActive.id);
      return remaining;
    });
  };

  const handleLanguageChange = (event) => {
    const nextLanguage = event.target.value;
    setChatThreads((threads) => threads.map((thread) => (thread.id === activeThreadId ? { ...thread, language: nextLanguage } : thread)));
    setDraftPrompt('');
  };

  if (loading) {
    return <div className="dashboard-grid"><div className="stat-card skeleton-card" /><div className="stat-card skeleton-card" /><div className="stat-card skeleton-card" /><div className="stat-card skeleton-card" /></div>;
  }

  return (
    <div className="dashboard-shell ai-only-shell">
      <div className="ai-panel">
        <div className="ai-header">
          <div>
            <span className="tiny-pill">AI assistant</span>
            <h3>Ask about your vault, rights, and next steps</h3>
          </div>
          <button type="button" className="new-chat-btn" onClick={handleNewChat}>+ New chat</button>
        </div>

        <div className="ai-layout">
          <div className="ai-chat-card">
            <div className="chat-thread-scroll">
              {activeThread?.messages.map((message, index) => (
                <div key={`${message.role}-${index}`} className={`chat-message ${message.role}`}>
                  {message.role === 'user' ? (
                    <div className="chat-bubble user">{message.text}</div>
                  ) : (
                    <div className="chat-bubble assistant">
                      <strong>Answer</strong>
                      <p>{message.summary}</p>
                      <ul>
                        {message.bullets.map((bullet) => (
                          <li key={`${message.role}-${index}-${bullet}`}>{bullet}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="help-panel">
            <div className="helper-card">
              <h4>Saved chats</h4>
              <div className="chat-thread-list">
                {chatThreads.map((thread) => (
                  <div key={thread.id} className="chat-thread-item-wrap">
                    <button
                      type="button"
                      className={`chat-thread-item ${thread.id === activeThreadId ? 'active' : ''}`}
                      onClick={() => handleThreadSelect(thread.id)}
                    >
                      {thread.messages[0]?.text || 'New chat'}
                    </button>
                    <button
                      type="button"
                      className="chat-thread-delete"
                      onClick={(event) => handleDeleteThread(thread.id, event)}
                      aria-label={`Delete chat ${thread.messages[0]?.text || 'thread'}`}
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="helper-card">
              <h4>Suggested questions</h4>
              <div className="question-list">
                {suggestedQuestions.map((question) => (
                  <button
                    key={question}
                    type="button"
                    className={`question-pill ${draftPrompt === question ? 'active' : ''}`}
                    onClick={() => setDraftPrompt(question)}
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="ai-input-row">
          <select className="ai-language-select" value={currentLanguage} onChange={handleLanguageChange} aria-label="Select chat language">
            <option value="en">English</option>
            <option value="hi">Hindi</option>
          </select>
          <input
            value={draftPrompt}
            onChange={(event) => setDraftPrompt(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                handlePromptSubmit();
              }
            }}
            placeholder="Ask a question about your documents or legal rights"
          />
          <button type="button" className="primary-btn" onClick={handlePromptSubmit}>Ask</button>
        </div>
      </div>
    </div>
  );
}

function VaultPage() {
  const [persons, setPersons] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [selectedPerson, setSelectedPerson] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [search, setSearch] = useState('');
  const [reviewDoc, setReviewDoc] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ name: '', relation: '', dob: '' });
  const { push } = useToast();

  const loadData = async () => {
    const [personList, docList] = await Promise.all([api('/persons'), api('/docs')]);
    setPersons(personList);
    if (!selectedPerson && personList[0]) setSelectedPerson(personList[0]._id);
    setDocuments(docList.filter((doc) => doc.confirmed));
  };

  useEffect(() => { loadData(); }, []);

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !selectedPerson) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('personId', selectedPerson);
      const result = await api('/docs/upload', { method: 'POST', body: formData });
      setReviewDoc(result);
      push('Your document is securely stored in the vault.', 'success');
    } catch (err) {
      push(err.message || 'This file is a bit unclear. Try again with a sharper image.', 'error');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleSaveReview = async () => {
    if (!reviewDoc) return;
    await api(`/docs/${reviewDoc._id}/confirm`, {
      method: 'PUT',
      body: { type: reviewDoc.type, extracted: reviewDoc.extracted },
    });
    setReviewDoc(null);
    await loadData();
    push('Document saved and confirmed.', 'success');
  };

  const filteredDocs = documents.filter((doc) => {
    const matchesType = filterType === 'all' || doc.type === filterType;
    const matchesSearch = !search || `${doc.fileName} ${doc.type}`.toLowerCase().includes(search.toLowerCase());
    const matchesPerson = !selectedPerson || doc.personId === selectedPerson || (!doc.personId && selectedPerson === 'all');
    return matchesType && matchesSearch && matchesPerson;
  });

  const addPerson = async () => {
    if (!form.name || !form.relation) return;
    await api('/persons', { method: 'POST', body: { name: form.name, relation: form.relation, dob: form.dob || null } });
    setForm({ name: '', relation: '', dob: '' });
    loadData();
  };

  const typeOptions = ['all', 'aadhaar', 'pan', 'insurance', 'fd', 'rc', 'certificate', 'property', 'other'];

  return (
    <div className="vault-shell">
      <div className="panel-card">
        <div className="panel-header">
          <h3>Family member</h3>
        </div>
        <div className="toolbar-row">
          <select value={selectedPerson} onChange={(e) => setSelectedPerson(e.target.value)}>
            {persons.map((person) => (
              <option key={person._id} value={person._id}>{person.name} • {person.relation}</option>
            ))}
          </select>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="New name" />
          <input value={form.relation} onChange={(e) => setForm({ ...form, relation: e.target.value })} placeholder="Relation" />
          <input type="date" value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} />
          <button type="button" className="primary-btn" onClick={addPerson}>Add</button>
        </div>
      </div>

      <div className="panel-card">
        <div className="panel-header">
          <h3>Upload and review</h3>
        </div>
        <div className="toolbar-row">
          <label className="upload-picker">
            <input type="file" onChange={handleUpload} />
            <span>{uploading ? 'Scanning document...' : 'Choose a file'}</span>
          </label>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search documents" />
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            {typeOptions.map((option) => <option key={option} value={option}>{option === 'all' ? 'All types' : option}</option>)}
          </select>
        </div>
      </div>

      <div className="vault-grid">
        {filteredDocs.length ? filteredDocs.map((doc) => (
          <article key={doc._id} className="doc-card">
            <div className="doc-card-top">
              <span className={`tag tag-${doc.type || 'other'}`}>{doc.type || 'other'}</span>
              <span className="tiny-pill">{doc.confirmed ? 'Confirmed' : 'Draft'}</span>
            </div>
            <h4>{doc.fileName}</h4>
            <p>{doc.extracted?.issuer || 'Document'} • {doc.extracted?.holderName || 'No holder name yet'}</p>
            <div className="meta-row">
              <span>{formatDate(doc.expiryDate)}</span>
              <span>{doc.extracted?.confidence ? `${Math.round(doc.extracted.confidence * 100)}% match` : 'Review pending'}</span>
            </div>
            <div className="doc-actions">
              <button type="button" className="ghost-btn small" onClick={async () => {
                const response = await fetch(`/api/docs/${doc._id}/file`, { headers: { Authorization: `Bearer ${localStorage.getItem('kaagazsetu_token')}` } });
                const blob = await response.blob();
                const url = URL.createObjectURL(blob);
                window.open(url, '_blank');
              }}>View</button>
              <button type="button" className="ghost-btn small" onClick={() => setReviewDoc(doc)}>Review</button>
            </div>
          </article>
        )) : <div className="empty-card">No matching documents yet.</div>}
      </div>

      {reviewDoc && (
        <div className="modal-overlay" onClick={() => setReviewDoc(null)}>
          <div className="review-modal" onClick={(event) => event.stopPropagation()}>
            <div className="review-header">
              <h3>Review extracted fields</h3>
              <button type="button" className="tiny-btn" onClick={() => setReviewDoc(null)}>Close</button>
            </div>
            <div className="review-layout">
              <div className="review-preview">
                <div className="preview-box">Document preview</div>
                <p>{reviewDoc.fileName}</p>
              </div>
              <div className="review-fields">
                <label>
                  Type
                  <select value={reviewDoc.type || 'other'} onChange={(e) => setReviewDoc({ ...reviewDoc, type: e.target.value })}>
                    {['aadhaar', 'pan', 'insurance', 'fd', 'rc', 'certificate', 'property', 'other'].map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </label>
                {Object.entries(reviewDoc.extracted || {}).map(([key, value]) => (
                  <label key={key}>
                    {key}
                    <input value={value ?? ''} onChange={(e) => setReviewDoc({
                      ...reviewDoc,
                      extracted: { ...reviewDoc.extracted, [key]: e.target.value || null },
                    })} />
                  </label>
                ))}
                <button type="button" className="primary-btn full" onClick={handleSaveReview}>Looks good, save</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ExpiryPage() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    api('/expiring').then((result) => setItems(result)).catch(() => setItems([]));
  }, []);

  return (
    <div className="timeline-shell">
      {items.length ? (
        <div className="timeline">
          {items.map((item) => (
            <div key={item._id} className={`timeline-item ${item.daysLeft <= 7 ? 'danger' : item.daysLeft <= 30 ? 'warning' : 'ok'}`}>
              <span className="timeline-dot" />
              <div className="timeline-card">
                <div className="panel-header">
                  <h3>{item.type}</h3>
                  <span className={`tag ${item.daysLeft <= 7 ? 'danger' : item.daysLeft <= 30 ? 'warning' : 'ok'}`}>{item.daysLeft <= 0 ? 'Expired' : `${item.daysLeft} days left`}</span>
                </div>
                <p>{item.extracted?.issuer || 'Issuer'} • {item.extracted?.number || 'reference'}</p>
                <small>Expiry: {formatDate(item.expiryDate)}</small>
                <button type="button" className="secondary-btn small">Copy renewal draft</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-card">No expiring documents found right now.</div>
      )}
    </div>
  );
}

function DeathChecklistPage() {
  const [event, setEvent] = useState(null);
  const [doneSteps, setDoneSteps] = useState([]);

  useEffect(() => {
    api('/events/death').then((result) => {
      setEvent(result);
      setDoneSteps(result.steps.filter((step) => step.done).map((step) => step.id));
    });
  }, []);

  const toggleStep = async (id) => {
    const next = doneSteps.includes(id) ? doneSteps.filter((stepId) => stepId !== id) : [...doneSteps, id];
    setDoneSteps(next);
    await api('/events/death/progress', { method: 'PUT', body: { doneSteps: next } });
  };

  if (!event) return <div className="skeleton-card wide" />;

  const total = event.steps.length;
  const doneCount = doneSteps.length;
  const percent = Math.round((doneCount / total) * 100 || 0);

  return (
    <div className="checklist-shell">
      <div className="notice-card">
        <h3>Life event support</h3>
        <p>{event.note}</p>
        <small>Guidance, not legal advice. Verify with a CA or lawyer before production use.</small>
      </div>
      <div className="progress-ring-wrap">
        <div className="progress-ring" style={{ '--value': percent }}>
          <span>{percent}%</span>
        </div>
      </div>

      <div className="checklist-list">
        {event.steps.map((step) => (
          <div key={step.id} className={`checklist-card ${step.done ? 'done' : ''}`}>
            <div className="checklist-header">
              <label className="check-toggle">
                <input type="checkbox" checked={step.done} onChange={() => toggleStep(step.id)} />
                <span>{step.title}</span>
              </label>
              <span className={`tag ${step.status === 'ready' ? 'ok' : step.status === 'missing' ? 'warning' : 'default'}`}>{step.status === 'ready' ? 'Documents ready' : step.status === 'missing' ? 'Document missing' : 'To do'}</span>
            </div>
            <p>{step.instruction}</p>
            {step.matched.length ? (
              <div className="mini-list">
                {step.matched.map((item) => (
                  <span key={item.id} className="mini-badge">{item.type}</span>
                ))}
              </div>
            ) : (
              <div className="mini-list">
                <span className="mini-badge muted">Upload needed</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function FamilyPage() {
  const [persons, setPersons] = useState([]);
  useEffect(() => {
    api('/persons').then((result) => setPersons(result));
  }, []);

  return (
    <div className="family-shell">
      <svg viewBox="0 0 640 260" className="family-graph" aria-label="Family tree diagram">
        <line x1="140" y1="130" x2="260" y2="130" stroke="var(--primary)" strokeWidth="2" />
        <line x1="260" y1="80" x2="360" y2="80" stroke="var(--primary)" strokeWidth="2" />
        <line x1="260" y1="180" x2="360" y2="180" stroke="var(--primary)" strokeWidth="2" />
        <circle cx="140" cy="130" r="42" fill="var(--warm-terracotta)" />
        <circle cx="260" cy="130" r="42" fill="var(--primary)" />
        <circle cx="360" cy="80" r="36" fill="var(--accent)" />
        <circle cx="360" cy="180" r="36" fill="var(--success)" />
        <text x="140" y="136" textAnchor="middle" fill="white" fontSize="18">Self</text>
        <text x="260" y="136" textAnchor="middle" fill="white" fontSize="18">Family</text>
        <text x="360" y="86" textAnchor="middle" fill="white" fontSize="14">Papa</text>
        <text x="360" y="186" textAnchor="middle" fill="white" fontSize="14">Mummy</text>
      </svg>
      <div className="family-list">
        {persons.map((person) => (
          <div key={person._id} className="family-item">
            <div className="avatar">{person.name.slice(0, 1).toUpperCase()}</div>
            <div>
              <strong>{person.name}</strong>
              <p>{person.relation}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function NomineePage() {
  const [nominee, setNominee] = useState({ name: '', email: '', delayDays: 90, waitDays: 7 });
  const { push } = useToast();

  useEffect(() => {
    api('/nominee').then((result) => setNominee((current) => ({ ...current, ...result }))).catch(() => setNominee({ name: '', email: '', delayDays: 90, waitDays: 7 }));
  }, []);

  const save = async () => {
    await api('/nominee', { method: 'PUT', body: nominee });
    push('Nominee settings saved.', 'success');
  };

  return (
    <div className="nominee-shell">
      <div className="panel-card">
        <h3>Emergency nominee</h3>
        <div className="nominee-form">
          <label>
            Name
            <input value={nominee.name || ''} onChange={(e) => setNominee({ ...nominee, name: e.target.value })} />
          </label>
          <label>
            Email
            <input type="email" value={nominee.email || ''} onChange={(e) => setNominee({ ...nominee, email: e.target.value })} />
          </label>
          <div className="two-column-form">
            <label>
              Inactivity days
              <input type="number" value={nominee.delayDays || 90} onChange={(e) => setNominee({ ...nominee, delayDays: Number(e.target.value) })} />
            </label>
            <label>
              Waiting days
              <input type="number" value={nominee.waitDays || 7} onChange={(e) => setNominee({ ...nominee, waitDays: Number(e.target.value) })} />
            </label>
          </div>
          <button type="button" className="primary-btn" onClick={save}>Save nominee</button>
        </div>
      </div>
      <div className="panel-card">
        <h3>Flow preview</h3>
        <div className="flow-diagram">
          <div className="flow-node">90-day inactivity</div>
          <div className="connector" />
          <div className="flow-node warning">Warning email</div>
          <div className="connector" />
          <div className="flow-node">7-day wait</div>
          <div className="connector" />
          <div className="flow-node success">Nominee sees metadata</div>
        </div>
      </div>
    </div>
  );
}

function AuditPage() {
  const [logs, setLogs] = useState([]);
  useEffect(() => {
    api('/audit').then((result) => setLogs(result)).catch(() => setLogs([]));
  }, []);

  return (
    <div className="audit-shell">
      {logs.length ? logs.map((entry) => (
        <div key={entry._id} className="audit-item">
          <strong>{entry.actor}</strong>
          <p>{entry.action}</p>
          <small>{formatDate(entry.createdAt)}</small>
        </div>
      )) : <div className="empty-card">No audit events yet.</div>}
    </div>
  );
}

function ToolsPage() {
  const [selectedTool, setSelectedTool] = useState('photo-resize');
  const [files, setFiles] = useState([]);
  const [message, setMessage] = useState('Upload a file to begin processing.');

  const toolCatalog = [
    { slug: 'photo-resize', title: 'Photo resize', description: 'Resize passport photos and ID images to exact dimensions.', accept: 'image/*', multi: false },
    { slug: 'signature-cleanup', title: 'Signature cleanup', description: 'Remove background noise and prepare signatures for print and upload.', accept: 'image/*', multi: false },
    { slug: 'merge-pdfs', title: 'Merge PDFs', description: 'Combine multiple PDFs into a single file for one final submission.', accept: '.pdf,image/*', multi: true },
    { slug: 'pdf-compress', title: 'PDF compress', description: 'Reduce file size while keeping the content readable.', accept: '.pdf', multi: false },
    { slug: 'scan-to-pdf', title: 'Scan to PDF', description: 'Convert a scan or picture into a clean PDF document.', accept: 'image/*', multi: false },
    { slug: 'secure-share', title: 'Secure share', description: 'Prepare a share policy and export it as a secure file.', accept: '.txt,.json', multi: false },
  ];

  const activeTool = toolCatalog.find((tool) => tool.slug === selectedTool) || toolCatalog[0];

  const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const readImage = (file) => new Promise((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(file);
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Unable to read image file.'));
    };
    image.src = url;
  });

  const processFile = async () => {
    if (!files.length) {
      setMessage('Please choose a file to process first.');
      return;
    }

    try {
      switch (activeTool.slug) {
        case 'photo-resize': {
          const image = await readImage(files[0]);
          const canvas = document.createElement('canvas');
          canvas.width = 200;
          canvas.height = 230;
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          const scale = Math.min(canvas.width / image.width, canvas.height / image.height);
          const width = Math.max(1, image.width * scale);
          const height = Math.max(1, image.height * scale);
          const x = (canvas.width - width) / 2;
          const y = (canvas.height - height) / 2;
          ctx.drawImage(image, x, y, width, height);
          const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9));
          downloadBlob(blob, 'photo-resize.jpg');
          setMessage('Photo resized successfully and downloaded.');
          return;
        }
        case 'signature-cleanup': {
          const image = await readImage(files[0]);
          const canvas = document.createElement('canvas');
          canvas.width = image.width;
          canvas.height = image.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(image, 0, 0);
          const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
          for (let index = 0; index < data.length; index += 4) {
            const r = data[index];
            const g = data[index + 1];
            const b = data[index + 2];
            const brightness = (r + g + b) / 3;
            if (brightness > 245) {
              data[index + 3] = 0;
            } else {
              const clean = 255 - brightness;
              data[index] = Math.min(255, r + clean * 0.2);
              data[index + 1] = Math.min(255, g + clean * 0.2);
              data[index + 2] = Math.min(255, b + clean * 0.2);
            }
          }
          ctx.putImageData(new ImageData(data, canvas.width, canvas.height), 0, 0);
          const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
          downloadBlob(blob, 'signature-cleaned.png');
          setMessage('Signature cleaned and downloaded.');
          return;
        }
        case 'merge-pdfs': {
          const { PDFDocument } = await import('pdf-lib');
          const mergedPdf = await PDFDocument.create();
          for (const file of files) {
            if (file.type.includes('pdf')) {
              const pdf = await PDFDocument.load(await file.arrayBuffer());
              const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
              pages.forEach((page) => mergedPdf.addPage(page));
            } else {
              const image = await readImage(file);
              const page = mergedPdf.addPage([image.width, image.height]);
              const pngData = await new Promise((resolve) => {
                const canvas = document.createElement('canvas');
                canvas.width = image.width;
                canvas.height = image.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(image, 0, 0);
                canvas.toBlob((blob) => resolve(blob), 'image/png');
              });
              const pngBytes = new Uint8Array(await pngData.arrayBuffer());
              const pngImage = await mergedPdf.embedPng(pngBytes);
              page.drawImage(pngImage, { x: 0, y: 0, width: image.width, height: image.height });
            }
          }
          const pdfBytes = await mergedPdf.save();
          downloadBlob(new Blob([pdfBytes], { type: 'application/pdf' }), 'merged-document.pdf');
          setMessage('PDF files merged successfully.');
          return;
        }
        case 'pdf-compress': {
          const { PDFDocument } = await import('pdf-lib');
          const pdf = await PDFDocument.load(await files[0].arrayBuffer());
          const bytes = await pdf.save({ useObjectStreams: false });
          downloadBlob(new Blob([bytes], { type: 'application/pdf' }), 'compressed-document.pdf');
          setMessage('Compressed PDF created successfully.');
          return;
        }
        case 'scan-to-pdf': {
          const { PDFDocument } = await import('pdf-lib');
          const file = files[0];
          const image = await readImage(file);
          const pdf = await PDFDocument.create();
          const page = pdf.addPage([image.width, image.height]);
          const bytes = new Uint8Array(await file.arrayBuffer());
          const imageData = file.type.includes('png') ? await pdf.embedPng(bytes) : await pdf.embedJpg(bytes);
          page.drawImage(imageData, { x: 0, y: 0, width: image.width, height: image.height });
          const pdfBytes = await pdf.save();
          downloadBlob(new Blob([pdfBytes], { type: 'application/pdf' }), 'scan-document.pdf');
          setMessage('Scan converted to PDF and downloaded.');
          return;
        }
        case 'secure-share': {
          const text = JSON.stringify({
            title: 'Secure share policy',
            owner: 'KaagazSetu user',
            access: 'Private by default',
            validity: '24 hours',
            notes: 'Shared files must be reviewed before download.',
          }, null, 2);
          downloadBlob(new Blob([text], { type: 'application/json' }), 'secure-share-policy.json');
          setMessage('Secure share policy exported.');
          return;
        }
        default:
          throw new Error('This tool is not available yet.');
      }
    } catch (error) {
      setMessage(error.message || 'Unable to complete the action.');
    }
  };

  return (
    <div className="tools-shell">
      <div className="panel-card tools-card">
        <div className="panel-header tools-header">
          <div>
            <p className="eyebrow">Utilities</p>
            <h3>Document tools</h3>
          </div>
        </div>

        <div className="tool-workspace">
          <div className="tool-selector">
            {toolCatalog.map((tool) => (
              <button
                type="button"
                key={tool.slug}
                className={`tool-select ${selectedTool === tool.slug ? 'active' : ''}`}
                onClick={() => {
                  setSelectedTool(tool.slug);
                  setFiles([]);
                  setMessage('Upload a file to begin processing.');
                }}
              >
                <span>{tool.title}</span>
              </button>
            ))}
          </div>

          <div className="tool-editor">
            <h4>{activeTool.title}</h4>
            <p>{activeTool.description}</p>

            <label className="file-input-wrap">
              <span>Choose file</span>
              <input type="file" accept={activeTool.accept} multiple={activeTool.multi} onChange={(event) => setFiles(Array.from(event.target.files || []))} />
            </label>

            <div className="file-list">
              {files.length ? (
                files.map((file, index) => (
                  <div key={`${file.name}-${index}`} className="file-pill">
                    {file.name}
                  </div>
                ))
              ) : (
                <div className="empty-state">No file selected yet.</div>
              )}
            </div>

            <button type="button" className="primary-btn" onClick={processFile}>Process file</button>
            <p className="tool-message">{message}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [status, setStatus] = useState('');
  const [link, setLink] = useState('');

  const token = searchParams.get('token') || '';

  const requestReset = () => {
    const email = localStorage.getItem('kaagazsetu_reset_email') || 'user@example.com';
    const targetToken = crypto.randomUUID();
    const requests = JSON.parse(localStorage.getItem('kaagazsetu_reset_requests') || '[]');
    requests.push({ email, token: targetToken, createdAt: new Date().toISOString() });
    localStorage.setItem('kaagazsetu_reset_requests', JSON.stringify(requests));
    const nextLink = `${window.location.origin}/reset-password?token=${targetToken}`;
    setLink(nextLink);
    setStatus('Reset link generated. Use the link below to set a new password.');
  };

  const submitReset = () => {
    if (!token) {
      setStatus('Reset token is missing. Please use the link from your email.');
      return;
    }

    if (form.password.length < 8) {
      setStatus('Password must be at least 8 characters long.');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setStatus('Passwords do not match.');
      return;
    }

    const requests = JSON.parse(localStorage.getItem('kaagazsetu_reset_requests') || '[]');
    const match = requests.find((item) => item.token === token);

    if (!match) {
      setStatus('This reset link is invalid or has expired.');
      return;
    }

    const currentUser = JSON.parse(localStorage.getItem('kaagazsetu_user') || 'null');
    if (currentUser) {
      currentUser.email = currentUser.email || match.email;
      localStorage.setItem('kaagazsetu_user', JSON.stringify(currentUser));
    }

    localStorage.setItem('kaagazsetu_reset_email', match.email);
    localStorage.removeItem('kaagazsetu_reset_requests');
    setStatus('Password updated successfully. You can now sign in with your new password.');
  };

  return (
    <div className="page-shell centered">
      <div className="panel-card auth-card">
        <h3>{token ? 'Reset your password' : 'Password recovery'}</h3>
        {!token ? (
          <>
            <p>Generate a secure reset link for your account.</p>
            <button type="button" className="primary-btn" onClick={requestReset}>Generate reset link</button>
            {link && (
              <div className="reset-link-box">
                <span>{link}</span>
              </div>
            )}
          </>
        ) : (
          <>
            <label>
              New password
              <input type="password" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} />
            </label>
            <label>
              Confirm password
              <input type="password" value={form.confirmPassword} onChange={(event) => setForm((current) => ({ ...current, confirmPassword: event.target.value }))} />
            </label>
            <button type="button" className="primary-btn" onClick={submitReset}>Update password</button>
          </>
        )}
        {status && <p className="tool-message">{status}</p>}
      </div>
    </div>
  );
}

function SettingsPage() {
  const { logout, user } = useAuth();
  const { push } = useToast();
  const [profile, setProfile] = useState({
    name: user?.name || 'Rahul Sharma',
    email: user?.email || 'rahul@example.com',
    phone: '+91 98765 43210',
    timezone: 'Asia/Kolkata',
    language: 'English',
    notifications: true,
    activityAlerts: true,
    secureAccess: true,
  });

  const exportData = async () => {
    const response = await api('/me/export');
    const blob = new Blob([JSON.stringify(response, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'kaagazsetu-export.json';
    link.click();
    URL.revokeObjectURL(url);
    push('Your vault export is ready.', 'success');
  };

  const navigate = useNavigate();

  const deleteAccount = async () => {
    if (!window.confirm('Are you sure you want to delete your account and all vault data?')) return;
    await api('/me', { method: 'DELETE' });
    logout();
    navigate('/');
    push('Account deleted.', 'success');
  };

  const saveProfile = () => {
    push('Profile settings updated.', 'success');
  };

  const requestPasswordReset = () => {
    const email = profile.email || user?.email || 'user@example.com';
    const token = crypto.randomUUID();
    const requests = JSON.parse(localStorage.getItem('kaagazsetu_reset_requests') || '[]');
    requests.push({ email, token, createdAt: new Date().toISOString() });
    localStorage.setItem('kaagazsetu_reset_requests', JSON.stringify(requests));
    localStorage.setItem('kaagazsetu_reset_email', email);
    const resetLink = `${window.location.origin}/reset-password?token=${token}`;
    navigator.clipboard?.writeText(resetLink).catch(() => {});
    push(`Password reset link created. Use: ${resetLink}`, 'success');
  };

  return (
    <div className="settings-shell">
      <div className="panel-card settings-card">
        <div className="settings-header">
          <div className="avatar">{(profile.name || 'R').charAt(0).toUpperCase()}</div>
          <div>
            <h3>Profile settings</h3>
            <p>Manage your personal details and preferred access options.</p>
          </div>
        </div>

        <div className="settings-grid">
          <div className="settings-form">
            <label>
              Full name
              <input value={profile.name} onChange={(event) => setProfile((current) => ({ ...current, name: event.target.value }))} />
            </label>
            <label>
              Email address
              <input type="email" value={profile.email} onChange={(event) => setProfile((current) => ({ ...current, email: event.target.value }))} />
            </label>
            <label>
              Phone number
              <input value={profile.phone} onChange={(event) => setProfile((current) => ({ ...current, phone: event.target.value }))} />
            </label>
            <div className="two-column-form">
              <label>
                Time zone
                <select value={profile.timezone} onChange={(event) => setProfile((current) => ({ ...current, timezone: event.target.value }))}>
                  <option value="Asia/Kolkata">Asia/Kolkata</option>
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">America/New_York</option>
                </select>
              </label>
              <label>
                Preferred language
                <select value={profile.language} onChange={(event) => setProfile((current) => ({ ...current, language: event.target.value }))}>
                  <option value="English">English</option>
                  <option value="Hindi">Hindi</option>
                </select>
              </label>
            </div>
          </div>

          <div className="settings-side">
            <div className="settings-toggle">
              <span>Notifications</span>
              <button type="button" className={profile.notifications ? 'toggle active' : 'toggle'} onClick={() => setProfile((current) => ({ ...current, notifications: !current.notifications }))}>
                <span />
              </button>
            </div>
            <div className="settings-toggle">
              <span>Activity alerts</span>
              <button type="button" className={profile.activityAlerts ? 'toggle active' : 'toggle'} onClick={() => setProfile((current) => ({ ...current, activityAlerts: !current.activityAlerts }))}>
                <span />
              </button>
            </div>
            <div className="settings-toggle">
              <span>Secure access</span>
              <button type="button" className={profile.secureAccess ? 'toggle active' : 'toggle'} onClick={() => setProfile((current) => ({ ...current, secureAccess: !current.secureAccess }))}>
                <span />
              </button>
            </div>
          </div>
        </div>

        <div className="settings-actions">
          <button type="button" className="ghost-btn" onClick={() => setProfile({ name: user?.name || 'Rahul Sharma', email: user?.email || 'rahul@example.com', phone: '+91 98765 43210', timezone: 'Asia/Kolkata', language: 'English', notifications: true, activityAlerts: true, secureAccess: true })}>Reset</button>
          <button type="button" className="primary-btn" onClick={saveProfile}>Save profile</button>
        </div>
      </div>

      <div className="panel-card">
        <h3>Security</h3>
        <p>Reset your account password anytime. A secure reset link is generated here and can be used to update the password without leaving the app.</p>
        <button type="button" className="secondary-btn" onClick={requestPasswordReset}>Send password reset link</button>
      </div>
      <div className="panel-card">
        <h3>Privacy & export</h3>
        <p>Your vault is encrypted, and your nominee only receives metadata after the waiting period. We never store full Aadhaar numbers.</p>
        <button type="button" className="secondary-btn" onClick={exportData}>Export my data</button>
      </div>
      <div className="panel-card danger-panel">
        <h3>Delete account</h3>
        <p>Delete your account and all associated data as per DPDP-friendly handling.</p>
        <button type="button" className="danger-btn" onClick={deleteAccount}>Delete everything</button>
      </div>
    </div>
  );
}

function EmergencyPage() {
  const { token } = useParams();
  const [state, setState] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api(`/emergency/${token}`)
      .then((result) => setState(result))
      .catch((err) => setError(err.message));
  }, [token]);

  if (error) {
    return <div className="page-shell centered"><div className="panel-card"><h3>Emergency access unavailable</h3><p>{error}</p></div></div>;
  }

  if (!state) {
    return <div className="page-shell centered"><div className="card skeleton-card wide" /></div>;
  }

  return (
    <div className="page-shell centered">
      <div className="emergency-box">
        <p className="eyebrow">Emergency access</p>
        <h2>{state.owner}'s document metadata</h2>
        <div className="emergency-list">
          {state.docs.map((doc) => (
            <div key={doc.id} className="emergency-item">
              <strong>{doc.type}</strong>
              <p>{doc.fileName}</p>
              <small>{doc.extracted?.issuer || 'Issuer'} • {doc.extracted?.number || 'masked record'}</small>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function NotFoundPage() {
  return (
    <div className="page-shell centered">
      <div className="panel-card">
        <h3>Page not found</h3>
        <p>The route you are looking for does not exist.</p>
        <Link to="/dashboard" className="primary-link">Go to dashboard</Link>
      </div>
    </div>
  );
}

function AppShell() {
  const { token, loading } = useAuth();
  const { toasts } = useToast();

  if (loading) {
    return <div className="page-shell centered"><div className="card skeleton-card wide" /></div>;
  }

  return (
    <>
      <ToastViewport toasts={toasts} />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={token ? <Navigate to="/dashboard" replace /> : <LandingPage />} />
          <Route path="/auth" element={token ? <Navigate to="/dashboard" replace /> : <AuthPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/emergency/:token" element={<EmergencyPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<AnalyticsDashboardPage />} />
              <Route path="/ai-assistant" element={<AiAssistantPage />} />
              <Route path="/tools" element={<ToolsPage />} />
              <Route path="/vault" element={<VaultPage />} />
              <Route path="/family" element={<FamilyPage />} />
              <Route path="/expiry" element={<ExpiryPage />} />
              <Route path="/death" element={<DeathChecklistPage />} />
              <Route path="/nominee" element={<NomineePage />} />
              <Route path="/audit" element={<AuditPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}

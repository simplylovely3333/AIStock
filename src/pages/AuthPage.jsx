import React, { useState } from 'react';
import { Mail, Lock, User, Github, Eye, EyeOff, Zap } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AppContext';
import './AuthPage.css';

export default function AuthPage() {
  const [tab, setTab] = useState('login');
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [mockOAuth, setMockOAuth] = useState({ open: false, provider: '' });
  const navigate = useNavigate();
  const { fetchUser } = useAuth();

  function handleChange(e) { setForm(f => ({ ...f, [e.target.name]: e.target.value })); }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      if (tab === 'register') {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: form.name, email: form.email, password: form.password })
        });
        if (!res.ok) {
          const data = await res.json();
          alert(data.detail || 'Ошибка регистрации!');
          return;
        }
        setTab('login');
        alert('Регистрация успешна! Теперь вы можете войти.');
      } else {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: form.email, password: form.password })
        });
        if (!res.ok) {
          const data = await res.json();
          alert(data.detail || 'Ошибка входа! Проверьте почту и пароль.');
          return;
        }
        const data = await res.json();
        localStorage.setItem('token', data.access_token);
        await fetchUser();
        navigate('/');
      }
    } catch (err) {
      console.error(err);
      alert('Ошибка сети или сервер недоступен');
    }
  }

  async function handleGoogleSuccess(credentialResponse) {
    try {
      const res = await fetch('/api/auth/oauth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          provider: 'google',
          token: credentialResponse.credential 
        })
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('token', data.access_token);
        await fetchUser();
        navigate('/');
      } else {
        const err = await res.json();
        alert(err.detail || 'Ошибка Google-входа');
      }
    } catch (e) {
      console.error(e);
      alert('Ошибка соединения с сервером');
    }
  }

  function handleOAuth(provider) {
    if (provider === 'github') {
      setMockOAuth({ open: true, provider });
    }
  }

  async function selectMockAccount(account) {
    try {
      const res = await fetch('/api/auth/oauth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          provider: mockOAuth.provider,
          email: account.email,
          name: account.name,
          avatar: account.avatar
        })
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('token', data.access_token);
        await fetchUser();
        setMockOAuth({ open: false, provider: '' });
        navigate('/');
      } else {
        const errData = await res.json();
        alert('Ошибка авторизации на сервере: ' + (errData.detail || 'Неизвестная ошибка'));
      }
    } catch(err) {
      console.error(err);
      alert('Ошибка соединения с бэкендом');
    }
  }

  const MOCK_ACCOUNTS = [
    { name: 'Бексултан Абдураимов', email: 'bekaadburaimov@gmail.com', avatar: 'Б', color: '#00838f' },
    { name: 'Использовать другой аккаунт', email: '', avatar: '👤', isAction: true },
  ];

  return (
    <div className="auth-page page-enter">
      <div className="auth-page__bg" />

      <div className="auth-card card">
        {/* Logo */}
        <div className="auth-logo">
          <div className="header__logo-icon">
            <Zap size={16} fill="currentColor" />
          </div>
          <span className="auth-logo__text">AI<span className="text-gradient">Stock</span></span>
        </div>

        {/* Tabs */}
        <div className="auth-tabs">
          <button className={`auth-tab ${tab === 'login' ? 'auth-tab--active' : ''}`} onClick={() => setTab('login')}>
            Вход
          </button>
          <button className={`auth-tab ${tab === 'register' ? 'auth-tab--active' : ''}`} onClick={() => setTab('register')}>
            Регистрация
          </button>
        </div>

        <h2 className="auth-title">
          {tab === 'login' ? 'С возвращением' : 'Присоединяйтесь к AIStock'}
        </h2>
        <p className="auth-sub">
          {tab === 'login'
            ? 'Войдите, чтобы получить доступ к своим ассетам и покупкам.'
            : 'Создайте бесплатный аккаунт и начните покупать или продавать AI-ассеты.'}
        </p>

        {/* Social */}
        <div className="auth-socials">
          <div className="auth-google-full" style={{ display: 'flex', justifyContent: 'center' }}>
            {/* 
            <GoogleLogin 
              onSuccess={handleGoogleSuccess} 
              onError={() => alert('Google Login Failed')}
              theme="filled_blue"
              shape="pill"
              text="continue_with"
              locale="ru"
              width="320"
            />
            */}
            <div style={{ color: 'var(--clr-text-3)', fontSize: '13px', textAlign: 'center', padding: '10px' }}>
              Google Auth временно отключен (Origin Error). Используйте вход для разработчика.
            </div>
          </div>
          
          <div className="auth-divider" style={{ margin: '10px 0' }}>
            <span>или используйте</span>
          </div>

          <button type="button" className="btn btn-secondary auth-social-btn" style={{ background: 'var(--clr-bg-3)', borderColor: 'var(--clr-primary-2)' }} onClick={() => setMockOAuth({ open: true, provider: 'google' })}>
            <User size={18} />
            Вход для разработчика (Тестовый)
          </button>

          <button type="button" className="btn btn-secondary auth-social-btn" onClick={() => handleOAuth('github')}>
            <Github size={18} />
            Продолжить с GitHub
          </button>
        </div>

        <div className="auth-divider">
          <span>или</span>
        </div>

        {/* Form */}
        <form className="auth-form" onSubmit={handleSubmit}>
          {tab === 'register' && (
            <div className="auth-field">
              <User size={15} className="auth-field__icon" />
              <input
                name="name" type="text" className="input auth-field__input" style={{ paddingLeft: 38 }}
                placeholder="Полное имя" value={form.name} onChange={handleChange} required
              />
            </div>
          )}

          <div className="auth-field">
            <Mail size={15} className="auth-field__icon" />
            <input
              name="email" type="email" className="input auth-field__input" style={{ paddingLeft: 38 }}
              placeholder="Email адрес" value={form.email} onChange={handleChange} required
            />
          </div>

          <div className="auth-field">
            <Lock size={15} className="auth-field__icon" />
            <input
              name="password" type={showPass ? 'text' : 'password'} className="input auth-field__input" style={{ paddingLeft: 38 }}
              placeholder="Пароль" value={form.password} onChange={handleChange} required
            />
            <button type="button" className="auth-field__toggle" onClick={() => setShowPass(s => !s)}>
              {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>

          {tab === 'login' && (
            <div style={{ textAlign: 'right' }}>
              <Link to="/forgot" style={{ fontSize: '0.82rem', color: 'var(--clr-primary-2)' }}>
                Забыли пароль?
              </Link>
            </div>
          )}

          <button id="auth-submit-btn" type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }}>
            {tab === 'login' ? 'Войти' : 'Создать аккаунт'}
          </button>
        </form>

        <p className="auth-switch">
          {tab === 'login' ? "Нет аккаунта? " : 'Уже есть аккаунт? '}
          <button className="auth-switch-btn" onClick={() => setTab(tab === 'login' ? 'register' : 'login')}>
            {tab === 'login' ? 'Создать аккаунт' : 'Войти'}
          </button>
        </p>

        <p className="auth-legal">
          Продолжая, вы соглашаетесь с нашими{' '}
          <Link to="/terms" style={{ color: 'var(--clr-primary-2)' }}>Условиями использования</Link>
          {' '}и{' '}
          <Link to="/privacy" style={{ color: 'var(--clr-primary-2)' }}>Политикой конфиденциальности</Link>.
        </p>
      </div>

      {mockOAuth.open && (
        <div className="mock-oauth-overlay">
          <div className="mock-oauth-modal google-style-modal">
            <div className="mock-oauth-header">
              <div className="google-logo-wrapper">
                <svg width="24" height="24" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>Вход через аккаунт Google</span>
              </div>
              <h1 className="google-title">Выберите аккаунт</h1>
              <p className="google-subtitle">Переход в приложение "mediapro707.kz"</p>
            </div>

          <div className="google-accounts-list">
            {MOCK_ACCOUNTS.map(acc => (
              <button 
                key={acc.email || acc.name} 
                className="google-account-item" 
                onClick={() => {
                  if (acc.isAction) {
                    setMockOAuth({open:false, provider:''});
                  } else {
                    selectMockAccount(acc);
                  }
                }}
              >
                  <div className="google-account-avatar" style={{ backgroundColor: acc.color || 'transparent', border: acc.isAction ? '1px solid #5f6368' : 'none' }}>
                    {acc.avatar}
                  </div>
                  <div className="google-account-info">
                    <div className="google-account-name">{acc.name}</div>
                    {acc.email && <div className="google-account-email">{acc.email}</div>}
                  </div>
                </button>
              ))}
            </div>

            <div className="google-footer-info">
              Прежде чем начать работу с приложением "mediapro707.kz", вы можете ознакомиться с его <a href="#">политикой конфиденциальности</a> и <a href="#">условиями использования</a>.
            </div>

            <div className="google-modal-bottom">
              <div className="google-lang">Русский ▾</div>
              <div className="google-links">
                <a href="#">Справка</a>
                <a href="#">Конфиденциальность</a>
                <a href="#">Условия</a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

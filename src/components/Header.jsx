import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  Search, ShoppingCart, Heart, Upload, Menu, X, Zap, Bell, Plus, LogOut, Sparkles, User
} from 'lucide-react';
import { useCart, useAuth } from '../context/AppContext';
import AISearchBar from './AISearchBar';
import NotificationsDropdown from './NotificationsDropdown';
import './Header.css';

export default function Header() {
  const { cart, setCartOpen } = useCart();
  const { user, setUser, fetchUser } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const [aiSearchOpen, setAiSearchOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [query, setQuery] = useState('');
  const [notifOpen, setNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  const fetchUnreadCount = () => {
    const token = localStorage.getItem('token');
    if (token) {
      fetch('/api/interactions/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setUnreadCount(data.filter(n => !n.is_read).length);
        }
      })
      .catch(console.error);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
  }, [user]);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  function handleSearch(e) {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/browse?q=${encodeURIComponent(query.trim())}`);
      setSearchOpen(false);
      setQuery('');
    }
  }

  function handleLogout() {
    localStorage.removeItem('token');
    setUser(null);
    navigate('/');
  }

  const navLinks = [
    { to: '/browse',  label: 'Каталог' },
    { to: '/creators',label: 'Авторы' },
    { to: '/pricing', label: 'Тарифы' },
    { to: '/upload',  label: 'Продать' },
    { to: '/profile', label: 'Профиль' },
  ];

  return (
    <header className={`header ${scrolled ? 'header--scrolled' : ''}`}>
      <div className="container header__inner">
        {/* Logo */}
        <Link to="/" className="header__logo">
          <div className="header__logo-icon">
            <Zap size={18} fill="currentColor" />
          </div>
          <span className="header__logo-text">
            AI<span className="text-gradient">Stock</span>
          </span>
        </Link>

        {/* Backdrop overlay */}
        {mobileOpen && (
          <div 
            className="header__backdrop" 
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* Nav */}
        <nav className={`header__nav ${mobileOpen ? 'header__nav--open' : ''}`}>
          {navLinks.map(l => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `header__nav-link ${isActive ? 'header__nav-link--active' : ''}`
              }
              onClick={() => setMobileOpen(false)}
            >
              {l.label}
            </NavLink>
          ))}
          {user && (
            <div className="header__nav-mobile-info">
              <div className="header__mobile-user-row">
                <div className="header__mobile-user-avatar">
                  {user.avatar || '🤖'}
                </div>
                <div>
                  <div className="header__mobile-user-name">{user.name}</div>
                  <div className="header__mobile-user-balance">{user.balance} ₸</div>
                </div>
              </div>
              <button 
                onClick={handleLogout} 
                className="header__mobile-logout-btn"
              >
                <LogOut size={16} /> Выйти
              </button>
            </div>
          )}
        </nav>

        {/* Actions */}
        <div className="header__actions">
          {/* Unified Smart Search */}
          <button 
            className="btn btn-icon btn-ghost unified-search-trigger" 
            onClick={() => setAiSearchOpen(true)}
            title="Умный поиск (AI)"
          >
            <div className="search-icon-wrapper">
              <Search size={20} />
              <Sparkles size={10} className="ai-badge-mini" />
            </div>
          </button>

          <div style={{ position: 'relative' }}>
            <button 
              className="btn btn-icon btn-ghost" 
              aria-label="Уведомления"
              onClick={() => {
                if (!user) return navigate('/auth');
                setNotifOpen(!notifOpen);
              }}
            >
              <Bell size={18} />
              {unreadCount > 0 && <span className="header__cart-count" style={{ background: '#ff3b3b' }}>{unreadCount}</span>}
            </button>
            <NotificationsDropdown 
              isOpen={notifOpen} 
              onClose={() => {
                setNotifOpen(false);
                fetchUnreadCount();
              }} 
            />
          </div>

          <Link to="/profile?tab=favorites" className="btn btn-icon btn-ghost" aria-label="Избранное">
            <Heart size={18} />
          </Link>

          {/* Cart */}
          <button
            id="cart-btn"
            className="btn btn-icon btn-ghost header__cart-btn"
            onClick={() => setCartOpen(true)}
            aria-label="Корзина"
          >
            <ShoppingCart size={18} />
            {cart.length > 0 && (
              <span className="header__cart-count">{cart.length}</span>
            )}
          </button>

          <Link to="/upload" className="btn btn-sm btn-primary header__upload-btn">
            <Upload size={14} /> Продать
          </Link>

          {user ? (
            <div className="header__user">
              <div className="header__user-info">
                <div className="header__user-name">{user.name}</div>
                <div className="header__user-balance">{user.balance} ₸</div>
              </div>
              <Link to="/profile" className="btn btn-icon btn-ghost" title="Профиль">
                <User size={18} />
              </Link>
              <button 
                onClick={handleLogout} 
                className="btn btn-icon btn-ghost text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                title="Выйти"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <Link to="/auth" className="btn btn-sm btn-secondary ml-2">
              Войти
            </Link>
          )}

          {/* Mobile toggle */}
          <button
            className="btn btn-icon btn-ghost header__mobile-toggle"
            onClick={() => setMobileOpen(o => !o)}
            aria-label="Меню"
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      <AISearchBar 
        isOpen={aiSearchOpen} 
        onClose={() => setAiSearchOpen(false)} 
      />
    </header>
  );
}

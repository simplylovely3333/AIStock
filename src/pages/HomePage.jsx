import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Shield, TrendingUp, Users, Star, Download, ChevronRight } from 'lucide-react';
import AssetCard from '../components/AssetCard';
import { CATEGORIES, AUTHORS } from '../data/assets';
import './HomePage.css';

const HERO_WORDS = ['Изображения', 'Видео', 'Аудио', '3D Модели', 'Промпты'];

function AnimatedWord() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % HERO_WORDS.length), 2200);
    return () => clearInterval(t);
  }, []);
  return (
    <span className="hero__word text-gradient" key={idx}>
      {HERO_WORDS[idx]}
    </span>
  );
}

const STATS = [
  { label: 'AI Ассеты',  value: '2.8M+',  icon: <Sparkles size={20} /> },
  { label: 'Авторы',   value: '45K+',   icon: <Users size={20} /> },
  { label: 'Скачивания',  value: '18M+',   icon: <Download size={20} /> },
  { label: 'Средняя оценка', value: '4.9★',   icon: <Star size={20} /> },
];

const FEATURES = [
  {
    icon: <Sparkles size={24} />,
    title: 'Качество на базе ИИ',
    desc: 'Каждый ассет сгенерирован с использованием передовых моделей ИИ и отобран для творческого совершенства.',
  },
  {
    icon: <Shield size={24} />,
    title: 'Понятные лицензии',
    desc: 'Стандартная, расширенная и коммерческая лицензии — точно знайте, для чего можно использовать каждый ассет.',
  },
  {
    icon: <TrendingUp size={24} />,
    title: 'Заработок для авторов',
    desc: 'Зарабатывайте до 70% с каждой продажи. Создайте пассивный доход на ваших навыках ИИ-генерации.',
  },
];

export default function HomePage() {
  const [assets, setAssets] = useState([]);

  useEffect(() => {
    fetch('/api/assets')
      .then(res => res.json())
      .then(setAssets)
      .catch(console.error);
  }, []);

  const featured  = assets.filter(a => a.isHot).slice(0, 4);
  const newAssets = assets.filter(a => a.isHot).slice(0, 8); // fallback if no isNew
  const trending  = assets.filter(a => a.isHot).slice(0, 4);

  return (
    <div className="page-enter">
      {/* ── Hero ── */}
      <section className="hero">
        <div className="hero__glow" />
        <div className="container hero__content">
          <div className="hero__badge badge badge-primary">
            <Sparkles size={12} /> Уже более 2.8 млн AI ассетов
          </div>
          <h1 className="hero__title">
            Откройте для себя премиальные<br />
            AI-сгенерированные <AnimatedWord />
          </h1>
          <p className="hero__subtitle">
            Крупнейший в мире маркетплейс для AI-активов.
            Лицензируйте, скачивайте и творите — всё в одном месте.
          </p>
          <div className="hero__actions">
            <Link to="/browse" className="btn btn-primary btn-lg">
              Каталог <ArrowRight size={18} />
            </Link>
            <Link to="/upload" className="btn btn-secondary btn-lg">
              Начать продавать
            </Link>
          </div>

          {/* Stats bar */}
          <div className="hero__stats">
            {STATS.map(s => (
              <div key={s.label} className="hero__stat">
                <span className="hero__stat-icon">{s.icon}</span>
                <span className="hero__stat-value">{s.value}</span>
                <span className="hero__stat-label">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Floating cards decoration */}
        <div className="hero__deco">
          {[0,1,2,3,4].map(i => {
            if (!assets[i]) return null;
            const a = assets[i];
            const [c1, c2] = a.palette;
            return (
              <div
                key={i}
                className={`hero__deco-card hero__deco-card--${i}`}
                style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}
              />
            );
          })}
        </div>
      </section>

      {/* ── Categories ── */}
      <section className="section-sm">
        <div className="container">
          <div className="home-section-head">
            <h2>Категории</h2>
            <Link to="/browse" className="home-view-all">Смотреть все <ChevronRight size={16} /></Link>
          </div>
          <div className="cats-grid">
            {CATEGORIES.map(cat => (
              <Link
                key={cat.id}
                to={`/browse?cat=${cat.id}`}
                className="cat-tile"
              >
                <span className="cat-tile__icon">{cat.icon}</span>
                <span className="cat-tile__label">{cat.label}</span>
                <span className="cat-tile__count">{cat.count.toLocaleString()}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured ── */}
      <section className="section">
        <div className="container">
          <div className="home-section-head">
            <div>
              <span className="badge badge-gold" style={{ marginBottom: 8 }}>⭐ Выбор редакции</span>
              <h2>Рекомендуемые ассеты</h2>
            </div>
            <Link to="/browse?filter=featured" className="home-view-all">Смотреть все <ChevronRight size={16} /></Link>
          </div>
          <div className="asset-grid">
            {featured.map(a => <AssetCard key={a.id} asset={a} />)}
          </div>
        </div>
      </section>

      {/* ── New Arrivals ── */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="home-section-head">
            <div>
              <span className="badge badge-green" style={{ marginBottom: 8 }}>✦ Только что добавлено</span>
              <h2>Новые поступления</h2>
            </div>
            <Link to="/browse?sort=new" className="home-view-all">Смотреть все <ChevronRight size={16} /></Link>
          </div>
          <div className="asset-grid">
            {newAssets.map(a => <AssetCard key={a.id} asset={a} />)}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="section">
        <div className="container">
          <div className="features-grid">
            {FEATURES.map(f => (
              <div key={f.title} className="feature-card card">
                <div className="feature-card__icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Top Creators ── */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="home-section-head">
            <h2>Лучшие авторы</h2>
            <Link to="/creators" className="home-view-all">Смотреть все <ChevronRight size={16} /></Link>
          </div>
          <div className="creators-row">
            {AUTHORS.map(a => (
              <div key={a.id} className="creator-card card">
                <div className="creator-card__avatar">{a.avatar}</div>
                <div className="creator-card__name">
                  {a.name}
                  {a.verified && <span className="asset-card__verified" title="Подтвержден">✓</span>}
                </div>
                <div className="creator-card__sales">{a.sales.toLocaleString()} продаж</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="cta-banner">
            <div className="cta-banner__glow" />
            <h2>Начните продавать свои AI-работы</h2>
            <p>Присоединяйтесь к 45 000+ авторам, получающим пассивный доход.</p>
            <Link to="/upload" className="btn btn-primary btn-lg">
              Загрузить первый ассет <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

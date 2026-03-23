import React, { useState, useEffect } from 'react';
import { Check, Zap, Star, ShieldCheck, ArrowRight } from 'lucide-react';
import './PricingPage.css';

const TIERS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 2000,
    limit: 100,
    icon: <Zap className="tier-icon" />,
    features: ['100 выкладываний в месяц', 'Базовая поддержка', 'Стандартная комиссия', 'Бейдж "Starter"'],
    color: '#7c5cfc'
  },
  {
    id: 'medium',
    name: 'Medium',
    price: 5000,
    limit: 500,
    icon: <ShieldCheck className="tier-icon" />,
    features: ['500 выкладываний в месяц', 'Приоритетная поддержка', 'Сниженная комиссия', 'Бейдж "Pro Author"', 'Аналитика продаж'],
    color: '#00d2ff'
  },
  {
    id: 'max',
    name: 'Max',
    price: 9000,
    limit: 1000,
    icon: <Star className="tier-icon" />,
    features: ['1000 выкладываний в месяц', 'Персональный менеджер', 'Минимальная комиссия', 'Бейдж "Elite"', 'Доступ к бета-функциям', 'VIP Продвижение'],
    popular: true,
    color: '#ffcc00'
  }
];

export default function PricingPage() {
  const [loading, setLoading] = useState(false);
  const [currentTier, setCurrentTier] = useState('free');
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        setBalance(data.balance);
        setCurrentTier(data.subscription_tier || 'free');
      });
    }
  }, []);

  async function handleUpgrade(tierId) {
    if (tierId === currentTier) return;
    
    setLoading(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/subscriptions/purchase?tier=${tierId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (res.ok) {
        alert(data.message);
        setCurrentTier(tierId);
        setBalance(data.balance);
        window.location.reload();
      } else {
        alert(data.detail || "Ошибка при покупке");
      }
    } catch (err) {
      console.error(err);
      alert("Произошла ошибка");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="pricing-page page-enter">
      <div className="container">
        <header className="pricing-header">
          <span className="badge badge-primary">Тарифы для авторов</span>
          <h1>Выберите уровень своего творчества</h1>
          <p>Повысьте лимиты и получите эксклюзивные возможности для продвижения своих AI-ассетов.</p>
          
          <div className="current-stats">
            <span>Ваш баланс: <strong>{balance} ₸</strong></span>
            <span className="separator">|</span>
            <span>Ваш тариф: <strong>{currentTier.toUpperCase()}</strong></span>
          </div>
        </header>

        <div className="pricing-grid">
          {TIERS.map(tier => (
            <div key={tier.id} className={`pricing-card ${tier.popular ? 'pricing-card--popular' : ''} ${currentTier === tier.id ? 'pricing-card--active' : ''}`}>
              {tier.popular && <div className="popular-tag">Рекомендуем</div>}
              <div className="tier-icon-wrap" style={{ color: tier.color }}>{tier.icon}</div>
              <h2 className="tier-name">{tier.name}</h2>
              <div className="tier-price">
                <span className="amount">{tier.price}</span>
                <span className="currency">₸</span>
                <span className="period">/мес</span>
              </div>
              <p className="tier-limit">{tier.limit} выкладываний</p>
              
              <ul className="feature-list">
                {tier.features.map((f, i) => (
                  <li key={i}><Check size={16} /> {f}</li>
                ))}
              </ul>

              <button 
                className={`btn ${tier.popular ? 'btn-primary' : 'btn-secondary'} btn-block`}
                onClick={() => handleUpgrade(tier.id)}
                disabled={loading || currentTier === tier.id}
              >
                {currentTier === tier.id ? 'Текущий план' : 'Выбрать план'} 
                {currentTier !== tier.id && <ArrowRight size={16} />}
              </button>
            </div>
          ))}
        </div>

        <section className="free-tier-notice">
          <h3>Все еще сомневаетесь?</h3>
          <p>Начните с <strong>бесплатных 5 выкладываний</strong>. Вы можете стать автором прямо сейчас, не тратя ни копейки.</p>
          <button className="btn btn-outline" onClick={() => window.location.href='/upload'}>Попробовать бесплатно</button>
        </section>
      </div>
    </div>
  );
}

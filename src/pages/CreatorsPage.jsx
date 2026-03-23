import React, { useState, useEffect } from 'react';
import { Users, Star, UserPlus, Check } from 'lucide-react';
import { useAuth } from '../context/AppContext';
import './CreatorsPage.css';

export default function CreatorsPage() {
  const { following, toggleFollow, user } = useAuth();
  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/creators/')
      .then(res => res.json())
      .then(data => {
        setCreators(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="page-enter" style={{ padding: '40px', textAlign: 'center' }}>Загрузка авторов...</div>;
  }

  return (
    <div className="creators-page page-enter">
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: 40, marginTop: 40 }}>
          <span className="badge badge-primary" style={{ marginBottom: 12 }}>Сообщество</span>
          <h1 style={{ fontSize: '2.5rem', marginBottom: 16 }}>Популярные Авторы</h1>
          <p style={{ color: 'var(--clr-text-2)', maxWidth: 600, margin: '0 auto' }}>
            Подписывайтесь на лучших создателей AI-контента, следите за их новыми работами и поддерживайте их творчество.
          </p>
        </div>

        <div className="creators-grid">
          {creators.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--clr-text-3)' }}>
              <Users size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
              <p>Пока нет подтвержденных авторов.</p>
            </div>
          ) : (
            creators.map(c => (
              <div key={c.id} className="creator-card card">
                <div className="creator-card__header">
                  <div className="creator-card__avatar">{c.avatar}</div>
                  <div className="creator-card__info">
                    <div className="creator-card__name">
                      {c.name} <span title="Автор">✓</span>
                      <span className="creator-card__ai-badge">{c.ai_category}</span>
                    </div>
                    <div className="creator-card__stats">
                      <span>{c.followers_count} подписчиков</span>
                    </div>
                  </div>
                </div>

                <div className="creator-card__info-row">
                  <div className="creator-card__info-item">
                    <span className="creator-card__info-label">Ассетов</span>
                    <span className="creator-card__info-value">{c.assets_count}</span>
                  </div>
                  <div className="creator-card__info-item">
                    <span className="creator-card__info-label">Рейтинг</span>
                    <span className="creator-card__info-value" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Star size={12} fill="var(--clr-gold)" color="var(--clr-gold)" /> {c.avg_rating}
                    </span>
                  </div>
                  <div className="creator-card__info-item">
                    <span className="creator-card__info-label">Ср. цена</span>
                    <span className="creator-card__info-value">{c.avg_price} ₸</span>
                  </div>
                </div>

                <div className="creator-card__justification">
                  "{c.ai_justification}"
                </div>
                <div className="creator-card__footer">
                  <button 
                    className={`btn btn-sm ${following.includes(c.id) ? 'btn-ghost' : 'btn-secondary'}`} 
                    onClick={() => toggleFollow(c.id)}
                  >
                    {following.includes(c.id) ? <Check size={14} /> : <UserPlus size={14} />} 
                    {following.includes(c.id) ? 'Отписаться' : 'Подписаться'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

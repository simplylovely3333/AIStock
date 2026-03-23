import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ShoppingCart, Heart, Download, Star, Shield, Share2,
  ChevronRight, Eye, Clock, Tag, ArrowLeft, Check, UserPlus
} from 'lucide-react';
import { useCart, useWishlist, useAuth } from '../context/AppContext';
import AssetCard from '../components/AssetCard';
import './AssetDetailPage.css';

function Stars({ rating, size = 16 }) {
  return (
    <div className="stars">
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={size} fill={i <= Math.round(rating) ? 'currentColor' : 'none'}
          className={i <= Math.round(rating) ? 'star-filled' : 'star-empty'} />
      ))}
    </div>
  );
}

const LICENSES = [
  {
    key: 'standard',
    label: 'Стандартная',
    price: null, // use asset price
    features: ['Личное и коммерческое использование', 'До 500 тыс. копий', 'Цифровые продукты'],
  },
  {
    key: 'extended',
    label: 'Расширенная',
    multiplier: 5,
    features: ['Неограниченное кол-во копий', 'Право перепродажи', 'Физические продукты', 'Телевещание'],
  },
];

export default function AssetDetailPage() {
  const { id } = useParams();
  const { addToCart } = useCart();
  const { toggleWishlist, inWishlist } = useWishlist();
  const { following, toggleFollow, user } = useAuth();
  const [license, setLicense] = useState('standard');
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  React.useEffect(() => {
    fetch('/api/assets')
      .then(r => r.json())
      .then(d => { setAssets(d); setLoading(false); })
      .catch(console.error);
  }, []);

  if (loading) return <div className="container detail-not-found"><h2>Загрузка...</h2></div>;

  const asset = assets.find(a => a.id === Number(id));

  if (!asset) {
    return (
      <div className="container detail-not-found">
        <h2>Ассет не найден</h2>
        <Link to="/browse" className="btn btn-primary">← В каталог</Link>
      </div>
    );
  }

  const liked = inWishlist(asset.id);
  const [c1, c2] = asset.palette;
  const price = license === 'extended' ? (asset.price * 5).toFixed(2) : asset.price;

  const related = assets
    .filter(a => a.category === asset.category && a.id !== asset.id)
    .slice(0, 4);

  const dateStr = new Date(asset.createdAt).toLocaleDateString('ru-RU', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <div className="detail-page page-enter">
      <div className="container">
        {/* Breadcrumb */}
        <nav className="detail-breadcrumb">
          <Link to="/">Главная</Link>
          <ChevronRight size={14} />
          <Link to="/browse">Каталог</Link>
          <ChevronRight size={14} />
          <Link to={`/browse?cat=${asset.category}`} style={{ textTransform: 'capitalize' }}>
            {asset.category}
          </Link>
          <ChevronRight size={14} />
          <span>{asset.title}</span>
        </nav>

        <div className="detail-layout">
          {/* Preview */}
          <div className="detail-preview">
            <div
              className="detail-thumb"
              style={{ background: `linear-gradient(135deg, ${c1} 0%, ${c2} 100%)` }}
            >
              <div className="detail-thumb__pattern" />
              <div className="detail-thumb__badges">
                {asset.isNew  && <span className="badge badge-green">Новый</span>}
                {asset.isHot  && <span className="badge badge-red">🔥 Хит</span>}
                {asset.isFree && <span className="badge badge-gold">Бесплатно</span>}
                {asset.resolution && <span className="badge badge-primary">{asset.resolution}</span>}
              </div>
            </div>

            {/* Metadata strip */}
            <div className="detail-meta-strip">
              <div className="detail-meta-item">
                <Eye size={14} /> <span>{(asset.sales * 4).toLocaleString()} просмотров</span>
              </div>
              <div className="detail-meta-item">
                <Download size={14} /> <span>{asset.sales.toLocaleString()} продаж</span>
              </div>
              <div className="detail-meta-item">
                <Clock size={14} /> <span>{dateStr}</span>
              </div>
            </div>

            {/* Tags */}
            <div className="detail-tags">
              <Tag size={14} />
              {asset.tags.map(t => (
                <Link key={t} to={`/browse?q=${t}`} className="tag">{t}</Link>
              ))}
            </div>
          </div>

          {/* Info panel */}
          <aside className="detail-panel">
            {/* Author */}
            <div className="detail-author">
              <div className="detail-author__avatar">{asset.author.avatar}</div>
              <div style={{ flex: 1 }}>
                <div className="detail-author__name">
                  {asset.author.name}
                  {asset.author.verified && (
                    <span className="asset-card__verified">✓</span>
                  )}
                </div>
                <div className="detail-author__sales">{asset.author.sales.toLocaleString()} продаж всего</div>
              </div>
              <button 
                className={`btn btn-sm ${following.includes(asset.author.id) ? 'btn-ghost' : 'btn-secondary'}`}
                style={{ padding: '4px 12px', fontSize: '0.75rem' }}
                onClick={() => toggleFollow(asset.author.id)}
              >
                {following.includes(asset.author.id) ? <Check size={14}/> : <UserPlus size={14}/>} 
                {following.includes(asset.author.id) ? 'Вы подписаны' : 'Подписаться'}
              </button>
            </div>

            <h1 className="detail-title">{asset.title}</h1>

            {/* Rating */}
            <div className="detail-rating">
              <Stars rating={asset.rating} />
              <span className="detail-rating__val">{asset.rating}</span>
              <span className="detail-rating__count">({asset.reviews} отзывов)</span>
            </div>

            <p className="detail-desc">{asset.description}</p>

            {/* License selector */}
            {!asset.isFree && (
              <div className="detail-licenses">
                {LICENSES.map(l => {
                  const lPrice = l.multiplier ? (asset.price * l.multiplier).toFixed(2) : asset.price;
                  return (
                    <div
                      key={l.key}
                      className={`license-card ${license === l.key ? 'license-card--active' : ''}`}
                      onClick={() => setLicense(l.key)}
                    >
                      <div className="license-card__header">
                        <span className="license-card__label">{l.label}</span>
                        <span className="license-card__price">{lPrice} ₸</span>
                      </div>
                      <ul className="license-card__features">
                        {l.features.map(f => (
                          <li key={f}><span className="license-check">✓</span> {f}</li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Price & CTA */}
            <div className="detail-cta">
              <div className="detail-price">
                {asset.isFree ? (
                  <span className="detail-price__free">Бесплатно</span>
                ) : (
                  <span className="detail-price__val">{price} ₸</span>
                )}
                <span className="detail-price__license badge badge-primary">{license === 'standard' ? 'Стандартная' : 'Расширенная'} лицензия</span>
              </div>
              <button
                id="add-to-cart-btn"
                className="btn btn-primary btn-lg"
                onClick={() => addToCart({ ...asset, price: Number(price) })}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <ShoppingCart size={18} />
                {asset.isFree ? 'Скачать бесплатно' : `В корзину — ${price} ₸`}
              </button>
              <div className="detail-actions-row">
                <button
                  className={`btn btn-secondary ${liked ? 'detail-liked' : ''}`}
                  onClick={() => toggleWishlist(asset)}
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  <Heart size={16} fill={liked ? 'currentColor' : 'none'} />
                  {liked ? 'В избранном' : 'В избранное'}
                </button>
                <button 
                  className="btn btn-ghost btn-icon"
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  title="Поделиться"
                >
                  {copied ? <Check size={16} className="text-green-500" /> : <Share2 size={16} />}
                </button>
              </div>
            </div>

            {/* Trust badges */}
            <div className="detail-trust">
              <div className="detail-trust-item"><Shield size={14} /> Безопасная оплата</div>
              <div className="detail-trust-item"><Download size={14} /> Мгновенное скачивание</div>
              <div className="detail-trust-item"><Star size={14} /> Гарантия возврата денег</div>
            </div>
          </aside>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <section style={{ marginTop: 60 }}>
            <div className="home-section-head">
              <h2>Похожие ассеты</h2>
              <Link to={`/browse?cat=${asset.category}`} className="home-view-all">
                Смотреть все <ChevronRight size={16} />
              </Link>
            </div>
            <div className="asset-grid">
              {related.map(a => <AssetCard key={a.id} asset={a} />)}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Eye, Star, Play, Headphones, Box } from 'lucide-react';
import { useCart, useWishlist } from '../context/AppContext';
import './AssetCard.css';

function AssetThumbnail({ asset }) {
  const [c1, c2] = asset.palette;
  const catIcon = {
    images:  null,
    video:   <Play size={28} fill="white" />,
    audio:   <Headphones size={28} />,
    '3d':    <Box size={28} />,
    prompts: <span style={{ fontSize: 28 }}>✍️</span>,
  }[asset.category] || null;

  return (
    <div
      className="asset-thumb"
      style={{ background: `linear-gradient(135deg, ${c1} 0%, ${c2} 100%)` }}
    >
      {/* Pattern overlay */}
      <div className="asset-thumb__pattern" />

      {/* Center icon for non-image types */}
      {catIcon && (
        <div className="asset-thumb__icon">{catIcon}</div>
      )}

      {/* Badges */}
      <div className="asset-thumb__badges">
        {asset.isNew  && <span className="badge badge-green">Новый</span>}
        {asset.isHot  && <span className="badge badge-red">🔥 Хит</span>}
        {asset.isFree && <span className="badge badge-gold">Бесплатно</span>}
        {asset.resolution && <span className="badge badge-primary">{asset.resolution}</span>}
        {asset.duration   && <span className="asset-thumb__duration">{asset.duration}</span>}
      </div>
    </div>
  );
}

function Stars({ rating }) {
  return (
    <div className="stars">
      {[1,2,3,4,5].map(i => (
        <Star
          key={i}
          size={11}
          fill={i <= Math.round(rating) ? 'currentColor' : 'none'}
          className={i <= Math.round(rating) ? 'star-filled' : 'star-empty'}
        />
      ))}
    </div>
  );
}

export default function AssetCard({ asset }) {
  const { addToCart } = useCart();
  const { toggleWishlist, inWishlist } = useWishlist();
  const liked = inWishlist(asset.id);

  return (
    <div className="asset-card card" id={`asset-card-${asset.id}`} data-asset-id={asset.id}>
      <div className="asset-card__thumb-wrap">
        <AssetThumbnail asset={asset} />

        {/* Hover overlay */}
        <div className="asset-card__overlay">
          <button
            className="btn btn-icon btn-primary"
            onClick={() => addToCart(asset)}
            title="В корзину"
          >
            <ShoppingCart size={16} />
          </button>
          <Link to={`/asset/${asset.id}`} className="btn btn-icon btn-secondary" title="Быстрый просмотр">
            <Eye size={16} />
          </Link>
          <button
            className={`btn btn-icon ${liked ? 'btn-primary' : 'btn-ghost'} asset-card__wish`}
            onClick={() => toggleWishlist(asset)}
            title="В избранное"
          >
            <Heart size={16} fill={liked ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>

      <div className="asset-card__body">
        {/* Author */}
        <div className="asset-card__author">
          <div className="asset-card__avatar">{asset.author.avatar}</div>
          <span className="asset-card__author-name">
            {asset.author.name}
            {asset.author.verified && <span className="asset-card__verified" title="Подтвержден">✓</span>}
          </span>
        </div>

        {/* Title */}
        <Link to={`/asset/${asset.id}`} className="asset-card__title">
          {asset.title}
        </Link>

        {/* Rating row */}
        <div className="asset-card__meta">
          <Stars rating={asset.rating} />
          <span className="asset-card__rating-val">{asset.rating}</span>
          <span className="asset-card__reviews">({asset.reviews})</span>
        </div>

        {/* Footer */}
        <div className="asset-card__footer">
          <div className="asset-card__price">
            {asset.isFree ? (
              <span className="asset-card__price-free">Бесплатно</span>
            ) : (
              <span className="asset-card__price-val">{asset.price} ₸</span>
            )}
            <span className="asset-card__license">{asset.license}</span>
          </div>
          <button
            className="btn btn-sm btn-primary asset-card__buy-btn"
            onClick={() => addToCart(asset)}
          >
            {asset.isFree ? 'Получить' : 'Купить'}
          </button>
        </div>
      </div>
    </div>
  );
}

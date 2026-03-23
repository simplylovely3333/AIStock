import React from 'react';
import { Link } from 'react-router-dom';
import { Zap, Twitter, Github, Instagram, Youtube } from 'lucide-react';
import './Footer.css';

const COLS = [
  {
    title: 'Маркетплейс',
    links: [
      { label: 'Весь каталог', to: '/browse' },
      { label: 'Новые поступления', to: '/browse?sort=new' },
      { label: 'Популярное', to: '/browse?sort=popular' },
      { label: 'Бесплатные', to: '/browse?price=free' },
    ],
  },
  {
    title: 'Авторам',
    links: [
      { label: 'Продать ассеты', to: '/upload' },
      { label: 'Панель автора', to: '/dashboard' },
      { label: 'Тарифы', to: '/pricing' },
      { label: 'Верификация', to: '/verify' },
    ],
  },
  {
    title: 'Поддержка',
    links: [
      { label: 'Центр помощи', to: '/help' },
      { label: 'Лицензии', to: '/licenses' },
      { label: 'Контакты', to: '/contact' },
      { label: 'Статус серверов', to: '/status' },
    ],
  },
  {
    title: 'Компания',
    links: [
      { label: 'О нас', to: '/about' },
      { label: 'Блог', to: '/blog' },
      { label: 'Карьера', to: '/careers' },
      { label: 'Пресс-кит', to: '/press' },
    ],
  },
];

const SOCIALS = [
  { Icon: Twitter, label: 'Twitter',   href: '#' },
  { Icon: Github,  label: 'GitHub',    href: '#' },
  { Icon: Instagram, label: 'Instagram', href: '#' },
  { Icon: Youtube, label: 'Youtube',   href: '#' },
];

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__top">
          {/* Brand */}
          <div className="footer__brand">
            <Link to="/" className="footer__logo">
              <div className="header__logo-icon">
                <Zap size={16} fill="currentColor" />
              </div>
              <span>AI<span className="text-gradient">Stock</span></span>
            </Link>
            <p className="footer__tagline">
              Крупнейший в мире маркетплейс AI-сгенерированных креативных активов: изображений, видео, аудио, 3D и промптов.
            </p>
            <div className="footer__socials">
              {SOCIALS.map(({ Icon, label, href }) => (
                <a key={label} href={href} className="footer__social-link" aria-label={label}>
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {COLS.map(col => (
            <div key={col.title} className="footer__col">
              <h4 className="footer__col-title">{col.title}</h4>
              <ul>
                {col.links.map(l => (
                  <li key={l.label}>
                    <Link to={l.to} className="footer__link">{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="footer__bottom">
          <p className="footer__copy">© 2025 AIStock. Все права защищены.</p>
          <div className="footer__legal">
            <Link to="/terms" className="footer__link">Условия использования</Link>
            <Link to="/privacy" className="footer__link">Конфиденциальность</Link>
            <Link to="/cookies" className="footer__link">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

import React from 'react';
import { X, ShoppingCart, Trash2, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/AppContext';
import './CartSidebar.css';

export default function CartSidebar() {
  const { cart, removeFromCart, cartOpen, setCartOpen } = useCart();
  const total = cart.reduce((s, a) => s + a.price, 0);
  const navigate = useNavigate();

  const handleCheckout = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert("Пожалуйста, войдите в систему для оформления заказа.");
      setCartOpen(false);
      navigate('/auth');
      return;
    }
    const assetIds = cart.map(a => a.id);
    try {
      const res = await fetch('/api/orders/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ asset_ids: assetIds })
      });
      const data = await res.json();
      if (res.ok) {
        alert("Заказ успешно оформлен! Ассеты добавлены в ваши покупки.");
        // clear cart logic would go here
        setCartOpen(false);
      } else {
        alert("Ошибка: " + data.detail); 
        if(data.detail.includes("баланс")) {
           setCartOpen(false);
        }
      }
    } catch (e) {
      console.error(e);
      alert("Произошла ошибка при оформлении заказа.");
    }
  };

  if (!cartOpen) return null;

  return (
    <>
      <div className="overlay" onClick={() => setCartOpen(false)} />
      <aside className="cart-sidebar">
        <div className="cart-sidebar__header">
          <div className="cart-sidebar__title">
            <ShoppingCart size={20} />
            <span>Корзина</span>
            <span className="cart-sidebar__count">{cart.length}</span>
          </div>
          <button
            className="btn btn-icon btn-ghost"
            onClick={() => setCartOpen(false)}
            aria-label="Закрыть корзину"
          >
            <X size={18} />
          </button>
        </div>

        <div className="cart-sidebar__body">
          {cart.length === 0 ? (
            <div className="cart-sidebar__empty">
              <ShoppingCart size={48} strokeWidth={1} />
              <p>Ваша корзина пуста</p>
              <Link to="/browse" className="btn btn-primary" onClick={() => setCartOpen(false)}>
                В каталог
              </Link>
            </div>
          ) : (
            <ul className="cart-sidebar__items">
              {cart.map(asset => {
                const [c1, c2] = asset.palette;
                return (
                  <li key={asset.id} className="cart-item">
                    <div
                      className="cart-item__thumb"
                      style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}
                    />
                    <div className="cart-item__info">
                      <span className="cart-item__title">{asset.title}</span>
                      <span className="cart-item__author">{asset.author.name}</span>
                      <span className="cart-item__license badge badge-primary">{asset.license === 'standard' ? 'Стандартная' : asset.license}</span>
                    </div>
                    <div className="cart-item__right">
                      <span className="cart-item__price">
                        {asset.isFree ? 'Бесплатно' : `${asset.price} ₸`}
                      </span>
                      <button
                        className="cart-item__remove"
                        onClick={() => removeFromCart(asset.id)}
                        aria-label="Удалить"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {cart.length > 0 && (
          <div className="cart-sidebar__footer">
            <div className="cart-sidebar__summary">
              <div className="cart-sidebar__row">
                <span>Подытог ({cart.length} товар{cart.length !== 1 ? 'ов' : ''})</span>
                <span>{total} ₸</span>
              </div>
              <div className="cart-sidebar__row cart-sidebar__row--total">
                <span>Итого</span>
                <span className="cart-sidebar__total">{total} ₸</span>
              </div>
            </div>
            <button
              className="btn btn-primary btn-lg"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={handleCheckout}
            >
              Оформить заказ <ArrowRight size={18} />
            </button>
            <button
              className="btn btn-ghost"
              style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
              onClick={() => setCartOpen(false)}
            >
              Продолжить покупки
            </button>
          </div>
        )}
      </aside>
    </>
  );
}

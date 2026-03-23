import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Shield, Lock, ChevronLeft, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AppContext';
import './TopUpPage.css';

export default function TopUpPage() {
  const { user, fetchUser } = useAuth();
  const navigate = useNavigate();
  
  const [form, setForm] = useState({
    number: '',
    expiry: '',
    cvc: '',
    name: ''
  });
  
  const [amount, setAmount] = useState(5000);
  const [cardInfo, setCardInfo] = useState({
    brand: 'Unknown',
    country: 'Unknown',
    flag: '🏳️',
    bank: 'Unknown',
    cardholder_name: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // BIN Detection Effect
  useEffect(() => {
    const cleanNum = form.number.replace(/\s/g, '');
    if (cleanNum.length >= 6) {
      const bin = cleanNum.slice(0, 16); // Send up to 16 for full check if needed
      fetch('/api/payments/card-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bin })
      })
      .then(r => r.json())
      .then(data => {
        setCardInfo({
          brand: data.brand,
          country: data.country,
          flag: data.country_flag,
          bank: data.bank,
          cardholder_name: data.cardholder_name || ''
        });
        // Magic auto-fill for Beksultan
        if (data.cardholder_name && !form.name) {
          setForm(f => ({ ...f, name: data.cardholder_name }));
        }
      })
      .catch(console.error);
    } else {
      setCardInfo({ brand: 'Unknown', country: 'Unknown', flag: '🏳️', bank: 'Unknown', cardholder_name: '' });
    }
  }, [form.number]);

  const handleInputChange = (e) => {
    let { name, value } = e.target;
    
    if (name === 'number') {
      value = value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim().slice(0, 19);
    }
    if (name === 'expiry') {
      value = value.replace(/\D/g, '').replace(/(.{2})/, '$1/').slice(0, 5);
    }
    if (name === 'cvc') {
      value = value.replace(/\D/g, '').slice(0, 3);
    }
    
    setForm(f => ({ ...f, [name]: value }));
  };

  const validateCard = (num) => {
    const s = num.replace(/\s/g, '');
    let sum = 0;
    for (let i = 0; i < s.length; i++) {
        let intVal = parseInt(s.substr(i, 1));
        if (i % 2 === s.length % 2) {
            intVal *= 2;
            if (intVal > 9) intVal -= 9;
        }
        sum += intVal;
    }
    return sum % 10 === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanNum = form.number.replace(/\s/g, '');
    
    if (cleanNum.length < 16) {
      alert("Номер карты должен содержать 16 цифр");
      return;
    }
    if (!validateCard(cleanNum) && !cleanNum.endsWith('7777')) {
      alert("Некорректный номер карты (Luhn check failed)");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/payments/topup?amount=${amount}`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json' 
        }
      });
      
      if (res.ok) {
        setIsSuccess(true);
        await fetchUser();
        setTimeout(() => navigate('/profile'), 2000);
      } else {
        alert("Ошибка пополнения");
      }
    } catch (err) {
      console.error(err);
      alert("Ошибка сети");
    } finally {
      setLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="topup-page flex items-center justify-center">
        <div className="text-center p-12 bg-card rounded-3xl border border-border shadow-2xl">
          <div className="mx-auto w-20 h-20 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mb-6">
            <Check size={40} strokeWidth={3} />
          </div>
          <h2 className="text-3xl font-black mb-4">Успешно!</h2>
          <p className="text-muted text-lg mb-8">Баланс пополнен на <strong>{amount} ₸</strong></p>
          <p className="text-sm text-muted animate-pulse">Перенаправление в профиль...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="topup-page page-enter">
      <div className="container">
        <button onClick={() => navigate(-1)} className="btn btn-ghost mb-8 flex items-center gap-2">
          <ChevronLeft size={18} /> Назад
        </button>

        <div className="topup-container">
          {/* Visual Card Section */}
          <div className="card-visual-section">
            <div className="card-visual-wrapper">
              <div className="virtual-card">
                <div className="card-pattern" />
                <div className="card-top">
                  <div className="card-chip" />
                  <div className="card-brand">{cardInfo.brand !== 'Unknown' ? cardInfo.brand : 'VISA'}</div>
                </div>
                <div className="card-number">
                  {form.number || '•••• •••• •••• ••••'}
                </div>
                <div className="card-bottom">
                  <div className="card-holder">
                    CARDHOLDER
                    <span className="card-holder-name">{form.name || 'ВАШЕ ИМЯ'}</span>
                  </div>
                  <div className="card-expiry">
                    <span className="card-expiry-label">Expires</span>
                    <span className="card-expiry-val">{form.expiry || 'MM/YY'}</span>
                  </div>
                </div>
                
                {cardInfo.country !== 'Unknown' && (
                  <div className="card-country">
                    <span>{cardInfo.flag}</span>
                    <span>{cardInfo.country}</span>
                    <span style={{opacity: 0.5}}>•</span>
                    <span>{cardInfo.bank}</span>
                  </div>
                )}
              </div>
              
              <div className="card-info-box mt-12 p-6 rounded-2xl bg-primary-500/5 border border-primary-500/10">
                <h4 className="flex items-center gap-2 font-bold mb-2">
                  <AlertCircle size={16} className="text-primary-400" /> Тестовые данные
                </h4>
                <p className="text-sm text-muted leading-relaxed">
                  Используйте карту <strong>4444 ... 7777</strong> для автоматического определения владельца. 
                  Для других карт BIN-детектор покажет страну и банк (например, 510621 для Kaspi).
                </p>
              </div>
            </div>
          </div>

          {/* Form Section */}
          <div className="topup-form-section">
            <div className="topup-form-card">
              <h2 className="topup-title">Пополнение баланса</h2>
              <p className="topup-subtitle">Быстрое и безопасное пополнение через карту</p>

              <div className="topup-amount-selector">
                {[1000, 5000, 10000, 25000].map(val => (
                  <button 
                    key={val}
                    className={`amount-btn ${amount === val ? 'active' : ''}`}
                    onClick={() => setAmount(val)}
                  >
                    {val} ₸
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">Номер карты</label>
                  <div className="form-input-wrap">
                    <input 
                      name="number"
                      className="form-input" 
                      placeholder="0000 0000 0000 0000"
                      value={form.number}
                      onChange={handleInputChange}
                      required
                    />
                    <CreditCard className="form-icon-right" size={18} />
                  </div>
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Срок действия</label>
                    <input 
                      name="expiry"
                      className="form-input" 
                      placeholder="ММ/ГГ"
                      value={form.expiry}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">CVC / CVV</label>
                    <input 
                      name="cvc"
                      type="password"
                      className="form-input" 
                      placeholder="•••"
                      value={form.cvc}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Имя владельца</label>
                  <input 
                    name="name"
                    className="form-input" 
                    placeholder="IVAN IVANOV"
                    style={{ textTransform: 'uppercase' }}
                    value={form.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <button type="submit" disabled={loading} className="btn btn-primary topup-submit">
                  {loading ? 'Обработка...' : `Оплатить ${amount} ₸`}
                </button>
              </form>

              <div className="security-badges">
                <div className="security-badge"><Shield size={14} /> PCI DSS</div>
                <div className="security-badge"><Lock size={14} /> 256-bit SSL</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

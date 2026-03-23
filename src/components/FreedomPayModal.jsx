import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CreditCard, ShieldCheck, Lock } from 'lucide-react';
import './FreedomPayModal.css';

export default function FreedomPayModal({ isOpen, onClose, amount, onSuccess }) {
  const [loading, setLoading] = useState(false);

  async function handlePay(e) {
    e.preventDefault();
    setLoading(true);
    setTimeout(async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/payments/deposit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ amount: parseFloat(amount) })
        });
        const data = await res.json();
        const sessionId = data.session_id;

        await fetch('/api/payments/webhook', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: sessionId, status: 'success' })
        });

        setLoading(false);
        onSuccess();
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    }, 2000);
  }

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        className="fp-modal-overlay"
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
      >
        <motion.div 
          className="fp-modal-content"
          initial={{ scale: 0.9, y: 30 }} 
          animate={{ scale: 1, y: 0 }} 
          exit={{ scale: 0.9, y: 30 }}
        >
          <button onClick={onClose} className="fp-modal-close" aria-label="Закрыть">
            <X size={20} />
          </button>

          <header className="fp-modal-header">
            <div className="fp-icon-box">
              <ShieldCheck size={28} />
            </div>
            <div className="fp-title-group">
              <h2>Freedom Pay</h2>
              <p className="fp-subtitle">Безопасный платеж (Казахстан)</p>
            </div>
          </header>

          <div className="fp-amount-section">
            <span className="fp-amount-label">Сумма к оплате</span>
            <div className="fp-amount-value">{amount} ₸</div>
          </div>

          <form onSubmit={handlePay} className="fp-form">
            <div className="fp-input-group">
              <label className="fp-label">Номер карты</label>
              <div className="fp-input-relative">
                <CreditCard className="fp-input-icon" size={20} />
                <input 
                  type="text" 
                  placeholder="0000 0000 0000 0000" 
                  className="fp-input"
                  required
                />
              </div>
            </div>
            
            <div className="fp-row">
              <div className="fp-input-group">
                <label className="fp-label">Срок (MM/YY)</label>
                <input type="text" placeholder="12/26" className="fp-input" required />
              </div>
              <div className="fp-input-group">
                <label className="fp-label">CVC</label>
                <div className="fp-input-relative">
                  <Lock className="fp-input-icon" size={18} style={{left: '12px'}} />
                  <input type="password" placeholder="•••" className="fp-input" style={{paddingLeft: '40px'}} required />
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="fp-submit-btn"
            >
              {loading ? (
                <div className="fp-spinner" />
              ) : (
                `Оплатить ${amount} ₸`
              )}
            </button>
          </form>

          <p style={{textAlign: 'center', fontSize: '11px', color: 'var(--clr-text-3)', marginTop: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'}}>
            <Lock size={12} /> Ваши данные защищены шифрованием SSL
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

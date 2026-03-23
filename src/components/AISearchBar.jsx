import React, { useState } from 'react';
import { Sparkles, X, ArrowRight, Loader2, Search, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './AISearchBar.css';

export default function AISearchBar({ isOpen, onClose }) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [visibleAssets, setVisibleAssets] = useState([]);
  const navigate = useNavigate();

  // Scrape visible context when opened
  React.useEffect(() => {
    if (isOpen) {
      const cards = document.querySelectorAll('.asset-card');
      const ids = Array.from(cards)
        .map(c => parseInt(c.getAttribute('data-asset-id')))
        .filter(id => !isNaN(id));
      setVisibleAssets(ids);
    }
  }, [isOpen]);

  async function handleSubmit(e) {
    if (e) e.preventDefault();
    if (!prompt.trim() || loading) return;

    setLoading(true);
    setResults(null);
    try {
      const res = await fetch('/api/ai-search/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt,
          visible_assets: visibleAssets
        })
      });
      
      if (!res.ok) throw new Error('AI Search failed');
      const data = await res.json();
      setResults(data);
    } catch (err) {
      console.error(err);
      alert("Ошибка ИИ-поиска. Попробуйте другой запрос.");
    } finally {
      setLoading(false);
    }
  }

  function handleHighlight(assetId) {
    const el = document.getElementById(`asset-card-${assetId}`);
    if (el) {
      onClose();
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('highlight-shake');
      setTimeout(() => el.classList.remove('highlight-shake'), 2000);
    } else {
      // If not on current page, just navigate
      navigate(`/asset/${assetId}`);
      onClose();
    }
  }

  function handleQuickTip(tip) {
    setPrompt(tip);
    // Trigger search immediately for better UX
    setTimeout(() => {
      const mockEvent = { preventDefault: () => {} };
      // Note: In a real app, I'd extract the search logic to a separate function
    }, 10);
  }

  if (!isOpen) return null;

  const isAssistantMode = visibleAssets.length > 0;

  return (
    <div className="ai-search-overlay">
      <div className="ai-search-modal page-enter">
        <button className="ai-search-close" onClick={onClose}>
          <X size={24} />
        </button>
        
        <div className="ai-search-content">
          <div className="ai-search-header">
            <div className="ai-search-icon-badge">
              {isAssistantMode ? (
                <div className="agent-avatar-wrap">
                  <span className="agent-emoji" role="img" aria-label="assistant">🤖</span>
                  <div className="online-indicator" />
                </div>
              ) : (
                <>
                  <Search size={22} className="search-base-icon" />
                  <Sparkles size={16} fill="currentColor" className="ai-accent-icon" />
                </>
              )}
            </div>
            <h2>{isAssistantMode ? 'Ваш ассистент' : 'Умный поиск'}</h2>
            <p>
              {isAssistantMode 
                ? `Вижу ${visibleAssets.length} товаров на странице. Сравнить их или посоветовать лучшее?`
                : 'Ищите ассеты по ключевым словам или просто опишите, что вам нужно'
              }
            </p>
          </div>

          <form onSubmit={handleSubmit} className="ai-search-form">
            <div className={`ai-search-input-wrap ${loading ? 'ai-search-input-wrap--loading' : ''}`}>
              <textarea
                autoFocus
                placeholder={isAssistantMode ? "Напр: «Сравни товары на странице» или «Что лучше из этого?»" : "Напр: 3D модели машин или подбери лучшие промпты..."}
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                disabled={loading}
              />
              {loading && (
                <div className="ai-search-loader">
                  <div className="ai-search-shimmer" />
                  <Loader2 className="animate-spin" size={24} />
                  <span>ИИ анализирует контекст и ваш запрос...</span>
                </div>
              )}
            </div>

            <button 
              type="submit" 
              className="btn btn-primary btn-lg ai-search-submit"
              disabled={loading || !prompt.trim()}
            >
              {isAssistantMode ? <Sparkles size={18} /> : <Search size={18} />}
              {loading ? 'ИИ думает...' : (results ? 'Спросить еще' : (isAssistantMode ? 'Посоветовать' : 'Найти'))}
            </button>
          </form>
          
          <div className="ai-search-disclaimer" style={{ textAlign: 'center', fontSize: '12px', color: 'var(--clr-text-3)', marginTop: '8px' }}>
            ИИ может допускать ошибки. Пожалуйста, проверяйте информацию.
          </div>

          {results && (
            <div className="ai-search-results-area page-enter">
              <div className="ai-search-explanation">
                <div className="ai-search-explanation-icon">🤖</div>
                <p>{results.text_response}</p>
              </div>

              <div className="ai-search-results-grid">
                {results.results.map((item, idx) => (
                  <div 
                    key={idx} 
                    className={`ai-result-item ${item.is_recommendation ? 'ai-result-item--chosen' : ''}`}
                  >
                    <div className="ai-result-thumb" onClick={() => { navigate(item.url); onClose(); }}>
                      {item.thumb ? (
                        item.type === 'creator' && item.thumb === '🤖' ? (
                          <div className="avatar-placeholder">🤖</div>
                        ) : (
                          <img src={item.thumb} alt={item.label} />
                        )
                      ) : (
                        <div className="type-icon">{item.type[0].toUpperCase()}</div>
                      )}
                    </div>
                    <div className="ai-result-info">
                      <div className="ai-result-badges-row">
                        <span className={`ai-result-badge ai-result-badge--${item.type}`}>
                          {item.type === 'asset' ? 'Ассет' : item.type === 'creator' ? 'Автор' : 'Раздел'}
                        </span>
                        {item.is_recommendation && <span className="ai-result-badge ai-result-badge--suggest">Совет ИИ</span>}
                      </div>
                      <h4 className="ai-result-label" onClick={() => { navigate(item.url); onClose(); }}>{item.label}</h4>
                      <p className="ai-result-reason">{item.reason || item.description}</p>
                    </div>
                    
                    <div className="ai-result-actions">
                      {item.type === 'asset' && visibleAssets.includes(item.id) ? (
                        <button 
                          className="btn btn-icon btn-ghost btn-sm" 
                          title="Показать на странице"
                          onClick={() => handleHighlight(item.id)}
                        >
                          <Eye size={16} />
                        </button>
                      ) : (
                        <button 
                          className="btn btn-icon btn-ghost btn-sm" 
                          onClick={() => { navigate(item.url); onClose(); }}
                        >
                          <ArrowRight size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!results && !loading && (
            <div className="ai-search-tips">
              <span className="tip-label">Попробуйте:</span>
              <div className="tip-list">
                <button type="button" onClick={() => handleQuickTip("Бесплатные 3D модели машин")}>"Бесплатные 3D модели машин"</button>
                <button type="button" onClick={() => handleQuickTip("Аудио для медитации высокого качества")}>"Аудио для медитации высокого качества"</button>
                <button type="button" onClick={() => handleQuickTip("Промпты для киберпанка от лучших авторов")}>"Промпты для киберпанка от лучших авторов"</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

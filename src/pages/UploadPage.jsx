import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Upload, Image, Film, Music, Box, FileText, X, CheckCircle, DollarSign, Tag, Zap, Sparkles, Loader2 } from 'lucide-react';
import { CATEGORIES } from '../data/assets';
import './UploadPage.css';

const CAT_ICONS = { images: Image, video: Film, audio: Music, '3d': Box, prompts: FileText };

export default function UploadPage() {
  const navigate = useNavigate();
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [form, setForm] = useState({
    title: '', description: '', tags: '', rawIdea: '',
    category: 'images', price: '', license: 'Standard',
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [subInfo, setSubInfo] = useState({ tier: 'free', uploads_count: 0, monthly_uploads_count: 0, limit: 5 });
  const [limitReached, setLimitReached] = useState(false);
  const fileRef = useRef();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetch('/api/subscriptions/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        setSubInfo(data);
        const currentCount = data.tier === 'free' ? data.uploads_count : data.monthly_uploads_count;
        if (currentCount >= data.limit) {
          setLimitReached(true);
        }
      })
      .catch(err => console.error("Error fetching sub info:", err));
    }
  }, []);

  function handleDrop(e) {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) setFile(f);
  }
  function handleFile(e) { if (e.target.files[0]) setFile(e.target.files[0]); }
  function handleChange(e) { setForm(f => ({ ...f, [e.target.name]: e.target.value })); }

  async function handleSubmit(e) {
    e.preventDefault();
    if (limitReached) {
      alert("Лимит загрузок исчерпан! Пожалуйста, обновите тариф.");
      navigate('/pricing');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      alert("Сначала войдите в систему, чтобы загрузить ассет!");
      return;
    }
    try {
      const res = await fetch('/api/assets/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          price: Number(form.price) || 0,
          category: form.category
        })
      });
      if (res.ok) {
        setSubmitted(true);
      } else {
        const data = await res.json();
        if (res.status === 403) {
          alert(data.detail);
          navigate('/pricing');
        } else {
          alert("Ошибка: " + data.detail);
        }
      }
    } catch (err) {
      console.error(err);
      alert("Ошибка сети при отправке!");
    }
  }

  async function handleAIGenerate() {
    if (!file) {
      alert("Сначала загрузите файл! Наш ИИ проанализирует его, чтобы создать идеальное описание.");
      return;
    }
    setIsGenerating(true);
    try {
      const res = await fetch('/api/metadata/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw_idea: file.name, category: form.category })
      });
      if (res.ok) {
        const data = await res.json();
        setForm(f => ({
          ...f,
          title: data.title,
          description: data.description,
          tags: data.tags.join(', ')
        }));
      }
    } catch (err) {
      console.error("AI Gen Error:", err);
    } finally {
      setIsGenerating(false);
    }
  }

  if (submitted) {
    return (
      <div className="upload-success page-enter">
        <CheckCircle size={64} strokeWidth={1.5} color="var(--clr-green)" />
        <h2>Ассет отправлен!</h2>
        <p>Ваш ассет находится на проверке. Мы сообщим вам, когда он появится на маркетплейсе.</p>
        <button className="btn btn-primary btn-lg" onClick={() => { setSubmitted(false); setFile(null); setForm({ title:'',description:'',tags:'',rawIdea:'',category:'images',price:'',license:'Standard' }); }}>
          Загрузить еще
        </button>
      </div>
    );
  }

  return (
    <div className="upload-page page-enter">
      <div className="container">
        <div className="upload-page__header">
          <span className="badge badge-primary">Студия автора</span>
          <h1>Загрузите ваш ассет</h1>
          <p>Поделитесь своими AI-работами и начните зарабатывать уже сегодня.</p>
        </div>

        {/* Subscription Status Banner */}
        <div className={`sub-status-banner ${limitReached ? 'sub-status-banner--limit' : ''}`}>
          <div className="sub-status-content">
            <div className="sub-status-info">
              <Zap size={20} className="sub-status-icon" />
              <div>
                <span className="sub-status-label">Тариф: <strong>{subInfo.tier.toUpperCase()}</strong></span>
                <span className="sub-status-count">
                   Использовано {subInfo.tier === 'free' ? subInfo.uploads_count : subInfo.monthly_uploads_count} из {subInfo.limit}
                </span>
              </div>
            </div>
            <div className="sub-status-progress-wrap">
              <div className="sub-status-progress-bg">
                <div 
                  className="sub-status-progress-fill" 
                  style={{ width: `${Math.min(100, ((subInfo.tier === 'free' ? subInfo.uploads_count : subInfo.monthly_uploads_count) / (subInfo.limit || 5)) * 100)}%` }}
                ></div>
              </div>
            </div>
            <Link to="/pricing" className="btn btn-ghost btn-sm sub-upgrade-btn">
              Улучшить тариф
            </Link>
          </div>
        </div>

        <form className="upload-layout" onSubmit={handleSubmit}>
          <div className="upload-zone-col">
            <div
              className={`upload-zone ${dragging ? 'upload-zone--over' : ''} ${file ? 'upload-zone--has-file' : ''}`}
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => !file && fileRef.current.click()}
            >
              {file ? (
                <>
                  <div className="upload-zone__file-info">
                    <CheckCircle size={32} color="var(--clr-green)" />
                    <span className="upload-zone__filename">{file.name}</span>
                    <span className="upload-zone__filesize">{(file.size / 1024 / 1024).toFixed(1)} MB</span>
                  </div>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={e => { e.stopPropagation(); setFile(null); }}
                  >
                    <X size={14} /> Удалить
                  </button>
                </>
              ) : (
                <>
                  <div className="upload-zone__icon">
                    <Upload size={36} />
                  </div>
                  <div className="upload-zone__text">
                    <strong>Перетащите файл сюда</strong>
                    <span>или нажмите для выбора</span>
                  </div>
                  <div className="upload-zone__hint">
                    Поддерживаются: JPG, PNG, MP4, MOV, MP3, WAV, GLB, GLTF
                  </div>
                </>
              )}
              <input ref={fileRef} type="file" hidden onChange={handleFile} />
            </div>

            <div className="upload-cats">
              <label className="filter-label">Категория</label>
              <div className="upload-cats__grid">
                {CATEGORIES.filter(c => c.id !== 'all').map(cat => {
                  const Icon = CAT_ICONS[cat.id] || FileText;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      className={`upload-cat-btn ${form.category === cat.id ? 'upload-cat-btn--active' : ''}`}
                      onClick={() => setForm(f => ({ ...f, category: cat.id }))}
                    >
                      <Icon size={20} />
                      {cat.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="upload-form-col">
            <div className="upload-ai-box" style={{ background: 'rgba(124,92,252,0.05)', border: '1px solid rgba(124,92,252,0.3)', padding: '20px', borderRadius: 'var(--r-md)', marginBottom: '16px' }}>
              <label className="filter-label" style={{ color: 'var(--clr-primary)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <Sparkles size={16} /> Умное автозаполнение
              </label>
              <p style={{ fontSize: '0.85rem', color: 'var(--clr-text-3)', marginBottom: '12px', lineHeight: '1.4' }}>
                Не тратьте время на описание. Загрузите файл, и наш ИИ проанализирует проект и сам заполнит название, описание и теги!
              </p>
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={handleAIGenerate}
                disabled={isGenerating || !file}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                {isGenerating ? <><Loader2 className="animate-spin" size={16}/> Анализ файла...</> : <><Sparkles size={16}/> Сгенерировать с ИИ</>}
              </button>
            </div>

            <div className="upload-form-group">
              <label className="filter-label" htmlFor="title" style={{ marginBottom: '4px' }}>Название *</label>
              <input id="title" name="title" className="input" placeholder="например, Городской неоновый пейзаж" value={form.title} onChange={handleChange} required />
            </div>

            <div className="upload-form-group">
              <label className="filter-label" htmlFor="description">Описание</label>
              <textarea id="description" name="description" className="input" rows={4} placeholder="Опишите ваш ассет, технику, использованную модель…" value={form.description} onChange={handleChange} />
            </div>

            <div className="upload-form-group">
              <label className="filter-label" htmlFor="tags">Теги</label>
              <div className="upload-tags-input">
                <Tag size={14} />
                <input id="tags" name="tags" className="input" placeholder="ai-art, midjourney, абстракция, неон…" value={form.tags} onChange={handleChange} />
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--clr-text-3)' }}>Разделяйте теги запятыми</span>
            </div>

            <div className="upload-row">
              <div className="upload-form-group">
                <label className="filter-label" htmlFor="price">
                  <span>₸</span> Цена (KZT)
                </label>
                <input id="price" name="price" type="number" min={0} step={0.01} className="input" placeholder="0 для бесплатных" value={form.price} onChange={handleChange} />
              </div>

              <div className="upload-form-group">
                <label className="filter-label" htmlFor="license">Тип лицензии</label>
                <select id="license" name="license" className="input" value={form.license} onChange={handleChange}>
                  <option>Стандартная</option>
                  <option>Расширенная</option>
                  <option>Коммерческая</option>
                </select>
              </div>
            </div>

            {form.price > 0 && (
              <div className="upload-earnings">
                <span>Ваш ожидаемый доход с продажи</span>
                <strong>{(form.price * 0.7).toFixed(0)} ₸</strong>
                <span className="upload-earnings__note">(70% доля автора)</span>
              </div>
            )}

            <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }} disabled={limitReached}>
              <Upload size={18} /> {limitReached ? 'Лимит исчерпан' : 'Отправить ассет на проверку'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

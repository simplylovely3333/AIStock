import React, { useState, useMemo } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import {
  SlidersHorizontal, Search, ChevronDown, X, Grid, List, Plus, Sparkles
} from 'lucide-react';
import AssetCard from '../components/AssetCard';
import { CATEGORIES } from '../data/assets';
import './BrowsePage.css';

const SORT_OPTIONS = [
  { value: 'popular', label: 'Сначала популярные' },
  { value: 'new',     label: 'Сначала новые' },
  { value: 'price_asc',  label: 'Цена: по возрастанию' },
  { value: 'price_desc', label: 'Цена: по убыванию' },
  { value: 'rating',     label: 'С высоким рейтингом' },
];

const LICENSE_OPTIONS = ['Стандартная', 'Расширенная', 'Коммерческая'];

export default function BrowsePage() {
  const [params] = useSearchParams();
  const location = useLocation();
  const initCat = params.get('cat') || 'all';
  const initQ   = params.get('q')   || '';

  // AI results from state
  const aiResults = location.state?.aiResults;
  const aiPrompt  = location.state?.aiPrompt;
  const aiFilters = location.state?.aiFilters;

  const [cat,        setCat]        = useState(initCat);
  const [sort,       setSort]       = useState('popular');
  const [query,      setQuery]      = useState(initQ);
  const [priceMax,   setPriceMax]   = useState(5000);
  const [freeOnly,   setFreeOnly]   = useState(false);
  const [licenses,   setLicenses]   = useState([]);
  const [minRating,  setMinRating]  = useState(0);
  const [filtersOpen,setFiltersOpen]= useState(false);
  const [mobileFilters, setMobileFilters] = useState(false);
  const [assets,     setAssets]     = useState(aiResults || []);
  const [loading,    setLoading]    = useState(!aiResults);

  React.useEffect(() => {
    if (aiResults) return; // Don't fetch if we have AI results
    
    fetch('/api/assets')
      .then(res => res.json())
      .then(data => { setAssets(data); setLoading(false); })
      .catch(console.error);
  }, [aiResults]);

  React.useEffect(() => {
    // If we have AI filters, apply them to the state
    if (aiFilters) {
      if (aiFilters.category) setCat(aiFilters.category);
      if (aiFilters.max_price !== undefined) setPriceMax(aiFilters.max_price);
      if (aiFilters.is_free !== undefined) setFreeOnly(aiFilters.is_free);
      if (aiFilters.min_rating !== undefined) setMinRating(aiFilters.min_rating);
      if (aiFilters.query_text) setQuery(aiFilters.query_text);
    }
  }, [aiFilters]);

  function toggleLicense(l) {
    setLicenses(ls => ls.includes(l) ? ls.filter(x => x !== l) : [...ls, l]);
  }
  function clearFilters() {
    setCat('all'); setSort('popular'); setQuery(''); setPriceMax(5000);
    setFreeOnly(false); setLicenses([]); setMinRating(0);
  }

  const filtered = useMemo(() => {
    let list = [...assets];
    if (cat !== 'all')      list = list.filter(a => a.category === cat);
    if (query)              list = list.filter(a => a.title.toLowerCase().includes(query.toLowerCase()) || a.tags.some(t => t.includes(query.toLowerCase())));
    if (freeOnly)           list = list.filter(a => a.isFree);
    if (!freeOnly)          list = list.filter(a => a.price <= priceMax);
    if (licenses.length)    list = list.filter(a => licenses.includes(a.license));
    if (minRating > 0)      list = list.filter(a => a.rating >= minRating);

    switch (sort) {
      case 'new':        return list.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
      case 'price_asc':  return list.sort((a,b) => a.price - b.price);
      case 'price_desc': return list.sort((a,b) => b.price - a.price);
      case 'rating':     return list.sort((a,b) => b.rating - a.rating);
      default:           return list.sort((a,b) => b.sales - a.sales);
    }
  }, [assets, cat, sort, query, priceMax, freeOnly, licenses, minRating]);

  const hasFilters = cat !== 'all' || freeOnly || licenses.length > 0 || minRating > 0 || priceMax < 5000;

  return (
    <div className="browse-page page-enter">
      <div className="browse-page__top">
        <div className="container">
          <div className="browse-page__header">
            {aiPrompt ? (
              <div className="ai-result-label">
                <Sparkles size={20} className="text-primary-400" />
                <h1>Результаты поиска ИИ</h1>
                <span className="ai-prompt-tag">"{aiPrompt}"</span>
              </div>
            ) : (
              <h1>Каталог</h1>
            )}
            <p className="browse-page__count">
              Найдено <strong>{filtered.length}</strong> ассетов
            </p>
          </div>

          {/* Category pills */}
          <div className="browse-cats">
            {CATEGORIES.map(c => (
              <button
                key={c.id}
                className={`tag ${cat === c.id ? 'active' : ''}`}
                onClick={() => setCat(c.id)}
              >
                {c.icon} {c.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container browse-page__body">
        {/* Sidebar */}
        <aside className={`browse-sidebar ${mobileFilters ? 'browse-sidebar--open' : ''}`}>
          <div className="browse-sidebar__header">
            <span>Фильтры</span>
            <div className="flex items-center gap-4">
              <button className="md:hidden" onClick={() => setMobileFilters(false)}>
                <X size={18} />
              </button>
              {hasFilters && (
                <div className="browse-clear" onClick={clearFilters}>
                  <X size={14} /> Сбросить
                </div>
              )}
            </div>
          </div>

          {/* Search */}
          <div className="filter-group">
            <label className="filter-label">Поиск</label>
            <div className="filter-search">
              <Search size={14} />
              <input
                className="input"
                placeholder="Ключевые слова, теги…"
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Price */}
          <div className="filter-group">
            <label className="filter-label">Макс. цена: <strong>{priceMax} ₸</strong></label>
            <input
              type="range" min={0} max={5000} step={100}
              value={priceMax}
              onChange={e => setPriceMax(Number(e.target.value))}
            />
            <label className="filter-check">
              <input type="checkbox" checked={freeOnly} onChange={e => setFreeOnly(e.target.checked)} />
              Только бесплатные
            </label>
          </div>

          {/* License */}
          <div className="filter-group">
            <label className="filter-label">Лицензия</label>
            {LICENSE_OPTIONS.map(l => (
              <label key={l} className="filter-check">
                <input
                  type="checkbox"
                  checked={licenses.includes(l)}
                  onChange={() => toggleLicense(l)}
                />
                {l}
              </label>
            ))}
          </div>

          {/* Rating */}
          <div className="filter-group">
            <label className="filter-label">Мин. рейтинг</label>
            <div className="filter-ratings">
              {[0,3,3.5,4,4.5].map(r => (
                <button
                  key={r}
                  className={`tag ${minRating === r ? 'active' : ''}`}
                  onClick={() => setMinRating(r)}
                >
                  {r === 0 ? 'Любой' : `${r}★+`}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="browse-main">
          {/* Toolbar */}
          <div className="browse-toolbar">
            <button
              className="btn btn-secondary btn-sm browse-filter-toggle"
              onClick={() => setFiltersOpen(o => !o)}
            >
              <SlidersHorizontal size={14} />
              {filtersOpen ? 'Скрыть' : 'Показать'} Фильтры
            </button>

            <button
              className="btn btn-secondary btn-sm browse-filter-toggle-mobile"
              onClick={() => setMobileFilters(true)}
            >
              <Plus size={16} /> Фильтры
            </button>

            <div className="browse-sort">
              <span className="filter-label">Сортировка:</span>
              <select
                className="input browse-sort-select"
                value={sort}
                onChange={e => setSort(e.target.value)}
              >
                {SORT_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <ChevronDown size={14} className="browse-sort-icon" />
            </div>
          </div>

          {/* Grid */}
          {loading ? (
             <div className="browse-empty"><h3>Загрузка...</h3></div>
          ) : filtered.length === 0 ? (
            <div className="browse-empty">
              <span style={{ fontSize: 48 }}>🔍</span>
              <h3>Ассеты не найдены</h3>
              <p>Попробуйте изменить фильтры или поисковый запрос.</p>
              <button className="btn btn-primary" onClick={clearFilters}>Сбросить фильтры</button>
            </div>
          ) : (
            <div className="asset-grid">
              {filtered.map(a => <AssetCard key={a.id} asset={a} />)}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

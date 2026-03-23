import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth, useWishlist } from '../context/AppContext';
import AssetCard from '../components/AssetCard';
import { 
  User, Mail, Wallet, ShoppingBag, Upload, Clock, 
  Settings, Shield, ChevronRight, ExternalLink, DollarSign, Heart
} from 'lucide-react';
import './ProfilePage.css';

export default function ProfilePage() {
  const { user } = useAuth();
  const { wishlist } = useWishlist();
  const location = useLocation();
  const [activeTab, setActiveTab] = React.useState('dashboard'); // dashboard, favorites, or settings
  const [dashboard, setDashboard] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab) setActiveTab(tab);
  }, [location.search]);

  // For Settings Form
  const [profileForm, setProfileForm] = React.useState({
    name: user?.name || '',
    email: user?.email || '',
    bio: user?.bio || '',
    avatar: user?.avatar || '🤖'
  });

  React.useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name,
        email: user.email,
        bio: user.bio || '',
        avatar: user.avatar || '🤖'
      });
    }
  }, [user]);

  React.useEffect(() => {
    async function fetchDashboard() {
      const token = localStorage.getItem('token');
      if (!token) return;
      try {
        const res = await fetch('/api/users/me/dashboard', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setDashboard(data);
        }
      } catch (err) {
        console.error("Dashboard Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/users/me', {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify(profileForm)
      });
      if (res.ok) {
        const updated = await res.json();
        setActiveTab('dashboard');
        // In real app, we might need to refresh AppContext user here
        window.location.reload(); 
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="profile-page flex items-center justify-center">
        <div className="text-center p-8 bg-card rounded-2xl border border-border shadow-xl">
          <Shield size={48} className="mx-auto mb-4 text-primary-500 opacity-20" />
          <h2 className="text-2xl font-bold mb-2">Доступ ограничен</h2>
          <p className="text-muted mb-6">Пожалуйста, войдите в систему, чтобы просмотреть свой профиль.</p>
          <a href="/auth" className="btn btn-primary">Войти</a>
        </div>
      </div>
    );
  }

  if (loading) return <div className="profile-page flex items-center justify-center"><div className="spinner"></div></div>;

  const sections = [
    { 
      title: 'Мои покупки', 
      icon: <ShoppingBag size={20} />, 
      count: dashboard?.stats?.purchase_count || 0, 
      color: 'blue' 
    },
    { 
      title: 'Мои ассеты', 
      icon: <Upload size={20} />, 
      count: dashboard?.stats?.asset_count || 0, 
      color: 'purple' 
    },
    { 
      title: 'Продажи', 
      icon: <DollarSign size={20} />, 
      count: dashboard?.stats?.sales_count || 0, 
      color: 'green' 
    },
  ];

  return (
    <div className="profile-page">
      <div className="container py-12">
        <div className="profile-grid">
          {/* Sidebar - User Info */}
          <div className="profile-sidebar">
            <div className="profile-card user-main-card">
              <div className="user-avatar-large">
                {user.avatar || '🤖'}
              </div>
              <h1 className="user-name-large">{user.name}</h1>
              <p className="user-email flex items-center justify-center gap-2">
                <Mail size={14} /> {user.email}
              </p>
              
              <div className="user-stats-minimal grid grid-cols-2 gap-4 mt-8">
                <div className="stat-item">
                  <span className="stat-label">Продажи</span>
                  <span className="stat-value">{dashboard?.stats?.sales_count || 0}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Рейтинг</span>
                  <span className="stat-value">{dashboard?.stats?.rating || 4.9} ★</span>
                </div>
              </div>

              <div className="flex flex-col gap-3 mt-8">
                <button 
                  className={`btn ${activeTab === 'dashboard' ? 'btn-primary' : 'btn-secondary'} w-full flex items-center justify-center gap-2`}
                  onClick={() => setActiveTab('dashboard')}
                >
                  <ShoppingBag size={16} /> Дашборд
                </button>
                <button 
                  className={`btn ${activeTab === 'favorites' ? 'btn-primary' : 'btn-secondary'} w-full flex items-center justify-center gap-2`}
                  onClick={() => setActiveTab('favorites')}
                >
                  <Heart size={16} /> Избранное
                </button>
                <button 
                  className={`btn ${activeTab === 'settings' ? 'btn-primary' : 'btn-secondary'} w-full flex items-center justify-center gap-2`}
                  onClick={() => setActiveTab('settings')}
                >
                  <Settings size={16} /> Настройки
                </button>
              </div>
            </div>

            <div className="profile-card balance-card mt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-muted uppercase text-xs font-bold tracking-wider">
                  <Wallet size={14} /> Текущий баланс
                </div>
                <div className="status-badge status-badge-success">Активен</div>
              </div>
              <div className="balance-amount">{user.balance} ₸</div>
              <a href="/topup" className="btn btn-primary w-full mt-6 text-center flex items-center justify-center">
                Пополнить баланс
              </a>
            </div>
          </div>

          {/* Main Content */}
          <div className="profile-content">
            {activeTab === 'dashboard' ? (
              <>
                <div className="content-header mb-8">
                  <h2 className="text-3xl font-black">Дашборд</h2>
                  <p className="text-muted">Управляйте своими активами и транзакциями</p>
                </div>

                <div className="content-grid grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                  {sections.map((s, idx) => (
                    <div key={idx} className={`stat-card stat-card-${s.color}`}>
                      <div className="stat-card-icon">{s.icon}</div>
                      <div className="stat-card-info">
                        <span className="stat-card-count">{s.count}</span>
                        <span className="stat-card-title">{s.title}</span>
                      </div>
                      <ChevronRight size={18} className="stat-card-arrow" />
                    </div>
                  ))}
                </div>

                <div className="recent-activity profile-card">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold">Последние покупки</h3>
                    <a href="#" className="flex items-center gap-1 text-primary-500 text-sm font-bold">
                      Все покупки <ExternalLink size={14} />
                    </a>
                  </div>
                  
                  <div className="activity-list space-y-4">
                    {dashboard?.recent_purchases?.map((item, idx) => (
                      <div key={idx} className="activity-item flex items-center justify-between p-4 rounded-xl hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="activity-thumb bg-primary-500/10 text-primary-500 rounded-lg p-3">
                            <ShoppingBag size={20} />
                          </div>
                          <div>
                            <div className="font-bold">Ассет #{item.asset_id}</div>
                            <div className="text-xs text-muted">{item.date}</div>
                          </div>
                        </div>
                        <div className="font-black">{item.price} ₸</div>
                      </div>
                    ))}
                    {(!dashboard?.recent_purchases || dashboard.recent_purchases.length === 0) && (
                      <p className="text-center text-muted py-8">История покупок пуста</p>
                    )}
                  </div>
                </div>
              </>
            ) : activeTab === 'favorites' ? (
              <div className="favorites-content">
                <div className="content-header mb-8">
                  <h2 className="text-3xl font-black">Избранное</h2>
                  <p className="text-muted">Проекты, которые вам понравились</p>
                </div>
                
                {wishlist.length > 0 ? (
                  <div className="asset-grid">
                    {wishlist.map(asset => (
                      <AssetCard key={asset.id} asset={asset} />
                    ))}
                  </div>
                ) : (
                  <div className="profile-card p-12 text-center text-muted">
                    <Heart size={48} className="mx-auto mb-4 opacity-20" />
                    У вас пока нет избранных проектов.
                  </div>
                )}
              </div>
            ) : (
              <div className="settings-content">
                <div className="content-header mb-8">
                  <h2 className="text-3xl font-black">Настройки профиля</h2>
                  <p className="text-muted">Редактируйте свои личные данные и предпочтения</p>
                </div>

                <div className="profile-card p-8">
                  <form onSubmit={handleUpdateProfile} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="form-group">
                        <label className="text-sm font-bold mb-2 block">Имя пользователя</label>
                        <input 
                          className="btn-secondary w-full px-4 py-3 rounded-xl border border-border bg-muted/20 outline-none focus:border-primary-500"
                          value={profileForm.name}
                          onChange={e => setProfileForm({...profileForm, name: e.target.value})}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label className="text-sm font-bold mb-2 block">Email адрес</label>
                        <input 
                          className="btn-secondary w-full px-4 py-3 rounded-xl border border-border bg-muted/20 outline-none focus:border-primary-500"
                          type="email"
                          value={profileForm.email}
                          onChange={e => setProfileForm({...profileForm, email: e.target.value})}
                          required
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="text-sm font-bold mb-2 block">О себе (Био)</label>
                      <textarea 
                        className="btn-secondary w-full px-4 py-3 rounded-xl border border-border bg-muted/20 outline-none focus:border-primary-500 h-32 resize-none"
                        placeholder="Расскажите немного о себе..."
                        value={profileForm.bio}
                        onChange={e => setProfileForm({...profileForm, bio: e.target.value})}
                      />
                    </div>

                    <div className="form-group">
                      <label className="text-sm font-bold mb-2 block">Emoji Аватар</label>
                      <div className="flex gap-4">
                        {['🤖', '👨‍💻', '🚀', '🎨', '🦁', '🌟'].map(emoji => (
                          <button
                            key={emoji}
                            type="button"
                            className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl border-2 transition-all ${profileForm.avatar === emoji ? 'border-primary-500 bg-primary-500/10 scale-110' : 'border-border'}`}
                            onClick={() => setProfileForm({...profileForm, avatar: emoji})}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-end gap-4 pt-4">
                      <button type="button" onClick={() => setActiveTab('dashboard')} className="btn btn-ghost px-8">Отмена</button>
                      <button type="submit" disabled={saving} className="btn btn-primary px-12">
                        {saving ? 'Сохранение...' : 'Сохранить изменения'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

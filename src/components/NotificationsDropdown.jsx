import React, { useEffect, useState, useRef } from 'react';
import { Bell, Check, X, Info, Settings, UserPlus, UploadCloud, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import './NotificationsDropdown.css';

const ICON_MAP = {
  'support': <MessageSquare size={16} className="text-blue-500" />,
  'upload': <UploadCloud size={16} className="text-green-500" />,
  'news': <Info size={16} className="text-purple-500" />,
  'author': <UserPlus size={16} className="text-orange-500" />
};

export default function NotificationsDropdown({ isOpen, onClose }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    // Click outside to close
    function handleClickOutside(event) {
      if (ref.current && !ref.current.contains(event.target)) {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      fetchNotifications();
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  async function fetchNotifications() {
    const token = localStorage.getItem('token');
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/interactions/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function markAsRead(id) {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      await fetch(`/api/interactions/notifications/${id}/read`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (e) {
      console.error(e);
    }
  }

  async function markAllAsRead() {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      await fetch('/api/interactions/notifications/read-all', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (e) {
      console.error(e);
    }
  }

  if (!isOpen) return null;

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="notif-dropdown" ref={ref}>
      <div className="notif-header">
        <div className="notif-title">
          Уведомления
          {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
        </div>
        <div className="notif-actions">
          {unreadCount > 0 && (
            <button className="btn btn-ghost btn-sm notif-read-all" onClick={markAllAsRead}>
              <Check size={14} /> Прочитано
            </button>
          )}
          <button className="btn btn-ghost btn-icon notif-close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
      </div>
      
      <div className="notif-body">
        {loading ? (
          <div className="notif-empty">Загрузка...</div>
        ) : notifications.length === 0 ? (
          <div className="notif-empty">
            <Bell size={24} className="notif-empty-icon" />
            <p>Нет новых уведомлений</p>
          </div>
        ) : (
          <div className="notif-list">
            {notifications.map(n => (
              <div 
                key={n.id} 
                className={`notif-item ${!n.is_read ? 'notif-item--unread' : ''}`}
                onClick={() => {!n.is_read && markAsRead(n.id);}}
              >
                <div className="notif-item-icon">
                  {ICON_MAP[n.type] || <Info size={16} />}
                </div>
                <div className="notif-item-content">
                  <div className="notif-item-title">{n.title}</div>
                  <div className="notif-item-message">{n.message}</div>
                  <div className="notif-item-time">
                    {new Date(n.created_at).toLocaleString('ru-RU', {
                      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </div>
                </div>
                {!n.is_read && <div className="notif-item-dot" />}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

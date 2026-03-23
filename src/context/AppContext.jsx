import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);
const CartContext = createContext(null);
const WishlistContext = createContext(null);

export function AppProviders({ children }) {
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [user, setUser] = useState(null);
  const [following, setFollowing] = useState([]);

  async function fetchUser() {
    const token = localStorage.getItem('token');
    if (!token) {
      setUser(null);
      return;
    }
    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setUser(await res.json());
      } else {
        localStorage.removeItem('token');
        setUser(null);
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function fetchWishlist() {
    const token = localStorage.getItem('token');
    if (!token) {
      setWishlist([]);
      setFollowing([]);
      return;
    }
    try {
      const res = await fetch('/api/interactions/favorites', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setWishlist(await res.json());

      const resFollow = await fetch('/api/interactions/following', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (resFollow.ok) setFollowing(await resFollow.json());
    } catch (e) { console.error(e); }
  }

  useEffect(() => {
    fetchUser().then(() => fetchWishlist());
  }, []);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  function addToCart(asset) {
    if (cart.find(a => a.id === asset.id)) { showToast('Already in cart'); return; }
    setCart(c => [...c, asset]);
    showToast(`"${asset.title.slice(0,24)}…" added to cart`);
  }
  function removeFromCart(id) { setCart(c => c.filter(a => a.id !== id)); }

  async function toggleWishlist(asset) {
    const token = localStorage.getItem('token');
    if (!token) {
      showToast('Авторизуйтесь для добавления в избранное');
      return;
    }
    const has = inWishlist(asset.id);
    setWishlist(w => has ? w.filter(a => a.id !== asset.id) : [...w, asset]);
    showToast(has ? 'Удалено из избранного' : 'Добавлено в избранное ♥');

    try {
      await fetch(`/api/interactions/favorite/${asset.id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch(e) {
      console.error(e);
    }
  }
  function inWishlist(id) { return !!wishlist.find(a => a.id === id); }

  async function toggleFollow(authorId) {
    const token = localStorage.getItem('token');
    if (!token) {
      showToast('Авторизуйтесь для подписки');
      return;
    }
    const has = following.includes(authorId);
    setFollowing(f => has ? f.filter(id => id !== authorId) : [...f, authorId]);
    showToast(has ? 'Отписка успешна' : 'Вы подписались на автора!');

    try {
      await fetch(`/api/interactions/follow/${authorId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch(e) {
      console.error(e);
    }
  }

  const cartValue = { cart, addToCart, removeFromCart, cartOpen, setCartOpen };
  const wishlistValue = { wishlist, toggleWishlist, inWishlist };

  const authValue = { user, setUser, fetchUser, following, toggleFollow };

  return (
    <AuthContext.Provider value={authValue}>
      <CartContext.Provider value={cartValue}>
        <WishlistContext.Provider value={wishlistValue}>
          {children}
          {toast && <div className="toast">{toast}</div>}
        </WishlistContext.Provider>
      </CartContext.Provider>
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
export const useCart = () => useContext(CartContext);
export const useWishlist = () => useContext(WishlistContext);

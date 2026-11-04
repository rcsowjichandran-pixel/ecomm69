import { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import { getAuth, signInAnonymously, signInWithCustomToken } from 'firebase/auth';
import './App.css';

const firebaseConfig = {
  apiKey: "AIzaSyAwFtyABUW_wmnUWgHFhE9BiNMBr7qZgrg",
  authDomain: "ecommerceday69.firebaseapp.com",
  databaseURL: "https://ecommerceday69-default-rtdb.firebaseio.com",
  projectId: "ecommerceday69",
  storageBucket: "ecommerceday69.firebasestorage.app",
  messagingSenderId: "328954166522",
  appId: "1:328954166522:web:ddfca2d5e0d6a1438edd43",
  measurementId: "G-3GDEZ71LDL"
};

/**
 * 13. Currency Formatting Helper:
 * Formats a numeric price into Indian Rupee (₹) currency with thousands separators.
 * Example: 8500000 -> "₹85,00,000", 19999 -> "₹19,999"
 */
export const formatCurrency = (amount) => {
  return '₹' + Number(amount || 0).toLocaleString('en-IN');
};

const getOrderErrorMessage = (error) => {
  switch (error?.code) {
    case 'permission-denied':
      return 'Firestore rejected this order (permission-denied). Check Firestore Rules for the orders path.';
    case 'failed-precondition':
      return 'Firestore is not ready for orders. Check that a Firestore database has been created.';
    case 'auth/operation-not-allowed':
      return 'Anonymous sign-in is disabled. Enable it in Firebase Authentication settings.';
    case 'auth/network-request-failed':
      return 'Could not reach Firebase Authentication. Check your internet connection and try again.';
    case 'auth/not-authenticated':
      return 'Firebase sign-in is not complete yet. Wait a moment and try again.';
    default:
      return `Unable to place your order${error?.code ? ` (${error.code})` : ''}. Check the browser console for details.`;
  }
};

/**
 * 8. Debounce Function:
 * Delays invoking the callback until after delay milliseconds have passed since last call.
 */
export function debounce(func, delay = 300) {
  let timerId;
  return function (...args) {
    if (timerId) clearTimeout(timerId);
    timerId = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
}

/**
 * 3. Static Product Data:
 * const array named PRODUCTS inside App.jsx.
 * Each object represents a product with properties like id, name, description, price, and image.
 * Also includes category and tags for smart recommendations.
 */
export const PRODUCTS = [
  {
    id: 1,
    name: 'Luxury Mediterranean Villa',
    category: 'villa',
    tags: ['luxury', 'real-estate', 'villa'],
    price: 8500000,
    description: 'Breathtaking 5-bedroom coastal villa with private infinity pool, solar deck, and panoramic sea views.',
    image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 2,
    name: 'Modern Sunset Villa Retreat',
    category: 'villa',
    tags: ['modern', 'villa', 'pool'],
    price: 6200000,
    description: 'Contemporary architectural masterpiece with glass walls, landscaped garden, and private pool.',
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 3,
    name: 'Smart Home Automation Hub',
    category: 'smart-home',
    tags: ['smart', 'home', 'iot'],
    price: 19999,
    description: 'Centralized voice-enabled automation console to orchestrate lighting, security, and climate control.',
    image: 'https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 4,
    name: 'Smart Ambient Security Camera',
    category: 'smart-home',
    tags: ['smart', 'home', 'security'],
    price: 14999,
    description: '4K AI motion-tracking indoor/outdoor camera with nocturnal night vision and two-way audio support.',
    image: 'https://images.unsplash.com/photo-1557324232-b8917d3c3dcb?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 5,
    name: 'Hi-Fi Studio Noise-Cancelling Headphones',
    category: 'audio',
    tags: ['audio', 'wireless', 'music'],
    price: 24999,
    description: 'Studio-grade acoustic drivers with 40-hour battery life, active noise cancellation, and spatial audio.',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 6,
    name: 'Wireless Spatial Soundbar System',
    category: 'audio',
    tags: ['audio', 'home-theater', 'bluetooth'],
    price: 21999,
    description: 'Dolby Atmos home-theater soundbar with wireless subwoofer and crystal-clear cinematic acoustics.',
    image: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=600&q=80'
  }
];

/**
 * 4. Product Card Component:
 * Functional component accepting product as a prop and rendering a single product's details.
 * 6. Basic Product Styling: Border, padding, and centered text.
 * 7. Add to Cart Button: Button with the exact text "Add to Cart".
 * 11. Button Handler: onClick calls props.onAddToCart(product).
 */
export function ProductCard(props) {
  const { product } = props;

  // 11. Call props.onAddToCart with the product as an argument
  const handleAdd = () => {
    if (props.onAddToCart) {
      props.onAddToCart(product);
    }
  };

  return (
    <div className="product-card">
      <div className="product-image-container">
        <img
          src={product.image}
          alt={product.name}
          className="product-image"
          loading="lazy"
        />
        <span className="category-tag">{product.category}</span>
      </div>
      <div className="product-info">
        <h3 className="product-title">{product.name}</h3>
        <p className="product-desc">{product.description}</p>
        <div className="product-tags">
          {product.tags && product.tags.map((tag, idx) => (
            <span key={idx} className="tag-badge">#{tag}</span>
          ))}
        </div>
        <div className="product-footer">
          <span className="product-price">{formatCurrency(product.price)}</span>
          {/* 7. Add to Cart Button */}
          <button
            className="btn-add-cart"
            onClick={handleAdd}
            title="Add to Cart"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Recommendations Component:
 * Displays recommended products matching the category of items added to cart.
 */
export function Recommendations({ recommendedProducts, onAddToCart }) {
  return (
    <section className="recommendations-wrapper">
      <div className="recommendations-banner">
        <div className="recommendations-title">
          <span>✨</span>
          <h3>Recommended For You</h3>
        </div>
        <p className="recommendations-desc">
          Customers exploring this category also loved these hand-picked items!
        </p>
      </div>
      <div className="products-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {recommendedProducts.map((product) => (
          <ProductCard
            key={`recommended-${product.id}`}
            product={product}
            onAddToCart={onAddToCart}
          />
        ))}
      </div>
    </section>
  );
}

/**
 * 15. Cart Component:
 * Receives cartItems as a prop and displays the contents of the shopping cart.
 * 19. Calculate Cart Total: Uses reduce() on cartItems to calculate total cost.
 * 20. Display Total: Displays calculated cart total prominently at the bottom.
 */
export function Cart(props) {
  const { cartItems, onUpdateQuantity, onRemoveFromCart, setIsCheckout, onCloseCart } = props;

  // 19. Calculate Cart Total: use reduce() method on cartItems
  const cartTotal = cartItems.reduce(
    (total, item) => total + Number(item.price || 0) * Number(item.quantity || 1),
    0
  );

  return (
    <div className="cart-panel">
      <div className="cart-header">
        <h3 className="cart-title">
          <span>🛍️</span> Your Cart
        </h3>
        <div className="cart-header-actions">
          {/* 14. Display cart item count using cartItems.length */}
          <span className="cart-badge">{cartItems.length} items</span>
          {onCloseCart && (
            <button
              className="btn-close-cart"
              onClick={onCloseCart}
              title="Close Cart"
            >
              ✕ Close
            </button>
          )}
        </div>
      </div>

      {cartItems.length === 0 ? (
        <div className="cart-empty">
          <p>Your shopping cart is empty.</p>
          <small>Add any product from the catalog to get started!</small>
        </div>
      ) : (
        <>
          <div className="cart-items-list">
            {cartItems.map((item) => (
              <div key={item.id} className="cart-item">
                <img src={item.image} alt={item.name} className="cart-item-img" />
                <div className="cart-item-details">
                  <div className="cart-item-name">{item.name}</div>
                  <div className="cart-item-price">{formatCurrency(item.price)}</div>
                  <div className="cart-item-controls">
                    {onUpdateQuantity && (
                      <button
                        className="qty-btn"
                        onClick={() => onUpdateQuantity(item.id, (item.quantity || 1) - 1)}
                        title="Decrease quantity"
                      >
                        -
                      </button>
                    )}
                    <span className="cart-item-qty">{item.quantity || 1}</span>
                    {onUpdateQuantity && (
                      <button
                        className="qty-btn"
                        onClick={() => onUpdateQuantity(item.id, (item.quantity || 1) + 1)}
                        title="Increase quantity"
                      >
                        +
                      </button>
                    )}
                  </div>
                </div>
                {onRemoveFromCart && (
                  <button
                    className="btn-remove-item"
                    onClick={() => onRemoveFromCart(item.id)}
                    title="Remove item"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="cart-summary">
            <div className="cart-summary-row">
              <span>Items Count:</span>
              <span>{cartItems.length}</span>
            </div>
            <div className="cart-summary-row">
              <span>Shipping & Delivery:</span>
              <span style={{ color: 'var(--success)', fontWeight: 700 }}>FREE</span>
            </div>
            {/* 20. Display Total: prominently displayed at the bottom of the Cart component */}
            <div className="cart-summary-row total">
              <span>Total:</span>
              <span>{formatCurrency(cartTotal)}</span>
            </div>
          </div>

          {setIsCheckout && (
            <button
              className="btn-proceed-checkout"
              onClick={() => setIsCheckout(true)}
            >
              Proceed to Checkout →
            </button>
          )}
        </>
      )}
    </div>
  );
}

/**
 * CheckoutForm Component:
 * Handles checkout details, client-side validation, and order placement.
 */
export function CheckoutForm({ onPlaceOrder, onCancel, grandTotal, cartItems }) {
  const [formData, setFormData] = useState({
    fullName: '',
    address: '',
    email: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));

    if (formErrors[name]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.fullName.trim()) {
      errors.fullName = 'Full Name is required.';
    } else if (formData.fullName.trim().length < 2) {
      errors.fullName = 'Full Name must be at least 2 characters long.';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      errors.email = 'Email Address is required.';
    } else if (!emailRegex.test(formData.email.trim())) {
      errors.email = 'Please provide a valid email format (e.g., name@example.com).';
    }

    if (!formData.address.trim()) {
      errors.address = 'Shipping Address is required.';
    } else if (formData.address.trim().length < 6) {
      errors.address = 'Please provide a complete shipping address (at least 6 characters).';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setSubmitError('');
    try {
      await onPlaceOrder(formData);
    } catch (error) {
      console.error('Unable to place order:', error);
      setSubmitError(getOrderErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="checkout-modal">
        <div className="checkout-header">
          <h2>Order Checkout</h2>
          <button
            type="button"
            className="btn-close-modal"
            onClick={onCancel}
            title="Cancel Checkout"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="checkout-form" noValidate>
          <div className="form-group">
            <label htmlFor="fullName" className="form-label">
              Full Name *
            </label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              className={`form-input ${formErrors.fullName ? 'input-error' : ''}`}
              placeholder="e.g. Rahul Sharma"
              value={formData.fullName}
              onChange={handleChange}
            />
            {formErrors.fullName && <span className="error-msg">{formErrors.fullName}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email Address *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              className={`form-input ${formErrors.email ? 'input-error' : ''}`}
              placeholder="e.g. rahul@example.com"
              value={formData.email}
              onChange={handleChange}
            />
            {formErrors.email && <span className="error-msg">{formErrors.email}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="address" className="form-label">
              Shipping Address *
            </label>
            <textarea
              id="address"
              name="address"
              className={`form-input ${formErrors.address ? 'input-error' : ''}`}
              placeholder="e.g. 104 Palm Heights, MG Road, Bengaluru, Karnataka"
              value={formData.address}
              onChange={handleChange}
              rows="3"
            />
            {formErrors.address && <span className="error-msg">{formErrors.address}</span>}
          </div>

          <div className="checkout-order-summary">
            <h4>Order Summary</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {cartItems.length} item(s) selected
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontWeight: 800 }}>
              <span>Total to Pay:</span>
              <span style={{ color: 'var(--primary)', fontSize: '1.15rem' }}>{formatCurrency(grandTotal)}</span>
            </div>
          </div>

          <button
            type="submit"
            className="btn-place-order"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Processing Order...' : 'Place Order'}
          </button>
          {submitError && <p className="error-msg" role="alert">{submitError}</p>}
        </form>
      </div>
    </div>
  );
}

/**
 * 2. Initial Component: Clean App functional component
 */
export default function App() {
  // 8. Cart State: state variable named cartItems initialized as empty array []
  const [cartItems, setCartItems] = useState([]);

  // 16. Show/Hide Cart: state variable isCartOpen using useState
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Search and Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProducts, setFilteredProducts] = useState(PRODUCTS);

  // Checkout and Recommendations State
  const [isCheckout, setIsCheckout] = useState(false);
  const [recommendedProducts, setRecommendedProducts] = useState([]);

  // Firebase state
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [userId, setUserId] = useState(null);
  const [orderConfirmation, setOrderConfirmation] = useState(null);

  /**
   * Firebase Initialization and Authentication
   */
  useEffect(() => {
    const config = typeof __firebase_config !== 'undefined'
      ? __firebase_config
      : (typeof window !== 'undefined' && window.__firebase_config ? window.__firebase_config : firebaseConfig);

    const token = typeof __initial_auth_token !== 'undefined'
      ? __initial_auth_token
      : (typeof window !== 'undefined' && window.__initial_auth_token ? window.__initial_auth_token : null);

    if (config) {
      try {
        const app = initializeApp(config);
        const firestoreDb = getFirestore(app);
        const authInstance = getAuth(app);

        setDb(firestoreDb);
        setAuth(authInstance);

        if (token) {
          signInWithCustomToken(authInstance, token)
            .then((cred) => {
              setUserId(cred.user.uid);
              console.log('Firebase user authenticated with token:', cred.user.uid);
            })
            .catch((err) => {
              console.error('Custom token sign in failed:', err);
              signInAnonymously(authInstance).then((cred) => setUserId(cred.user.uid));
            });
        } else {
          signInAnonymously(authInstance)
            .then((cred) => {
              setUserId(cred.user.uid);
              console.log('Firebase user authenticated anonymously:', cred.user.uid);
            })
            .catch((err) => console.error('Anonymous sign in failed:', err));
        }
      } catch (err) {
        console.error('Error during Firebase initialization:', err);
      }
    } else {
      console.warn('__firebase_config not found. Running in standalone mock mode.');
      setUserId('demo-guest-user');
    }
  }, []);

  /**
   * 4, 5, 8, 9, 10. Smart Search Logic with Debounce:
   * - 4. useEffect hook watching changes to searchTerm.
   * - 8 & 9. Applies the debounce function to delay filtering until the user stops typing.
   * - 5 & 10. Case-insensitive search comparing query with product name AND description.
   */
  useEffect(() => {
    // Search filtering function
    const performSearch = (query) => {
      const cleanQuery = query.trim().toLowerCase();

      if (!cleanQuery) {
        setFilteredProducts(PRODUCTS);
      } else {
        // 5 & 10. Case-insensitive search on both name and description
        const matched = PRODUCTS.filter((product) => {
          const nameMatches = product.name.toLowerCase().includes(cleanQuery);
          const descMatches = product.description.toLowerCase().includes(cleanQuery);
          const categoryMatches = product.category.toLowerCase().includes(cleanQuery);
          const tagMatches = product.tags && product.tags.some((tag) => tag.toLowerCase().includes(cleanQuery));

          return nameMatches || descMatches || categoryMatches || tagMatches;
        });

        setFilteredProducts(matched);
      }
    };

    // 9. Apply Debounce function
    const debouncedFilter = debounce(performSearch, 300);
    debouncedFilter(searchTerm);

    const timer = setTimeout(() => {
      performSearch(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    if (orderConfirmation) {
      const dismissTimer = setTimeout(() => {
        setOrderConfirmation(null);
      }, 8000);
      return () => clearTimeout(dismissTimer);
    }
  }, [orderConfirmation]);

  /**
   * Recommendation Logic
   */
  const generateRecommendations = (category) => {
    if (!category) return;
    const recommendations = PRODUCTS.filter((item) => item.category === category);
    setRecommendedProducts(recommendations);
  };

  /**
   * 9. Add to Cart Logic:
   * Function handleAddToCart that accepts a product object.
   * 12. Handle Duplicates: If item already in cart, increment quantity instead of adding new item.
   */
  const handleAddToCart = (product) => {
    setCartItems((prevItems) => {
      // 12. Check if product already exists in cart
      const existingItem = prevItems.find((item) => item.id === product.id);

      if (existingItem) {
        // Increment quantity property
        return prevItems.map((item) =>
          item.id === product.id
            ? { ...item, quantity: (item.quantity || 1) + 1 }
            : item
        );
      }

      // Add new product with initial quantity of 1
      return [...prevItems, { ...product, quantity: 1 }];
    });

    // Automatically open cart when item is added and show recommendations
    setIsCartOpen(true);
    generateRecommendations(product.category);
  };

  const handleUpdateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      handleRemoveFromCart(productId);
      return;
    }
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.id === productId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const handleRemoveFromCart = (productId) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.id !== productId));
  };

  // Grand total calculation
  const grandTotal = cartItems.reduce(
    (total, item) => total + Number(item.price || 0) * Number(item.quantity || 1),
    0
  );

  /**
   * Order Placement Handler
   */
  const handlePlaceOrder = async (formData) => {
    const newOrder = {
      fullName: formData.fullName,
      email: formData.email,
      address: formData.address,
      cartItems: cartItems,
      grandTotal: grandTotal,
      currency: 'INR',
      createdAt: new Date().toISOString()
    };

    const currentAppId = typeof __app_id !== 'undefined'
      ? __app_id
      : (typeof window !== 'undefined' && window.__app_id ? window.__app_id : 'ecommerce-app');

    try {
      if (db) {
        const activeUserId = auth?.currentUser?.uid || userId;
        if (!activeUserId) {
          const error = new Error('Firebase sign-in has not completed.');
          error.code = 'auth/not-authenticated';
          throw error;
        }

        const orderPath = `/artifacts/${currentAppId}/users/${activeUserId}/orders`;
        const ordersCollectionRef = collection(db, orderPath);
        const docRef = await addDoc(ordersCollectionRef, newOrder);

        console.log(`[Order Success] Document stored in Firestore ID: ${docRef.id}`);
        console.log('Order Details:', newOrder);

        setOrderConfirmation({
          id: docRef.id,
          ...newOrder
        });
      } else {
        const generatedId = 'ORD-' + Math.random().toString(36).substring(2, 9).toUpperCase();
        console.log(`[Order Success - Standalone] Generated ID: ${generatedId}`);
        console.log('Order Details:', newOrder);

        setOrderConfirmation({
          id: generatedId,
          ...newOrder
        });
      }

      setCartItems([]);
      setIsCheckout(false);
    } catch (error) {
      console.error('Error saving order to Firestore:', error);
      throw error;
    }
  };

  return (
    <div className="app">
      {/* Navigation Header */}
      <header className="navbar">
        <div className="container nav-container">
          <a href="#" className="brand" title="ApexCommerce Home">
            <div className="brand-icon">🛒</div>
            <span>ApexCommerce</span>
          </a>

          {/* Search Input in Header */}
          <div className="search-container">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              className="search-input"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Search products"
            />
            {searchTerm && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => setSearchTerm('')}
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          <div className="nav-actions">
            <div className="auth-badge">
              <span className="auth-dot"></span>
              <span>{userId ? `User: ${userId.slice(0, 8)}...` : 'Connecting...'}</span>
            </div>

            {/* 13. Cart Icon in top right corner */}
            {/* 14. Display number of items using cartItems.length */}
            {/* 17. Toggle Cart: onClick handler that toggles isCartOpen state */}
            <button
              className="cart-toggle-btn"
              onClick={() => setIsCartOpen(!isCartOpen)}
              title="Toggle Shopping Cart"
            >
              <span role="img" aria-label="cart">🛒</span>
              <span>Cart</span>
              <span className="cart-badge">{cartItems.length}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <div className="hero">
        <div className="container">
          <h1>Curated Prime Marketplace</h1>
          <p>
            Explore luxury properties, smart automation, and studio sound.
            Add items to your cart to experience seamless shopping.
          </p>
        </div>
      </div>

      <div className="container">
        {orderConfirmation && (
          <div className="order-success-banner" role="alert">
            <div>
              <h4 style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: '0.3rem' }}>
                🎉 Order #{orderConfirmation.id} Placed Successfully!
              </h4>
              <p style={{ fontSize: '0.925rem' }}>
                Thank you, <strong>{orderConfirmation.fullName}</strong>! Confirmation sent to{' '}
                <strong>{orderConfirmation.email}</strong>. Total: <strong>{formatCurrency(orderConfirmation.grandTotal)}</strong>.
              </p>
            </div>
            <button
              onClick={() => setOrderConfirmation(null)}
              style={{ background: 'none', fontWeight: 800, fontSize: '1.2rem', color: '#065f46' }}
              title="Dismiss notification"
            >
              ✕
            </button>
          </div>
        )}

        <div className={`main-content ${isCartOpen ? 'with-cart' : ''}`}>
          {/* Main Product Catalog */}
          <main className="catalog-section">
            <div className="section-header">
              <h2 className="section-title">
                <span>📦</span> Featured Catalog
              </h2>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                Showing {filteredProducts.length} of {PRODUCTS.length} products
              </span>
            </div>

            {/* 5. Render Product List: map() over PRODUCTS array (or filteredProducts) and render ProductCard with key */}
            {/* 10. Passing a Callback: pass handleAddToCart as onAddToCart prop */}
            {filteredProducts.length === 0 ? (
              <div className="no-products-found">
                <div className="no-products-icon">🔍</div>
                <h3>No products found</h3>
                <p>We couldn't find any products matching &quot;<strong>{searchTerm}</strong>&quot;.</p>
                <button
                  className="btn-clear-search"
                  onClick={() => setSearchTerm('')}
                >
                  Clear Search Filter
                </button>
              </div>
            ) : (
              <div className="products-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={handleAddToCart}
                  />
                ))}
              </div>
            )}

            {recommendedProducts && recommendedProducts.length > 0 && (
              <Recommendations
                recommendedProducts={recommendedProducts}
                onAddToCart={handleAddToCart}
              />
            )}
          </main>

          {/* 18. Conditional Rendering: isCartOpen && <Cart ... /> */}
          {isCartOpen && (
            <aside>
              <Cart
                cartItems={cartItems}
                onUpdateQuantity={handleUpdateQuantity}
                onRemoveFromCart={handleRemoveFromCart}
                setIsCheckout={setIsCheckout}
                onCloseCart={() => setIsCartOpen(false)}
              />
            </aside>
          )}
        </div>
      </div>

      {isCheckout && (
        <CheckoutForm
          onPlaceOrder={handlePlaceOrder}
          onCancel={() => setIsCheckout(false)}
          grandTotal={grandTotal}
          cartItems={cartItems}
        />
      )}
    </div>
  );
}

/**
 * ECOMMERCE TEMPLATE - main.js
 * ============================================================
 * Funcionalidades:
 *  - Carrito con localStorage (persistencia entre páginas)
 *  - Toast notifications (Bootstrap Toast API)
 *  - Filtro de productos por data-attributes
 *  - Modal galería / cambio dinámico de imagen
 *  - Validación de cupón (SAVE10)
 *  - Navbar scroll behavior
 *  - Quantity selectors
 *  - Scroll to top
 *
 * HOOKS PARA BACKEND:
 *  Busca los comentarios: // [API HOOK] para identificar
 *  dónde conectar con Laravel / Node / PHP.
 *
 * INTEGRACIÓN LARAVEL:
 *  - En addToCart(), reemplaza el localStorage por una
 *    llamada fetch('/api/cart/add', { method: 'POST', ... })
 *  - Usa el token CSRF de Laravel: X-CSRF-TOKEN en headers
 *  - Protege las rutas con auth:sanctum middleware
 * ============================================================
 */

'use strict';

/* ============================================================
   1. CARRITO - ESTADO Y PERSISTENCIA (localStorage)
   ============================================================ */

/**
 * Obtiene el carrito del localStorage.
 * [API HOOK] → En integración con backend, reemplazar por:
 *   GET /api/cart → devuelve items del usuario autenticado
 * @returns {Array} items del carrito
 */
function getCart() {
  try {
    return JSON.parse(localStorage.getItem('ec_cart')) || [];
  } catch {
    return [];
  }
}

/**
 * Persiste el carrito en localStorage.
 * [API HOOK] → En integración con backend, sincronizar con:
 *   POST /api/cart/sync → envía estado completo del carrito
 * @param {Array} cart
 */
function saveCart(cart) {
  localStorage.setItem('ec_cart', JSON.stringify(cart));
}

/**
 * Agrega un producto al carrito.
 * Si ya existe (mismo id + variante), incrementa cantidad.
 *
 * [API HOOK LARAVEL] →
 *   fetch('/api/cart/add', {
 *     method: 'POST',
 *     headers: {
 *       'Content-Type': 'application/json',
 *       'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
 *     },
 *     body: JSON.stringify({ product_id: item.id, qty: item.qty, variant: item.variant })
 *   })
 *
 * @param {Object} item - { id, name, price, image, variant, qty }
 */
function addToCart(item) {
  const cart = getCart();
  const key = `${item.id}_${item.variant || 'default'}`;
  const idx = cart.findIndex(c => c._key === key);

  if (idx >= 0) {
    cart[idx].qty = Math.min(cart[idx].qty + (item.qty || 1), 99);
  } else {
    cart.push({
      _key: key,
      id: item.id,
      name: item.name,
      price: parseFloat(item.price),
      image: item.image || '',
      variant: item.variant || '',
      qty: item.qty || 1
    });
  }

  saveCart(cart);
  updateCartBadge();
  showToast('¡Producto agregado!', `${item.name} fue añadido al carrito.`, 'success');
}

/**
 * Elimina un ítem del carrito por su _key.
 * [API HOOK] → DELETE /api/cart/{cart_item_id}
 * @param {string} key
 */
function removeFromCart(key) {
  let cart = getCart();
  const item = cart.find(c => c._key === key);
  cart = cart.filter(c => c._key !== key);
  saveCart(cart);
  updateCartBadge();
  renderCart();
  if (item) showToast('Eliminado', `${item.name} fue removido del carrito.`, 'info');
}

/**
 * Actualiza la cantidad de un ítem en el carrito.
 * [API HOOK] → PATCH /api/cart/{cart_item_id} → { qty }
 * @param {string} key
 * @param {number} qty
 */
function updateQuantity(key, qty) {
  const cart = getCart();
  const idx = cart.findIndex(c => c._key === key);
  if (idx < 0) return;
  if (qty < 1) { removeFromCart(key); return; }
  cart[idx].qty = Math.min(qty, 99);
  saveCart(cart);
  updateCartBadge();
  renderCart();
}

/**
 * Actualiza el badge del ícono de carrito en el navbar.
 * Lee el carrito del localStorage y suma todas las cantidades.
 */
function updateCartBadge() {
  const cart = getCart();
  const total = cart.reduce((sum, item) => sum + item.qty, 0);
  document.querySelectorAll('.cart-badge').forEach(el => {
    el.textContent = total;
    el.style.display = total > 0 ? 'flex' : 'none';
    // Animación bump
    el.classList.remove('bump');
    void el.offsetWidth; // reflow
    el.classList.add('bump');
    setTimeout(() => el.classList.remove('bump'), 300);
  });
}

/**
 * Calcula subtotal del carrito.
 * @returns {number}
 */
function getCartSubtotal() {
  return getCart().reduce((sum, item) => sum + item.price * item.qty, 0);
}

/* ============================================================
   2. RENDER CARRITO (cart.html)
   ============================================================ */

/**
 * Renderiza los ítems del carrito en la tabla de cart.html
 * [API HOOK] → En modo backend, cargar ítems desde la respuesta
 * de GET /api/cart y renderizar con los datos del servidor.
 */
function renderCart() {
  const tbody = document.getElementById('cart-items-body');
  const emptyState = document.getElementById('cart-empty');
  const cartContent = document.getElementById('cart-content');

  if (!tbody) return;

  const cart = getCart();

  if (cart.length === 0) {
    if (emptyState) emptyState.style.display = 'block';
    if (cartContent) cartContent.style.display = 'none';
    return;
  }

  if (emptyState) emptyState.style.display = 'none';
  if (cartContent) cartContent.style.display = 'block';

  tbody.innerHTML = cart.map(item => `
    <tr class="cart-item-row" data-key="${escapeHtml(item._key)}">
      <td class="py-3">
        <div class="d-flex align-items-center gap-3">
          <img src="${escapeHtml(item.image) || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=120&q=80'}"
               alt="${escapeHtml(item.name)}" class="cart-item-image" loading="lazy">
          <div>
            <div class="cart-item-name">${escapeHtml(item.name)}</div>
            ${item.variant ? `<div class="cart-item-variant">${escapeHtml(item.variant)}</div>` : ''}
          </div>
        </div>
      </td>
      <td class="py-3 text-muted" style="font-size:0.9rem;">${formatPrice(item.price)}</td>
      <td class="py-3">
        <div class="qty-selector" style="width:fit-content;">
          <button class="qty-btn" onclick="updateQuantity('${escapeHtml(item._key)}', ${item.qty - 1})"
                  aria-label="Disminuir cantidad">−</button>
          <input type="number" class="qty-input" value="${item.qty}" min="1" max="99"
                 onchange="updateQuantity('${escapeHtml(item._key)}', parseInt(this.value))"
                 aria-label="Cantidad">
          <button class="qty-btn" onclick="updateQuantity('${escapeHtml(item._key)}', ${item.qty + 1})"
                  aria-label="Aumentar cantidad">+</button>
        </div>
      </td>
      <td class="py-3 fw-600">${formatPrice(item.price * item.qty)}</td>
      <td class="py-3">
        <button class="cart-remove-btn" onclick="removeFromCart('${escapeHtml(item._key)}')"
                aria-label="Eliminar ${escapeHtml(item.name)}">
          <i class="bi bi-trash3"></i>
        </button>
      </td>
    </tr>
  `).join('');

  updateOrderSummary();
}

/**
 * Actualiza los totales en el resumen de la orden (cart.html / checkout.html)
 */
function updateOrderSummary() {
  const subtotal = getCartSubtotal();
  const discount = window._appliedDiscount || 0;
  const shipping = subtotal > 1500 ? 0 : 150;
  const tax = (subtotal - discount) * 0.16;
  const total = subtotal - discount + shipping + tax;

  setTextContent('#summary-subtotal', formatPrice(subtotal));
  setTextContent('#summary-shipping', shipping === 0 ? 'Gratis' : formatPrice(shipping));
  setTextContent('#summary-tax', formatPrice(tax));
  setTextContent('#summary-discount', discount > 0 ? `-${formatPrice(discount)}` : '$0.00');
  setTextContent('#summary-total', formatPrice(total));

  const discountRow = document.querySelector('.summary-row.discount');
  if (discountRow) discountRow.style.display = discount > 0 ? 'flex' : 'none';
}

/* ============================================================
   3. CUPÓN
   ============================================================ */

/**
 * Cupones válidos y sus descuentos.
 * [API HOOK LARAVEL] → Validar cupón con:
 *   POST /api/coupons/validate → { code } → { valid, discount_type, value, message }
 *   Reemplazar COUPONS por la respuesta del backend.
 */
const COUPONS = {
  'SAVE10': { type: 'percent', value: 10, label: '10% de descuento' },
  'BIENVENIDO': { type: 'fixed', value: 200, label: '$200 MXN de descuento' },
  'ENVIOGRATIS': { type: 'shipping', value: 0, label: 'Envío gratis' }
};

function applyCoupon() {
  const input = document.getElementById('coupon-input');
  if (!input) return;
  const code = input.value.trim().toUpperCase();

  if (!code) {
    shakeElement(input);
    return;
  }

  const coupon = COUPONS[code];
  if (!coupon) {
    input.classList.add('is-invalid');
    input.classList.remove('is-valid');
    showToast('Cupón inválido', 'El código ingresado no es válido o ha expirado.', 'error');
    setTimeout(() => input.classList.remove('is-invalid'), 2000);
    return;
  }

  input.classList.add('is-valid');
  input.classList.remove('is-invalid');

  const subtotal = getCartSubtotal();
  if (coupon.type === 'percent') {
    window._appliedDiscount = subtotal * (coupon.value / 100);
  } else if (coupon.type === 'fixed') {
    window._appliedDiscount = Math.min(coupon.value, subtotal);
  } else {
    window._appliedDiscount = 0;
  }

  // [API HOOK] → Guardar cupón aplicado: localStorage.setItem('ec_coupon', code)
  localStorage.setItem('ec_coupon', code);

  updateOrderSummary();
  showToast('¡Cupón aplicado!', coupon.label, 'success');

  const couponLabel = document.getElementById('applied-coupon-label');
  if (couponLabel) {
    couponLabel.textContent = `${code} — ${coupon.label}`;
    couponLabel.parentElement.style.display = 'block';
  }
}

function removeCoupon() {
  window._appliedDiscount = 0;
  localStorage.removeItem('ec_coupon');
  const input = document.getElementById('coupon-input');
  if (input) { input.value = ''; input.classList.remove('is-valid', 'is-invalid'); }
  const couponLabel = document.getElementById('applied-coupon-label');
  if (couponLabel) couponLabel.parentElement.style.display = 'none';
  updateOrderSummary();
  showToast('Cupón removido', 'Se eliminó el descuento aplicado.', 'info');
}

/* ============================================================
   4. FILTRO DE PRODUCTOS
   ============================================================ */

/**
 * Filtra las tarjetas de producto según el criterio activo.
 * Las cards deben tener data-category, data-price, data-badge.
 * Los botones de filtro deben tener data-filter="valor".
 *
 * [API HOOK] → Para filtros server-side, enviar parámetros a:
 *   GET /api/products?filter={filter}&sort={sort}&category={cat}
 *   y re-renderizar las cards con la respuesta.
 */
function initProductFilters() {
  const filterBtns = document.querySelectorAll('[data-filter]');
  const productCards = document.querySelectorAll('[data-product-item]');

  if (!filterBtns.length) return;

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Activar botón
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.dataset.filter;

      productCards.forEach(card => {
        card.style.transition = 'opacity 0.25s, transform 0.25s';

        if (filter === 'all') {
          card.style.opacity = '1';
          card.style.transform = 'scale(1)';
          card.style.display = '';
        } else {
          const matches = card.dataset.badge === filter ||
                          card.dataset.category === filter ||
                          card.dataset.filter === filter;
          if (matches) {
            card.style.opacity = '1';
            card.style.transform = 'scale(1)';
            card.style.display = '';
          } else {
            card.style.opacity = '0';
            card.style.transform = 'scale(0.97)';
            setTimeout(() => {
              if (card.style.opacity === '0') card.style.display = 'none';
            }, 240);
          }
        }
      });
    });
  });
}

/* ============================================================
   5. GALERÍA DE PRODUCTO
   ============================================================ */

/**
 * Inicializa la galería de producto con cambio de imagen
 * y modal/lightbox usando Bootstrap Modal.
 */
function initProductGallery() {
  const mainImage = document.getElementById('product-main-image');
  const thumbnails = document.querySelectorAll('.product-thumb');
  const modalImage = document.getElementById('gallery-modal-image');

  if (!mainImage || !thumbnails.length) return;

  thumbnails.forEach(thumb => {
    thumb.addEventListener('click', () => {
      const src = thumb.dataset.full || thumb.querySelector('img')?.src;
      if (!src) return;

      // Fade transition
      mainImage.style.opacity = '0';
      mainImage.style.transition = 'opacity 0.2s ease';
      setTimeout(() => {
        mainImage.src = src;
        mainImage.style.opacity = '1';
      }, 180);

      thumbnails.forEach(t => t.classList.remove('active'));
      thumb.classList.add('active');
    });
  });

  // Abrir modal al hacer click en imagen principal
  mainImage.addEventListener('click', () => {
    if (modalImage) modalImage.src = mainImage.src;
    const modal = document.getElementById('galleryModal');
    if (modal) {
      const bsModal = new bootstrap.Modal(modal);
      bsModal.show();
    }
  });
}

/* ============================================================
   6. SELECTOR DE CANTIDAD (quantity selector)
   ============================================================ */
function initQuantitySelectors() {
  document.querySelectorAll('.qty-selector').forEach(selector => {
    const input = selector.querySelector('.qty-input');
    const btnMinus = selector.querySelector('[data-qty="minus"]');
    const btnPlus = selector.querySelector('[data-qty="plus"]');
    if (!input) return;

    if (btnMinus) {
      btnMinus.addEventListener('click', () => {
        const val = parseInt(input.value) || 1;
        if (val > 1) input.value = val - 1;
        input.dispatchEvent(new Event('change'));
      });
    }
    if (btnPlus) {
      btnPlus.addEventListener('click', () => {
        const val = parseInt(input.value) || 1;
        if (val < 99) input.value = val + 1;
        input.dispatchEvent(new Event('change'));
      });
    }
    input.addEventListener('change', () => {
      let val = parseInt(input.value);
      if (isNaN(val) || val < 1) val = 1;
      if (val > 99) val = 99;
      input.value = val;
    });
  });
}

/* ============================================================
   7. TOASTS
   ============================================================ */

/**
 * Muestra una notificación toast personalizada.
 * Usa el Toast API de Bootstrap 5 si existe el contenedor nativo,
 * o un sistema custom en esquina inferior derecha.
 *
 * @param {string} title - Título bold
 * @param {string} message - Mensaje descriptivo
 * @param {'success'|'info'|'error'} type
 * @param {number} duration - ms antes de cerrar (default 3500)
 */
function showToast(title, message, type = 'success', duration = 3500) {
  // Bootstrap toast nativo (si existe en la página)
  const bsToastEl = document.getElementById('main-toast');
  if (bsToastEl) {
    document.getElementById('toast-title').textContent = title;
    document.getElementById('toast-message').textContent = message;

    const iconEl = document.getElementById('toast-icon');
    const iconMap = { success: 'bi-check-circle-fill text-success', info: 'bi-info-circle-fill text-primary', error: 'bi-exclamation-circle-fill text-danger' };
    if (iconEl) iconEl.className = `bi ${iconMap[type] || iconMap.success} me-2`;

    const bsToast = bootstrap.Toast.getOrCreateInstance(bsToastEl, { delay: duration });
    bsToast.show();
    return;
  }

  // Toast custom (fallback)
  let container = document.querySelector('.toast-container-custom');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container-custom';
    document.body.appendChild(container);
  }

  const iconMap = { success: 'bi-check-circle-fill', info: 'bi-info-circle-fill', error: 'bi-exclamation-triangle-fill' };

  const toast = document.createElement('div');
  toast.className = 'toast-custom';
  toast.innerHTML = `
    <div class="toast-icon ${type}">
      <i class="bi ${iconMap[type] || iconMap.success}"></i>
    </div>
    <div class="toast-text">
      <strong>${escapeHtml(title)}</strong>
      ${escapeHtml(message)}
    </div>
    <button onclick="this.parentElement.remove()" style="background:none;border:none;color:rgba(255,255,255,0.4);cursor:pointer;padding:0 0 0 0.5rem;font-size:1rem;" aria-label="Cerrar">
      <i class="bi bi-x-lg"></i>
    </button>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('hiding');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

/* ============================================================
   8. NAVBAR SCROLL BEHAVIOR
   ============================================================ */
function initNavbar() {
  const navbar = document.querySelector('.navbar-custom');
  if (!navbar) return;

  const handler = () => {
    navbar.classList.toggle('scrolled', window.scrollY > 30);
  };
  window.addEventListener('scroll', handler, { passive: true });
  handler();
}

/* ============================================================
   9. SCROLL TO TOP
   ============================================================ */
function initScrollToTop() {
  const btn = document.querySelector('.scroll-to-top');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 400);
  }, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/* ============================================================
   10. SELECTOR DE COLOR Y TALLA
   ============================================================ */
function initProductSelectors() {
  // Color swatches
  document.querySelectorAll('.color-swatch').forEach(swatch => {
    swatch.addEventListener('click', () => {
      document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
      swatch.classList.add('active');
      const colorName = swatch.dataset.color || '';
      const label = document.getElementById('selected-color');
      if (label) label.textContent = colorName;
    });
  });

  // Size buttons
  document.querySelectorAll('.size-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.disabled) return;
      document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const label = document.getElementById('selected-size');
      if (label) label.textContent = btn.dataset.size || btn.textContent.trim();
    });
  });
}

/* ============================================================
   11. ADD TO CART BUTTONS (product.html y tarjetas)
   ============================================================ */
function initAddToCartButtons() {
  // Botón en product detail
  const addBtn = document.getElementById('add-to-cart-btn');
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      const name = document.getElementById('product-name')?.textContent || 'Producto';
      const price = parseFloat(document.getElementById('product-price')?.dataset.price || '0');
      const image = document.getElementById('product-main-image')?.src || '';
      const qtyInput = document.querySelector('#product-qty-input .qty-input');
      const qty = parseInt(qtyInput?.value || '1');
      const color = document.getElementById('selected-color')?.textContent || '';
      const size = document.getElementById('selected-size')?.textContent || '';
      const variant = [color, size].filter(Boolean).join(' / ');

      addToCart({ id: addBtn.dataset.productId || Date.now(), name, price, image, variant, qty });

      // Animación botón
      addBtn.classList.add('btn-loading');
      const originalContent = addBtn.innerHTML;
      addBtn.innerHTML = '<i class="bi bi-check-lg"></i> Agregado';
      addBtn.disabled = true;
      setTimeout(() => {
        addBtn.innerHTML = originalContent;
        addBtn.disabled = false;
        addBtn.classList.remove('btn-loading');
      }, 1800);
    });
  }

  // Botones rápidos en tarjetas (product cards)
  document.querySelectorAll('[data-add-to-cart]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      const card = btn.closest('[data-product-item]');
      if (!card) return;
      addToCart({
        id: card.dataset.productId || btn.dataset.productId || Date.now(),
        name: card.dataset.name || card.querySelector('.product-card-name')?.textContent || 'Producto',
        price: parseFloat(card.dataset.price || btn.dataset.price || '0'),
        image: card.querySelector('.product-card-image-wrapper img')?.src || '',
        variant: '',
        qty: 1
      });
    });
  });
}

/* ============================================================
   12. FAVORITOS (wishlist - solo UI, sin persistencia de ejemplo)
   ============================================================ */
function initWishlistButtons() {
  document.querySelectorAll('[data-wishlist]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      const isAdded = btn.classList.toggle('wishlisted');
      const icon = btn.querySelector('i');
      if (icon) {
        icon.className = isAdded ? 'bi bi-heart-fill text-danger' : 'bi bi-heart';
      }
      showToast(
        isAdded ? 'Guardado' : 'Eliminado',
        isAdded ? 'Producto agregado a favoritos.' : 'Producto removido de favoritos.',
        'info'
      );
      // [API HOOK] → POST/DELETE /api/wishlist/{product_id}
    });
  });
}

/* ============================================================
   13. CHECKOUT - Restaurar cupón y calcular total
   ============================================================ */
function initCheckoutSummary() {
  const summaryContainer = document.getElementById('checkout-order-summary');
  if (!summaryContainer) return;

  const cart = getCart();
  if (cart.length === 0) {
    summaryContainer.innerHTML = '<p class="text-muted small">Tu carrito está vacío.</p>';
    return;
  }

  summaryContainer.innerHTML = cart.map(item => `
    <div class="d-flex align-items-center gap-3 mb-3">
      <div style="position:relative;flex-shrink:0;">
        <img src="${escapeHtml(item.image) || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=80&q=80'}"
             alt="${escapeHtml(item.name)}" style="width:52px;height:52px;object-fit:cover;border-radius:8px;background:#f4f4f4;">
        <span style="position:absolute;top:-6px;right:-6px;background:#1a1a1a;color:#fff;font-size:0.65rem;font-weight:700;border-radius:50%;width:18px;height:18px;display:flex;align-items:center;justify-content:center;">${item.qty}</span>
      </div>
      <div style="flex:1;min-width:0;">
        <div style="font-size:0.85rem;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(item.name)}</div>
        ${item.variant ? `<div style="font-size:0.75rem;color:#9CA3AF;">${escapeHtml(item.variant)}</div>` : ''}
      </div>
      <div style="font-size:0.88rem;font-weight:700;flex-shrink:0;">${formatPrice(item.price * item.qty)}</div>
    </div>
  `).join('');

  // Restaurar cupón si había uno guardado
  const savedCoupon = localStorage.getItem('ec_coupon');
  if (savedCoupon && COUPONS[savedCoupon]) {
    const coupon = COUPONS[savedCoupon];
    const subtotal = getCartSubtotal();
    if (coupon.type === 'percent') {
      window._appliedDiscount = subtotal * (coupon.value / 100);
    } else if (coupon.type === 'fixed') {
      window._appliedDiscount = Math.min(coupon.value, subtotal);
    }
  }

  updateOrderSummary();
}

/* ============================================================
   14. ANIMACIÓN DE ENTRADA PARA CARDS (Intersection Observer)
   ============================================================ */
function initScrollAnimations() {
  if (!('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.animate-on-scroll').forEach((el, i) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(24px)';
    el.style.transition = `opacity 0.5s ease ${i * 0.07}s, transform 0.5s ease ${i * 0.07}s`;
    observer.observe(el);
  });
}

/* ============================================================
   15. UTILITARIOS
   ============================================================ */

/**
 * Formatea un número como precio en MXN.
 * [API HOOK] → Adaptar según la moneda del backend.
 * @param {number} amount
 * @returns {string}
 */
function formatPrice(amount) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2
  }).format(amount || 0);
}

/**
 * Escapa caracteres HTML para prevenir XSS.
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  if (typeof str !== 'string') return String(str || '');
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
}

/**
 * Establece el textContent de un elemento por selector.
 * @param {string} selector
 * @param {string} text
 */
function setTextContent(selector, text) {
  const el = document.querySelector(selector);
  if (el) el.textContent = text;
}

/**
 * Anima un elemento con shake (para validación).
 * @param {HTMLElement} el
 */
function shakeElement(el) {
  el.style.animation = 'none';
  el.style.transition = 'transform 0.05s ease';
  const keyframes = [0, -6, 6, -4, 4, 0].map((x, i) => `${i * 15}ms`);
  el.animate([
    { transform: 'translateX(0)' },
    { transform: 'translateX(-6px)' },
    { transform: 'translateX(6px)' },
    { transform: 'translateX(-4px)' },
    { transform: 'translateX(4px)' },
    { transform: 'translateX(0)' }
  ], { duration: 320, easing: 'ease' });
}

/* ============================================================
   16. NEWSLETTER FORM
   ============================================================ */
function initNewsletterForm() {
  const form = document.getElementById('newsletter-form');
  if (!form) return;

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const email = form.querySelector('input[type="email"]')?.value;
    if (!email) return;

    // [API HOOK LARAVEL] →
    //   POST /api/newsletter/subscribe → { email }
    //   Retorna: { success: true, message: 'Suscrito correctamente' }
    //   Manejo de errores: email ya registrado, inválido, etc.

    const btn = form.querySelector('button[type="submit"]');
    if (btn) { btn.disabled = true; btn.textContent = 'Enviando...'; }
    await new Promise(r => setTimeout(r, 900)); // Simula delay API
    showToast('¡Suscrito!', 'Recibirás nuestras mejores ofertas en tu correo.', 'success');
    form.reset();
    if (btn) { btn.disabled = false; btn.textContent = 'Suscribirme'; }
  });
}

/* ============================================================
   17. CHECKOUT FORM VALIDATION
   ============================================================ */
function initCheckoutForm() {
  const form = document.getElementById('checkout-form');
  if (!form) return;

  form.addEventListener('submit', async e => {
    e.preventDefault();

    if (!form.checkValidity()) {
      form.classList.add('was-validated');
      showToast('Formulario incompleto', 'Por favor completa todos los campos requeridos.', 'error');
      return;
    }

    const submitBtn = form.querySelector('[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Procesando...';
    }

    // [API HOOK LARAVEL] → POST /api/orders/checkout con los datos del formulario
    // Incluir: items del carrito, cupón aplicado, datos de envío, método de pago
    // Integrar con Stripe: crear PaymentIntent en backend antes de confirmar
    //
    // Flujo recomendado con Stripe:
    // 1. POST /api/orders/create-payment-intent → devuelve { client_secret }
    // 2. stripe.confirmPayment({ elements, confirmParams: { return_url } })
    // 3. Backend webhook confirma pago → actualiza orden a 'paid'
    // 4. Limpiar carrito y redirigir a /order-confirmation

    await new Promise(r => setTimeout(r, 1500)); // Simula procesamiento

    // Limpiar carrito después del pedido exitoso
    // [API HOOK] → Solo limpiar localStorage después de confirmación exitosa del backend
    saveCart([]);
    updateCartBadge();

    showToast('¡Pedido realizado!', 'Recibirás un correo de confirmación pronto.', 'success');

    if (submitBtn) {
      submitBtn.innerHTML = '<i class="bi bi-check-lg me-2"></i>¡Listo!';
      setTimeout(() => {
        // [API HOOK] → Redirigir a página de confirmación con ID de orden
        window.location.href = 'index.html';
      }, 2000);
    }
  });

  // Formateo de tarjeta de crédito (solo UI)
  const cardInput = document.getElementById('card-number');
  if (cardInput) {
    cardInput.addEventListener('input', e => {
      let val = e.target.value.replace(/\D/g, '').substring(0, 16);
      e.target.value = val.replace(/(.{4})/g, '$1 ').trim();
    });
  }

  const expInput = document.getElementById('card-expiry');
  if (expInput) {
    expInput.addEventListener('input', e => {
      let val = e.target.value.replace(/\D/g, '').substring(0, 4);
      if (val.length >= 3) val = val.substring(0, 2) + '/' + val.substring(2);
      e.target.value = val;
    });
  }
}

/* ============================================================
   18. INICIALIZACIÓN PRINCIPAL
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  // Siempre ejecutar
  updateCartBadge();
  initNavbar();
  initScrollToTop();
  initScrollAnimations();
  initNewsletterForm();

  // Según la página actual
  const page = document.body.dataset.page || '';

  if (page === 'cart' || document.getElementById('cart-items-body')) {
    renderCart();
  }

  if (page === 'product' || document.getElementById('product-main-image')) {
    initProductGallery();
    initProductSelectors();
    initQuantitySelectors();
    initAddToCartButtons();
    initWishlistButtons();
  }

  if (page === 'checkout' || document.getElementById('checkout-form')) {
    initCheckoutSummary();
    initCheckoutForm();
    initQuantitySelectors();
  }

  if (page === 'index' || document.getElementById('products-grid')) {
    initProductFilters();
    initAddToCartButtons();
    initWishlistButtons();
  }

  if (document.getElementById('products-grid') || document.querySelectorAll('[data-add-to-cart]').length) {
    initAddToCartButtons();
    initWishlistButtons();
    initProductFilters();
  }

  // Coupon button (cart)
  const couponBtn = document.getElementById('apply-coupon-btn');
  if (couponBtn) couponBtn.addEventListener('click', applyCoupon);

  const removeCouponBtn = document.getElementById('remove-coupon-btn');
  if (removeCouponBtn) removeCouponBtn.addEventListener('click', removeCoupon);

  // Keyboard: Enter en campo cupón
  const couponInput = document.getElementById('coupon-input');
  if (couponInput) {
    couponInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); applyCoupon(); }
    });
  }
});

/* ============================================================
   19. EXPOSE GLOBALS (para uso en HTML inline mínimo)
   ============================================================ */
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.updateQuantity = updateQuantity;
window.renderCart = renderCart;
window.updateCartBadge = updateCartBadge;
window.applyCoupon = applyCoupon;
window.removeCoupon = removeCoupon;
window.showToast = showToast;
window.formatPrice = formatPrice;

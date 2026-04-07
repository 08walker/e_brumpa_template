/**
 * ═══════════════════════════════════════════════════════════════
 *  Lumora Store — js/main.js
 *  Lógica principal del frontend:
 *    - Carrito en localStorage (persistente entre páginas)
 *    - Notificaciones Toast
 *    - Filtro de productos
 *    - Badge del carrito
 *    - Utilidades
 *
 *  PARA PRODUCCIÓN: minificar este archivo con
 *    npx terser js/main.js -o js/main.min.js --compress --mangle
 *  y actualizar la referencia en el HTML.
 *
 *  INTEGRACIÓN CON API REAL (Laravel/REST):
 *    Busca los comentarios "// TODO: API" para los puntos de
 *    integración con el backend.
 * ═══════════════════════════════════════════════════════════════
 */

'use strict';

/* ─────────────────────────────────────────────────────────────
   CONSTANTES
───────────────────────────────────────────────────────────── */
const CART_KEY    = 'lumora_cart';
const TOAST_DURATION = 3500; // ms

/* ─────────────────────────────────────────────────────────────
   CARRITO — CRUD + PERSISTENCIA (localStorage)
   TODO: API — reemplazar todas estas funciones por llamadas
   a /api/cart cuando se integre el backend.
───────────────────────────────────────────────────────────── */

/**
 * Obtiene el carrito actual del localStorage.
 * @returns {Array} Array de items del carrito
 */
function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch {
    return [];
  }
}

/**
 * Guarda el carrito en localStorage.
 * @param {Array} cart - Array de items a guardar
 */
function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

/**
 * Añade un producto al carrito o incrementa su cantidad.
 * Emite un toast de confirmación.
 *
 * @param {Object} product - { id, name, price, image, qty, variant? }
 *
 * TODO: API — POST /api/cart/items { product_id, qty, variant }
 */
function addToCart(product) {
  const cart = getCart();
  const existingIdx = cart.findIndex(i => i.id === product.id);

  if (existingIdx > -1) {
    cart[existingIdx].qty += (product.qty || 1);
    showToast(`Cantidad actualizada — ${product.name}`, 'success');
  } else {
    cart.push({
      id:      product.id,
      name:    product.name,
      price:   product.price,
      image:   product.image,
      qty:     product.qty || 1,
      variant: product.variant || null,
    });
    showToast(`¡Añadido al carrito! — ${product.name}`, 'success');
  }

  saveCart(cart);
  updateCartBadge();
}

/**
 * Actualiza el badge (contador) del carrito en el header.
 * Se llama después de cada operación del carrito.
 */
function updateCartBadge() {
  const cart  = getCart();
  const total = cart.reduce((sum, item) => sum + item.qty, 0);
  const badges = document.querySelectorAll('.cart-badge');

  badges.forEach(badge => {
    if (total > 0) {
      badge.textContent = total > 99 ? '99+' : total;
      badge.classList.remove('hidden');
      badge.setAttribute('aria-label', `${total} producto${total !== 1 ? 's' : ''} en el carrito`);
      // Animación bump
      badge.classList.remove('bump');
      void badge.offsetWidth; // reflow
      badge.classList.add('bump');
    } else {
      badge.classList.add('hidden');
    }
  });
}

/* ─────────────────────────────────────────────────────────────
   TOAST NOTIFICATIONS
   Uso: showToast('Mensaje', 'success' | 'error' | 'warning' | 'info')
───────────────────────────────────────────────────────────── */

const TOAST_ICONS = {
  success: `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-teal-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/></svg>`,
  error:   `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/></svg>`,
  warning: `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-amber-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>`,
  info:    `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/></svg>`,
};

/**
 * Muestra una notificación toast con auto-dismiss.
 * @param {string} message - Mensaje a mostrar
 * @param {'success'|'error'|'warning'|'info'} type - Tipo de toast
 * @param {number} [duration] - Duración en ms (default: TOAST_DURATION)
 */
function showToast(message, type = 'info', duration = TOAST_DURATION) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.setAttribute('role', 'status');
  toast.innerHTML = `
    ${TOAST_ICONS[type] || TOAST_ICONS.info}
    <span class="flex-1">${message}</span>
    <button onclick="this.closest('.toast').remove()" aria-label="Cerrar notificación"
      class="text-gray-300 hover:text-gray-500 transition-colors ml-1 flex-shrink-0 leading-none">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
    </button>
  `;

  container.appendChild(toast);

  // Auto-dismiss
  const timer = setTimeout(() => dismissToast(toast), duration);

  // Pausar al hover
  toast.addEventListener('mouseenter', () => clearTimeout(timer));
  toast.addEventListener('mouseleave', () => {
    setTimeout(() => dismissToast(toast), 1500);
  });
}

function dismissToast(toast) {
  if (!toast || !toast.parentNode) return;
  toast.classList.add('toast-dismissing');
  toast.addEventListener('animationend', () => toast.remove(), { once: true });
}

/* ─────────────────────────────────────────────────────────────
   FILTRO DE PRODUCTOS (client-side)
   Usa data-category en los articles del grid.
   TODO: Para back-end, reemplazar por petición:
   GET /api/products?filter={filter}&sort={sort}
───────────────────────────────────────────────────────────── */

/**
 * Filtra los productos del grid según la categoría/tipo seleccionado.
 * @param {string} filter - 'all' | 'new' | 'sale' | 'popular'
 */
function filterProducts(filter) {
  const cards = document.querySelectorAll('#products-grid article[data-category]');
  const filterBtns = document.querySelectorAll('.filter-btn');

  // Actualizar estado visual de botones
  filterBtns.forEach(btn => {
    const isActive = btn.dataset.filter === filter;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-pressed', isActive);
  });

  // Mostrar/ocultar cards con animación suave
  cards.forEach(card => {
    const categories = card.dataset.category || '';
    const match = filter === 'all' || categories.includes(filter);
    card.style.transition = 'opacity 200ms ease, transform 200ms ease';
    if (match) {
      card.classList.remove('hidden-by-filter');
      card.style.opacity = '1';
      card.style.transform = 'translateY(0)';
    } else {
      card.style.opacity = '0';
      card.style.transform = 'translateY(8px)';
      setTimeout(() => card.classList.add('hidden-by-filter'), 200);
    }
  });
}

/* ─────────────────────────────────────────────────────────────
   FORMATEO DE PRECIOS
───────────────────────────────────────────────────────────── */

/**
 * Formatea un número como precio en pesos mexicanos.
 * @param {number} amount - Cantidad a formatear
 * @returns {string} - Precio formateado (ej: "$1,299.00")
 */
function formatPrice(amount) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
  }).format(amount);
}

/* ─────────────────────────────────────────────────────────────
   INICIALIZACIÓN
   Se ejecuta cuando el DOM está listo.
───────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {

  // 1. Actualizar badge del carrito al cargar cualquier página
  updateCartBadge();

  // 2. Newsletter form (mock — conectar con API de email marketing)
  const newsletterForms = document.querySelectorAll('form[aria-label="Suscripción al newsletter"]');
  newsletterForms.forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const emailInput = form.querySelector('input[type="email"]');
      const email = emailInput?.value;
      if (email) {
        // TODO: POST /api/newsletter/subscribe { email }
        showToast(`¡Suscrito! Recibirás novedades en ${email}`, 'success');
        if (emailInput) emailInput.value = '';
      }
    });
  });

  // 3. Cerrar menú al presionar Escape (accesibilidad)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      // Alpine.js maneja el offcanvas — disparar evento custom
      document.dispatchEvent(new CustomEvent('close-menus'));
    }
  });

  // 4. Lazy-loading nativo (fallback para navegadores sin soporte)
  if ('loading' in HTMLImageElement.prototype) {
    // Soporte nativo — no necesita polyfill
  } else {
    // Fallback básico: cargar todas las imágenes
    document.querySelectorAll('img[loading="lazy"]').forEach(img => {
      img.src = img.dataset.src || img.src;
    });
  }

  // 5. Añadir aria-label a las estrellas de rating que no lo tengan
  document.querySelectorAll('.product-card [class*="text-yellow"]').forEach(stars => {
    if (!stars.getAttribute('aria-label')) {
      const parent = stars.closest('[aria-label]');
      if (!parent) stars.setAttribute('aria-hidden', 'true');
    }
  });

});

/* ─────────────────────────────────────────────────────────────
   WINDOW GLOBALS
   Exponer funciones al scope global para uso desde HTML inline
   (atributos onclick, etc.)
   Para Laravel/Inertia/React reemplazar por importaciones.
───────────────────────────────────────────────────────────── */
window.addToCart       = addToCart;
window.getCart         = getCart;
window.saveCart        = saveCart;
window.updateCartBadge = updateCartBadge;
window.filterProducts  = filterProducts;
window.showToast       = showToast;
window.formatPrice     = formatPrice;

/* ─────────────────────────────────────────────────────────────
   NOTAS DE INTEGRACIÓN CON LARAVEL
   ─────────────────────────────────────────────────────────────
   1. CARRITO EN SESIÓN (recomendado para SEO y checkout):
      Reemplazar localStorage por:
      - POST   /api/cart            → añadir item
      - PUT    /api/cart/{id}       → actualizar cantidad
      - DELETE /api/cart/{id}       → eliminar item
      - GET    /api/cart            → listar items con totales

   2. AUTENTICACIÓN:
      Incluir CSRF token en headers:
      headers: { 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content }

   3. PAGO CON CLIP (México):
      Ver: https://developer.clip.mx
      Inicializar con el token generado en /api/payment/initiate

   4. PARA INERTIA.JS + REACT:
      Convertir las funciones de carrito a un Zustand store o
      Context API. Las páginas se renderizarían como componentes
      React en lugar de HTML estático.

   5. EVENTOS ANALÍTICOS (Google Analytics 4):
      gtag('event', 'add_to_cart', { item_id: id, value: price });
 ─────────────────────────────────────────────────────────────
*/
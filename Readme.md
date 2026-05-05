# ÉLARA — Bootstrap 5.3 E-Commerce Template

Plantilla e-commerce responsiva, moderna y lista para producción básica. Construida con Bootstrap 5.3, sin dependencias pesadas y con hooks claros para integración con backend Laravel / API REST.

---

## Estructura de archivos

```
/
├── index.html          # Página principal (hero, categorías, productos, testimonios)
├── product.html        # Detalle de producto (galería, tabs, relacionados)
├── cart.html           # Carrito de compras (localStorage, cupones, resumen)
├── checkout.html       # Checkout multi-paso (envío → pago → confirmación)
├── about.html          # Nosotros (historia, equipo, valores, estadísticas)
├── blog.html           # Listado de artículos (sidebar, categorías, paginación)
├── blog-details.html   # Detalle de artículo (TOC, autor, artículos relacionados)
├── css/
│   └── styles.css      # Todos los estilos personalizados (2300+ líneas)
├── js/
│   └── main.js         # Toda la lógica JS (carrito, filtros, toast, modales)
└── README.md
```

---

## Uso local

### Opción 1 — Abrir directamente en navegador
Simplemente abre `index.html` en tu navegador. Todo funciona sin servidor gracias a los CDN y localStorage.

### Opción 2 — Servidor local con Node
```bash
npx serve .
# Visita http://localhost:3000
```

### Opción 3 — PHP built-in server (ideal para integración Laravel-style)
```bash
php -S localhost:8000
# Visita http://localhost:8000
```

---

## CDN utilizados

Todos incluidos vía CDN, sin instalación:

| Librería | Versión | Propósito |
|---|---|---|
| Bootstrap CSS | 5.3.3 | Framework UI base |
| Bootstrap JS Bundle | 5.3.3 | Componentes interactivos |
| Bootstrap Icons | 1.11.3 | Iconografía |
| Google Fonts | — | Playfair Display + DM Sans |

---

## Funcionalidades JS (`/js/main.js`)

### Carrito (localStorage)
```javascript
// Todas las funciones están disponibles globalmente
window.addToCart({ id, name, price, image, variant, qty })
window.removeFromCart(itemKey)
window.updateQuantity(itemKey, newQty)
window.renderCart()          // Renderiza cart.html
window.updateCartBadge()     // Actualiza badge en navbar
window.getCart()             // Retorna array del carrito
```

**Persistencia:** Los datos se guardan en `localStorage` bajo la clave `elara_cart` y persisten entre páginas y recargas.

**Estructura de un ítem:**
```javascript
{
  _key: "product-id_Variante",  // clave única por producto+variante
  id: "product-id",
  name: "Nombre del producto",
  price: 2599,                  // número, sin formato
  image: "url-imagen",
  variant: "Color / Talla",
  qty: 1
}
```

### Cupones
Los cupones válidos están definidos en `main.js` en el objeto `COUPONS`:
```javascript
const COUPONS = {
  'SAVE10':      { type: 'percent',  value: 10  },  // 10% descuento
  'BIENVENIDO':  { type: 'fixed',    value: 200 },  // $200 MXN fijos
  'ENVIOGRATIS': { type: 'shipping', value: 0   },  // Envío gratis
};
```
Para agregar más cupones, simplemente extiende el objeto `COUPONS`.

### Filtros de productos
Funcionan con `data-attributes` en las cards:
```html
<div class="product-item" data-filter="bestseller" data-badge="Bestseller">
```
Los filtros disponibles se definen como botones con `data-filter="valor"`.

### Toast notifications
```javascript
window.showToast('Título', 'Mensaje descriptivo', 'success'); // success | error | info | warning
```

---

## Integración con Laravel

### 1. Instalación en proyecto Laravel existente

Copia los archivos a `public/`:
```
public/
├── index.html  → resources/views/index.blade.php  (o mantener como HTML)
├── css/styles.css → public/css/styles.css
├── js/main.js  → public/js/main.js
```

O sirve directamente desde `public/` para un frontend desacoplado.

### 2. Convertir a Blade

Renombra `.html` → `.blade.php` y usa directivas:
```blade
{{-- layouts/app.blade.php --}}
@include('partials.navbar')
@yield('content')
@include('partials.footer')
```

### 3. API REST — Endpoints sugeridos

Busca los comentarios `// [API HOOK LARAVEL]` en `main.js` y `checkout.html`:

```
GET    /api/products                    → Listado con filtros
GET    /api/products/{slug}             → Detalle de producto
POST   /api/coupons/validate            → Validar cupón
POST   /api/orders                      → Crear orden
POST   /api/orders/{id}/payment         → Procesar pago
GET    /api/orders/{id}                 → Estado de orden
POST   /api/newsletter/subscribe        → Suscripción
```

**Ejemplo de integración en `addToCart`:**
```javascript
// Reemplazar localStorage con llamada API:
async function addToCart(item) {
  const response = await fetch('/api/cart/add', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrf },
    body: JSON.stringify(item)
  });
  const cart = await response.json();
  renderCartFromApi(cart);
}
```

### 4. Autenticación

Agrega en el navbar el estado del usuario desde Blade:
```blade
@auth
  <a href="{{ route('account') }}" class="nav-icon-btn">
    <i class="bi bi-person-check"></i>
  </a>
@else
  <a href="{{ route('login') }}" class="nav-icon-btn">
    <i class="bi bi-person"></i>
  </a>
@endauth
```

---

## Integración de pagos

### Stripe
```html
<!-- Agregar en checkout.html dentro del tab de tarjeta -->
<script src="https://js.stripe.com/v3/"></script>
<div id="stripe-card-element"></div>

<script>
const stripe = Stripe('pk_test_TU_CLAVE_PUBLICA');
const elements = stripe.elements();
const cardElement = elements.create('card');
cardElement.mount('#stripe-card-element');
</script>
```

**Laravel backend:**
```bash
composer require stripe/stripe-php
```
```php
// En tu PaymentController:
\Stripe\Stripe::setApiKey(config('services.stripe.secret'));
$paymentIntent = \Stripe\PaymentIntent::create([
    'amount'   => $total * 100,  // centavos
    'currency' => 'mxn',
]);
```

### Clip (México)
Reemplaza el formulario de tarjeta con el SDK de Clip:
```html
<!-- [API HOOK LARAVEL] Clip TokenForm -->
<script src="https://sdk.clip.mx/v2/clip.js"></script>
```
Ver documentación oficial: https://developer.clip.mx

### Conekta / OXXO / SPEI
```bash
composer require conekta/conekta-php
```
Los tabs de OXXO y SPEI en `checkout.html` ya tienen los hooks marcados para conectar la generación de referencias.

---

## Personalización

### Colores
Edita las variables CSS en `styles.css`:
```css
:root {
  --color-primary:       #FF0000;
  --color-primary-dark:  #CC0000;
  --color-primary-light: #FFE5E5;
}
```

### Tipografía
Cambia las fuentes en `styles.css` y en el `<link>` de Google Fonts de cada página:
```css
--font-display: 'Playfair Display', serif;
--font-body:    'DM Sans', sans-serif;
```

### Moneda y locale
En `main.js`, busca la función `formatPrice`:
```javascript
function formatPrice(amount) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(amount);
}
```
Cambia `'es-MX'` y `'MXN'` según tu mercado.

### Envío gratuito
En `main.js`, busca `FREE_SHIPPING_THRESHOLD`:
```javascript
const FREE_SHIPPING_THRESHOLD = 1500;  // MXN
const SHIPPING_COST = 150;             // MXN
```

---

## SEO

Todas las páginas incluyen:
- `<meta name="description">`
- `<meta property="og:title">`
- `<meta property="og:description">`
- `loading="lazy"` en todas las imágenes

Para SEO avanzado en Laravel, considera:
```bash
composer require spatie/laravel-sitemap
```

---

## Accesibilidad

- Todos los botones/iconos tienen `aria-label`
- Inputs con `autocomplete` apropiado
- Roles ARIA en listas de navegación y toast (`aria-live="assertive"`)
- Navegación completa por teclado (focus states en `styles.css`)

---

## Notas de desarrollo

- **Sin jQuery.** Todo JS vanilla + Bootstrap JS API.
- **Sin inline styles** salvo valores dinámicos mínimos (e.g. `top: 90px` en sticky).
- **Imágenes:** Todas usan `placehold.co`. Reemplazar con rutas reales o llamadas a Storage de Laravel.
- **Formularios:** Validación HTML5 nativa + lógica adicional en `main.js`. Para producción, agregar validación servidor (Laravel `FormRequest`).
- **CSRF:** Agregar token CSRF al pasar a Laravel con `@csrf` en forms o header `X-CSRF-TOKEN` en fetch.

---

## Licencia

Template de uso libre para proyectos comerciales y personales.  
Créditos: Bootstrap (MIT), Bootstrap Icons (MIT), Google Fonts (OFL).

# Lumora Store — Template E-commerce

Template de e-commerce moderno, responsivo y listo para producción. Construido con Tailwind CSS (CDN), Alpine.js y DM Sans + Fraunces como tipografía.

## Estructura de archivos

```
/
├── index.html          ← Página principal (hero, categorías, grid de productos)
├── product.html        ← Detalle de producto (galería, variantes, tabs)
├── cart.html           ← Carrito con resumen y cupones
├── css/
│   └── styles.css      ← Estilos personalizados y componentes
├── js/
│   └── main.js         ← Carrito, toasts, filtros, utilidades
├── assets/
│   └── images/         ← Imágenes del sitio (ver sección más abajo)
└── README.md
```

## Uso rápido (demo local)

No requiere instalación. Abre `index.html` en cualquier navegador:

```bash
# Con VS Code Live Server (recomendado)
# Instalar extensión "Live Server" y hacer clic derecho → Open with Live Server

# Con Python 3
python -m http.server 8080
# Abrir http://localhost:8080

# Con Node.js
npx serve .
```

## CDNs utilizados

Incluidos directamente en el `<head>` de cada página HTML:

| Librería | CDN | Propósito |
|---|---|---|
| Tailwind CSS | `https://cdn.tailwindcss.com` | Estilos utility-first |
| Alpine.js | `https://unpkg.com/alpinejs@3.x.x/dist/cdn.min.js` | Interactividad declarativa |
| Google Fonts | `https://fonts.googleapis.com` | Fraunces + DM Sans |

## Producción con Tailwind CLI (recomendado)

Para producción, **no usar el CDN** — compilar con Tailwind CLI:

```bash
# 1. Inicializar proyecto npm
npm init -y

# 2. Instalar Tailwind CSS
npm install -D tailwindcss

# 3. Generar configuración
npx tailwindcss init

# 4. Crear css/input.css
echo '@tailwind base;
@tailwind components;
@tailwind utilities;' > css/input.css

# 5. Compilar (desarrollo con watch)
npx tailwindcss -i ./css/input.css -o ./css/styles-compiled.css --watch

# 6. Compilar (producción, minificado)
npx tailwindcss -i ./css/input.css -o ./css/styles-compiled.css --minify
```

Luego en el HTML, reemplazar:
```html
<!-- Quitar CDN -->
<script src="https://cdn.tailwindcss.com"></script>

<!-- Añadir CSS compilado -->
<link rel="stylesheet" href="css/styles-compiled.css" />
```

## Minificar JavaScript

```bash
# Con terser
npm install -D terser
npx terser js/main.js -o js/main.min.js --compress --mangle

# Actualizar en HTML:
# <script src="js/main.min.js"></script>
```

## Paleta de colores y tipografía

| Variable | Valor | Uso |
|---|---|---|
| `primary` | `#0ea5a4` | Botones, badges, acentos |
| `neutral-900` | `#111827` | Texto principal |
| `neutral-50` | `#f8fafc` | Fondos claros |
| `cream` | `#faf8f5` | Fondo del body |
| `Fraunces` | Display/Serif | Títulos h1–h3 |
| `DM Sans` | Sans-serif | Cuerpo de texto |

## Imágenes

El template usa **placeholders automáticos** via `onerror` en cada `<img>`. Para producción:

1. Reemplazar las rutas `assets/images/*.jpg` con tus imágenes reales
2. Recommended: usar WebP con fallback JPG
3. Para Laravel: `Storage::url('products/foto.webp')`

Imágenes de ejemplo que debes agregar en `assets/images/`:
- `hero-product.jpg` — Imagen del banner principal
- `product-1.jpg` a `product-8.jpg` — Fotos de productos
- `cat-ropa.jpg`, `cat-electronica.jpg`, `cat-hogar.jpg`, `cat-accesorios.jpg` — Categorías

Fuentes gratuitas: [Unsplash](https://unsplash.com), [Pexels](https://pexels.com), [Pixabay](https://pixabay.com)

## Carrito

El carrito usa `localStorage` con la clave `lumora_cart`. Para integrar con Laravel:

```javascript
// GET carrito desde API
const response = await fetch('/api/cart', {
  headers: { 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content }
});
const cart = await response.json();
```

**Cupones de prueba disponibles:**
- `SAVE10` → 10% de descuento
- `LUMORA20` → 20% de descuento
- `PROMO15` → 15% de descuento

## Componentes disponibles

| Componente | Clase CSS | Archivo |
|---|---|---|
| Botón primario | `btn-primary` | `styles.css` |
| Botón outline | `btn-outline` | `styles.css` |
| Badge Nuevo | `badge-new` | `styles.css` |
| Badge Oferta | `badge-sale` | `styles.css` |
| Chip filtro | `chip-filter` | `styles.css` |
| Toast | `showToast(msg, type)` | `main.js` |
| Tarjeta producto | `product-card` | `styles.css` |

## Accesibilidad

- Todos los botones e imágenes tienen `aria-label` o `alt`
- Menú offcanvas con `role="dialog"` y `aria-modal="true"`
- Toasts con `aria-live="polite"`
- Focus states visibles (`:focus-visible`)
- Breadcrumbs con `aria-label="Breadcrumb"` y `aria-current="page"`
- Selectores de talla y color con `role="radiogroup"` y `role="radio"`

## Integración con Laravel

```
app/
├── Http/Controllers/
│   ├── ProductController.php   ← Listar/filtrar productos
│   ├── CartController.php      ← CRUD carrito (sesión o BD)
│   └── CouponController.php    ← Validar cupones
├── Models/
│   ├── Product.php
│   ├── Cart.php
│   └── Coupon.php
routes/
└── api.php
    GET    /api/products
    POST   /api/cart
    PUT    /api/cart/{id}
    DELETE /api/cart/{id}
    POST   /api/coupons/validate
```

## Pasarela de pago — Clip (México)

```javascript
// En cart.html → proceedToCheckout()
// Documentación: https://developer.clip.mx
async function proceedToCheckout() {
  const response = await fetch('/api/payment/clip/initiate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-TOKEN': csrfToken,
    },
    body: JSON.stringify({ cart: getCart() }),
  });
  const { payment_url } = await response.json();
  window.location.href = payment_url;
}
```

## Licencia

MIT — Libre para uso personal y comercial.

---

Desarrollado como base para proyectos Laravel + Bootstrap/Tailwind. 🚀
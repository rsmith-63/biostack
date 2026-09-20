# Mobile CSS Optimization Guide: Biostack Client (`/Users/robsmith/biostack/src/client`)

This document outlines the refactoring plan and responsive CSS architecture to optimize all styles across `/Users/robsmith/biostack/src/client` for modern smartphone screen sizes ranging from **5.4 inches to 6.9 inches**.

---

## 1. Display Size Mapping & Viewport Strategy

While physical displays range from 5.4" to 6.9", CSS layouts respond to **logical viewport widths** (in CSS pixels), which depend on device scaling and aspect ratios (e.g., 19.5:9 to 20:9).

| Phone Category | Screen Diagonal | Typical Logical Width | Key Target Devices |
| :--- | :--- | :--- | :--- |
| **Compact** | 5.4" – 5.9" | `320px` – `375px` | iPhone Mini, Asus Zenfone 10, Small Androids |
| **Standard / Medium** | 6.0" – 6.5" | `376px` – `429px` | iPhone 15/16, Galaxy S24/S25, Pixel 8/9 |
| **Large / Ultra** | 6.6" – 6.9" | `430px` – `480px` | iPhone 16 Pro Max, Galaxy S25 Ultra, Pixel 9 Pro XL |

### Strategy Objectives
- **Fluid Scaling over Rigid Breakpoints:** Utilize `clamp()`, `min()`, `max()`, and CSS container queries to scale UI elements fluidly across all mobile dimensions without requiring excessive `@media` blocks.
- **Safe Area Inset Handling:** Ensure content accounts for camera cutouts, dynamic islands, and home indicator bars.
- **Touch Ergonomics:** Enforce a minimum touch target size of `$44px \times 44px$` across all mobile sizes.

---

## 2. Universal Design Tokens (`src/client/styles/tokens.css`)

Add or update fluid design tokens in your root stylesheet to establish baseline variables across all client files.

```css
/* /Users/robsmith/biostack/src/client/styles/tokens.css */

:root {
  /* --- Viewport & Padding Fluidity --- */
  /* Scales outer container padding dynamically from 12px on compact screens to 24px on ultra screens */
  --gutter-padding: clamp(0.75rem, 4vw, 1.5rem);
  
  /* --- Fluid Typography System --- */
  --font-size-xs: clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem);   /* 12px -> 14px */
  --font-size-sm: clamp(0.875rem, 0.8rem + 0.35vw, 1rem);      /* 14px -> 16px */
  --font-size-base: clamp(1rem, 0.95rem + 0.4vw, 1.125rem);    /* 16px -> 18px */
  --font-size-lg: clamp(1.25rem, 1.15rem + 0.6vw, 1.5rem);    /* 20px -> 24px */
  --font-size-xl: clamp(1.5rem, 1.3rem + 1vw, 2rem);         /* 24px -> 32px */

  /* --- Spacing System --- */
  --space-xs: clamp(0.25rem, 1vw, 0.5rem);
  --space-sm: clamp(0.5rem, 2vw, 0.75rem);
  --space-md: clamp(1rem, 3vw, 1.5rem);
  --space-lg: clamp(1.5rem, 4vw, 2.25rem);

  /* --- Ergonomic Touch Target Minimums --- */
  --touch-target-min: 44px;

  /* --- Dynamic Viewport Heights (Solves mobile address bar jitter) --- */
  --full-screen-height: 100dvh;
}

/* Specific Adjustments for Compact Displays (<375px) */
@media (max-width: 375px) {
  :root {
    --touch-target-min: 40px; /* Slightly tighter touch target density if needed */
  }
}
```

---

## 3. Global Base Styles & Safe Areas (`src/client/styles/base.css`)

Apply these updates to your base reset to accommodate modern hardware features (notches, curved corners, bottom gestures).

```css
/* /Users/robsmith/biostack/src/client/styles/base.css */

html {
  /* Prevent horizontal scroll issues caused by subtle scaling overflow */
  overflow-x: hidden;
  /* Improve text rendering on small high-DPI displays */
  -webkit-text-size-adjust: 100%;
  text-rendering: optimizeLegibility;
}

body {
  margin: 0;
  padding: 0;
  width: 100%;
  min-height: 100dvh;
  font-size: var(--font-size-base);
  
  /* Support hardware cutouts, dynamic islands, and iOS home bars */
  padding-top: env(safe-area-inset-top, 0px);
  padding-right: env(safe-area-inset-right, 0px);
  padding-bottom: env(safe-area-inset-bottom, 0px);
  padding-left: env(safe-area-inset-left, 0px);
}

/* Ensure interactive controls maintain accessible target areas on small screens */
button, 
a, 
input, 
select {
  min-height: var(--touch-target-min);
  min-width: var(--touch-target-min);
}
```

---

## 4. Mobile Display Specific Layout Queries

Apply targeted queries across `/Users/robsmith/biostack/src/client` components depending on physical form-factor thresholds.

### A. Compact Displays (5.4" – 5.9" / Viewports $\le 375\text{px}$)
*Targeting devices like iPhone Mini or compact Androids.*

```css
/* Inline component adaptation for Compact devices */
@media screen and (max-width: 375px) {
  .biostack-card-grid {
    grid-template-columns: 1fr; /* Force single column */
    gap: var(--space-sm);
  }

  .biostack-header-actions {
    flex-direction: column;
    align-items: stretch;
  }

  /* Reduce non-essential padding to save horizontal real estate */
  .biostack-container {
    padding-left: 0.5rem;
    padding-right: 0.5rem;
  }
}
```

### B. Standard Displays (6.0" – 6.5" / Viewports $376\text{px} \le w \le 429\text{px}$)
*Targeting standard flagship phones.*

```css
@media screen and (min-width: 376px) and (max-width: 429px) {
  .biostack-card-grid {
    grid-template-columns: 1fr;
    gap: var(--space-md);
  }

  .biostack-metrics-row {
    display: grid;
    grid-template-columns: repeat(2, 1fr); /* 2 columns fit well on standard size */
  }
}
```

### C. Ultra / Large Displays (6.6" – 6.9" / Viewports $430\text{px} \le w \le 500\text{px}$)
*Targeting Ultra/Max devices.*

```css
@media screen and (min-width: 430px) and (max-width: 767px) {
  .biostack-card-grid {
    /* Ultra screens have sufficient width (430px+) for compact multi-column or rich cards */
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: var(--space-md);
  }

  .biostack-metrics-row {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
  }
}
```

---

## 5. Modern Component Modernization (Container Queries)

Rather than relying purely on full-viewport dimensions, update modular UI components in subdirectories (e.g., `src/client/components/*/*.css`) to use **Container Queries**. This allows components to adapt seamlessly when placed inside sidebars, cards, or full-width layouts.

```css
/* Example component stylesheet: src/client/components/MetricCard/MetricCard.css */

.metric-card-wrapper {
  container-type: inline-size;
  container-name: metric-card;
  width: 100%;
}

/* Default view for small wrappers/compact displays */
.metric-card {
  display: flex;
  flex-direction: column;
  padding: var(--space-sm);
}

/* Adjust layout when card container width exceeds 350px (e.g. Ultra phones or wide slots) */
@container metric-card (min-width: 350px) {
  .metric-card {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    padding: var(--space-md);
  }
}
```

---

## 6. Directory Migration Step-by-Step

To roll out these updates across the `/Users/robsmith/biostack/src/client` workspace:

1. **Update Central Tokens:**
   - Create or update `/Users/robsmith/biostack/src/client/styles/tokens.css` with the fluid variables detailed in Section 2.
   - Import `tokens.css` at the root entry point (e.g., `index.css` or `App.css`).

2. **Refactor Hardcoded Pixel Values:**
   - Scan all CSS files under `/Users/robsmith/biostack/src/client/**/*.css` for fixed `width`, `padding`, or `font-size` declarations in pixels.
   - Replace fixed font sizes with `clamp()` or `var(--font-size-*)`.
   - Replace fixed `100vh` values with `100dvh` to prevent browser toolbar jumpiness.

3. **Audit Touch Targets:**
   - Check interactive elements (`.btn`, `.nav-link`, `.icon-button`, inputs) and ensure `min-height: var(--touch-target-min)` is applied.

4. **Test Across Targets:**
   - Test using browser dev tools or real devices at the key logical widths:
     - **360px / 375px** (Compact target)
     - **393px / 412px** (Standard target)
     - **430px / 440px** (Ultra target)
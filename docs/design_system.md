# Sport Parking - Premium Design System

## 1. Visual Philosophy
- **Estilo**: Premium, Sobrio, "Broadcast Quality".
- **Inspiración**: UEFA, Premier League, High-end stats dashboards.
- **Principio**: "Menos es más". Jerarquía clara, cero decoración innecesaria.

## 2. Color Palette (Dark Mode Base)

### Backgrounds
- **Primary Background**: `var(--color-bg-primary)` - #020617 (Slate 950) or #050b14 (Deep Night Blue)
- **Secondary Background**: `var(--color-bg-secondary)` - #0f172a (Slate 900) - For cards/panels.
- **Surface**: `var(--color-bg-surface)` - #1e293b (Slate 800) - For inputs/smaller elements.

### Text Levels
- **Text Primary**: `var(--color-text-primary)` - #f8fafc (Slate 50) - High contrast, almost white.
- **Text Secondary**: `var(--color-text-secondary)` - #94a3b8 (Slate 400) - For labels, metadata.
- **Text Muted**: `var(--color-text-muted)` - #64748b (Slate 500) - For placeholders, disabled text.

### Accents
- **Accent Primary (Brand)**: `var(--color-accent-primary)` - #22c55e (Green 500) or #10b981 (Emerald 500) - "Soccer Green". Used for primary actions, active states.
- **Accent Subtle**: `var(--color-accent-subtle)` - #fbbf24 (Amber 400) - "Gold details", very sparing use.
- **Success/Live**: #22c55e
- **Error/Alert**: #ef4444 (Red 500) - Clean red, no gradients.

### Borders
- **Border Subtle**: `var(--color-border-subtle)` - rgba(255, 255, 255, 0.08)
- **Border Strong**: `var(--color-border-strong)` - rgba(255, 255, 255, 0.15)

## 3. Typography
- **Font Family**: 'Inter', sans-serif.
- **Weights**:
  - Regular (400) - Body
  - Medium (500) - Labels, Buttons
  - SemiBold (600) - Headings, Highlights
- **Sizes**:
  - H1: 2rem (32px)
  - H2: 1.5rem (24px)
  - H3: 1.25rem (20px)
  - Body: 0.9375rem (15px)
  - Micro: 0.75rem (12px) - Uppercase labels

## 4. Components & UI Layout

### Cards
- Clean background (Secondary BG).
- 1px Solid border (Subtle Border).
- No heavy drop shadows (maybe very subtle inner glow or spread shadow).
- Padding: Spacious (1.5rem / 24px).

### Buttons
- **Primary**: Solid Accent Color, Black Text (for contrast) or White Text depending on shade. Medium weight. Rectangular with small border-radius (4px-6px).
- **Secondary**: Transparent with border. White text.
- **Ghost**: Text only, accent color on hover.

### Grid
- 4px / 8px baseline grid.
- Consistent spacing tokens (4, 8, 16, 24, 32, 48, 64px).

## 5. Iconography
- Library: Lucide React (already installed).
- Style: Stroke width 1.5px or 2px.
- Color: Usually Secondary Text or White.

## 6. Implementation Notes
- Tailwind v4 `@theme` configuration.
- CSS Variables for easy theming.
- Dark mode default.

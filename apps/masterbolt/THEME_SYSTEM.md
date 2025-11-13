# Theme System Documentation

## Overview

Masterbolt now supports a comprehensive, pluggable theme system with:
- **Light/Dark Modes**: Standard light and dark themes
- **Festival Themes**: Hindu, Korean, US, UK, and Canada festivals
- **Pluggable Architecture**: Easy to add new themes
- **Persistent Storage**: Theme preferences saved in localStorage
- **Default**: Light mode

## Available Themes

### Standard Modes
- ☀️ **Light Mode** (`light-default`) - Default
- 🌙 **Dark Mode** (`dark-default`)

### Hindu Festivals
- 🪔 **Diwali** (`diwali`)
- 🎨 **Holi** (`holi`)
- 🕉️ **Navratri** (`navratri`)

### Korean Festivals
- 🌕 **Chuseok** (`chuseok`)
- 🐉 **Seollal** (`seollal`)
- 🌾 **Dano** (`dano`)

### US Festivals
- 🦃 **Thanksgiving** (`thanksgiving`)
- 🇺🇸 **Independence Day** (`independence-day`)
- 🎃 **Halloween** (`halloween`)

### UK Festivals
- 🎄 **Christmas** (`christmas`)
- 🐰 **Easter** (`easter`)

### Canada Festivals
- 🇨🇦 **Canada Day** (`canada-day`)

## Usage

### Theme Switcher Component

The theme switcher is automatically included in the Navbar. Users can click it to see all available themes organized by category.

### Programmatic Theme Changes

```typescript
import { useTheme } from '~/composables/useTheme'

const { themeId, theme, applyTheme } = useTheme()

// Change theme
applyTheme('diwali')

// Access current theme
console.log(theme.value.name) // "Diwali"
console.log(theme.value.colors.primary) // "#ff6b35"
```

### Using Theme Colors in Components

#### Via CSS Variables (Recommended)

```vue
<template>
  <div style="background-color: var(--theme-bg); color: var(--theme-text);">
    Content
  </div>
</template>
```

#### Via Tailwind Classes

```vue
<template>
  <div class="bg-theme-bg text-theme-text">
    Content
  </div>
</template>
```

#### Via Utility Classes

The system provides utility classes that automatically use theme colors:
- `.btn-primary` - Primary button
- `.btn-secondary` - Secondary button
- `.card` - Card container
- `.input-field` - Input field

## Adding New Themes

1. Open `composables/useTheme.ts`
2. Add your theme to the `themes` object:

```typescript
'my-theme': {
  id: 'my-theme',
  name: 'My Theme',
  emoji: '🎉',
  mode: 'light', // or 'dark'
  category: 'festival', // or 'standard'
  colors: {
    bg: '#ffffff',
    dark: '#f5f5f5',
    card: '#ffffff',
    primary: '#3b82f6',
    secondary: '#10b981',
    accent: '#f59e0b',
    text: '#1f2937',
    textSecondary: '#6b7280',
    border: '#e5e7eb',
    shadow: 'rgba(0, 0, 0, 0.1)'
  }
}
```

3. The theme will automatically appear in the theme switcher!

## Migration from Halloween Classes

Old halloween classes still work for backward compatibility, but you should migrate to:

| Old Class | New Approach |
|-----------|--------------|
| `bg-halloween-bg` | `bg-theme-bg` or `style="background-color: var(--theme-bg)"` |
| `text-halloween-orange` | `style="color: var(--theme-primary)"` |
| `text-halloween-ghost` | `text-theme-text` or `style="color: var(--theme-text)"` |
| `border-halloween-orange` | `style="border-color: var(--theme-primary)"` |

## CSS Variables

All themes expose these CSS variables:
- `--theme-bg`: Background color
- `--theme-dark`: Darker background variant
- `--theme-card`: Card background color
- `--theme-primary`: Primary accent color
- `--theme-secondary`: Secondary accent color
- `--theme-accent`: Accent color
- `--theme-text`: Main text color
- `--theme-text-secondary`: Secondary text color
- `--theme-border`: Border color
- `--theme-shadow`: Shadow color

## Theme Persistence

Theme preferences are automatically saved to `localStorage` with the key `masterbolt-theme`. The theme is restored on page load.

## Default Theme

The default theme is **Light Mode** (`light-default`). This ensures a clean, professional appearance on first visit.

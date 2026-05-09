# DESIGN.md - CRM 3.0 Platinum

Visual language specification for the next generation of TravelCRM. Inspired by Linear and modern high-precision developer tools.

## 1. Visual Theme & Atmosphere
- **Atmosphere**: Professional, focused, and high-precision.
- **Surface Philosophy**: Multi-layered dark mode using subtle borders instead of heavy shadows.
- **Accent Philosophy**: Single vibrant color (Electric Purple) used sparingly for focus and interaction.

## 2. Color Palette
| Name | Hex | HSL | Role |
|------|-----|-----|------|
| Base Black | #09090b | 240 10% 3.9% | App background |
| Surface | #18181b | 240 5% 8% | Cards, Sidebars, Modals |
| Elevated | #27272a | 240 5% 15% | Hover states, Active items |
| Primary | #7c3aed | 262 83% 58% | Primary actions, Active indicators |
| Border | #ffffff10 | 0 0% 100% / 0.1 | Structural separation |
| Text Main | #fafafa | 0 0% 98% | Primary content |
| Text Muted | #a1a1aa | 240 5% 65% | Secondary info, labels |

## 3. Typography
- **Primary Font**: Inter (Sans-serif)
- **Monospace Font**: JetBrains Mono (For IDs, dates, and technical data)
- **Scale**:
  - `h1`: 24px / 1.2 / SemiBold
  - `h2`: 20px / 1.2 / Medium
  - `body`: 14px / 1.5 / Regular
  - `small`: 12px / 1.5 / Regular

## 4. Component Stylings

### Buttons
- **Primary**: Electric Purple background, white text. Subtle 10% glow on hover.
- **Secondary**: Transparent background, 1px white/10% border. Hover: background becomes white/5%.

### Cards
- **Structure**: 1px border (`#ffffff10`), 8px border radius.
- **Interaction**: On hover, border color shifts to white/20% and a subtle "aura" glow (5px blur) appears.

### Status Badges
- **Success**: Emerald text, emerald/10% background, no border.
- **Pending**: Amber text, amber/10% background, no border.
- **Error**: Rose text, rose/10% background, no border.

## 5. Layout Principles
- **Spacing**: 4px base grid.
- **Density**: High density. Standard padding for cards is 16px.
- **Sidebar**: 240px width, collapsible to 64px.

## 6. Depth & Elevation
- **Level 0**: Background (`#09090b`)
- **Level 1**: Surfaces (`#18181b`)
- **Level 2**: Popovers/Modals (`#1c1c1f`) with 20px blur backdrop.

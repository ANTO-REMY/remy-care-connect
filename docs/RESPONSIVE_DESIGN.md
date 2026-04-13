# Responsive Design Patterns

This guide documents the mobile-first responsive patterns used across the frontend.

## Core constants

Use shared constants from `src/components/ui/spacing.constants.ts`:

- `RESPONSIVE_PADDING.card`: `p-3 sm:p-4 md:p-6`
- `RESPONSIVE_PADDING.modal`: `p-4 sm:p-6`
- `RESPONSIVE_PADDING.section`: `px-4 sm:px-6 md:px-8`
- `RESPONSIVE_GRID.twoCol`: `grid-cols-1 sm:grid-cols-2`
- `RESPONSIVE_GRID.threeCol`: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`
- `RESPONSIVE_GRID.fourCol`: `grid-cols-2 md:grid-cols-3 lg:grid-cols-4`

## Foundational component patterns

1. Cards use responsive spacing through shared constants.
2. Dialogs use mobile-safe width: `w-[calc(100%-1rem)] sm:w-full max-w-lg`.
3. Buttons enforce 44px mobile tap targets with `h-11 md:h-10`.
4. Inputs enforce 44px mobile tap targets with `h-11 md:h-10` and `py-2.5 md:py-2`.

## Implemented examples in this codebase

- `src/components/ui/dialog.tsx`: `w-[calc(100%-1rem)] sm:w-full max-w-lg` + `RESPONSIVE_PADDING.modal`
- `src/components/ui/button.tsx`: `h-11 md:h-10` (default/large/icon variants)
- `src/components/ui/input.tsx`: `h-11 md:h-10` with `py-2.5 md:py-2`
- `src/components/mother/EnhancedMotherDashboard.tsx`: tab grid `grid-cols-2 sm:grid-cols-3 md:grid-cols-5`
- `src/components/chw/EnhancedCHWDashboard.tsx`: tab grid `grid-cols-2 md:grid-cols-4`
- `src/components/nurse/EnhancedNurseDashboard.tsx`: tab grid `grid-cols-2 md:grid-cols-4`
- `src/components/PinInput.tsx`: touch-target sizing `h-11 sm:h-12 w-11 sm:w-12`
- `src/components/mother/ModernMotherDashboard.tsx`: table wrapped with `overflow-x-auto` and `min-w-[640px]`

## Breakpoint baseline

- `sm` = 640px
- `md` = 768px
- `lg` = 1024px
- Build mobile-first, then scale up with `sm:`, `md:`, `lg:`.

## Usage guidance

- Prefer mobile-first classes and scale up at `sm`, `md`, and `lg`.
- Reuse constants instead of repeating utility strings.
- Keep layout changes CSS-only unless behavior changes are explicitly required.

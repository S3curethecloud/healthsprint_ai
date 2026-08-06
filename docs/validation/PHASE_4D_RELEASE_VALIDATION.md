# Phase 4D Barcode Scanner Release Validation

## Release scope

Phase 4D adds:

- Cross-browser UPC and EAN camera scanning using ZXing
- Manual barcode entry
- HealthSprint product lookup API
- Open Food Facts response normalization
- Product found, not-found, and provider-error states
- Serving quantity confirmation
- Meal destination selection
- Explicit add-to-meal workflow
- Local persistence of scanned foods

Phase 4D does not add:

- Health Connect
- Native Android packaging
- Cloudflare AI
- Meal-photo recognition
- Medical recommendations

## Static quality gates

- [ ] ESLint passes
- [ ] TypeScript and Next.js production build pass
- [ ] OpenNext Cloudflare build passes
- [ ] `git diff --check` passes
- [ ] No unintended files are modified

## Responsive validation

- [x] 320 px viewport has no horizontal overflow
- [x] 390 px mobile scanner is usable
- [x] 430 px mobile scanner is usable
- [x] 768 px tablet layout is stable
- [x] 1024 px intermediate layout is stable
- [x] 1100 px desktop shell is stable
- [x] 1440 px desktop layout is stable
- [x] 1920 px wide layout remains bounded
- [x] Mobile bottom navigation does not cover scanner controls
- [x] Product and serving cards remain readable on mobile

## Camera and barcode capture

- [x] Camera permission prompt appears
- [x] Camera preview starts after permission approval
- [x] Target overlay appears
- [x] Start Camera is disabled while scanning
- [x] Stop Camera is enabled while scanning
- [x] Stop Camera releases all camera tracks
- [x] Camera-denied state shows manual-entry guidance
- [x] Manual 8-digit barcode entry works
- [x] Manual 12-digit barcode entry works
- [x] Manual 13-digit barcode entry works
- [x] Invalid barcode length is rejected

## Product lookup API

- [ ] Valid found product returns normalized JSON
- [x] Valid missing product returns `not-found`
- [x] Invalid barcode returns HTTP 400
- [ ] Provider failure returns controlled HTTP 502 response
- [x] API responses use `Cache-Control: no-store`
- [ ] Dashboard found-product state renders
- [ ] Dashboard not-found state renders
- [ ] Dashboard provider-error fallback renders
- [ ] No API failure crashes the dashboard

## Serving confirmation and meal logging

- [ ] Product is not automatically logged after lookup
- [ ] Default quantity is 1
- [ ] Quantity 0.5 halves nutrition values
- [ ] Quantity 2 doubles nutrition values
- [ ] Zero quantity is rejected
- [ ] Negative quantity is rejected
- [ ] Meal destination changes correctly
- [ ] Button label reflects selected meal
- [ ] Product is added to selected meal
- [ ] Product is immediately selected/logged
- [ ] Daily calories update immediately
- [ ] Daily macros update immediately
- [ ] Duplicate logging creates distinct entries
- [ ] Logged items persist after refresh
- [ ] Missing calorie data blocks direct logging
- [ ] Dark dropdown styling renders correctly

## Accessibility

- [ ] Scanner controls are keyboard reachable
- [ ] Enter activates buttons
- [ ] Select controls work with keyboard
- [ ] Quantity control has an accessible label
- [ ] Lookup loading state is announced
- [ ] Lookup error state is announced
- [ ] Success message is announced
- [ ] Focus outlines are visible
- [ ] Reduced-motion mode remains usable
- [ ] No scanner action requires hover

## PWA and offline behavior

- [ ] Manifest loads
- [ ] Service worker activates
- [ ] `healthsprint-ai-shell-v5` exists
- [ ] Application shell loads offline
- [ ] Previously logged local foods remain available offline
- [ ] Manual food entry remains available offline
- [ ] Camera component renders offline
- [ ] External nutrition lookup fails gracefully offline
- [ ] Offline lookup failure does not erase existing local data

## Cloudflare preview

- [ ] OpenNext preview starts
- [ ] Scanner UI renders in preview
- [ ] Product API works in preview
- [ ] Found and not-found lookup states work
- [ ] Serving confirmation works
- [ ] Meal logging persists
- [ ] No blocking browser-console errors

## Production deployment

- [ ] Cloudflare deployment succeeds
- [ ] Production URL loads
- [ ] Production camera permission works over HTTPS
- [ ] Production barcode capture works
- [ ] Production product API works
- [ ] Production serving workflow works
- [ ] Production PWA shell works offline
- [ ] No blocking production-console errors
- [ ] Git working tree remains clean after deployment

## Release evidence

- Branch:
- Commit:
- Cloudflare URL:
- Cloudflare Version ID:
- Worker startup time:
- Validation date:

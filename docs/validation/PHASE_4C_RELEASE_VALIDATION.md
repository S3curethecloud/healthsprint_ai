# Phase 4C Release Validation

## Build quality

- [x] `npm run lint` passes with zero errors and warnings
- [x] `npm run build` completes successfully
- [x] No unexpected TypeScript failures
- [x] Working tree contains only intended Phase 4C changes

## Visual assets

- [x] Desktop application logo renders correctly
- [x] PWA PNG icons render correctly

## Desktop regression

- [x] 1024 px layout has no horizontal overflow
- [x] 1440 px desktop navigation works
- [x] 1920 px content width remains controlled
- [x] Top application bar remains sticky
- [x] Activity column remains usable while scrolling
- [x] Today, Meals, Activity, and Progress navigation works
- [x] Active desktop navigation state is accurate

## Mobile regression

- [x] 320 px layout has no horizontal overflow
- [x] 366 px layout remains usable
- [x] 390 px layout remains usable
- [x] 430 px layout remains usable
- [x] Mobile bottom navigation remains visible
- [x] Today, Meals, Activity, and Progress navigation works
- [x] Meal groups collapse and expand
- [x] Inputs remain visible above the bottom navigation
- [x] Buttons and fields remain touch accessible

## Functional regression

- [x] Meal selections update calories and macros
- [x] Custom meal entry works
- [x] Water controls work
- [x] Step entry works
- [x] Weight entry works
- [x] Workout completion works
- [x] Reset confirmation works
- [x] Local state survives reload

## Accessibility

- [x] Tab order is logical
- [x] Focus indicators remain visible
- [x] Enter activates buttons
- [x] Space toggles checkboxes
- [x] Reduced-motion preference is respected
- [x] No workflow depends on hover

## PWA and offline behavior

- [x] Manifest loads successfully
- [z] 192 × 192 icon loads
- [z] 512 × 512 icon loads
- [z] Maskable icon loads
- [z] Service worker registers and controls the page
- [z] `healthsprint-ai-shell-v5` exists
- [z] Offline shell loads successfully
- [z] Offline mode is disabled after testing

## Cloudflare release

- [ ] OpenNext build succeeds
- [ ] Wrangler deployment succeeds
- [ ] Production URL loads
- [ ] Production navigation works
- [ ] Production PWA assets load
- [ ] Production service worker activates
- [ ] No console-blocking errors

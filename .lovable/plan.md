

## Plan: Product images — cover + lightbox zoom

### Changes

**`src/pages/ProductDetail.tsx`**

1. **`object-contain` → `object-cover`** on both mobile (line 176) and desktop (line 203) main images
2. **Add lightbox state**: `lightboxOpen` + `lightboxIndex` state variables
3. **Click to open**: Clicking any image (mobile main, mobile thumbnails, desktop gallery) opens a fullscreen lightbox overlay
4. **Lightbox component** (inline in the file or extracted):
   - Fixed fullscreen overlay with dark backdrop (`bg-black/90`)
   - Large image displayed with `object-contain` (so full image is visible when zoomed)
   - Left/right navigation arrows + dot indicators
   - Close button (X) top-right
   - Click backdrop to close
   - Keyboard support (Escape to close, arrow keys to navigate)

### Files affected
- `src/pages/ProductDetail.tsx`


## Center category hero on mobile

Edit `src/components/category/CategoryHero.tsx` to center align everything on mobile while keeping desktop left-aligned.

### Changes
- Container: add `items-center text-center md:items-start md:text-left` to the flex column.
- Breadcrumb (`nav`): add `justify-center md:justify-start`.
- Title (`h1`): centered via parent `text-center`; keep `max-w-3xl` with `mx-auto md:mx-0`.
- Stats chips wrapper: change to `justify-center md:justify-start`. Keep `flex-wrap` so the 3rd chip wraps to its own line below the first two on narrow screens (the first two chips fit side-by-side; a third wraps under, centered).

Desktop layout remains unchanged.

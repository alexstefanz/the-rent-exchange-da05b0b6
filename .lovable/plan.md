

## Plan: Redesign homepage category cards to match reference image

### Overview
Redesign the popular categories section on the homepage to display each category inside a bordered card container with: icon in a rounded circle, category title, and listing count (number of announcements).

### Changes

**1. Update `src/pages/Index.tsx`** -- Category section
- Change grid from 9 columns to 4 columns (matching reference: 4 per row)
- Wrap each category in a bordered card container with rounded corners
- Icon in a soft orange circle (existing `bg-primary/10` + `rounded-full`)
- Category name below the icon, bold
- Listing count below the name (e.g. "234 anunturi")
- Fetch product counts per category from the database using a query on the `products` table grouped by `category`

**2. Add product count query**
- Use `useQuery` to fetch counts per category from the `products` table (grouped by category field)
- Display actual count or fallback to subcategory count if no products exist yet

### Layout (matching reference image)
```text
┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│    (icon)    │  │    (icon)    │  │    (icon)    │  │    (icon)    │
│   Title      │  │   Title      │  │   Title      │  │   Title      │
│  X anunturi  │  │  X anunturi  │  │  X anunturi  │  │  X anunturi  │
└─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘
```

### Card styling
- Border: `border border-border rounded-xl`
- Padding: `p-6`
- Hover: subtle shadow/scale
- Icon container: `h-14 w-14 rounded-full bg-primary/10` with primary-colored icon
- Grid: `grid-cols-2 sm:grid-cols-3 md:grid-cols-4` (2 on mobile, 4 on desktop)

### Files affected
- `src/pages/Index.tsx` -- redesign category cards layout and add product count fetch


# AI Caption Generator - Design Guidelines

## Design Approach

**Selected Approach**: Hybrid - Modern SaaS Design System inspired by Linear, Vercel, and Stripe

**Key Design Principles**:
- Tech-forward minimalism with purposeful gradients and subtle depth
- Data-first interface prioritizing content over chrome
- Polished micro-interactions that feel intelligent and responsive
- Clean information hierarchy with generous breathing room

## Typography

**Font Stack**:
- Primary: Inter (Google Fonts) - All UI elements, body text
- Monospace: JetBrains Mono (Google Fonts) - Generated captions for differentiation

**Hierarchy**:
- Hero Headline: text-5xl md:text-6xl font-bold tracking-tight
- Section Headers: text-3xl md:text-4xl font-semibold
- Card Titles: text-xl font-semibold
- Body Text: text-base leading-relaxed
- Captions Display: text-sm md:text-base font-mono
- Labels/Meta: text-sm font-medium tracking-wide uppercase text-opacity-70

## Layout System

**Spacing Primitives**: Use Tailwind units of 2, 4, 6, 8, 12, 16, 20, 24 for consistent rhythm

**Container Strategy**:
- App Container: max-w-7xl mx-auto px-4 md:px-6
- Content Sections: py-12 md:py-16 lg:py-20
- Component Padding: p-6 md:p-8
- Card Spacing: gap-4 md:gap-6

## Component Library

### Navigation
- Sticky header with backdrop blur effect (backdrop-blur-md bg-opacity-90)
- Logo left, CTA button right
- Height: h-16 md:h-20
- Shadow on scroll: shadow-lg transition

### Hero Section
- Full-width gradient background (subtle tech gradient - dark to darker with accent hints)
- Centered layout with max-w-4xl
- Headline + subheadline + primary CTA
- Height: min-h-[600px] flex items-center
- Include abstract tech visualization image (geometric shapes, AI-themed illustration) as background with overlay

### Upload Zone
- Large drag-and-drop area with dashed border (border-2 border-dashed rounded-2xl)
- Minimum height: min-h-[400px]
- Hover state: Subtle scale and border color transition
- Active state: Background fill with opacity
- Grid preview of uploaded images: grid grid-cols-2 md:grid-cols-4 gap-4
- Each thumbnail: aspect-square rounded-xl overflow-hidden with remove button overlay

### Style/Tone Selector
- Horizontal pill group on desktop, wrap on mobile
- Each option: Rounded-full button with icon + label
- Options: Professional (briefcase icon), Friendly (smile icon), Funny (laugh icon), Minimalist (minus icon), Inspirational (sparkles icon), Casual (coffee icon)
- Active state: Filled background with high contrast
- Layout: flex flex-wrap gap-3

### Context Input
- Textarea with floating label design
- Rounded-xl border with focus ring
- Placeholder: "Add context to help AI understand your images better..."
- Height: min-h-[120px]

### Caption Results
- Cards grid: grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6
- Each card: Rounded-2xl with subtle border and shadow-sm
- Card content: Image thumbnail at top (aspect-video), caption text in monospace below
- Copy button: Top-right corner with icon, hover shows "Copy" tooltip
- Regenerate option per caption with refresh icon

### CTA Buttons
- Primary: Rounded-full px-8 py-3 font-semibold shadow-lg
- On hero image: backdrop-blur-md bg-white/10 border border-white/20
- Secondary: Outlined style with border-2
- Icons: Use Heroicons via CDN

### Footer
- Three-column layout on desktop (Product links, Company, Social)
- Single column stack on mobile
- Background: Subtle gradient matching hero
- Padding: py-16 md:py-20

## Images

**Hero Background Image**:
- Abstract AI/tech visualization (neural network patterns, geometric shapes, gradient meshes)
- Placement: Full-width background with dark overlay (opacity-60)
- Purpose: Establish modern, tech-forward brand personality

**Thumbnail Previews**:
- User-uploaded images shown in grid
- aspect-square or aspect-video based on upload
- Rounded corners (rounded-xl)

## Animations

**Subtle Micro-interactions Only**:
- Button hover: Scale 102% with smooth transition
- Card hover: Lift effect (translateY -4px) with shadow increase
- Upload zone: Gentle pulse animation on drag-over
- Copy button: Success checkmark animation on click
- Page transitions: Fade-in with slight slide-up (50px) on load

No scroll-triggered animations or excessive motion.

## Accessibility

- Maintain WCAG AA contrast ratios throughout
- Focus states: 2px ring with offset for all interactive elements
- Keyboard navigation support for all controls
- ARIA labels for icon-only buttons
- Screen reader announcements for caption generation status
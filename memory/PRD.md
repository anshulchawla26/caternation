# CaterNation — Luxury Catering Website (PRD)

## Original Problem
World-class, luxury/Michelin-star style catering website for brand "CaterNation" (Amritsar, Punjab). Image-first, minimal, premium hospitality. Objective: WOW visitors and drive Call/WhatsApp conversions — NOT online selling. Explicitly NO pricing, packages, booking, get-quote, enquiry forms, event management, vendor portal, or customer login.

## Stack & Architecture
- Backend: FastAPI + MongoDB (motor). All routes under `/api`.
- Frontend: React 19 + Tailwind + shadcn/ui + framer-motion + lenis (smooth scroll).
- Auth: JWT Bearer (localStorage `cn_token`). Admin seeded on startup from env.
- CMS: single MongoDB doc `site.{key:'site_content'}`; public GET `/api/content`, admin PUT `/api/content`, POST `/api/content/reset`.

## Design
- White bg, warm beige sections (#F9F6F0), black text, champagne gold accent (#C7A253). Playfair Display (headings) + Inter (body). Design guidelines at /app/design_guidelines.json.

## Personas
- Prospective clients (weddings/corporate/private events) browsing on mobile → tap Call/WhatsApp.
- Owner/admin editing all content visually via /admin.

## Implemented (2026-07-27)
- Kinetic hero (masked line reveal + parallax) with Call/WhatsApp CTAs.
- Sections: Hero, Marquee, About (numbered manifesto), Services (6 image cards), Signature Dishes (alternating), Live Counters (dark showcase), Gallery (masonry + category filters + lightbox + lazy load), Testimonials, Contact (2 owner cards Vivek/Jatin + Google Maps + hours + Instagram).
- Always-visible floating Call + WhatsApp text buttons (primary +91 6284649883).
- Header with glass on scroll, Instagram link, mobile menu.
- Full CMS admin (/admin): brand/colors/fonts, contact/owners, hero, marquee, about, services, dishes, counters, gallery (columns/categories/images), testimonials, section order + show/hide.
- Backend regression tests: /app/backend/tests/test_caternation_api.py (7/7 pass). Full e2e frontend passed 100%.

## Credentials
admin@caternation.com / CaterNation@2025 (see /app/memory/test_credentials.md)

## Backlog / Next
- P1: Image upload in CMS (currently image URLs only).
- P1: Real Instagram feed embed (currently link only, per user request).
- P2: SEO — sitemap, JSON-LD LocalBusiness schema, OG images.
- P2: Section drag-and-drop (currently up/down arrows).
- P2: Performance — responsive image srcset, blur-up placeholders.

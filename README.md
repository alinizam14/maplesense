# Maple Sense website

A static site: HTML, CSS and plain JavaScript. No build step and no dependencies.

## Run it on Windows

Opening `index.html` by double-click works. A local server is better, because it matches how the site will behave once hosted.

**Option A: Python** (if installed)
1. Open the project folder in File Explorer, click the address bar, type `cmd`, press Enter.
2. Run `python -m http.server 8000`
3. Open http://localhost:8000

**Option B: Node**
1. In the same folder, run `npx serve .`
2. Open the address it prints.

## Structure

```
index.html
css/style.css              brand tokens at the top of the file
js/scroll-animation.js     112-frame canvas sequence engine
js/main.js                 nav, solutions index, reveals
assets/frames/             the 112 original frames, unchanged (ezgif-frame-001.jpg ... 112.jpg)
assets/images/             detail crops cut from frames 6, 38, 76, 100
assets/fonts/              put the licensed font file here
```

## How the scroll-start bug is avoided

- The hero IS the sequence: one `<section id="top">` that is the first element in `<main>`, at document offset 0.
- Inside it, one `position: sticky` stage holds a single canvas. There is no JS pin-spacer, so nothing can be doubled or offset.
- Progress is read from `getBoundingClientRect()` on every frame, so no cached measurement can go stale.
- Scroll 0 to 92% maps to frames 1 to 112. The last 8% holds frame 112 while the stage fades to Forest Green, then the next section scrolls in.
- Total sequence length is `--scrub-length` in `style.css` (default 420vh). Raise it for slower playback.

## Brand (from the MapleSense Brand Guidelines)

- **Colours:** Deep Green `#0C2416`, Forest Green `#184E3A`, Warm Orange `#DF5917`, Light Grey `#E8E8E8` (tokens at the top of `css/style.css`). The earlier Deep Green mix-up is resolved.
- **Type:** Inter (400, 600, 800), self-hosted in `assets/fonts/`. Headlines are Inter ExtraBold, uppercase, as in the guideline.
- **Logo:** vector artwork taken from the guideline PDF. Inline sprite at the top of `index.html` (mono light on dark), plus `assets/logo-full.svg` and `assets/logo-icon.svg` (favicon).
- **Pattern:** `assets/pattern-on-green.svg`, `-on-deep.svg`, `-on-grey.svg`, built from the maple crown at the guideline opacities (20% on green, 5% on grey).
- The hero film (`js/scroll-animation.js`, canvas, sticky stage) is unchanged; only its CSS look was updated.

## Motion layer (`css/fx.css`, `js/fx.js`)

Delete the two `fx` lines in `index.html` to switch it off; the hero script is never touched.
Preloader with counter, masked word-by-word headline reveals, scroll-lit statement, image unmask on the drawer photo, floating product preview on the Solutions rows, cursor dot, header that hides on scroll down, velocity-driven footer marquee, light film grain. Everything respects reduced-motion; cursor and preview are off on touch devices.

## Page structure

1. **Hero**: washroom cleaning, the 112-frame scroll film (unchanged).
2. **Statement**: light grey, words light up as you scroll.
3. **Washroom cleaning** (`#engineering`) on Deep Green.
4. **Our solutions** (`#solutions`) on Forest Green, hover a row to preview the product.
5. **About** (`#philosophy`) on Warm Orange, and **Contact** (`#contact`) with the giant logo footer.

The earlier "How it works" and "Product" sections were removed so the site is not only about washroom cleaning.

## Content to confirm before launch

- **Solutions images:** four of the five (`solution-smart-washroom`, `-smart-waste`, `-foot-dryer`, `-shelf-label`) were cropped from a screenshot of the existing site and are only about 240px wide originally (upscaled 2x). Replace them with the original high-resolution photos, keeping the same filenames. `solution-self-clean.jpg` is cut from the supplied footage.
- **Solutions descriptions** were written only from what the photos show. Please check each one.
- The "Enquire" links are `mailto:` links with the product name in the subject. Replace `enquiries@maplesense.example` and the phone number (search the HTML for `maplesense.example` and `PLACEHOLDER`).
- The About text is placeholder copy; swap in Maple Sense's own words. The wordmark is plain text until a logo file is supplied.
- Hero lines ("The future cleans itself", and so on) are marketing copy, not specifications.
- The footage does not show how the pan itself is cleaned, so the site makes no claim about it.

## Decisions

- **No GSAP/ScrollTrigger.** A native sticky stage plus a rAF scroll handler does the same job with fewer failure points, especially on mobile browsers, and works offline. A GSAP drop-in is straightforward if you prefer it.
- **No Three.js.** The 112 frames are a flat 2D sequence, not a 3D model, so a 3D scene would add weight without adding truth. If a real 3D model is supplied later, it can be added then.

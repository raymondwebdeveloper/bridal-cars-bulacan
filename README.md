# Bridal Cars Bulacan — Three-scene cinematic hero

## Deploy to GitHub Pages
Upload the contents of this folder (not the enclosing folder) to the root of your repository. In Settings → Pages, select Deploy from branch / main / (root). Ensure `index.html`, `css/`, `js/`, and `assets/` retain their paths.

## How it works
Scene 1 → scene 2: `forward-1.mp4`, scene 2 → scene 3: `forward-2.mp4`.
Backwards: `reverse-2.mp4` then `reverse-1.mp4`. These are ACTUAL pre-rendered reversed video tracks, so ordinary browser playback is used for both directions. No frame-by-frame JavaScript seeking. Each scene pauses on a still extracted from the actual combined footage.

Controls: wheel / trackpad gestures, touch swipe, Next / Back arrows, keyboard left/right. At Scene 3, scroll down normally to see the rest of the site. At Scene 1, scroll upward normally. During playback, additional scroll events are ignored.

## Customize
- Update contact Facebook link inside `index.html` (currently `https://www.facebook.com/`).
- Update copy / package inclusions with confirmed information.
- Scene background stills: assets/images/still-[1-3].jpg
- 4 clips in assets/video (keep names unchanged).

## Browser behavior
Modern Chromium and Firefox should play the H.264 MP4 files. Browser rendering and codec behavior vary. Reduced-motion preference disables floating petals, but the cinematic video can still be started by choice. Autoplay is not used. A decent connection is needed for the first load, especially on mobile. Offline opening as file:// may work but use a localhost web server for reliable testing.

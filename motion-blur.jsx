/* global gsap */

/* ==================================================================== *
 *  Motion blur for element / component transitions.                     *
 *                                                                       *
 *  fxMotionBlur(el, opts) blurs an element in proportion to how fast it  *
 *  is actually MOVING / MORPHING this frame, and clears to crisp the     *
 *  moment it settles. Because it reads the element's real per-frame      *
 *  motion (position + size delta) it stays visible for the whole travel  *
 *  of a morph or a transition — not just a flash at the start — and it   *
 *  is scoped to that one element, never the page/scroll as a whole.      *
 *                                                                       *
 *  Call it when a transition BEGINS (hover enter/leave, a morph start);  *
 *  it tracks until the element stops, then removes itself.               *
 *                                                                       *
 *    k    — blur px per px-of-motion this frame (strength)               *
 *    max  — clamp on the blur radius                                     *
 * ==================================================================== */
(function () {
  // Motion blur removed — fxMotionBlur is now a no-op so every call site
  // (hero cards, showcase covers, etc.) renders crisp with no velocity blur.
  window.fxMotionBlur = function fxMotionBlur() {};
})();

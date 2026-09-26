import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import Lenis from "lenis";

import { getLocale } from "../i18n/locale";
import type { Locale } from "../i18n/translations";
import { CITY_DIMENSIONS, drawCity, progressState, sampleModel, windowAt } from "./city";
import { formatContributions, formatDay } from "./format";

gsap.registerPlugin(ScrollTrigger, SplitText);

const REVEAL_SHARE = 0.78;
const ZOOM_HOUSE = 10;

function prefersReducedMotion(): boolean {
  return matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function hasFinePointer(): boolean {
  return matchMedia("(pointer: fine)").matches;
}

function setupSmoothScroll(): void {
  const lenis = new Lenis({ duration: 1.1, easing: (t) => 1 - (1 - t) ** 4 });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

function createCityPainter(canvas: HTMLCanvasElement, root: ParentNode, locale: Locale) {
  const date = root.querySelector<HTMLElement>("[data-counter-date]");
  const total = root.querySelector<HTMLElement>("[data-counter-total]");
  let lastLit = -1;

  return (fraction: number): void => {
    const state = progressState(sampleModel, fraction);
    if (state.litDays === lastLit) return;
    lastLit = state.litDays;
    drawCity(canvas, sampleModel, fraction, locale);
    if (date) date.textContent = formatDay(state.date, locale);
    if (total) total.textContent = formatContributions(state.contributions, locale);
  };
}

function setupWindowTooltip(canvas: HTMLCanvasElement, frame: HTMLElement, locale: Locale): void {
  const tooltip = frame.querySelector<HTMLElement>("[data-tooltip]");
  const focus = frame.querySelector<HTMLElement>("[data-window-focus]");
  if (!tooltip || !focus) return;

  const hide = (): void => {
    tooltip.hidden = true;
    focus.hidden = true;
  };

  canvas.addEventListener("pointermove", (event) => {
    const rect = canvas.getBoundingClientRect();
    const scale = CITY_DIMENSIONS.width / rect.width;
    const hit = windowAt(
      sampleModel,
      CITY_DIMENSIONS,
      (event.clientX - rect.left) * scale,
      (event.clientY - rect.top) * scale,
    );
    if (!hit) return hide();

    const frameRect = frame.getBoundingClientRect();
    const offsetX = rect.left - frameRect.left;
    const offsetY = rect.top - frameRect.top;
    focus.style.transform = `translate(${offsetX + hit.x / scale}px, ${offsetY + hit.y / scale}px)`;
    focus.style.width = `${hit.width / scale}px`;
    focus.style.height = `${hit.height / scale}px`;
    tooltip.textContent = `${formatDay(hit.date, locale)} · ${formatContributions(hit.count, locale)}`;
    tooltip.style.transform = `translate(${offsetX + (hit.x + hit.width / 2) / scale}px, ${offsetY + hit.y / scale}px)`;
    tooltip.hidden = false;
    focus.hidden = false;
  });
  canvas.addEventListener("pointerleave", hide);
}

function setupMagnetic(root: ParentNode): void {
  if (!hasFinePointer()) return;
  for (const element of root.querySelectorAll<HTMLElement>("[data-magnetic]")) {
    const toX = gsap.quickTo(element, "x", { duration: 0.5, ease: "power3.out" });
    const toY = gsap.quickTo(element, "y", { duration: 0.5, ease: "power3.out" });
    element.addEventListener("pointermove", (event) => {
      const rect = element.getBoundingClientRect();
      toX((event.clientX - rect.left - rect.width / 2) * 0.35);
      toY((event.clientY - rect.top - rect.height / 2) * 0.35);
    });
    element.addEventListener("pointerleave", () => {
      toX(0);
      toY(0);
    });
  }
}

function revealIntro(root: ParentNode): void {
  const headline = root.querySelector<HTMLElement>("[data-split]");
  if (!headline) return;
  gsap.set(headline, { opacity: 1 });
  const split = SplitText.create(headline, { type: "words", mask: "words" });
  const timeline = gsap.timeline({ defaults: { ease: "expo.out" } });
  timeline
    .from(split.words, { yPercent: 110, duration: 1.3, stagger: 0.06 })
    .from("[data-intro-fade]", { opacity: 0, y: 24, duration: 1, stagger: 0.12 }, "-=0.9");
}

function revealOnEnter(root: ParentNode): void {
  for (const title of root.querySelectorAll<HTMLElement>("[data-reveal-lines]")) {
    const split = SplitText.create(title, { type: "lines", mask: "lines" });
    gsap.from(split.lines, {
      yPercent: 105,
      duration: 1.1,
      stagger: 0.08,
      ease: "expo.out",
      scrollTrigger: { trigger: title, start: "top 85%" },
    });
  }
  for (const group of root.querySelectorAll<HTMLElement>("[data-reveal-group]")) {
    gsap.from(group.children, {
      opacity: 0,
      y: 32,
      duration: 1,
      stagger: 0.12,
      ease: "power3.out",
      scrollTrigger: { trigger: group, start: "top 80%" },
    });
  }
}

function setupYear(root: ParentNode, paint: (fraction: number) => void): void {
  const section = root.querySelector<HTMLElement>("[data-year]");
  const frame = root.querySelector<HTMLElement>("[data-city-frame]");
  const hint = root.querySelector<HTMLElement>("[data-scroll-hint]");
  if (!section || !frame) return;

  const houseCenter = ((ZOOM_HOUSE + 0.5) / 12) * 100;
  gsap.set(frame, { transformOrigin: `${houseCenter}% 70%` });

  const timeline = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: "top top",
      end: "+=260%",
      pin: true,
      pinSpacing: true,
      scrub: 0.6,
      onUpdate: (self) => paint(Math.min(1, self.progress / REVEAL_SHARE)),
    },
  });
  const chrome = section.querySelectorAll("[data-year-chrome]");
  timeline
    .to({}, { duration: REVEAL_SHARE })
    .to(frame, { scale: 3.2, opacity: 0, ease: "power2.in", duration: 1 - REVEAL_SHARE })
    .to(chrome, { opacity: 0, ease: "power1.in", duration: (1 - REVEAL_SHARE) * 0.6 }, "<");

  if (hint) {
    gsap.to(hint, { opacity: 0, scrollTrigger: { trigger: section, start: "top 90%", end: "top 40%", scrub: true } });
  }
}

function setupAnatomy(root: ParentNode): void {
  const section = root.querySelector<HTMLElement>("[data-anatomy]");
  if (!section) return;
  const windows = section.querySelectorAll<SVGRectElement>("[data-window]");
  const notes = section.querySelectorAll<HTMLElement>("[data-note]");

  const timeline = gsap.timeline({
    scrollTrigger: { trigger: section, start: "top 70%", end: "center center", scrub: 0.8 },
  });
  timeline
    .from(section.querySelector("[data-house]"), { opacity: 0, scale: 0.92, duration: 0.3, ease: "power2.out" })
    .from(windows, { opacity: 0, duration: 0.05, stagger: { each: 0.012, from: "start" } }, "<0.1")
    .from(notes, { opacity: 0, x: 24, duration: 0.2, stagger: 0.15 }, "<0.1");
}

export function mountLanding(root: ParentNode = document): void {
  const locale = getLocale();
  const canvas = root.querySelector<HTMLCanvasElement>("[data-city]");
  const frame = root.querySelector<HTMLElement>("[data-city-frame]");
  if (!canvas || !frame) return;

  const paint = createCityPainter(canvas, root, locale);
  setupWindowTooltip(canvas, frame, locale);

  if (prefersReducedMotion()) {
    paint(1);
    for (const element of root.querySelectorAll<HTMLElement>("[data-split]")) element.style.opacity = "1";
    return;
  }

  paint(0);
  setupSmoothScroll();
  document.fonts.ready.then(() => {
    revealIntro(root);
    revealOnEnter(root);
    setupYear(root, paint);
    setupAnatomy(root);
    setupMagnetic(root);
    ScrollTrigger.refresh();
  });
}

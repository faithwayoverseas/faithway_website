import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export const revealAnimation = (element: string | HTMLElement, delay: number = 0) => {
  return gsap.from(element, {
    y: 50,
    opacity: 0,
    duration: 1,
    ease: "power3.out",
    delay,
    scrollTrigger: {
      trigger: element,
      start: "top 85%",
    },
  });
};

export const staggerReveal = (elements: string | HTMLElement[], stagger: number = 0.2) => {
  return gsap.from(elements, {
    y: 30,
    opacity: 0,
    duration: 1,
    ease: "power3.out",
    stagger,
    scrollTrigger: {
      trigger: Array.isArray(elements) ? elements[0] : elements,
      start: "top 85%",
    },
  });
};

export const parallaxEffect = (element: string | HTMLElement, speed: number = 0.5) => {
  return gsap.to(element, {
    y: () => -ScrollTrigger.maxScroll(window) * speed,
    ease: "none",
    scrollTrigger: {
      trigger: element,
      start: "top bottom",
      end: "bottom top",
      scrub: true,
    },
  });
};

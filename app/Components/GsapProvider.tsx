"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function GsapProvider() {
  const pathname = usePathname();

  useEffect(() => {
    const context = gsap.context(() => {
      const header = document.querySelector("header nav");
      if (!header || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        return;
      }

      gsap.fromTo(
        header,
        { autoAlpha: 0, y: -12 },
        { autoAlpha: 1, y: 0, duration: 0.6, ease: "power3.out" }
      );
    });

    return () => context.revert();
  }, []);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const main = document.querySelector("main");
    if (!main) return;

    const context = gsap.context(() => {
      if (main.firstElementChild) {
        gsap.fromTo(
          main.firstElementChild,
          { autoAlpha: 0, y: 18 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.65,
            ease: "power3.out",
            clearProps: "opacity,visibility,transform",
          }
        );
      }
    }, main);

    let entranceTarget = main.firstElementChild;
    const processed = new WeakSet<HTMLElement>();
    const animateScrollElements = () => {
      const currentEntranceTarget = main.firstElementChild;
      if (currentEntranceTarget && currentEntranceTarget !== entranceTarget) {
        entranceTarget = currentEntranceTarget;
        context.add(() => {
          gsap.fromTo(
            currentEntranceTarget,
            { autoAlpha: 0, y: 18 },
            {
              autoAlpha: 1,
              y: 0,
              duration: 0.65,
              ease: "power3.out",
              clearProps: "opacity,visibility,transform",
            }
          );
        });
      }

      main.querySelectorAll<HTMLElement>("[data-animate]").forEach((element) => {
        if (processed.has(element)) return;
        processed.add(element);
        context.add(() => {
          gsap.fromTo(
            element,
            { autoAlpha: 0, y: 22 },
            {
              autoAlpha: 1,
              y: 0,
              duration: 0.7,
              ease: "power3.out",
              clearProps: "opacity,visibility,transform",
              scrollTrigger: {
                trigger: element,
                start: "top 88%",
                once: true,
              },
            }
          );
        });
      });

      main.querySelectorAll<HTMLElement>("[data-animate-group]").forEach((group) => {
        if (processed.has(group) || group.children.length === 0) return;
        processed.add(group);
        const items = Array.from(group.children);
        context.add(() => {
          gsap.fromTo(
            items,
            { autoAlpha: 0, y: 18 },
            {
              autoAlpha: 1,
              y: 0,
              duration: 0.6,
              stagger: 0.09,
              ease: "power3.out",
              clearProps: "opacity,visibility,transform",
              scrollTrigger: {
                trigger: group,
                start: "top 88%",
                once: true,
              },
            }
          );
        });
      });
    };

    animateScrollElements();
    const observer = new MutationObserver(animateScrollElements);
    observer.observe(main, { childList: true, subtree: true });

    const refreshFrame = requestAnimationFrame(() => ScrollTrigger.refresh());

    return () => {
      cancelAnimationFrame(refreshFrame);
      observer.disconnect();
      context.revert();
    };
  }, [pathname]);

  return null;
}

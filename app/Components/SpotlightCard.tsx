"use client";

import type { HTMLAttributes, PointerEvent as ReactPointerEvent, ReactNode } from "react";

interface SpotlightCardProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
}

export default function SpotlightCard({
  children,
  className = "",
  onPointerMove,
  onPointerLeave,
  ...props
}: SpotlightCardProps) {
  const handlePointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    onPointerMove?.(event);
    if (event.pointerType !== "mouse") return;

    const bounds = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty("--spotlight-x", `${event.clientX - bounds.left}px`);
    event.currentTarget.style.setProperty("--spotlight-y", `${event.clientY - bounds.top}px`);
  };

  const handlePointerLeave = (event: ReactPointerEvent<HTMLElement>) => {
    event.currentTarget.style.removeProperty("--spotlight-x");
    event.currentTarget.style.removeProperty("--spotlight-y");
    onPointerLeave?.(event);
  };

  return (
    <article
      {...props}
      className={`spotlight-card ${className}`}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      {children}
    </article>
  );
}

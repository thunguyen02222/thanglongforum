import React from 'react';
import LazyHydrateLib from 'react-lazy-hydration';

export type LazyHydrateProps = {
  ssrOnly?: boolean;
  whenIdle?: boolean;
  whenVisible?: boolean | IntersectionObserverInit;
  on?: keyof HTMLElementEventMap | (keyof HTMLElementEventMap)[];
  children: React.ReactElement;
};

/**
 * Re-export LazyHydrate from react-lazy-hydration for consistent usage.
 * Use whenIdle to hydrate during browser idle (reduces TBT).
 * Use whenVisible to hydrate when element enters viewport (IntersectionObserver).
 * Use on="click" (or array) to hydrate on user interaction.
 * Use ssrOnly to skip hydration (static content only).
 */
export const LazyHydrate = LazyHydrateLib as React.FC<LazyHydrateProps>;

export default LazyHydrate;

import React, { useState, useEffect } from 'react';
import clsx from 'clsx';

export const PLATFORM_LOGO_SRC = '/brand/logo.png';

/**
 * Platform logo; optional tenant URL override with fallback on error.
 * @param {string} [props.logoSrc] - If set and looks like http(s), try this first (tenant branding).
 * @param {'default'|'sidebar'} [props.variant] - sidebar: max height for narrow column
 * @param {boolean} [props.compact] - narrower logo (collapsed sidebar)
 */
const AppLogo = ({
  logoSrc = null,
  className = '',
  imgClassName = '',
  alt = 'DuesAccountant',
  variant = 'default',
  compact = false
}) => {
  const [useFallback, setUseFallback] = useState(false);

  const tryTenant =
    logoSrc && typeof logoSrc === 'string' && /^https?:\/\//i.test(logoSrc.trim());
  const resolvedSrc =
    tryTenant && !useFallback ? logoSrc.trim() : PLATFORM_LOGO_SRC;

  useEffect(() => {
    setUseFallback(false);
  }, [logoSrc]);

  const sizeCls =
    variant === 'sidebar'
      ? compact
        ? 'max-h-8 max-w-9 w-auto object-contain object-center'
        : 'max-h-9 w-auto max-w-[160px] object-contain object-left'
      : 'h-10 sm:h-11 w-auto max-w-[min(100%,280px)] object-contain object-left';

  return (
    <span className={clsx('inline-flex items-center', className)}>
      <img
        src={resolvedSrc}
        alt={alt}
        className={clsx(sizeCls, imgClassName)}
        onError={() => {
          if (tryTenant && !useFallback) setUseFallback(true);
        }}
        decoding="async"
      />
    </span>
  );
};

export default AppLogo;

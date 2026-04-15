import React from 'react';
import { Link } from 'react-router-dom';

/** Full horizontal logo (transparent PNG) for auth flows. */
export const AUTH_LOGO_SRC = '/brand/duesaccountant-logo.png';

/**
 * @param {{ showHomeLink?: boolean, className?: string, imgClassName?: string }} props
 */
export default function AuthBrandLogo({
  showHomeLink = true,
  className = '',
  imgClassName = '',
}) {
  const img = (
    <img
      src={AUTH_LOGO_SRC}
      alt="DuesAccountant — Dues Management Made Easy"
      className={
        `mx-auto h-auto w-full max-w-[min(100%,240px)] sm:max-w-[min(100%,290px)] select-none object-contain object-center ${imgClassName}`.trim()
      }
      decoding="async"
    />
  );

  const wrap = (
    <div className={`flex justify-center ${className}`.trim()}>
      {showHomeLink ? (
        <Link
          to="/"
          className="rounded-xl outline-none transition-opacity hover:opacity-95 focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2"
        >
          {img}
        </Link>
      ) : (
        img
      )}
    </div>
  );

  return wrap;
}

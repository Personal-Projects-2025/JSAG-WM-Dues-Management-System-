import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

/**
 * Short URL: /r/:token → redirects to API public PDF (same receipt as SMS link).
 * API base must match REACT_APP_API_URL (e.g. https://host/api).
 */
const ReceiptPublicRedirect = () => {
  const { token } = useParams();

  useEffect(() => {
    if (!token) return;
    const base = (process.env.REACT_APP_API_URL || '').replace(/\/$/, '');
    if (!base) {
      return;
    }
    const pdfUrl = `${base}/public/receipt/${encodeURIComponent(token)}/pdf`;
    window.location.replace(pdfUrl);
  }, [token]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-slate-50 px-4">
      <Loader2 className="w-8 h-8 animate-spin text-blue-600" aria-hidden />
      <p className="text-sm text-slate-600 text-center">Opening your receipt…</p>
      {!process.env.REACT_APP_API_URL && (
        <p className="text-xs text-amber-600/90 max-w-md text-center">
          Set REACT_APP_API_URL to your API base URL (e.g. https://api.example.com/api) for this
          redirect to work.
        </p>
      )}
    </div>
  );
};

export default ReceiptPublicRedirect;

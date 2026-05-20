/**
 * Build a single user-visible message from an axios/network error response.
 *
 * Priority: validation details → top-level error string → connection message → fallback.
 *
 * @param {unknown} error - Typically an axios reject from api.post/get/...
 * @param {string} fallback - Context-specific default (e.g. "Failed to save settings")
 */
export function getApiErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  const res = error && typeof error === 'object' ? error.response : undefined;

  if (!res) {
    return 'Unable to reach the server. Check your connection and try again.';
  }

  const data = res.data;
  if (!data || typeof data !== 'object') {
    return fallback;
  }

  const details = Array.isArray(data.details) ? data.details : [];
  const fromDetails = [...new Set(
    details
      .map((d) => {
        const m = d && typeof d === 'object' ? (d.msg ?? d.message) : null;
        return typeof m === 'string' ? m.trim() : '';
      })
      .filter(Boolean)
  )];

  if (fromDetails.length > 0) {
    return fromDetails.length === 1 ? fromDetails[0] : fromDetails.join(' • ');
  }

  if (typeof data.error === 'string' && data.error.trim()) {
    return data.error.trim();
  }

  return fallback;
}

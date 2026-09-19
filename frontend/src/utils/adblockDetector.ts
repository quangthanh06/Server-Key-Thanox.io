/**
 * Robust & lightweight AdBlock / Brave Shields detector
 * Returns true if an ad blocker is actively intercepting ads/requests.
 */
export async function detectAdBlock(): Promise<boolean> {
  if (typeof window === 'undefined' || typeof document === 'undefined') return false;

  // 1. Check DOM bait element (triggers CSS cosmetic filtering of uBlock/AdBlock)
  const bait = document.createElement('div');
  bait.setAttribute(
    'class',
    'pub_300x250 pub_300x250m pub_728x90 text-ad textAd text_ad text_ads text-ads text-ad-links ad-banner adsbox adsbygoogle'
  );
  bait.setAttribute(
    'style',
    'width: 1px !important; height: 1px !important; position: absolute !important; left: -10000px !important; top: -1000px !important;'
  );

  try {
    document.body.appendChild(bait);
    const isHiddenByStyle =
      window.getComputedStyle(bait).display === 'none' ||
      window.getComputedStyle(bait).visibility === 'hidden' ||
      bait.offsetParent === null ||
      bait.clientHeight === 0;

    document.body.removeChild(bait);

    if (isHiddenByStyle) {
      return true;
    }
  } catch (_) {}

  // 2. Check Network Request blocking (AdBlock blocks scripts from ad networks)
  try {
    const res = await fetch('https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js', {
      method: 'HEAD',
      mode: 'no-cors',
      cache: 'no-store'
    });
    // If not blocked, no-cors fetch succeeds or returns opaque response
    if (res.type === 'opaque' || res.ok || res.status === 200 || res.status === 0) {
      return false;
    }
  } catch (err: any) {
    // Network error caused by ERR_BLOCKED_BY_CLIENT
    return true;
  }

  return false;
}

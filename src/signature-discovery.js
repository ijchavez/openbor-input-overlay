'use strict';

// Official Inpulsar Signature landing page. Keep this as the single URL source of truth.
const SIGNATURE_LANDING_URL = 'https://inpulsar.vercel.app/';

function isAllowedSignatureUrl(candidate, officialUrl = SIGNATURE_LANDING_URL) {
  if (!officialUrl || typeof candidate !== 'string' || candidate !== officialUrl) return false;
  try {
    const parsed = new URL(candidate);
    return parsed.protocol === 'https:' && parsed.href === officialUrl;
  } catch {
    return false;
  }
}

function createSignatureOpener(openExternal, officialUrl = SIGNATURE_LANDING_URL) {
  return async function openSignatureLanding(candidate = officialUrl) {
    if (!isAllowedSignatureUrl(candidate, officialUrl)) return false;
    try {
      await openExternal(candidate);
      return true;
    } catch (error) {
      console.error('No se pudo abrir la landing de Inpulsar Signature:', error);
      return false;
    }
  };
}

module.exports = { SIGNATURE_LANDING_URL, isAllowedSignatureUrl, createSignatureOpener };

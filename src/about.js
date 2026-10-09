'use strict';

const { SIGNATURE_LANDING_URL } = require('./signature-discovery');

const ABOUT_LINKS = Object.freeze({
  repository: 'https://github.com/ijchavez/openbor-input-overlay',
  releases: 'https://github.com/ijchavez/openbor-input-overlay/releases',
  inpulsar: SIGNATURE_LANDING_URL
});

function isAllowedAboutUrl(candidate) {
  return typeof candidate === 'string' && Object.values(ABOUT_LINKS).includes(candidate);
}

module.exports = { ABOUT_LINKS, isAllowedAboutUrl };

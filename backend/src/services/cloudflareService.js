// backend/src/services/cloudflareService.js
//
// Automatically adds a custom domain to the Cloudflare Pages hotel-website
// project whenever a new org is created. This means every new hotel signup
// gets their subdomain (e.g. acme.cierlo.app) working instantly with no
// manual steps.
//
// Required env vars:
//   CF_API_TOKEN        — Cloudflare API token with Pages:Edit permission
//   CF_ACCOUNT_ID       — Cloudflare account ID
//   CF_PAGES_PROJECT    — Pages project name (e.g. "hotel-website")
//   WEBSITE_BASE_DOMAIN — e.g. "cierlo.app"

import { env } from '../config/env.js';

const CF_BASE = 'https://api.cloudflare.com/client/v4';

/**
 * Adds <slug>.<WEBSITE_BASE_DOMAIN> as a custom domain on the
 * Cloudflare Pages hotel-website project.
 *
 * Fails silently with a console error — a domain provisioning failure
 * should never block org registration from completing.
 */
export const provisionHotelSubdomain = async (slug) => {
  const { CF_API_TOKEN, CF_ACCOUNT_ID, CF_PAGES_PROJECT, WEBSITE_BASE_DOMAIN } = env;

  if (!CF_API_TOKEN || !CF_ACCOUNT_ID || !CF_PAGES_PROJECT) {
    console.warn('[cloudflare] Skipping subdomain provisioning — CF env vars not set.');
    return;
  }

  const domain = `${slug}.${WEBSITE_BASE_DOMAIN || 'cierlo.app'}`;

  try {
    const res = await fetch(
      `${CF_BASE}/accounts/${CF_ACCOUNT_ID}/pages/projects/${CF_PAGES_PROJECT}/domains`,
      {
        method:  'POST',
        headers: {
          'Authorization': `Bearer ${CF_API_TOKEN}`,
          'Content-Type':  'application/json',
        },
        body: JSON.stringify({ name: domain }),
      }
    );

    const json = await res.json();

    if (!res.ok) {
      // 409 = domain already exists — not an error
      if (res.status === 409) {
        console.log(`[cloudflare] Domain ${domain} already exists — skipping.`);
        return;
      }
      console.error(`[cloudflare] Failed to provision ${domain}:`, json?.errors);
      return;
    }

    console.log(`[cloudflare] Provisioned subdomain: ${domain}`);
  } catch (err) {
    console.error(`[cloudflare] Error provisioning ${domain}:`, err.message);
  }
};

/**
 * Adds a hotel's fully custom domain (e.g. "www.grandmeridian.com") to
 * Cloudflare Pages. Called when a hotel saves a custom domain in Settings.
 *
 * The hotel still needs to add a CNAME at their DNS provider pointing to
 * <slug>.cierlo.app — we show them these instructions in the UI.
 */
export const provisionCustomDomain = async (domain) => {
  const { CF_API_TOKEN, CF_ACCOUNT_ID, CF_PAGES_PROJECT } = env;

  if (!CF_API_TOKEN || !CF_ACCOUNT_ID || !CF_PAGES_PROJECT) {
    console.warn('[cloudflare] Skipping custom domain provisioning — CF env vars not set.');
    return { ok: false, reason: 'CF env vars not configured' };
  }

  try {
    const res = await fetch(
      `${CF_BASE}/accounts/${CF_ACCOUNT_ID}/pages/projects/${CF_PAGES_PROJECT}/domains`,
      {
        method:  'POST',
        headers: {
          'Authorization': `Bearer ${CF_API_TOKEN}`,
          'Content-Type':  'application/json',
        },
        body: JSON.stringify({ name: domain }),
      }
    );

    const json = await res.json();

    if (!res.ok) {
      if (res.status === 409) {
        console.log(`[cloudflare] Custom domain ${domain} already exists.`);
        return { ok: true, alreadyExists: true };
      }
      console.error(`[cloudflare] Failed to provision custom domain ${domain}:`, json?.errors);
      return { ok: false, reason: json?.errors?.[0]?.message || 'Unknown error' };
    }

    console.log(`[cloudflare] Provisioned custom domain: ${domain}`);
    return { ok: true };
  } catch (err) {
    console.error(`[cloudflare] Error provisioning custom domain ${domain}:`, err.message);
    return { ok: false, reason: err.message };
  }
};
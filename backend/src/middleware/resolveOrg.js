// src/middleware/resolveOrg.js
//
// Resolves the org (hotel) for every public route.
// Priority order:
//   1. Custom domain  — e.g. www.amarahotel.com        (mapped in organizations table)
//   2. Subdomain      — e.g. amarahotel.cierlo.app     (slug-based)
//   3. API key        — X-API-Key header                (self-hosted / widget fallback)
//
// Sets req.orgId on success. Calls next(err) on failure.
//
// NOTE: We intentionally do NOT filter by status='active' here.
// Suspended/soft-locked orgs must still resolve so the subscriptionGate
// middleware can return the correct 402/403 response. Filtering by status
// here causes a 404 for suspended orgs, which surfaces as a Cloudflare 522.

import { supabase } from '../config/supabase.js';
import { AppError } from './errorHandler.js';
import { env } from '../config/env.js';
import bcrypt from 'bcryptjs';

// Extract the root domain from env so we know what counts as "our" subdomain.
// e.g. WEBSITE_BASE_DOMAIN=cierlo.app  →  default.cierlo.app is a subdomain
// FIX: fallback is now 'cierlo.app', not the stale 'hms-67e.pages.dev'
const WEBSITE_BASE_DOMAIN = env.WEBSITE_BASE_DOMAIN || 'cierlo.app';

export const resolveOrg = async (req, res, next) => {
    try {
        const host = (req.hostname || '').toLowerCase();

        // ── 1. Try custom domain ────────────────────────────────────────────────
        // Any host that is NOT our own subdomain is treated as a potential custom domain.
        // FIX: Removed .eq('status', 'active') — suspended orgs must still resolve.
        const isOwnSubdomain = host === WEBSITE_BASE_DOMAIN || host.endsWith(`.${WEBSITE_BASE_DOMAIN}`);

        if (!isOwnSubdomain && host && host !== 'localhost') {
            const { data: org } = await supabase
                .from('organizations')
                .select('id, status, subscription_status')
                .eq('custom_domain', host)
                .not('status', 'eq', 'deleted')   // only exclude hard-deleted orgs
                .maybeSingle();

            if (org) {
                req.orgId = org.id;
                req.orgStatus = org.status;
                req.orgSubscriptionStatus = org.subscription_status;
                return next();
            }
        }

        // ── 2. Try subdomain ────────────────────────────────────────────────────
        // e.g. "default.cierlo.app" → slug = "default"
        // FIX: Removed .eq('status', 'active') — suspended orgs must still resolve.
        if (isOwnSubdomain) {
            const slug = host.replace(`.${WEBSITE_BASE_DOMAIN}`, '');

            // Ignore bare domain (no subdomain) and "www"
            if (slug && slug !== WEBSITE_BASE_DOMAIN && slug !== 'www') {
                const { data: org } = await supabase
                    .from('organizations')
                    .select('id, status, subscription_status')
                    .eq('slug', slug)
                    .not('status', 'eq', 'deleted')   // only exclude hard-deleted orgs
                    .maybeSingle();

                if (org) {
                    req.orgId = org.id;
                    req.orgStatus = org.status;
                    req.orgSubscriptionStatus = org.subscription_status;
                    return next();
                }
            }
        }

        // ── 3. API key fallback ─────────────────────────────────────────────────
        // Used for: self-hosted websites, embedded booking widgets, local dev
        const apiKey = req.headers['x-api-key'];
        if (apiKey) {
            const prefix = apiKey.slice(0, 15);
            const { data: keys } = await supabase
                .from('api_keys')
                .select('id, org_id, key_hash, is_active, expires_at')
                .eq('key_prefix', prefix)
                .eq('is_active', true);

            if (keys?.length) {
                let matched = null;
                for (const k of keys) {
                    if (await bcrypt.compare(apiKey, k.key_hash)) { matched = k; break; }
                }

                if (matched) {
                    if (matched.expires_at && new Date(matched.expires_at) < new Date()) {
                        return next(new AppError('API key expired.', 403));
                    }

                    // Fire-and-forget last_used_at
                    supabase.from('api_keys')
                        .update({ last_used_at: new Date().toISOString() })
                        .eq('id', matched.id).then(() => { });

                    req.orgId = matched.org_id;
                    req.isApiKey = true;
                    return next();
                }
            }
        }

        // ── 4. Local dev convenience ────────────────────────────────────────────
        // In development, if DEV_ORG_ID is set, use it so you can test without
        // a subdomain or API key. Never runs in production.
        if (env.isDev && env.DEV_ORG_ID) {
            req.orgId = env.DEV_ORG_ID;
            return next();
        }

        return next(new AppError('Hotel not found.', 404));
    } catch (err) {
        return next(err);
    }
};
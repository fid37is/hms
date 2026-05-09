// src/routes/searchRoutes.js
//
// GET /api/v1/search?q=<query>
// Requires authentication. No special permission needed —
// results are already org-scoped and only surface basic info.

import { Router }    from 'express';
import { authenticate } from '../middleware/auth.js';
import { search }    from '../controllers/searchController.js';

const router = Router();

router.get('/', authenticate, search);

export default router;
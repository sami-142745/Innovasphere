import { Router } from 'express';
import { requireRole } from '../security/rbac.js';

export const adminRouter = Router();

adminRouter.use(requireRole('ADMIN'));

adminRouter.get('/analytics/summary', async (_req, res) => {
  return res.json({
    totalUsers: 0,
    activeUsers: 0,
    totalOrders: 0,
    revenue: 0,
    referrals: 0,
  });
});

// Additional admin routes (projects/orders/referrals/payments/reviews) will be implemented next.


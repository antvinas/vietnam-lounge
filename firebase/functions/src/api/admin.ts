import * as express from 'express';
import * as admin from 'firebase-admin';
import {requireAdmin} from '../middlewares/requireAdmin';

const router = express.Router();
const db = admin.firestore();

// All routes in this file are protected and can only be accessed by admins.
router.use(requireAdmin);

// GET /admin/analytics/overview
router.get('/analytics/overview', async (req, res) => {
  try {
    // Example: Fetching total user and post counts
    const usersSnapshot = await db.collection('users').get();
    const postsSnapshot = await db.collection('posts').get();
    
    const overview = {
      totalUsers: usersSnapshot.size,
      totalPosts: postsSnapshot.size,
      // You can add more KPIs here as defined in the guide (dau, revenue, etc.)
    };

    res.status(200).send(overview);
  } catch (error) {
    res.status(500).send({error: 'Failed to fetch analytics overview.'});
  }
});

// GET /admin/users/list
router.get('/users/list', async (req, res) => {
    try {
        const usersSnapshot = await db.collection('users').get();
        const users = usersSnapshot.docs.map(doc => ({id: doc.id, ...doc.data()}));
        res.status(200).send(users);
    } catch (error) {
        res.status(500).send({ error: 'Failed to fetch user list.' });
    }
});


// --- Add other admin-related endpoints here ---
// e.g., GET /admin/reports/list

export const adminRouter = router;

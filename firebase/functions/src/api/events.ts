import * as express from 'express';
import * as admin from 'firebase-admin';
import { requireAuth } from '../middlewares/requireAuth';
import { requireAdmin } from '../middlewares/requireAdmin';

const router = express.Router();
const db = admin.firestore();

// --- Public Event Endpoints ---

// GET /events/list (List all upcoming events)
router.get('/list', async (req, res) => {
  try {
    const eventsSnapshot = await db.collection('events')
      .where('date', '>=', new Date().toISOString())
      .orderBy('date', 'asc')
      .get();
    const events = eventsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).send(events);
  } catch (error) {
    res.status(500).send({ error: 'Failed to fetch events.' });
  }
});

// GET /events/:id (Get a single event by ID)
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const eventDoc = await db.collection('events').doc(id).get();
    if (!eventDoc.exists) {
      return res.status(404).send({ error: 'Event not found.' });
    }
    res.status(200).send({ id: eventDoc.id, ...eventDoc.data() });
  } catch (error) {
    res.status(500).send({ error: 'Failed to fetch event.' });
  }
});

// POST /events/:id/rsvp (RSVP to an event)
router.post('/:id/rsvp', requireAuth, async (req, res) => {
  const { id: eventId } = req.params;
  const { uid } = req.user!;
  const { status } = req.body; // e.g., 'going', 'interested', 'not-going'

  if (!status) {
    return res.status(400).send({ error: 'RSVP status is required.' });
  }

  try {
    const rsvpRef = db.collection('events').doc(eventId).collection('rsvps').doc(uid);
    await rsvpRef.set({ status: status, date: new Date() });
    res.status(200).send({ message: 'RSVP successful.' });
  } catch (error) {
    res.status(500).send({ error: 'Failed to RSVP to event.' });
  }
});

// --- Admin Event Endpoints ---

// POST /events/create (Admin only)
router.post('/create', requireAdmin, async (req, res) => {
  // Implementation for creating an event (omitted for brevity)
  res.status(201).send({ message: "Event created (stub)" });
});

// PUT /events/:id (Admin only)
router.put('/:id', requireAdmin, async (req, res) => {
  // Implementation for updating an event (omitted for brevity)
  res.status(200).send({ message: "Event updated (stub)" });
});

// DELETE /events/:id (Admin only)
router.delete('/:id', requireAdmin, async (req, res) => {
  // Implementation for deleting an event (omitted for brevity)
  res.status(200).send({ message: "Event deleted (stub)" });
});


export const eventsRouter = router;

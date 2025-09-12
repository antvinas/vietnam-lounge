import * as express from 'express';
import * as admin from 'firebase-admin';
import {requireAuth} from '../middlewares/requireAuth';
import {requireAdmin} from '../middlewares/requireAdmin';

const router = express.Router();
const db = admin.firestore();

// GET /events/list
router.get('/list', async (req, res) => {
  try {
    const eventsSnapshot = await db.collection('events').orderBy('startDate', 'asc').get();
    const events = eventsSnapshot.docs.map(doc => ({id: doc.id, ...doc.data()}));
    res.status(200).send(events);
  } catch (error) {
    res.status(500).send({error: 'Failed to fetch events.'});
  }
});

// POST /events/create (Admin only)
router.post('/create', requireAdmin, async (req, res) => {
  const {title, description, location, startDate, endDate} = req.body;

  if (!title || !location || !startDate) {
    return res.status(400).send({error: 'Title, location, and start date are required.'});
  }

  try {
    const newEvent = {
      title,
      description,
      location,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      participantCount: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    const eventRef = await db.collection('events').add(newEvent);
    res.status(201).send({id: eventRef.id, ...newEvent});
  } catch (error) {
    res.status(500).send({error: 'Failed to create event.'});
  }
});

// POST /events/register (Authenticated users only)
router.post('/register', requireAuth, async (req, res) => {
  const {eventId} = req.body;
  const {uid} = req.user;

  if (!eventId) {
    return res.status(400).send({error: 'Event ID is required.'});
  }

  try {
    const eventRef = db.collection('events').doc(eventId);
    const registrationRef = eventRef.collection('participants').doc(uid);

    await db.runTransaction(async (transaction) => {
      const eventDoc = await transaction.get(eventRef);
      if (!eventDoc.exists) {
        throw new Error('Event not found.');
      }
      const registrationDoc = await transaction.get(registrationRef);
      if (registrationDoc.exists) {
        throw new Error('Already registered for this event.');
      }
      transaction.create(registrationRef, { registeredAt: admin.firestore.FieldValue.serverTimestamp() });
      transaction.update(eventRef, { participantCount: admin.firestore.FieldValue.increment(1) });
    });

    res.status(201).send({message: 'Successfully registered for the event.'});

  } catch (error: any) {
    res.status(500).send({ error: error.message || 'Failed to register for the event.' });
  }
});

export const eventsRouter = router;

"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventsRouter = void 0;
const express = __importStar(require("express"));
const admin = __importStar(require("firebase-admin"));
const requireAuth_1 = require("../middlewares/requireAuth");
const requireAdmin_1 = require("../middlewares/requireAdmin");
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
    }
    catch (error) {
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
    }
    catch (error) {
        res.status(500).send({ error: 'Failed to fetch event.' });
    }
});
// POST /events/:id/rsvp (RSVP to an event)
router.post('/:id/rsvp', requireAuth_1.requireAuth, async (req, res) => {
    const { id: eventId } = req.params;
    const { uid } = req.user;
    const { status } = req.body; // e.g., 'going', 'interested', 'not-going'
    if (!status) {
        return res.status(400).send({ error: 'RSVP status is required.' });
    }
    try {
        const rsvpRef = db.collection('events').doc(eventId).collection('rsvps').doc(uid);
        await rsvpRef.set({ status: status, date: new Date() });
        res.status(200).send({ message: 'RSVP successful.' });
    }
    catch (error) {
        res.status(500).send({ error: 'Failed to RSVP to event.' });
    }
});
// --- Admin Event Endpoints ---
// POST /events/create (Admin only)
router.post('/create', requireAdmin_1.requireAdmin, async (req, res) => {
    // Implementation for creating an event (omitted for brevity)
    res.status(201).send({ message: "Event created (stub)" });
});
// PUT /events/:id (Admin only)
router.put('/:id', requireAdmin_1.requireAdmin, async (req, res) => {
    // Implementation for updating an event (omitted for brevity)
    res.status(200).send({ message: "Event updated (stub)" });
});
// DELETE /events/:id (Admin only)
router.delete('/:id', requireAdmin_1.requireAdmin, async (req, res) => {
    // Implementation for deleting an event (omitted for brevity)
    res.status(200).send({ message: "Event deleted (stub)" });
});
exports.eventsRouter = router;
//# sourceMappingURL=events.js.map
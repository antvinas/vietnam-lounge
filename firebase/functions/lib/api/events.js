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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventsRouter = void 0;
const express = __importStar(require("express"));
const admin = __importStar(require("firebase-admin"));
const router = express.Router();
const db = admin.firestore();
const getCollection = (segment) => {
    return segment === 'adult' ? db.collection('adult_events') : db.collection('events');
};
// GET /events/:segment/upcoming
router.get('/:segment/upcoming', async (req, res) => {
    const { segment } = req.params;
    try {
        const now = new Date();
        const eventsSnapshot = await getCollection(segment)
            .where('endDate', '>=', now)
            .orderBy('endDate', 'asc')
            .limit(5)
            .get();
        const upcomingEvents = eventsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.status(200).send(upcomingEvents);
    }
    catch (error) {
        res.status(500).send({ error: `Failed to fetch upcoming ${segment} events.` });
    }
});
// GET /events/:segment/:id
router.get('/:segment/:id', async (req, res) => {
    const { segment, id } = req.params;
    try {
        const eventDoc = await getCollection(segment).doc(id).get();
        if (!eventDoc.exists) {
            return res.status(404).send({ error: 'Event not found' });
        }
        res.status(200).send({ id: eventDoc.id, ...eventDoc.data() });
    }
    catch (error) {
        res.status(500).send({ error: `Failed to fetch ${segment} event` });
    }
});
// GET /events/:segment (e.g., /events/general or /events/adult)
router.get('/:segment', async (req, res) => {
    const { segment } = req.params;
    try {
        const eventsSnapshot = await getCollection(segment).get();
        const events = eventsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.status(200).send(events);
    }
    catch (error) {
        res.status(500).send({ error: `Failed to fetch ${segment} events.` });
    }
});
// POST /events/:segment
router.post('/:segment', async (req, res) => {
    const { segment } = req.params;
    try {
        const newEvent = req.body;
        const addedEvent = await getCollection(segment).add(newEvent);
        res.status(201).send({ id: addedEvent.id, ...newEvent });
    }
    catch (error) {
        res.status(500).send({ error: `Failed to create ${segment} event` });
    }
});
// DELETE /events/:segment/:id
router.delete('/:segment/:id', async (req, res) => {
    const { segment, id } = req.params;
    try {
        await getCollection(segment).doc(id).delete();
        res.status(204).send();
    }
    catch (error) {
        res.status(500).send({ error: `Failed to delete ${segment} event` });
    }
});
exports.eventsRouter = router;
//# sourceMappingURL=events.js.map
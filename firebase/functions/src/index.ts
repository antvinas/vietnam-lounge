import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as express from 'express';
import * as cors from 'cors';
import * as helmet from 'helmet';

import {logger} from './utils/logger';
import {communityRouter} from './api/community';
import {spotsRouter} from './api/spots';
import {adminRouter} from './api/admin';
import {eventsRouter} from './api/events';
import {usersRouter} from './api/users';
import {uploadsRouter} from './api/uploads';
import {handleCreateUser} from './triggers/auth';

// Initialize Firebase Admin SDK
admin.initializeApp();

// Initialize Express app
const app = express();

// Middlewares
app.use(helmet());
app.use(cors({origin: true})); // Configure for your specific domain in production
app.use(express.json());

// API Routers
app.use('/community', communityRouter);
app.use('/spots', spotsRouter);
app.use('/admin', adminRouter);
app.use('/events', eventsRouter);
app.use('/users', usersRouter);
app.use('/uploads', uploadsRouter);

// Generic error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).send({error: 'An unexpected error occurred.'});
});

// Expose the Express API as a single Cloud Function
export const api = functions.https.onRequest(app);

// --- Function Triggers ---
export const onCreateUser = functions.region('asia-northeast3').auth.user().onCreate(handleCreateUser);

// functions/src/routes/index.ts
import { Router } from 'express';
import spots from './spots.router';

const api = Router();

api.use('/spots', spots);

// 여기에 다른 라우트가 있다면 이어서 등록
// api.use('/adult_spots', adultSpots);
// api.use('/uploads', uploads);

export default api;

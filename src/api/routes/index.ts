import { Router } from 'express';
import { createEventRoutes } from './events';
import { createSeatReservationRoutes } from './seatReservations';
import config from '../../config';

const router = Router();

router.use('/events', createEventRoutes({
    eventManager: config.services.eventManager,
    redis: config.redis,
    eventSettings: config.eventSettings
}));
router.use('/seat-reservations', createSeatReservationRoutes({
    userService: config.services.userService,
    redis: config.redis,
    seatReservationSettings: config.seatReservationSettings
}));

export default router;

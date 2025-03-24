import { validate as isUUID } from 'uuid';
import { Request, Response, Router } from 'express';
import { IUserService } from '../../../services/userService';
import { Redis } from 'ioredis';
import { CreateSeatReservationDto } from './types';
import { SeatReservationSettings } from '../../../config/types';

export function createSeatReservationRoutes(dependencies: {
  userService: IUserService,
  redis: Redis,
  seatReservationSettings: SeatReservationSettings,
}) {
  const { userService, redis, seatReservationSettings } = dependencies;

  const router = Router();

  // Try to reserve a Seat
  router.post('/', async (req: Request<{}, {}, CreateSeatReservationDto>, res: Response): Promise<void> => {
    try {
      const { eventId, seatId, personId } = req.body;

      if (!isUUID(eventId)) {
        res.status(400).json({ error: 'Invalid eventId: not a valid UUID' });
        return;
      } else if (!isUUID(seatId)) {
        res.status(400).json({ error: 'Invalid seatId: not a valid UUID' });
        return;
      } else if (!isUUID(personId)) {
        res.status(400).json({ error: 'Invalid personId: not a valid UUID' });
        return;
      }

      const reservedSeatKey = `${seatReservationSettings.reservedSeatPrefix}:event-${eventId}--seat-${seatId}`;

      // Try to reserve the seat first to avoid race conditions
      const result = await redis.set(
        reservedSeatKey,
        personId,
        'EX',
        seatReservationSettings.seatReservationHoldTimeoutSecs,
        'NX'
      );

      if (!result) {
        res.status(409).json({ error: 'This seat is already reserved.' });
        return;
      }

      const userSeatReservations = await userService.getUserSeatReservations(personId);
      if ((userSeatReservations).length >= seatReservationSettings.maxUserSeatReservations) {
        res.status(409).json({ error: 'User has reached the maximum number of reservations.' });
        await redis.del(reservedSeatKey);
        return;
      } else {
        await redis.set(
          `${seatReservationSettings.userSeatReservationsPrefix}:${personId}`,
          JSON.stringify(userSeatReservations.concat([reservedSeatKey])),
          'EX',
          seatReservationSettings.seatReservationHoldTimeoutSecs
        );
      }

      // TODO: ping the persistent store to verify:
      // 1. the event, the seat, and the person all exist
      // 2. the seat is not already reserved
      // 3. If any of the above are true delete the redis key and return an appropriate error

      res.status(202).json({ status: 'Seat reserved successfully' });
      return;
    } catch (error) {
      console.error('Error in event route:', error);
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }
  });

  // Try to reserve a Seat
  router.patch('/refresh', async (req: Request<{}, {}, CreateSeatReservationDto>, res: Response): Promise<void> => {
    try {
      const { eventId, seatId, personId } = req.body;

      if (!isUUID(eventId)) {
        res.status(400).json({ error: 'Invalid eventId: not a valid UUID' });
        return;
      } else if (!isUUID(seatId)) {
        res.status(400).json({ error: 'Invalid seatId: not a valid UUID' });
        return;
      } else if (!isUUID(personId)) {
        res.status(400).json({ error: 'Invalid personId: not a valid UUID' });
        return;
      }

      const redisKey = `reservedSeat:${eventId}-${seatId}`;
      const result = await redis.expire(
        redisKey,
        seatReservationSettings.seatReservationHoldTimeoutSecs
      );
      await redis.expire(
        `${seatReservationSettings.userSeatReservationsPrefix}:${personId}`,
        seatReservationSettings.seatReservationHoldTimeoutSecs
      )

      if (result === 1) {
        res.status(200).json({ status: 'TTL refreshed successfully' });
        return;
      } else {
        res.status(404).json({ error: 'Key does not exist or has already expired' });
        return;
      }
    } catch (error) {
      console.error('Error in event route:', error);
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }
  });

  router.get('/', async (req: Request, res: Response) => {
    res.status(200).json({ message: 'Hello from the seat reservation router' });
    return;
  });

  return router;
}


export default createSeatReservationRoutes;

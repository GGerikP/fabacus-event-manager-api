import { Request, Response, Router } from 'express';
import { CreateEventDto } from './types';
import { IEventManager } from '../../../services/eventManagerService';
import { Redis } from 'ioredis';
import { EventSettings } from '../../../config/types';

export function createEventRoutes(dependencies: {
  eventManager: IEventManager,
  redis: Redis,
  eventSettings: EventSettings,
}) {
  const { eventManager, redis, eventSettings } = dependencies;

  const router = Router();

  // Create an Event
  router.post('/', async (req: Request<{}, {}, CreateEventDto>, res: Response): Promise<void> => {
    try {

      const payload = req.body;
      const seating_plan = payload.seating_plan;

      if (!seating_plan) {
        res.status(400).json({ error: 'Missing seating_plan in request body' });
        return;
      }
      const grid = seating_plan.grid;
      if (!grid) {
        res.status(400).json({ error: 'Missing grid in seating_plan' });
        return;
      }
      if (!seating_plan?.grid?.row_count || !seating_plan?.grid?.column_count) {
        res.status(400).json({ error: `Invalid seating_plan supplied: row_count and column_count must be greater than 0.` });
        return;
      }

      if (seating_plan.grid.row_count * seating_plan.grid.column_count > eventSettings.maxEventSize) {
        res.status(400).json({error: `Invalid seating_plan: events can have no more than ${eventSettings.maxEventSize} seats.'`});
        return;
      }
      if (seating_plan.grid.row_count * seating_plan.grid.column_count < eventSettings.minEventSize) {
        res.status(400).json({ error: `Invalid seating_plan: events must have at least ${eventSettings.minEventSize} seats.` });
        return;
      }
      const response = await eventManager.requestAddSeats(seating_plan);
      if (!response || response.status !== 'published') {
        res.status(500).json({ error: 'Failed to create event' });
        return;
      } else {
        res.status(202).json({
          message: 'Event creation queued successfully',
          status: response.status,
          id: response.id
        });
        return;
      }
    } catch (error) {
      console.error('Error in event route:', error);
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }
  });

  router.get('/:id([a-zA-Z0-9_-]+)', async (req: Request, res: Response): Promise<void> => {
    try {
      const { id, payload } = req.body;

      if (!id || !payload) {
        res.status(400).json({ error: 'Missing id or payload in request body' });
        return;
      }

      const redisKey = `event:${id}`;
      const exists = await redis.get(redisKey);

      if (exists) {
        res.status(409).json({ error: 'Duplicate event' });
        return;
      }

      await redis.set(redisKey, JSON.stringify(payload), 'EX', 3600);

      res.status(202).json({ status: 'Event queued successfully' });
      return;
    } catch (error) {
      console.error('Error in event route:', error);
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }
  });

  router.get('/', async (req: Request, res: Response) => {
    res.status(200).json({ message: 'Hello from the event manager' });
  });

  return router;
}


export default createEventRoutes;

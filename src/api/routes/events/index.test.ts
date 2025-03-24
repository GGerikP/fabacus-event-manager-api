import request from 'supertest';
import express from 'express';
import { createEventRoutes } from './index';
import { IEventManager } from '../../../services/eventManagerService';

// Mock the Redis class entirely
jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    expire: jest.fn(),
  }));
});

import Redis from 'ioredis'; // Import after mocking

const mockEventManager: IEventManager = {
  requestAddSeats: jest.fn(async (seatingPlan) => ({
    status: 'published',
    id: 'mock-event-id',
  })),
};

const mockRedis = new Redis() as jest.Mocked<Redis>;

const app = express();
app.use(express.json());
const mockEventSettings = {
  maxEventSize: 1000,
  minEventSize: 10,
};

app.use('/events', createEventRoutes({ eventManager: mockEventManager, redis: mockRedis, eventSettings: mockEventSettings }));

describe('Event Routes Integration Tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /events', () => {
    it('should return 202 when a valid seating plan is provided', async () => {
      const response = await request(app)
        .post('/events')
        .send({
          seating_plan: {
            grid: { row_count: 10, column_count: 10 },
          },
        });

      expect(response.status).toBe(202);
      expect(response.body).toEqual({
        message: 'Event creation queued successfully',
        status: 'published',
        id: 'mock-event-id',
      });
      expect(mockEventManager.requestAddSeats).toHaveBeenCalledWith({
        grid: { row_count: 10, column_count: 10 },
      });
    });

    it('should return 400 when seating_plan is missing', async () => {
      const response = await request(app).post('/events').send({});

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Missing seating_plan in request body' });
    });

    it('should return 400 when grid is missing in seating_plan', async () => {
      const response = await request(app).post('/events').send({
        seating_plan: {},
      });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Missing grid in seating_plan' });
    });

    it('should return 400 when row_count or column_count is invalid', async () => {
      const response = await request(app).post('/events').send({
        seating_plan: {
          grid: { row_count: 0, column_count: 10 },
        },
      });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'Invalid seating_plan supplied: row_count and column_count must be greater than 0.',
      });
    });
  });

  describe('GET /events', () => {
    it('should return 200 with a welcome message', async () => {
      const response = await request(app).get('/events');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'Hello from the event manager' });
    });
  });

  describe('GET /events/:id', () => {
    it('should return 409 if the event already exists in Redis', async () => {
      mockRedis.get.mockResolvedValueOnce('existing-event');

      const response = await request(app)
        .get('/events/mock-event-id')
        .send({ id: 'mock-event-id', payload: { some: 'data' } });

      expect(response.status).toBe(409);
      expect(response.body).toEqual({ error: 'Duplicate event' });
      expect(mockRedis.get).toHaveBeenCalledWith('event:mock-event-id');
    });

    it('should return 202 if the event does not exist in Redis', async () => {
      mockRedis.get.mockResolvedValueOnce(null);

      const response = await request(app)
        .get('/events/mock-event-id')
        .send({ id: 'mock-event-id', payload: { some: 'data' } });

      expect(response.status).toBe(202);
      expect(response.body).toEqual({ status: 'Event queued successfully' });
      expect(mockRedis.set).toHaveBeenCalledWith(
        'event:mock-event-id',
        JSON.stringify({ some: 'data' }),
        'EX',
        3600
      );
    });

    it('should return 400 if id or payload is missing', async () => {
      const response = await request(app).get('/events/mock-event-id').send({});

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Missing id or payload in request body' });
    });

    it('should return 500 if Redis throws an error', async () => {
      mockRedis.get.mockRejectedValueOnce(new Error('Redis error'));

      const response = await request(app)
        .get('/events/mock-event-id')
        .send({ id: 'mock-event-id', payload: { some: 'data' } });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Internal Server Error' });
      expect(mockRedis.get).toHaveBeenCalledWith('event:mock-event-id');
    });
  });
});

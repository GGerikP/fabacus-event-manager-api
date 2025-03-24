import request from 'supertest';
import express from 'express';
import { createSeatReservationRoutes } from './index';
import { IUserService } from '../../../services/userService';
import { Redis } from 'ioredis';
import { SeatReservationSettings } from '../../../config/types';

const mockUserService: IUserService = {
  getUserSeatReservations: jest.fn(),
};

const mockRedis = {
  set: jest.fn(),
  del: jest.fn(),
  expire: jest.fn(),
};

const seatReservationSettings: SeatReservationSettings = {
  reservedSeatPrefix: 'reservedSeat',
  maxUserSeatReservations: 2,
  userSeatReservationsPrefix: 'userSeat',
  seatReservationHoldTimeoutSecs: 60,
};

const app = express();
app.use(express.json());
app.use(
  '/seatReservations',
  createSeatReservationRoutes({
    userService: mockUserService,
    redis: mockRedis as unknown as Redis,
    seatReservationSettings,
  })
);

describe('Seat Reservation Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /', () => {
    it('should reserve a seat successfully', async () => {
      mockRedis.set.mockResolvedValue('OK');
      (mockUserService.getUserSeatReservations as jest.Mock).mockResolvedValue([]);

      const response = await request(app)
        .post('/seatReservations')
        .send({ eventId: '123e4567-e89b-12d3-a456-426614174000', seatId: '123e4567-e89b-12d3-a456-426614174001', personId: '123e4567-e89b-12d3-a456-426614174002' });

      expect(response.status).toBe(202);
      expect(response.body).toEqual({ status: 'Seat reserved successfully' });
    });

    it('should return 409 if the seat is already reserved', async () => {
      mockRedis.set.mockResolvedValue(null);

      const response = await request(app)
        .post('/seatReservations')
        .send({ eventId: '123e4567-e89b-12d3-a456-426614174000', seatId: '123e4567-e89b-12d3-a456-426614174001', personId: '123e4567-e89b-12d3-a456-426614174002' });

      expect(response.status).toBe(409);
      expect(response.body).toEqual({ error: 'This seat is already reserved.' });
    });

    it('should return 400 for invalid UUIDs', async () => {
      const response = await request(app)
        .post('/seatReservations')
        .send({ eventId: 'invalid', seatId: 'invalid', personId: 'invalid' });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Invalid eventId: not a valid UUID' });
    });
  });

  describe('PATCH /refresh', () => {
    it('should refresh TTL successfully', async () => {
      mockRedis.expire.mockResolvedValue(1);

      const response = await request(app)
        .patch('/seatReservations/refresh')
        .send({ eventId: '123e4567-e89b-12d3-a456-426614174000', seatId: '123e4567-e89b-12d3-a456-426614174001', personId: '123e4567-e89b-12d3-a456-426614174002' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ status: 'TTL refreshed successfully' });
    });

    it('should return 404 if the key does not exist', async () => {
      mockRedis.expire.mockResolvedValue(0);

      const response = await request(app)
        .patch('/seatReservations/refresh')
        .send({ eventId: '123e4567-e89b-12d3-a456-426614174000', seatId: '123e4567-e89b-12d3-a456-426614174001', personId: '123e4567-e89b-12d3-a456-426614174002' });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Key does not exist or has already expired' });
    });

    it('should return 400 for invalid UUIDs', async () => {
      const response = await request(app)
        .patch('/seatReservations/refresh')
        .send({ eventId: 'invalid', seatId: 'invalid', personId: 'invalid' });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Invalid eventId: not a valid UUID' });
    });
  });

  describe('GET /', () => {
    it('should return a welcome message', async () => {
      const response = await request(app).get('/seatReservations');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'Hello from the seat reservation router' });
    });
  });
});

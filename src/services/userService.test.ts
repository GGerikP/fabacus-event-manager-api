import { createUserService } from './userService';
import Redis from 'ioredis';

jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    get: jest.fn(),
  }));
});

describe('UserService', () => {
  let redis: jest.Mocked<Redis>;
  let userService: ReturnType<typeof createUserService>;

  beforeEach(() => {
    redis = new (jest.requireMock('ioredis'))() as jest.Mocked<Redis>;
    const seatReservationSettings = {
      userSeatReservationsPrefix: 'mock-prefix',
      maxUserSeatReservations: 10,
      reservedSeatPrefix: 'reserved-',
      seatReservationHoldTimeoutSecs: 60,
    };
    userService = createUserService({ redis, seatReservationSettings });
  });

  it('should return verified seat reservations for a user', async () => {
    const userId = 'user-123';
    const seatReservationIds = ['seat-1', 'seat-2', 'seat-3'];
    const redisKey = `mock-prefix:${userId}`;

    redis.get.mockImplementation(async (key) => {
      if (key === redisKey) return seatReservationIds.join(',');
      if (seatReservationIds.includes(key.toString())) return 'valid';
      return null;
    });

    const result = await userService.getUserSeatReservations(userId);

    expect(redis.get).toHaveBeenCalledTimes(4); // 1 for user key + 3 for seat IDs
    expect(redis.get).toHaveBeenCalledWith(redisKey);
    seatReservationIds.forEach((id) => {
      expect(redis.get).toHaveBeenCalledWith(id);
    });
    expect(result).toEqual(seatReservationIds);
  });

  it('should return an empty array if no reservations exist for the user', async () => {
    const userId = 'user-456';
    const redisKey = `mock-prefix:${userId}`;

    redis.get.mockResolvedValue(null);

    const result = await userService.getUserSeatReservations(userId);

    expect(redis.get).toHaveBeenCalledTimes(1);
    expect(redis.get).toHaveBeenCalledWith(redisKey);
    expect(result).toEqual([]);
  });

  it('should filter out invalid seat reservations', async () => {
    const userId = 'user-789';
    const seatReservationIds = ['seat-1', 'seat-2', 'seat-3'];
    const redisKey = `mock-prefix:${userId}`;

    redis.get.mockImplementation(async (key) => {
      if (key === redisKey) return seatReservationIds.join(',');
      if (key === 'seat-1') return 'valid';
      return null; // 'seat-2' and 'seat-3' are invalid
    });

    const result = await userService.getUserSeatReservations(userId);

    expect(redis.get).toHaveBeenCalledTimes(4); // 1 for user key + 3 for seat IDs
    expect(result).toEqual(['seat-1']);
  });
});

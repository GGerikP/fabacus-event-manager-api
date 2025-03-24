import { createEventManagerService } from './eventManagerService';
import { Producer } from 'kafkajs';
import { SeatingPlan } from '../api/routes/events/types';

jest.mock('kafkajs', () => ({
  Producer: jest.fn().mockImplementation(() => ({
    send: jest.fn(),
  })),
}));

describe('EventManagerService', () => {
  let kafkaProducer: jest.Mocked<Producer>;
  let eventManagerService: ReturnType<typeof createEventManagerService>;

  beforeEach(() => {
    kafkaProducer = new (jest.requireMock('kafkajs').Producer)() as jest.Mocked<Producer>;
    eventManagerService = createEventManagerService({ kafkaProducer });
  });

  it('should publish a Kafka message and return a CreatedEventResponse', async () => {
    const seatingPlan: SeatingPlan = { grid: { row_count: 10, column_count: 10 } };
    const mockSend = kafkaProducer.send as jest.Mock;

    const response = await eventManagerService.requestAddSeats(seatingPlan);

    expect(mockSend).toHaveBeenCalledTimes(1);
    expect(mockSend).toHaveBeenCalledWith({
      topic: 'events.v1',
      messages: expect.arrayContaining([
        expect.objectContaining({
          key: expect.any(String),
          value: expect.any(String),
        }),
      ]),
    });

    expect(response).toEqual({
      status: 'published',
      id: expect.any(String),
    });
  });

  it('should use the provided event_id if given', async () => {
    const seatingPlan: SeatingPlan = { grid: { row_count: 10, column_count: 10 } };
    const event_id = 'test-event-id';
    const mockSend = kafkaProducer.send as jest.Mock;

    const response = await eventManagerService.requestAddSeats(seatingPlan, event_id);

    expect(mockSend).toHaveBeenCalledTimes(1);
    expect(response).toEqual({
      status: 'published',
      id: event_id,
    });
  });
});

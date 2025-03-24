import { v4 as uuidv4 } from 'uuid';
import { createKafkaMessage } from '../utils/kafkaUtils';
import { CreatedEventResponse, SeatingPlan, TicketedEvent } from '../api/routes/events/types';
import { Producer } from 'kafkajs';

export interface IEventManager {
    requestAddSeats(seatingPlan: SeatingPlan, event_id?: string): Promise<CreatedEventResponse>;
}

export const createEventManagerService = (dependencies: {
  kafkaProducer: Producer,
}) => {

    const { kafkaProducer } = dependencies;

    const requestAddSeats = async (seatingPlan: SeatingPlan, event_id?: string): Promise<CreatedEventResponse> => {
      const id = event_id ? event_id : uuidv4();
      const event: TicketedEvent = {
            id: id,
            seatingPlan
        }
        const kafkaMessage = createKafkaMessage('events.v1.add-seats-requested', event );

        await kafkaProducer.send({
          topic: 'events.v1',
          messages: [kafkaMessage],
        });

        const createdEventResponse: CreatedEventResponse = {
          status: 'published',
          id: id,
        };
        return createdEventResponse;
    }

    return {
        requestAddSeats
    }
}

export default createEventManagerService;

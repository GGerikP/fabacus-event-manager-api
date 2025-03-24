import { Producer } from 'kafkajs';

export const connectKafka = async (kafkaProducer: Producer) => {
  await kafkaProducer.connect();
  console.log('[Kafka] Producer connected');
};

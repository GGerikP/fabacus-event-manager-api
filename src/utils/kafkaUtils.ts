export interface KafkaMessage {
    key: string;
    value: string;
}

export const createKafkaMessage = (type: string, payload: any): KafkaMessage => {
    return {
      key: type,
      value: JSON.stringify({
        eventType: type,
        timestamp: new Date().toISOString(),
        payload,
      }),
    };
  };
  
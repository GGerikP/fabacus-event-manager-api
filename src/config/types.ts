import { Producer } from 'kafkajs';
import Redis from 'ioredis';
import { IEventManager } from '../services/eventManagerService';
import { IUserService } from '../services/userService';

/* Types */
export type KafkaConfig = {
    clientId: string;
    brokers: string[];
}

export type RedisConfig = {
    url: string;
}

export type EventSettings = {
    minEventSize: number;
    maxEventSize: number;
}

export type SeatReservationSettings = {
    maxUserSeatReservations: number;
    reservedSeatPrefix: string;
    userSeatReservationsPrefix: string;
    seatReservationHoldTimeoutSecs: number;
}

export type Config = {
    kafkaProducer: Producer,
    redis: Redis,
    services: {
        eventManager: IEventManager;
        userService: IUserService;
    },
    eventSettings: EventSettings;
    seatReservationSettings: SeatReservationSettings;
}


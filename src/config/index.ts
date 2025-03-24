
import dotenv from 'dotenv';
import { Kafka } from 'kafkajs';
import Redis from 'ioredis';
import createEventManagerService from '../services/eventManagerService';
import createUserService from '../services/userService';
import { Config, KafkaConfig, RedisConfig } from './types';

dotenv.config();

/* Instantiation */
const kafkaConfig: KafkaConfig = {
    clientId: process.env.KAFKA_CLIENT_ID || 'fabacus-api',
    brokers: [process.env.KAFKA_BROKER || 'kafka:9092'],
}
const kafka = new Kafka(kafkaConfig);
const kafkaProducer = kafka.producer()

const redisConfig: RedisConfig = {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
}
const redis = new Redis(redisConfig.url);

const eventManager = createEventManagerService({ kafkaProducer });

const seatReservationSettings = {
    maxUserSeatReservations: parseInt(process.env.MAX_USER_SEAT_RESERVATIONS || '3'),
    reservedSeatPrefix: process.env.RESERVED_SEAT_PREFIX || 'reservedSeat',
    userSeatReservationsPrefix: process.env.USER_SEAT_RESERVATIONS_PREFIX || 'userSeatReservations',
    seatReservationHoldTimeoutSecs: parseInt(process.env.SEAT_RESERVATION_HOLD_TIMEOUT_SECS || '60'),
}

const userService = createUserService({ redis, seatReservationSettings });

/* Configuration */
const config: Config = {
    kafkaProducer,
    redis,
    services: {
        eventManager,
        userService,
    },
    eventSettings: {
        minEventSize: parseInt(process.env.MIN_EVENT_SIZE || '10'),
        maxEventSize: parseInt(process.env.MAX_EVENT_SIZE || '1000'),
    },
    seatReservationSettings
}

export default config;
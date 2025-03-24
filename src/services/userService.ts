import Redis from "ioredis";
import { SeatReservationSettings } from "../config/types";


export type IUserService = {
    getUserSeatReservations: (userId: string) => Promise<string[]>;
}

export const createUserService = (dependencies: {
    redis: Redis,
    seatReservationSettings: SeatReservationSettings
}) => {
    const { redis, seatReservationSettings } = dependencies;

    const getUserSeatReservations = async (userId: string): Promise<string[]> => {
        const result = await redis.get(`${seatReservationSettings.userSeatReservationsPrefix}:${userId}`);
        const seatReservationIds = result ? JSON.parse(result) : [];

        const verifiedSeatReservations: string[] = [];
        for (const id of seatReservationIds) {
            if (await redis.get(id)) {
                console.log(`Valid id found: ${id}`);
                verifiedSeatReservations.push(id);
            }
        }

        return verifiedSeatReservations;
    };

    return {
        getUserSeatReservations,
    };
}

export default createUserService;
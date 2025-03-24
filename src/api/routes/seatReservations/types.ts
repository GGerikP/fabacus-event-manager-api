
export type CreateSeatReservationDto = {
    eventId: string;
    seatId: string;
    personId: string; // This structure allows an authorised person to reserve a seat for someone else
}

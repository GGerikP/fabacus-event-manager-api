
export type SeatGrid = {
    row_count: number;
    column_count: number;
}

export type SeatingPlan = {
    // seats: Seat[]; // TODO: Needs an XOR with seatGrid
    grid?: SeatGrid;
}

export interface CreateEventDto {
    seating_plan: SeatingPlan
}

export interface CreatedEventResponse {
    status: string;
    id: string;
}

/* Really we would be selling tickets and not seats, but for now we'll keep it simple
export type EventTicket = {
    id: string;
    seat?: Seat;
    price: number;
}
*/

export type TicketedEvent = {
    id: string;
    // tickets: EventTicket[]; // TODO: future addition - the tickets would hold the seat, but for now we'll keep it simple
    seatingPlan: SeatingPlan;
}
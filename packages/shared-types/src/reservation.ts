export type SeatStatus = 'AVAILABLE' | 'HELD' | 'RESERVED';

export interface EventResponse {
  id: number;
  title: string;
  date: string; // ISO 8601 형식
  createdAt: string;
  updatedAt: string;
}

export interface SeatResponse {
  id: number;
  seatNumber: string;
  eventId: number;
  status: SeatStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ReservationResponse {
  id: number;
  userId: number;
  seatId: number;
  createdAt: string;
  updatedAt: string;
}

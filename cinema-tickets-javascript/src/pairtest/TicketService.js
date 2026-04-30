import TicketPaymentService from '../thirdparty/paymentgateway/TicketPaymentService.js';
import SeatReservationService from '../thirdparty/seatbooking/SeatReservationService.js';
import InvalidPurchaseException from './lib/InvalidPurchaseException.js';

// Ticket prices in pounds
const TICKET_PRICES = {
  INFANT: 0,
  CHILD: 15,
  ADULT: 25,
};

const MAX_TICKETS = 25;

export default class TicketService {
  #paymentService;
  #reservationService;

  constructor() {
    this.#paymentService = new TicketPaymentService();
    this.#reservationService = new SeatReservationService();
  }

  /**
   * Main method to purchase tickets.
   * @param {number} accountId - Must be greater than 0
   * @param {...TicketTypeRequest} ticketTypeRequests - One or more ticket requests
   */
  purchaseTickets(accountId, ...ticketTypeRequests) {
    // Validate account ID
    this.#validateAccountId(accountId);

    // Validate ticket requests exist
    if (!ticketTypeRequests || ticketTypeRequests.length === 0) {
      throw new InvalidPurchaseException('No ticket requests provided');
    }

    // Count tickets by type
    const ticketCounts = this.#countTickets(ticketTypeRequests);

    // Validate business rules
    this.#validateTicketRules(ticketCounts);

    // Calculate total amount to pay
    const totalAmount = this.#calculateTotalAmount(ticketCounts);

    // Calculate total seats to reserve (infants don't get a seat)
    const totalSeats = ticketCounts.ADULT + ticketCounts.CHILD;

    // Make payment
    this.#paymentService.makePayment(accountId, totalAmount);

    // Reserve seats
    this.#reservationService.reserveSeat(accountId, totalSeats);
  }

  /**
   * Validates the account ID is a positive integer
   */
  #validateAccountId(accountId) {
    if (!Number.isInteger(accountId) || accountId <= 0) {
      throw new InvalidPurchaseException('Invalid account ID. Account ID must be a positive integer greater than zero.');
    }
  }

  /**
   * Counts the number of tickets per type from the requests
   */
  #countTickets(ticketTypeRequests) {
    const counts = { ADULT: 0, CHILD: 0, INFANT: 0 };

    for (const request of ticketTypeRequests) {
      const type = request.getTicketType();
      const quantity = request.getNoOfTickets();
      counts[type] += quantity;
    }

    return counts;
  }

  /**
   * Validates all business rules
   */
  #validateTicketRules(ticketCounts) {
    const totalTickets = ticketCounts.ADULT + ticketCounts.CHILD + ticketCounts.INFANT;

    // Must purchase at least one ticket
    if (totalTickets === 0) {
      throw new InvalidPurchaseException('At least one ticket must be purchased.');
    }

    // Cannot exceed 25 tickets
    if (totalTickets > MAX_TICKETS) {
      throw new InvalidPurchaseException(`Cannot purchase more than ${MAX_TICKETS} tickets at a time. You requested ${totalTickets}.`);
    }

    // Child and Infant tickets require at least one Adult ticket
    if (ticketCounts.ADULT === 0 && (ticketCounts.CHILD > 0 || ticketCounts.INFANT > 0)) {
      throw new InvalidPurchaseException('Child and Infant tickets cannot be purchased without at least one Adult ticket.');
    }

    // There must be enough adults for infants (each infant sits on one adult's lap)
    if (ticketCounts.INFANT > ticketCounts.ADULT) {
      throw new InvalidPurchaseException(`There are more Infants (${ticketCounts.INFANT}) than Adults (${ticketCounts.ADULT}). Each infant must sit on an adult's lap.`);
    }
  }

  /**
   * Calculates the total cost of all tickets
   */
  #calculateTotalAmount(ticketCounts) {
    return (
      ticketCounts.ADULT * TICKET_PRICES.ADULT +
      ticketCounts.CHILD * TICKET_PRICES.CHILD +
      ticketCounts.INFANT * TICKET_PRICES.INFANT
    );
  }
}

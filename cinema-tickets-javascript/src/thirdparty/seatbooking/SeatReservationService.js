/* eslint-disable */

export default class SeatReservationService {
  reserveSeat(accountId, totalSeatsToAllocate) {
    if (!Number.isInteger(accountId)) {
      throw new TypeError('accountId must be an integer');
    }

    if (!Number.isInteger(totalSeatsToAllocate)) {
      throw new TypeError('totalSeatsToAllocate must be an integer');
    }
    // External seat reservation provider - no implementation needed
    console.log(`${totalSeatsToAllocate} seat(s) reserved for account ${accountId}`);
  }
}

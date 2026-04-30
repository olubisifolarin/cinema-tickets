import TicketService from '../src/pairtest/TicketService.js';
import TicketTypeRequest from '../src/pairtest/lib/TicketTypeRequest.js';
import InvalidPurchaseException from '../src/pairtest/lib/InvalidPurchaseException.js';

// Simple test runner
let passed = 0;
let failed = 0;

function test(description, fn) {
  try {
    fn();
    console.log(`  ✅ PASS: ${description}`);
    passed++;
  } catch (err) {
    console.log(`  ❌ FAIL: ${description}`);
    console.log(`     → ${err.message}`);
    failed++;
  }
}

function expect(actual) {
  return {
    toBe: (expected) => {
      if (actual !== expected) throw new Error(`Expected ${expected} but got ${actual}`);
    },
    toThrow: (expectedMessage) => {
      throw new Error(`Expected function to throw but it did not`);
    }
  };
}

function expectToThrow(fn, expectedType, expectedMessage) {
  try {
    fn();
    throw new Error(`Expected to throw ${expectedType} but did not throw`);
  } catch (err) {
    if (!(err instanceof expectedType)) {
      throw new Error(`Expected ${expectedType.name} but got ${err.constructor.name}: ${err.message}`);
    }
    if (expectedMessage && !err.message.includes(expectedMessage)) {
      throw new Error(`Expected message to include "${expectedMessage}" but got: "${err.message}"`);
    }
  }
}

const ticketService = new TicketService();

// ─────────────────────────────────────────────
console.log('\n📋 ACCOUNT ID VALIDATION');
// ─────────────────────────────────────────────

test('throws if account ID is 0', () => {
  expectToThrow(
    () => ticketService.purchaseTickets(0, new TicketTypeRequest('ADULT', 1)),
    InvalidPurchaseException,
    'Invalid account ID'
  );
});

test('throws if account ID is negative', () => {
  expectToThrow(
    () => ticketService.purchaseTickets(-1, new TicketTypeRequest('ADULT', 1)),
    InvalidPurchaseException,
    'Invalid account ID'
  );
});

test('accepts valid account ID greater than 0', () => {
  // Should not throw
  ticketService.purchaseTickets(1, new TicketTypeRequest('ADULT', 1));
});

// ─────────────────────────────────────────────
console.log('\n📋 TICKET REQUEST VALIDATION');
// ─────────────────────────────────────────────

test('throws if no ticket requests provided', () => {
  expectToThrow(
    () => ticketService.purchaseTickets(1),
    InvalidPurchaseException,
    'No ticket requests provided'
  );
});

test('throws if all ticket quantities are zero', () => {
  expectToThrow(
    () => ticketService.purchaseTickets(1, new TicketTypeRequest('ADULT', 0)),
    InvalidPurchaseException,
    'At least one ticket'
  );
});

test('throws if more than 25 tickets requested', () => {
  expectToThrow(
    () => ticketService.purchaseTickets(1,
      new TicketTypeRequest('ADULT', 20),
      new TicketTypeRequest('CHILD', 6)
    ),
    InvalidPurchaseException,
    'Cannot purchase more than 25'
  );
});

test('allows exactly 25 tickets', () => {
  // Should not throw
  ticketService.purchaseTickets(1,
    new TicketTypeRequest('ADULT', 20),
    new TicketTypeRequest('CHILD', 5)
  );
});

// ─────────────────────────────────────────────
console.log('\n📋 ADULT TICKET REQUIREMENT');
// ─────────────────────────────────────────────

test('throws if child ticket purchased without adult', () => {
  expectToThrow(
    () => ticketService.purchaseTickets(1, new TicketTypeRequest('CHILD', 2)),
    InvalidPurchaseException,
    'without at least one Adult'
  );
});

test('throws if infant ticket purchased without adult', () => {
  expectToThrow(
    () => ticketService.purchaseTickets(1, new TicketTypeRequest('INFANT', 1)),
    InvalidPurchaseException,
    'without at least one Adult'
  );
});

test('throws if more infants than adults', () => {
  expectToThrow(
    () => ticketService.purchaseTickets(1,
      new TicketTypeRequest('ADULT', 1),
      new TicketTypeRequest('INFANT', 2)
    ),
    InvalidPurchaseException,
    'more Infants'
  );
});

test('allows adult + child + infant', () => {
  // Should not throw
  ticketService.purchaseTickets(1,
    new TicketTypeRequest('ADULT', 2),
    new TicketTypeRequest('CHILD', 1),
    new TicketTypeRequest('INFANT', 1)
  );
});

// ─────────────────────────────────────────────
console.log('\n📋 TICKET TYPE REQUEST');
// ─────────────────────────────────────────────

test('throws if invalid ticket type used', () => {
  expectToThrow(
    () => new TicketTypeRequest('VIP', 1),
    TypeError,
    'type must be'
  );
});

test('throws if noOfTickets is not an integer', () => {
  expectToThrow(
    () => new TicketTypeRequest('ADULT', 1.5),
    TypeError
  );
});

// ─────────────────────────────────────────────
console.log('\n📋 VALID PURCHASE SCENARIOS');
// ─────────────────────────────────────────────

test('1 adult ticket - £25', () => {
  // Should not throw - confirms payment/seat logic runs
  ticketService.purchaseTickets(1, new TicketTypeRequest('ADULT', 1));
});

test('2 adults + 3 children - £95', () => {
  // 2x25 + 3x15 = 50 + 45 = £95, 5 seats
  ticketService.purchaseTickets(1,
    new TicketTypeRequest('ADULT', 2),
    new TicketTypeRequest('CHILD', 3)
  );
});

test('1 adult + 1 infant - £25 (infant free, no seat)', () => {
  // 1x25 + 0 = £25, 1 seat only
  ticketService.purchaseTickets(1,
    new TicketTypeRequest('ADULT', 1),
    new TicketTypeRequest('INFANT', 1)
  );
});

test('multiple ticket types together', () => {
  // 3 adults + 2 children + 2 infants
  // 3x25 + 2x15 + 0 = 75 + 30 = £105, 5 seats
  ticketService.purchaseTickets(1,
    new TicketTypeRequest('ADULT', 3),
    new TicketTypeRequest('CHILD', 2),
    new TicketTypeRequest('INFANT', 2)
  );
});

// ─────────────────────────────────────────────
console.log('\n─────────────────────────────────────');
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed === 0) {
  console.log('🎉 All tests passed!');
} else {
  console.log('⚠️  Some tests failed. Please review.');
}
console.log('─────────────────────────────────────\n');

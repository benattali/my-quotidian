/** Server-side tuning constants. */

/**
 * A quote will not be reused as the global "quote of the day" if it was used
 * within this many days. With a quotes pool in the thousands and one pick per
 * day, a 180-day window is comfortably satisfiable and guarantees no quote
 * recurs within ~6 months (and never same-as-yesterday).
 */
export const DEDUPE_WINDOW_DAYS = 180;

/** How many times to re-roll the API when we hit a recently-used quote. */
export const MAX_DEDUPE_RETRIES = 12;

/**
 * When a user's local time is at or past their notify time by less than this
 * many minutes, and they haven't received the current quote yet, we push. This
 * window absorbs missed/late scheduler ticks without ever double-sending
 * (the lastNotifiedQuoteId guard prevents duplicates).
 */
export const NOTIFY_WINDOW_MINUTES = 30;

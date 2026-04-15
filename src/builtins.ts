import type { FunctionDescriptor } from './types.js';
import type { Registry } from './registry.js';

/** All built-in IntelMesh CEL functions. */
const BUILTIN_FUNCTIONS: readonly FunctionDescriptor[] = [
  {
    name: 'history.exists',
    params: [
      { name: 'event_type', type: 'string' },
      { name: 'field', type: 'string' },
      { name: 'value', type: 'string' },
      { name: 'duration', type: 'string' },
    ],
    returnType: 'bool',
    description:
      'Checks if an event with the given field value exists in the history within the specified time window.',
    examples: [
      'history.exists("purchase", "card_number", event.metadata.card_number, "24h")',
      'history.exists("login", "user_id", event.metadata.user_id, "1h")',
    ],
  },
  {
    name: 'history.count',
    params: [
      { name: 'event_type', type: 'string' },
      { name: 'field', type: 'string' },
      { name: 'value', type: 'string' },
      { name: 'duration', type: 'string' },
    ],
    returnType: 'int',
    description:
      'Counts the number of events matching the given field value within the specified time window.',
    examples: [
      'history.count("purchase", "card_number", event.metadata.card_number, "24h") > 5',
      'history.count("login_failed", "user_id", event.metadata.user_id, "1h") >= 3',
    ],
  },
  {
    name: 'history.sum',
    params: [
      { name: 'event_type', type: 'string' },
      { name: 'field', type: 'string' },
      { name: 'value', type: 'string' },
      { name: 'sum_field', type: 'string' },
      { name: 'duration', type: 'string' },
    ],
    returnType: 'double',
    description:
      'Sums the values of a numeric field across matching events within the specified time window.',
    examples: [
      'history.sum("purchase", "card_number", event.metadata.card_number, "amount", "24h") > 10000.0',
    ],
  },
  {
    name: 'history.distinct_count',
    params: [
      { name: 'event_type', type: 'string' },
      { name: 'field', type: 'string' },
      { name: 'value', type: 'string' },
      { name: 'distinct_field', type: 'string' },
      { name: 'duration', type: 'string' },
    ],
    returnType: 'int',
    description:
      'Counts the number of distinct values for a field across matching events within the specified time window.',
    examples: [
      'history.distinct_count("purchase", "card_number", event.metadata.card_number, "merchant_id", "24h") > 3',
    ],
  },
  {
    name: 'history.last',
    params: [
      { name: 'event_type', type: 'string' },
      { name: 'field', type: 'string' },
      { name: 'value', type: 'string' },
      { name: 'return_field', type: 'string' },
    ],
    returnType: 'string',
    description:
      'Returns the value of a field from the most recent matching event in the history.',
    examples: [
      'history.last("purchase", "card_number", event.metadata.card_number, "merchant_id")',
    ],
  },
  {
    name: 'score.get',
    params: [
      { name: 'score_name', type: 'string' },
      { name: 'key', type: 'string' },
    ],
    returnType: 'double',
    description: 'Retrieves a pre-computed score by name and key.',
    examples: [
      'score.get("fraud_score", event.metadata.user_id) > 0.8',
      'score.get("risk_level", event.metadata.card_number) >= 0.5',
    ],
  },
  {
    name: 'score.current',
    params: [],
    returnType: 'int',
    description:
      'Returns the transient score accumulated so far in the current pipeline execution. ' +
      'Use this in late-phase rules to react to the running risk score.',
    examples: [
      'score.current() > 80',
      "score.current() > 50 && !list.contains('trusted', event.metadata.device_id)",
    ],
  },
  {
    name: 'list.contains',
    params: [
      { name: 'list_name', type: 'string' },
      { name: 'value', type: 'string' },
    ],
    returnType: 'bool',
    description: 'Checks if a value exists in a named list (blocklist, allowlist, etc.).',
    examples: [
      'list.contains("blocked_cards", event.metadata.card_number)',
      'list.contains("vip_users", event.metadata.user_id)',
    ],
  },
];

/**
 * Registers all built-in IntelMesh CEL functions into a registry.
 * @param registry - The registry to populate.
 */
export function registerBuiltins(registry: Registry): void {
  for (const fn of BUILTIN_FUNCTIONS) {
    registry.registerFunction(fn);
  }
}

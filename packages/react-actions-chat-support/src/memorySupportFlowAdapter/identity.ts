import type { SupportUserIdentity } from '../supportFlowTypes';

/**
 * Returns whether two customer identity records refer to the same customer.
 *
 * @param candidate - Candidate identity or record being compared.
 * @param customer - Customer identity used for the support action.
 */
export function matchesIdentity(
  candidate: SupportUserIdentity,
  customer: SupportUserIdentity
): boolean {
  if (customer.id && candidate.id && customer.id === candidate.id) {
    return true;
  }

  if (
    customer.email &&
    candidate.email &&
    customer.email.toLowerCase() === candidate.email.toLowerCase()
  ) {
    return true;
  }

  return false;
}

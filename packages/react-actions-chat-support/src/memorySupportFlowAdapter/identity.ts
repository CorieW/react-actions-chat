import type { SupportUserIdentity } from '../supportFlowTypes';

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

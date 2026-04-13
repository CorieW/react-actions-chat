import { describe, expect, it } from 'vitest';
import {
  attemptDemoLogin,
  findDemoAccount,
  isValidEmailAddress,
  maskEmailAddress,
  verifyOneTimeCode,
} from './loginDemo';

describe('login demo helpers', () => {
  it('validates email addresses after trimming whitespace', () => {
    expect(isValidEmailAddress('  alex@northstar.app  ')).toBe(true);
    expect(isValidEmailAddress('alex@northstar')).toBe(false);
  });

  it('finds demo accounts case-insensitively', () => {
    expect(findDemoAccount(' SAM@NORTHSTAR.APP ')?.fullName).toBe('Sam Rivera');
  });

  it('returns a success result for the standard password flow', () => {
    expect(attemptDemoLogin('sam@northstar.app', 'Support!2026')).toMatchObject(
      {
        kind: 'success',
      }
    );
  });

  it('returns an MFA challenge for the protected account', () => {
    expect(
      attemptDemoLogin('alex@northstar.app', 'Northstar!24')
    ).toMatchObject({
      kind: 'requires-one-time-code',
    });
  });

  it('rejects an invalid password', () => {
    expect(
      attemptDemoLogin('maya@northstar.app', 'wrong-password')
    ).toMatchObject({
      kind: 'invalid-password',
    });
  });

  it('verifies the one-time code for the MFA account', () => {
    expect(verifyOneTimeCode('alex@northstar.app', ' 246810 ')).toBe(true);
    expect(verifyOneTimeCode('alex@northstar.app', '111111')).toBe(false);
  });

  it('masks email addresses for the challenge prompt', () => {
    expect(maskEmailAddress('alex@northstar.app')).toBe('al**@northstar.app');
  });
});

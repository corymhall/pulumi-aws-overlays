import * as pulumi from '@pulumi/pulumi';
import { setMocks, promiseOf } from './mocks';
import { sha1hash, ifUndefined, withAlias, withAliases } from '../src/utils';

beforeAll(() => {
  setMocks();
});

describe('sha1hash', () => {
  it('produces an 8-character hex string', () => {
    const hash = sha1hash('test-input');
    expect(hash).toHaveLength(8);
    expect(hash).toMatch(/^[0-9a-f]{8}$/);
  });

  it('produces consistent results for the same input', () => {
    const hash1 = sha1hash('consistent-test');
    const hash2 = sha1hash('consistent-test');
    expect(hash1).toBe(hash2);
  });

  it('produces different results for different inputs', () => {
    const hash1 = sha1hash('input-one');
    const hash2 = sha1hash('input-two');
    expect(hash1).not.toBe(hash2);
  });
});

describe('ifUndefined', () => {
  it('returns the input value when defined', async () => {
    const result = ifUndefined(pulumi.output('defined-value'), 'default-value');
    const resolved = await promiseOf(result);
    expect(resolved).toBe('defined-value');
  });

  it('returns the default value when input is undefined', async () => {
    const result = ifUndefined(undefined, pulumi.output('default-value'));
    const resolved = await promiseOf(result);
    expect(resolved).toBe('default-value');
  });

  it('works with plain values', async () => {
    const result = ifUndefined('plain-input', 'plain-default');
    const resolved = await promiseOf(result);
    expect(resolved).toBe('plain-input');
  });
});

describe('withAlias', () => {
  it('adds an alias to empty options', () => {
    const opts = {};
    const result = withAlias(opts, { name: 'old-name' });
    expect(result.aliases).toHaveLength(1);
    expect(result.aliases![0]).toEqual({ name: 'old-name' });
  });

  it('preserves existing aliases', () => {
    const opts = { aliases: [{ name: 'existing-alias' }] };
    const result = withAlias(opts, { name: 'new-alias' });
    expect(result.aliases).toHaveLength(2);
    expect(result.aliases![0]).toEqual({ name: 'existing-alias' });
    expect(result.aliases![1]).toEqual({ name: 'new-alias' });
  });

  it('does not mutate the original options', () => {
    const opts = { aliases: [{ name: 'original' }] };
    withAlias(opts, { name: 'added' });
    expect(opts.aliases).toHaveLength(1);
  });
});

describe('withAliases', () => {
  it('adds multiple aliases to empty options', () => {
    const opts = {};
    const result = withAliases(opts, [
      { name: 'alias-1' },
      { name: 'alias-2' },
    ]);
    expect(result.aliases).toHaveLength(2);
  });

  it('merges with existing aliases', () => {
    const opts = { aliases: [{ name: 'existing' }] };
    const result = withAliases(opts, [{ name: 'new-1' }, { name: 'new-2' }]);
    expect(result.aliases).toHaveLength(3);
  });

  it('handles empty aliases array', () => {
    const opts = { aliases: [{ name: 'existing' }] };
    const result = withAliases(opts, []);
    expect(result.aliases).toHaveLength(1);
  });
});

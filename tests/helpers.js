import { closeDatabase, openDatabase } from '../src/db.js';
import config from '../src/config.js';
import { createLocalAccount } from '../src/domain/accounts.js';

config.federation.enabled = false;

export function freshDatabase() {
  closeDatabase();
  openDatabase(':memory:');
}

export const makeAccount = (username, options = {}) =>
  createLocalAccount({ username, password: 'a-long-enough-password', ...options });

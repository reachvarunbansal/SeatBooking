import { describe, expect, it } from 'vitest';
import { parseEnvironment } from '../../src/config/environment.js';

const validEnvironment = {
  DATABASE_URL: 'postgresql://postgres:postgres@localhost:5434/seat_selection',
};

describe('parseEnvironment', () => {
  it('applies defaults to optional settings', () => {
    expect(parseEnvironment(validEnvironment)).toMatchObject({
      NODE_ENV: 'development',
      PORT: 4000,
      CORS_ORIGIN: '*',
      ADMIN_TOKEN: '',
      OPENAI_API_KEY: '',
      OPENAI_MODEL: 'gpt-4o-mini',
    });
  });

  it('reports invalid required and numeric settings clearly', () => {
    expect(() => parseEnvironment({ ...validEnvironment, PORT: '70000' })).toThrow(
      /Invalid environment configuration: PORT/,
    );
    expect(() => parseEnvironment({ DATABASE_URL: 'not-a-postgres-url' })).toThrow(
      /Invalid environment configuration: DATABASE_URL/,
    );
  });
});
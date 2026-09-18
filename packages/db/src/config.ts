import { z } from 'zod';

const configSchema = z.object({
  DATABASE_URL: z.string().url().default('postgres://equip:equip@localhost:5432/equip_ai'),
});

export const dbConfig = configSchema.parse(process.env);

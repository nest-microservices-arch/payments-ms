import 'dotenv/config';
import * as joi from 'joi';

interface EnvVars {
  PORT: number;
  STRIPE_SECRET: string;
}

const envsSchema = joi
  .object<EnvVars>({
    PORT: joi.number().required(),
    STRIPE_SECRET: joi.string().required(),
  })
  .unknown(true);

const result = envsSchema.validate(process.env);

if (result.error) {
  throw new Error(`Error validating envs: ${result.error.message}`);
}

const envVars: EnvVars = result.value;

export const envs = {
  PORT: envVars.PORT,
  STRIPE_SECRET: envVars.STRIPE_SECRET,
};

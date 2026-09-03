import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

export async function hashValue(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export async function compareValue(plain: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(plain, hashed);
}

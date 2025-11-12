import bcrypt from 'bcrypt';
import { config } from '@config/env';

/**
 * Service for handling password hashing and verification
 */
export class PasswordService {
  private readonly saltRounds: number;

  constructor() {
    this.saltRounds = config.security.bcryptSaltRounds;
  }

  /**
   * Hash a plain text password
   * @param password - Plain text password to hash
   * @returns Hashed password
   */
  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  /**
   * Verify a plain text password against a hash
   * @param password - Plain text password to verify
   * @param hash - Hashed password to compare against
   * @returns True if password matches, false otherwise
   */
  async verify(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}

// Export singleton instance
export const passwordService = new PasswordService();

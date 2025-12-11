import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { PaymentConfigService, UpdatePaymentConfigData } from './payment-config.service';
import { pool } from '../../../config/database';
import { cacheService } from '../../../shared/services/cache.service';

/**
 * Property-Based Tests for Payment Configuration Service
 * 
 * Feature: checkout-parcelamento-pix, Property 7: Configurações afetam novos checkouts
 * Validates: Requirements 7.4
 */

describe('PaymentConfigService - Property-Based Tests', () => {
  let service: PaymentConfigService;
  let mockConfigId: string;

  beforeEach(async () => {
    // Restore all mocks before each test
    vi.restoreAllMocks();
    
    service = new PaymentConfigService();
    mockConfigId = 'test-config-id';

    // Clear cache before each test
    await cacheService.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * Property 7: Configurações afetam novos checkouts
   * 
   * For any valid configuration update, the updateConfig method should
   * return a configuration object with the updated values applied.
   */
  it('Property 7: Configuration changes affect new checkouts', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate valid configuration updates
        fc.record({
          maxInstallments: fc.integer({ min: 1, max: 24 }),
          pixDiscountPercent: fc.float({ min: 0, max: 50, noNaN: true }),
          installmentsWithoutInterest: fc.integer({ min: 0, max: 24 }),
          pixExpirationMinutes: fc.integer({ min: 5, max: 1440 }),
        }),
        async (configUpdate: UpdatePaymentConfigData) => {
          // Ensure installmentsWithoutInterest doesn't exceed maxInstallments
          if (configUpdate.installmentsWithoutInterest! > configUpdate.maxInstallments!) {
            configUpdate.installmentsWithoutInterest = configUpdate.maxInstallments;
          }

          // Mock database responses
          const mockCurrentConfig = {
            id: mockConfigId,
            maxInstallments: 12,
            pixDiscountPercent: 10,
            installmentsWithoutInterest: 12,
            pixExpirationMinutes: 30,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          const mockUpdatedConfig = {
            id: mockConfigId,
            maxInstallments: configUpdate.maxInstallments!,
            pixDiscountPercent: configUpdate.pixDiscountPercent!,
            installmentsWithoutInterest: configUpdate.installmentsWithoutInterest!,
            pixExpirationMinutes: configUpdate.pixExpirationMinutes!,
            createdAt: mockCurrentConfig.createdAt,
            updatedAt: new Date(),
          };

          // Reset mocks for each iteration
          vi.restoreAllMocks();
          const querySpy = vi.spyOn(pool, 'query');
          
          // Setup mock responses
          querySpy
            // First call: getConfig in updateConfig
            .mockResolvedValueOnce({
              rows: [mockCurrentConfig],
              command: 'SELECT',
              rowCount: 1,
              oid: 0,
              fields: [],
            } as any)
            // Second call: UPDATE in updateConfig
            .mockResolvedValueOnce({
              rows: [mockUpdatedConfig],
              command: 'UPDATE',
              rowCount: 1,
              oid: 0,
              fields: [],
            } as any);

          // Update configuration
          const updatedConfig = await service.updateConfig(configUpdate);

          // Property: The updated config should have the new values
          expect(updatedConfig.maxInstallments).toBe(configUpdate.maxInstallments);
          expect(updatedConfig.pixDiscountPercent).toBeCloseTo(configUpdate.pixDiscountPercent!, 2);
          expect(updatedConfig.installmentsWithoutInterest).toBe(configUpdate.installmentsWithoutInterest);
          expect(updatedConfig.pixExpirationMinutes).toBe(configUpdate.pixExpirationMinutes);
        }
      ),
      { numRuns: 100 } // Run 100 iterations as specified in design doc
    );
  });

  /**
   * Additional property: Configuration validation rejects invalid values
   * 
   * For any configuration with values outside valid ranges,
   * the update should throw an error.
   */
  it('Property: Invalid configurations are rejected', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          // Invalid maxInstallments
          fc.record({
            maxInstallments: fc.oneof(
              fc.integer({ max: 0 }),
              fc.integer({ min: 25 })
            ),
          }),
          // Invalid pixDiscountPercent
          fc.record({
            pixDiscountPercent: fc.oneof(
              fc.float({ min: -10, max: Math.fround(-0.01), noNaN: true }),
              fc.float({ min: Math.fround(50.01), max: 100, noNaN: true })
            ),
          }),
          // Invalid installmentsWithoutInterest
          fc.record({
            installmentsWithoutInterest: fc.integer({ max: -1 }),
          }),
          // Invalid pixExpirationMinutes
          fc.record({
            pixExpirationMinutes: fc.oneof(
              fc.integer({ max: 4 }),
              fc.integer({ min: 1441 })
            ),
          })
        ),
        async (invalidConfig: UpdatePaymentConfigData) => {
          // Mock database response for getConfig
          const mockCurrentConfig = {
            id: mockConfigId,
            maxInstallments: 12,
            pixDiscountPercent: 10,
            installmentsWithoutInterest: 12,
            pixExpirationMinutes: 30,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          vi.spyOn(pool, 'query').mockResolvedValueOnce({
            rows: [mockCurrentConfig],
            command: 'SELECT',
            rowCount: 1,
            oid: 0,
            fields: [],
          } as any);

          // Property: Invalid configuration should throw an error
          await expect(service.updateConfig(invalidConfig)).rejects.toThrow();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Cache is cleared after configuration update
   * 
   * For any configuration update, the cache should be cleared
   * to ensure new values are fetched.
   */
  it('Property: Cache is cleared after update', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          maxInstallments: fc.integer({ min: 1, max: 24 }),
          pixDiscountPercent: fc.float({ min: 0, max: 50, noNaN: true }),
        }),
        async (configUpdate: UpdatePaymentConfigData) => {
          const mockCurrentConfig = {
            id: mockConfigId,
            maxInstallments: 12,
            pixDiscountPercent: 10,
            installmentsWithoutInterest: 12,
            pixExpirationMinutes: 30,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          const mockUpdatedConfig = {
            ...mockCurrentConfig,
            ...configUpdate,
            updatedAt: new Date(),
          };

          // Spy on cache delete
          const deleteSpy = vi.spyOn(cacheService, 'delete');

          vi.spyOn(pool, 'query')
            .mockResolvedValueOnce({
              rows: [mockCurrentConfig],
              command: 'SELECT',
              rowCount: 1,
              oid: 0,
              fields: [],
            } as any)
            .mockResolvedValueOnce({
              rows: [mockUpdatedConfig],
              command: 'UPDATE',
              rowCount: 1,
              oid: 0,
              fields: [],
            } as any);

          await service.updateConfig(configUpdate);

          // Property: Cache delete should have been called
          expect(deleteSpy).toHaveBeenCalled();
        }
      ),
      { numRuns: 100 }
    );
  });
});

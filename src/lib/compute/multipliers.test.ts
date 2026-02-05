import { describe, it, expect } from 'vitest';
import {
  getMultiplier,
  getMultiplierForCounts,
  computeNetworkCounts,
  SCALING_DRIVERS,
  FIXED_MULTIPLIER_BUCKETS,
  DC_SCOPED_BUCKETS,
  DU_SCALED_BUCKETS,
} from './multipliers';

describe('multipliers', () => {
  describe('SCALING_DRIVERS', () => {
    it('should have correct driver constants', () => {
      expect(SCALING_DRIVERS.PER_SITE).toBe('per_site');
      expect(SCALING_DRIVERS.PER_CU).toBe('per_cu');
      expect(SCALING_DRIVERS.PER_DC).toBe('per_dc');
      expect(SCALING_DRIVERS.PER_DU).toBe('per_du');
    });
  });

  describe('FIXED_MULTIPLIER_BUCKETS', () => {
    it('should include testing and integration buckets', () => {
      expect(FIXED_MULTIPLIER_BUCKETS).toContain('cluster_acceptance_testing');
      expect(FIXED_MULTIPLIER_BUCKETS).toContain('network_acceptance_testing');
      expect(FIXED_MULTIPLIER_BUCKETS).toContain('core_integration');
    });
  });

  describe('DC_SCOPED_BUCKETS', () => {
    it('should include CU/DC hardware and software buckets', () => {
      expect(DC_SCOPED_BUCKETS).toContain('cu_server');
      expect(DC_SCOPED_BUCKETS).toContain('switches_tor_oob');
      expect(DC_SCOPED_BUCKETS).toContain('cu_software_per_dc');
    });
  });

  describe('DU_SCALED_BUCKETS', () => {
    it('should include cloud per DU bucket', () => {
      expect(DU_SCALED_BUCKETS).toContain('cloud_per_du_at_site');
    });
  });

  describe('getMultiplier', () => {
    const mockCounts = {
      sites: 100,
      cus: 10,
      dcs: 5,
      dus: 200,
      sitesByScopeId: { 'arch-1': 60, 'arch-2': 40 },
      cusByScopeId: { 'arch-1': 6, 'arch-2': 4 },
      dcsByScopeId: { 'arch-1': 3, 'arch-2': 2 },
      dusByScopeId: { 'arch-1': 120, 'arch-2': 80 },
    };

    it('should return total sites for per_site driver with network_global scope', () => {
      const result = getMultiplier('per_site', 'network_global', null, mockCounts);
      expect(result).toBe(100);
    });

    it('should return archetype sites for per_site driver with site_archetype scope', () => {
      const result = getMultiplier('per_site', 'site_archetype', 'arch-1', mockCounts);
      expect(result).toBe(60);
    });

    it('should return total CUs for per_cu driver', () => {
      const result = getMultiplier('per_cu', 'network_global', null, mockCounts);
      expect(result).toBe(10);
    });

    it('should return archetype CUs for per_cu driver with scope', () => {
      const result = getMultiplier('per_cu', 'site_archetype', 'arch-2', mockCounts);
      expect(result).toBe(4);
    });

    it('should return total DCs for per_dc driver', () => {
      const result = getMultiplier('per_dc', 'network_global', null, mockCounts);
      expect(result).toBe(5);
    });

    it('should return 1 for fixed driver', () => {
      const result = getMultiplier('fixed', 'network_global', null, mockCounts);
      expect(result).toBe(1);
    });

    it('should return 1 for per_year driver', () => {
      const result = getMultiplier('per_year', 'network_global', null, mockCounts);
      expect(result).toBe(1);
    });

    it('should return 1 for per_year_deployment driver', () => {
      const result = getMultiplier('per_year_deployment', 'network_global', null, mockCounts);
      expect(result).toBe(1);
    });

    it('should return 1 for unknown driver', () => {
      const result = getMultiplier('unknown_driver', 'network_global', null, mockCounts);
      expect(result).toBe(1);
    });

    it('should override to DC count for DC-scoped buckets', () => {
      const result = getMultiplier('per_dc', 'network_global', null, mockCounts, 'cu_server');
      expect(result).toBe(5); // Uses DC count
    });

    it('should override to DU count for DU-scaled buckets', () => {
      const result = getMultiplier('per_site', 'network_global', null, mockCounts, 'cloud_per_du_at_site');
      expect(result).toBe(200); // Uses DU count
    });

    it('should return 0 for missing scope ID', () => {
      const result = getMultiplier('per_site', 'site_archetype', 'nonexistent', mockCounts);
      expect(result).toBe(0);
    });
  });

  describe('getMultiplierForCounts', () => {
    const mockCounts = {
      sites: 50,
      cus: 5,
      dcs: 2,
      dus: 100,
      sitesByScopeId: {},
      cusByScopeId: {},
      dcsByScopeId: {},
      dusByScopeId: {},
    };

    it('should return sites for per_site driver', () => {
      const result = getMultiplierForCounts('per_site', 'some_bucket', mockCounts);
      expect(result).toBe(50);
    });

    it('should return CUs for per_cu driver', () => {
      const result = getMultiplierForCounts('per_cu', 'some_bucket', mockCounts);
      expect(result).toBe(5);
    });

    it('should return DCs for per_dc driver', () => {
      const result = getMultiplierForCounts('per_dc', 'some_bucket', mockCounts);
      expect(result).toBe(2);
    });

    it('should return 1 for per_du driver (not directly supported)', () => {
      const result = getMultiplierForCounts('per_du', 'some_bucket', mockCounts);
      expect(result).toBe(1); // Falls through to default
    });

    it('should override to DC count for DC-scoped bucket', () => {
      const result = getMultiplierForCounts('per_site', 'cu_server', mockCounts);
      expect(result).toBe(2);
    });
  });

  describe('computeNetworkCounts', () => {
    it('should compute totals from archetypes', () => {
      const archetypes = [
        { id: 'arch-1', numSites: 60, numCus: 6, numDcs: 3, numDusPerSite: 2 },
        { id: 'arch-2', numSites: 40, numCus: 4, numDcs: 2, numDusPerSite: 1 },
      ];

      const result = computeNetworkCounts(archetypes);

      expect(result.sites).toBe(100);
      expect(result.cus).toBe(10);
      expect(result.dcs).toBe(5);
      expect(result.dus).toBe(160); // 60*2 + 40*1
    });

    it('should compute per-scope counts', () => {
      const archetypes = [
        { id: 'arch-1', numSites: 60, numCus: 6, numDcs: 3, numDusPerSite: 2 },
        { id: 'arch-2', numSites: 40, numCus: 4, numDcs: 2, numDusPerSite: 1 },
      ];

      const result = computeNetworkCounts(archetypes);

      expect(result.sitesByScopeId['arch-1']).toBe(60);
      expect(result.sitesByScopeId['arch-2']).toBe(40);
      expect(result.cusByScopeId['arch-1']).toBe(6);
      expect(result.dcsByScopeId['arch-2']).toBe(2);
      expect(result.dusByScopeId['arch-1']).toBe(120);
    });

    it('should default numDusPerSite to 1 if not provided', () => {
      const archetypes = [
        { id: 'arch-1', numSites: 50, numCus: 5, numDcs: 2 },
      ];

      const result = computeNetworkCounts(archetypes);

      expect(result.dus).toBe(50); // 50 * 1
      expect(result.dusByScopeId['arch-1']).toBe(50);
    });

    it('should return zeros for empty archetypes', () => {
      const result = computeNetworkCounts([]);

      expect(result.sites).toBe(0);
      expect(result.cus).toBe(0);
      expect(result.dcs).toBe(0);
      expect(result.dus).toBe(0);
    });
  });
});

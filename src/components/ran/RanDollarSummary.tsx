'use client';

import React from 'react';
import { DomainDollarSummary } from '@/components/summary/DomainDollarSummary';

/**
 * RAN Dollar Summary component.
 * Thin wrapper around the reusable DomainDollarSummary for the 'ran' domain.
 */
export function RanDollarSummary() {
  return (
    <DomainDollarSummary
      domain="ran"
      emptyText="Select or create a scenario to view the RAN summary"
    />
  );
}

/**
 * Pre-built Insight Types for TCO Analysis
 *
 * Each insight type has a specific prompt strategy for analyzing
 * different aspects of the TCO model.
 */

export type InsightType =
  | 'cost_drivers'
  | 'optimization_opportunities'
  | 'benchmark_comparison'
  | 'staffing_analysis'
  | 'license_optimization'
  | 'deployment_pacing'
  | 'general';

export interface InsightPrompt {
  type: InsightType;
  label: string;
  description: string;
  systemPromptAddition: string;
  userPromptTemplate: string;
}

export const INSIGHT_PROMPTS: Record<InsightType, InsightPrompt> = {
  cost_drivers: {
    type: 'cost_drivers',
    label: 'Analyze Cost Drivers',
    description: 'Identify the top cost contributors across domains and lifecycle phases',
    systemPromptAddition: `
Focus on identifying and ranking the major cost drivers. Look at:
- CAPEX vs OPEX split
- Day 0/1/2 distribution
- Domain breakdown (RAN, Cloud, OSS)
- Per-site vs fixed costs
- Scaling factors and their impact`,
    userPromptTemplate: `Analyze the cost drivers in this TCO model. Identify the top 5 contributors to both CAPEX and OPEX, and explain why they're significant.`,
  },

  optimization_opportunities: {
    type: 'optimization_opportunities',
    label: 'Find Optimizations',
    description: 'Suggest specific, actionable ways to reduce costs',
    systemPromptAddition: `
Identify specific optimization opportunities with concrete recommendations. Consider:
- Automation potential for reducing staffing
- Power efficiency improvements
- Software licensing optimizations
- Deployment schedule adjustments
- Consolidation opportunities

Always provide specific bucket names and proposed percentage changes.`,
    userPromptTemplate: `Analyze this TCO model and suggest specific optimizations to reduce costs. For each suggestion, provide the bucket to modify and the expected savings.`,
  },

  benchmark_comparison: {
    type: 'benchmark_comparison',
    label: 'Benchmark Comparison',
    description: 'Compare costs against industry benchmarks',
    systemPromptAddition: `
Compare the costs against typical industry benchmarks for OpenRAN deployments:
- Site costs should typically be $50K-150K depending on configuration
- Power costs range from $3K-8K per site annually
- Staffing ratios vary: NOC typically 1:100-200 sites, RAN Ops 1:50-100 sites
- Software support is typically 15-20% of license value annually

Identify areas where costs seem above or below benchmark.`,
    userPromptTemplate: `Compare this TCO model against industry benchmarks. Are there any areas where costs seem unusually high or low compared to typical OpenRAN deployments?`,
  },

  staffing_analysis: {
    type: 'staffing_analysis',
    label: 'Staffing Analysis',
    description: 'Analyze staffing costs and automation potential',
    systemPromptAddition: `
Focus on staffing and labor costs across:
- NOC (Network Operations Center) staffing
- SOC (Security Operations Center) staffing
- RAN Operations staffing
- Professional services and contractors

Consider automation levels and their impact on headcount.
Look for opportunities to reduce through:
- Increased auto-remediation
- Better tooling and dashboards
- AI/ML-assisted operations
- Consolidation of functions`,
    userPromptTemplate: `Analyze the staffing costs in this TCO model. What are the main drivers and how could automation reduce these costs?`,
  },

  license_optimization: {
    type: 'license_optimization',
    label: 'License Optimization',
    description: 'Analyze software licensing and subscription costs',
    systemPromptAddition: `
Focus on software licensing analysis:
- Compare perpetual vs subscription licensing
- Identify over-licensed components
- Look for bundling opportunities
- Consider open-source alternatives where applicable
- Evaluate support tier requirements

Calculate the impact of spreading perpetual licenses over multiple years.`,
    userPromptTemplate: `Analyze the software licensing costs in this TCO model. Are there opportunities to optimize through different licensing models or consolidation?`,
  },

  deployment_pacing: {
    type: 'deployment_pacing',
    label: 'Deployment Analysis',
    description: 'Analyze deployment schedule impact on TCO',
    systemPromptAddition: `
Analyze the deployment schedule and its TCO impact:
- How does phased deployment affect cash flow?
- What's the CAPEX profile over time?
- How does cumulative OPEX grow as sites deploy?
- Are there benefits to accelerating or slowing deployment?
- Consider NPV implications of timing changes

Look at year-over-year changes and suggest schedule optimizations.`,
    userPromptTemplate: `Analyze how the deployment schedule affects TCO. What would be the impact of changing the deployment pace?`,
  },

  general: {
    type: 'general',
    label: 'General Analysis',
    description: 'General TCO analysis based on user query',
    systemPromptAddition: '',
    userPromptTemplate: '',
  },
};

/**
 * Detect the insight type from user input
 */
export function detectInsightType(prompt: string): InsightType {
  const lowerPrompt = prompt.toLowerCase();

  if (lowerPrompt.includes('cost driver') || lowerPrompt.includes('main cost') || lowerPrompt.includes('biggest cost')) {
    return 'cost_drivers';
  }

  if (
    lowerPrompt.includes('optimize') ||
    lowerPrompt.includes('reduce') ||
    lowerPrompt.includes('save') ||
    lowerPrompt.includes('cut cost') ||
    lowerPrompt.includes('lower cost')
  ) {
    return 'optimization_opportunities';
  }

  if (lowerPrompt.includes('benchmark') || lowerPrompt.includes('compare') || lowerPrompt.includes('industry')) {
    return 'benchmark_comparison';
  }

  if (lowerPrompt.includes('staff') || lowerPrompt.includes('personnel') || lowerPrompt.includes('noc') || lowerPrompt.includes('soc')) {
    return 'staffing_analysis';
  }

  if (lowerPrompt.includes('license') || lowerPrompt.includes('subscription') || lowerPrompt.includes('software cost')) {
    return 'license_optimization';
  }

  if (lowerPrompt.includes('deploy') || lowerPrompt.includes('schedule') || lowerPrompt.includes('pacing') || lowerPrompt.includes('rollout')) {
    return 'deployment_pacing';
  }

  return 'general';
}

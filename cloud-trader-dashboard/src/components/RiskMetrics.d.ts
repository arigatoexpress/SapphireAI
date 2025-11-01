import React from 'react';
import { DashboardPortfolio } from '../api/client';
interface RiskMetricsProps {
    portfolio?: DashboardPortfolio;
}
declare const RiskMetrics: React.FC<RiskMetricsProps>;
export default RiskMetrics;

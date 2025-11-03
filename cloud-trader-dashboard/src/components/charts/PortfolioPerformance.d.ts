import React from 'react';
interface PerformanceDatum {
    timestamp: string | number;
    balance?: number;
    price?: number;
}
interface PortfolioPerformanceProps {
    balanceSeries: PerformanceDatum[];
    priceSeries: PerformanceDatum[];
}
declare const PortfolioPerformance: React.FC<PortfolioPerformanceProps>;
export default PortfolioPerformance;

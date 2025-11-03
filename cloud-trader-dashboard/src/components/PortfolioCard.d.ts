import React from 'react';
import { DashboardPortfolio } from '../api/client';
interface PortfolioCardProps {
    portfolio?: DashboardPortfolio;
}
declare const PortfolioCard: React.FC<PortfolioCardProps>;
export default PortfolioCard;

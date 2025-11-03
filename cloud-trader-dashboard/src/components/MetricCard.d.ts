import React from 'react';
interface MetricCardProps {
    label: string;
    value: React.ReactNode;
    delta?: {
        value: number;
        label?: string;
    } | null;
    icon?: string;
    accent?: 'emerald' | 'teal' | 'amber' | 'slate';
    footer?: React.ReactNode;
}
declare const MetricCard: React.FC<MetricCardProps>;
export default MetricCard;

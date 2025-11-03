import React from 'react';
type AuroraVariant = 'sapphire' | 'emerald' | 'amber';
type AuroraIntensity = 'soft' | 'bold';
interface AuroraFieldProps {
    className?: string;
    variant?: AuroraVariant;
    intensity?: AuroraIntensity;
}
declare const AuroraField: React.FC<AuroraFieldProps>;
export default AuroraField;

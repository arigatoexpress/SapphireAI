import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const AuroraField = ({ className = '', variant = 'sapphire', intensity = 'soft', }) => {
    const variantClass = `aurora-variant-${variant}`;
    const intensityClass = `aurora-intensity-${intensity}`;
    return (_jsxs("div", { className: `aurora-field ${variantClass} ${intensityClass} ${className}`.trim(), "aria-hidden": "true", children: [_jsx("span", { className: "aurora-layer aurora-layer-primary" }), _jsx("span", { className: "aurora-layer aurora-layer-secondary" }), _jsx("span", { className: "aurora-noise" }), _jsx("span", { className: "aurora-grid" })] }));
};
export default AuroraField;

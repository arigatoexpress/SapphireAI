import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useMemo, useRef } from 'react';
import { createChart, ColorType } from 'lightweight-charts';
const toUnix = (input) => {
    const date = typeof input === 'number' ? new Date(input) : new Date(input);
    return Math.floor(date.getTime() / 1000);
};
const PortfolioPerformance = ({ balanceSeries, priceSeries }) => {
    const containerRef = useRef(null);
    const chartRef = useRef(null);
    const areaSeriesRef = useRef(null);
    const lineSeriesRef = useRef(null);
    const balanceData = useMemo(() => balanceSeries
        .filter((point) => typeof point.balance === 'number')
        .map((point) => ({
        time: toUnix(point.timestamp),
        value: point.balance ?? 0,
    })), [balanceSeries]);
    const priceData = useMemo(() => priceSeries
        .filter((point) => typeof point.price === 'number')
        .map((point) => ({
        time: toUnix(point.timestamp),
        value: point.price ?? 0,
    })), [priceSeries]);
    useEffect(() => {
        if (!containerRef.current)
            return;
        const chart = createChart(containerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: 'transparent' },
                textColor: '#cbd5f5',
                fontFamily: 'Inter',
            },
            grid: {
                horzLines: { color: 'rgba(148, 163, 184, 0.08)' },
                vertLines: { color: 'rgba(148, 163, 184, 0.08)' },
            },
            localization: {
                timeFormatter: (time) => new Date(time * 1000).toLocaleTimeString(),
            },
            rightPriceScale: {
                borderVisible: false,
                textColor: '#cbd5f5',
            },
            timeScale: {
                borderVisible: false,
                timeVisible: true,
                secondsVisible: false,
            },
        });
        chartRef.current = chart;
        const areaSeries = chart.addAreaSeries({
            lineColor: 'rgba(76, 99, 255, 1)',
            topColor: 'rgba(76, 99, 255, 0.25)',
            bottomColor: 'rgba(76, 99, 255, 0.02)',
            priceFormat: {
                type: 'custom',
                formatter: (price) => `$${price.toFixed(2)}`,
            },
        });
        const lineSeries = chart.addLineSeries({
            color: 'rgba(34, 211, 238, 0.9)',
            lineWidth: 2,
            priceFormat: {
                type: 'custom',
                formatter: (price) => `$${price.toFixed(2)}`,
            },
        });
        areaSeriesRef.current = areaSeries;
        lineSeriesRef.current = lineSeries;
        const observer = new ResizeObserver(() => {
            if (containerRef.current) {
                chart.applyOptions({
                    width: containerRef.current.clientWidth,
                    height: containerRef.current.clientHeight,
                });
            }
        });
        observer.observe(containerRef.current);
        return () => {
            observer.disconnect();
            chart.remove();
            chartRef.current = null;
            areaSeriesRef.current = null;
            lineSeriesRef.current = null;
        };
    }, []);
    useEffect(() => {
        if (areaSeriesRef.current && balanceData.length > 0) {
            areaSeriesRef.current.setData(balanceData);
        }
        if (lineSeriesRef.current && priceData.length > 0) {
            lineSeriesRef.current.setData(priceData);
        }
        if (chartRef.current) {
            chartRef.current.timeScale().fitContent();
        }
    }, [balanceData, priceData]);
    return _jsx("div", { ref: containerRef, className: "h-64 w-full" });
};
export default PortfolioPerformance;

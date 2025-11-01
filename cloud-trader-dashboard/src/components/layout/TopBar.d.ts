import React from 'react';
interface TopBarProps {
    onRefresh: () => void;
    lastUpdated?: string;
    healthRunning?: boolean;
}
declare const TopBar: React.FC<TopBarProps>;
export default TopBar;

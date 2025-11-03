import React from 'react';
interface CouncilMessage {
    id: string;
    type: string;
    sender: string;
    timestamp: string;
    content: string;
    context?: string;
}
interface MCPCouncilProps {
    messages: CouncilMessage[];
    status?: string;
}
declare const MCPCouncil: React.FC<MCPCouncilProps>;
export default MCPCouncil;

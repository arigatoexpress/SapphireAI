from __future__ import annotations

from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class MCPRole(str, Enum):
    AGENT = "agent"
    COORDINATOR = "coordinator"
    OBSERVER = "observer"


class MCPMessageType(str, Enum):
    OBSERVATION = "observation"
    PROPOSAL = "proposal"
    CRITIQUE = "critique"
    QUERY = "query"
    RESPONSE = "response"
    CONSENSUS = "consensus"
    EXECUTION = "execution"
    HEARTBEAT = "heartbeat"


class MCPMessage(BaseModel):
    session_id: str = Field(..., description="Unique identifier for MCP collaboration session")
    sender_id: str = Field(..., description="Agent or coordinator unique id")
    sender_role: MCPRole = Field(..., description="Role of sender within MCP session")
    message_type: MCPMessageType = Field(..., description="Type of MCP message")
    payload: Dict[str, Any] = Field(default_factory=dict, description="Message-specific data")
    timestamp: Optional[str] = Field(default=None, description="ISO timestamp")


class MCPObservationPayload(BaseModel):
    market: Dict[str, Any] = Field(default_factory=dict)
    risk_state: Dict[str, Any] = Field(default_factory=dict)
    telemetry: Dict[str, Any] = Field(default_factory=dict)


class MCPProposalPayload(BaseModel):
    symbol: str
    side: str
    notional: float
    confidence: float
    rationale: str
    constraints: List[str] = Field(default_factory=list)


class MCPQueryPayload(BaseModel):
    reference_id: str
    question: str
    topic: str
    context: Dict[str, Any] = Field(default_factory=dict)


class MCPResponsePayload(BaseModel):
    reference_id: str
    answer: str
    confidence: float
    supplementary: Optional[Dict[str, Any]] = None


class MPCritiquePayload(BaseModel):
    reference_id: str
    concerns: List[str] = Field(default_factory=list)
    alternative: Optional[Dict[str, Any]] = None


class MCPConsensusPayload(BaseModel):
    approved: bool
    consensus_score: float
    participants: List[str]
    notes: Optional[str] = None


class MCPExecutionPayload(BaseModel):
    order_id: str
    status: str
    error: Optional[str] = None
    tx_hash: Optional[str] = None


class MCPHeartbeatPayload(BaseModel):
    healthy: bool = True
    latency_ms: Optional[int] = None


class MCPMessageEnvelope(BaseModel):
    message: MCPMessage
    schema_version: str = Field(default="1.0.0")

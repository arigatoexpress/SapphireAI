"""Advanced agent memory and context sharing system."""

from __future__ import annotations

import asyncio
import logging
import json
import hashlib
from collections import defaultdict, deque
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Set, Any, Tuple, Callable
from enum import Enum

from .time_sync import get_timestamp_us, get_precision_clock
from .market_regime import MarketRegime, RegimeMetrics
from .cache import get_cache, BaseCache

logger = logging.getLogger(__name__)


class MemoryType(Enum):
    """Types of agent memories."""
    TRADE_OUTCOME = "trade_outcome"
    MARKET_INSIGHT = "market_insight"
    STRATEGY_LEARNING = "strategy_learning"
    RISK_OBSERVATION = "risk_observation"
    CORRELATION_PATTERN = "correlation_pattern"
    REGIME_TRANSITION = "regime_transition"
    ANOMALY_DETECTION = "anomaly_detection"


class MemoryImportance(Enum):
    """Importance levels for memories."""
    LOW = 1
    MEDIUM = 2
    HIGH = 3
    CRITICAL = 4


@dataclass
class AgentMemory:
    """A single memory item from an agent."""
    memory_id: str
    agent_id: str
    memory_type: MemoryType
    content: Dict[str, Any]
    importance: MemoryImportance
    confidence: float  # 0-1
    timestamp_us: int
    tags: Set[str] = field(default_factory=set)
    related_memories: Set[str] = field(default_factory=set)
    access_count: int = 0
    last_accessed: Optional[int] = None
    validation_count: int = 0  # How many times this memory was validated/corroborated

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization."""
        return {
            "memory_id": self.memory_id,
            "agent_id": self.agent_id,
            "memory_type": self.memory_type.value,
            "content": self.content,
            "importance": self.importance.value,
            "confidence": self.confidence,
            "timestamp_us": self.timestamp_us,
            "tags": list(self.tags),
            "related_memories": list(self.related_memories),
            "access_count": self.access_count,
            "last_accessed": self.last_accessed,
            "validation_count": self.validation_count
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> AgentMemory:
        """Create from dictionary."""
        return cls(
            memory_id=data["memory_id"],
            agent_id=data["agent_id"],
            memory_type=MemoryType(data["memory_type"]),
            content=data["content"],
            importance=MemoryImportance(data["importance"]),
            confidence=data["confidence"],
            timestamp_us=data["timestamp_us"],
            tags=set(data.get("tags", [])),
            related_memories=set(data.get("related_memories", [])),
            access_count=data.get("access_count", 0),
            last_accessed=data.get("last_accessed"),
            validation_count=data.get("validation_count", 0)
        )

    def update_access(self) -> None:
        """Update access statistics."""
        self.access_count += 1
        self.last_accessed = get_timestamp_us()

    def validate(self) -> None:
        """Increment validation count."""
        self.validation_count += 1


@dataclass
class SharedContext:
    """Shared context information that multiple agents can access."""
    context_id: str
    symbol: str
    regime: Optional[MarketRegime]
    active_memories: List[str]  # Memory IDs relevant to current context
    market_state: Dict[str, Any]  # Current market conditions
    agent_contributions: Dict[str, Dict[str, Any]]  # What each agent is contributing
    consensus_signals: List[Dict[str, Any]]  # Recent consensus decisions
    risk_assessment: Dict[str, Any]  # Current risk profile
    timestamp_us: int
    ttl_seconds: int = 3600  # How long this context remains active

    def is_expired(self, current_time_us: int) -> bool:
        """Check if context has expired."""
        return (current_time_us - self.timestamp_us) > (self.ttl_seconds * 1_000_000)

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization."""
        return {
            "context_id": self.context_id,
            "symbol": self.symbol,
            "regime": self.regime.value if self.regime else None,
            "active_memories": self.active_memories,
            "market_state": self.market_state,
            "agent_contributions": self.agent_contributions,
            "consensus_signals": self.consensus_signals,
            "risk_assessment": self.risk_assessment,
            "timestamp_us": self.timestamp_us,
            "ttl_seconds": self.ttl_seconds
        }


class AgentMemoryManager:
    """
    Advanced memory management system for agents with context sharing.

    Features:
    - Long-term memory storage with importance-based retention
    - Context-aware memory retrieval
    - Agent-to-agent memory sharing and validation
    - Memory consolidation and pattern recognition
    - Cache-backed storage for performance
    """

    def __init__(self, max_memories_per_agent: int = 1000, consolidation_interval: int = 3600):
        self.max_memories_per_agent = max_memories_per_agent
        self.consolidation_interval = consolidation_interval  # seconds

        # Memory storage
        self.agent_memories: Dict[str, Dict[str, AgentMemory]] = defaultdict(dict)
        self.shared_contexts: Dict[str, SharedContext] = {}
        self.memory_index: Dict[str, Set[str]] = defaultdict(set)  # tag -> memory_ids

        # Cache for performance
        self._cache: Optional[BaseCache] = None
        self._cache_ready = False

        # Memory consolidation
        self.last_consolidation = get_timestamp_us()
        self.consolidation_task: Optional[asyncio.Task[None]] = None

        # Callbacks
        self.memory_callbacks: List[Callable[[AgentMemory], None]] = []
        self.context_callbacks: List[Callable[[SharedContext], None]] = []

        # Memory statistics
        self.stats = {
            "total_memories": 0,
            "shared_contexts": 0,
            "memory_hits": 0,
            "context_hits": 0,
            "consolidations_performed": 0
        }

    async def initialize(self) -> None:
        """Initialize the memory manager."""
        try:
            self._cache = await get_cache()
            self._cache_ready = self._cache.is_connected()
            if self._cache_ready:
                logger.info("Agent memory manager cache initialized")
            else:
                logger.warning("Agent memory manager cache not available, using in-memory only")
        except Exception as e:
            logger.warning(f"Failed to initialize memory cache: {e}, using in-memory only")

        # Start consolidation task
        self.consolidation_task = asyncio.create_task(self._consolidation_loop())

    async def shutdown(self) -> None:
        """Shutdown the memory manager."""
        if self.consolidation_task:
            self.consolidation_task.cancel()
            try:
                await self.consolidation_task
            except asyncio.CancelledError:
                pass

    def add_memory_callback(self, callback: Callable[[AgentMemory], None]) -> None:
        """Add callback for new memories."""
        self.memory_callbacks.append(callback)

    def add_context_callback(self, callback: Callable[[SharedContext], None]) -> None:
        """Add callback for new shared contexts."""
        self.context_callbacks.append(callback)

    async def store_memory(self, memory: AgentMemory) -> str:
        """Store a memory and trigger callbacks."""
        agent_id = memory.agent_id
        memory_id = memory.memory_id

        # Store in memory
        self.agent_memories[agent_id][memory_id] = memory

        # Update index
        for tag in memory.tags:
            self.memory_index[tag].add(memory_id)

        # Cache if available
        if self._cache_ready:
            cache_key = f"memory:{agent_id}:{memory_id}"
            await self._cache.set(cache_key, memory.to_dict(), ttl=86400)  # 24 hours

        # Update statistics
        self.stats["total_memories"] += 1

        # Trigger callbacks
        for callback in self.memory_callbacks:
            try:
                callback(memory)
            except Exception as e:
                logger.error(f"Error in memory callback: {e}")

        # Manage memory limits
        await self._manage_memory_limits(agent_id)

        logger.debug(f"Stored memory {memory_id} for agent {agent_id}")
        return memory_id

    async def retrieve_memories(self, agent_id: str, tags: Optional[List[str]] = None,
                               memory_types: Optional[List[MemoryType]] = None,
                               min_importance: MemoryImportance = MemoryImportance.LOW,
                               limit: int = 50) -> List[AgentMemory]:
        """Retrieve memories with filtering options."""
        memories = []

        # Get candidate memories
        if agent_id in self.agent_memories:
            candidate_memories = list(self.agent_memories[agent_id].values())
        else:
            candidate_memories = []

        # Also check cache for memories that might not be in memory
        if self._cache_ready:
            try:
                # Get all memory keys for this agent
                pattern = f"memory:{agent_id}:*"
                cache_keys = await self._cache.scan_keys(pattern)
                for cache_key in cache_keys:
                    if cache_key not in [f"memory:{agent_id}:{m.memory_id}" for m in candidate_memories]:
                        cached_data = await self._cache.get(cache_key)
                        if cached_data:
                            try:
                                memory = AgentMemory.from_dict(cached_data)
                                candidate_memories.append(memory)
                            except Exception as e:
                                logger.warning(f"Failed to deserialize cached memory {cache_key}: {e}")
            except Exception as e:
                logger.warning(f"Error retrieving memories from cache: {e}")

        # Apply filters
        for memory in candidate_memories:
            # Tag filter
            if tags and not any(tag in memory.tags for tag in tags):
                continue

            # Type filter
            if memory_types and memory.memory_type not in memory_types:
                continue

            # Importance filter
            if memory.importance.value < min_importance.value:
                continue

            memory.update_access()
            memories.append(memory)

        # Sort by importance and recency
        memories.sort(key=lambda m: (m.importance.value, m.timestamp_us), reverse=True)

        # Limit results
        memories = memories[:limit]

        self.stats["memory_hits"] += len(memories)
        return memories

    async def share_memory(self, from_agent: str, to_agents: List[str],
                          memory_id: str, context: Optional[str] = None) -> Dict[str, bool]:
        """Share a memory from one agent to others."""
        if from_agent not in self.agent_memories or memory_id not in self.agent_memories[from_agent]:
            return {agent: False for agent in to_agents}

        original_memory = self.agent_memories[from_agent][memory_id]

        # Create shared memory with updated metadata
        results = {}
        for agent_id in to_agents:
            try:
                # Create a copy with shared context
                shared_memory = AgentMemory(
                    memory_id=f"{memory_id}_shared_{agent_id}_{get_timestamp_us()}",
                    agent_id=agent_id,  # Now owned by receiving agent
                    memory_type=original_memory.memory_type,
                    content={
                        **original_memory.content,
                        "shared_from": from_agent,
                        "shared_context": context,
                        "original_memory_id": memory_id
                    },
                    importance=max(original_memory.importance, MemoryImportance.MEDIUM),  # Boost importance
                    confidence=original_memory.confidence * 0.9,  # Slight confidence decay
                    timestamp_us=get_timestamp_us(),
                    tags=original_memory.tags | {"shared", f"from_{from_agent}"},
                    related_memories=original_memory.related_memories.copy()
                )

                await self.store_memory(shared_memory)
                results[agent_id] = True

                # Link memories
                original_memory.related_memories.add(shared_memory.memory_id)
                shared_memory.related_memories.add(memory_id)

            except Exception as e:
                logger.error(f"Failed to share memory {memory_id} with {agent_id}: {e}")
                results[agent_id] = False

        return results

    async def create_shared_context(self, symbol: str, regime: Optional[MarketRegime],
                                   contributing_agents: List[str]) -> str:
        """Create a shared context for collaborative decision making."""
        context_id = f"context_{symbol}_{get_timestamp_us()}"

        # Gather relevant memories
        active_memories = []
        market_state = {}
        agent_contributions = {}

        for agent_id in contributing_agents:
            # Get recent relevant memories
            memories = await self.retrieve_memories(
                agent_id=agent_id,
                tags=[symbol, regime.value if regime else "general"],
                limit=10
            )
            active_memories.extend([m.memory_id for m in memories])

            # Get agent contribution summary
            agent_contributions[agent_id] = {
                "memory_count": len(memories),
                "specialization": "general",  # Would be populated from agent registry
                "confidence_avg": sum(m.confidence for m in memories) / len(memories) if memories else 0
            }

        context = SharedContext(
            context_id=context_id,
            symbol=symbol,
            regime=regime,
            active_memories=list(set(active_memories)),  # Remove duplicates
            market_state=market_state,
            agent_contributions=agent_contributions,
            consensus_signals=[],
            risk_assessment={},
            timestamp_us=get_timestamp_us()
        )

        self.shared_contexts[context_id] = context
        self.stats["shared_contexts"] += 1

        # Cache context
        if self._cache_ready:
            cache_key = f"context:{context_id}"
            await self._cache.set(cache_key, context.to_dict(), ttl=context.ttl_seconds)

        # Trigger callbacks
        for callback in self.context_callbacks:
            try:
                callback(context)
            except Exception as e:
                logger.error(f"Error in context callback: {e}")

        logger.info(f"Created shared context {context_id} for {symbol} with {len(contributing_agents)} agents")
        return context_id

    async def get_shared_context(self, context_id: str) -> Optional[SharedContext]:
        """Retrieve a shared context."""
        context = self.shared_contexts.get(context_id)

        if not context and self._cache_ready:
            # Try cache
            cache_key = f"context:{context_id}"
            cached_data = await self._cache.get(cache_key)
            if cached_data:
                try:
                    context = SharedContext(
                        context_id=cached_data["context_id"],
                        symbol=cached_data["symbol"],
                        regime=MarketRegime(cached_data["regime"]) if cached_data["regime"] else None,
                        active_memories=cached_data["active_memories"],
                        market_state=cached_data["market_state"],
                        agent_contributions=cached_data["agent_contributions"],
                        consensus_signals=cached_data["consensus_signals"],
                        risk_assessment=cached_data["risk_assessment"],
                        timestamp_us=cached_data["timestamp_us"],
                        ttl_seconds=cached_data["ttl_seconds"]
                    )
                    self.shared_contexts[context_id] = context
                except Exception as e:
                    logger.warning(f"Failed to deserialize cached context {context_id}: {e}")
                    return None

        if context:
            current_time = get_timestamp_us()
            if context.is_expired(current_time):
                # Context expired, remove it
                if context_id in self.shared_contexts:
                    del self.shared_contexts[context_id]
                if self._cache_ready:
                    cache_key = f"context:{context_id}"
                    await self._cache.delete(cache_key)
                return None

            self.stats["context_hits"] += 1

        return context

    async def update_context_signal(self, context_id: str, signal: Dict[str, Any]) -> bool:
        """Update a shared context with a new consensus signal."""
        context = await self.get_shared_context(context_id)
        if not context:
            return False

        context.consensus_signals.append(signal)
        context.timestamp_us = get_timestamp_us()  # Refresh TTL

        # Update cache
        if self._cache_ready:
            cache_key = f"context:{context_id}"
            await self._cache.set(cache_key, context.to_dict(), ttl=context.ttl_seconds)

        return True

    async def validate_memory(self, agent_id: str, memory_id: str, validating_agent: str) -> bool:
        """Allow one agent to validate/corrobate another agent's memory."""
        if agent_id not in self.agent_memories or memory_id not in self.agent_memories[agent_id]:
            return False

        memory = self.agent_memories[agent_id][memory_id]
        memory.validate()

        # Create validation memory
        validation_memory = AgentMemory(
            memory_id=f"validation_{memory_id}_{validating_agent}_{get_timestamp_us()}",
            agent_id=validating_agent,
            memory_type=MemoryType.MARKET_INSIGHT,
            content={
                "validated_memory_id": memory_id,
                "original_agent": agent_id,
                "validation_type": "corroboration",
                "confidence_boost": 0.1
            },
            importance=MemoryImportance.MEDIUM,
            confidence=0.8,
            timestamp_us=get_timestamp_us(),
            tags={"validation", f"validates_{memory_id}"},
            related_memories={memory_id}
        )

        await self.store_memory(validation_memory)

        # Link back to original memory
        memory.related_memories.add(validation_memory.memory_id)

        return True

    async def _manage_memory_limits(self, agent_id: str) -> None:
        """Manage memory limits by removing least important memories."""
        memories = list(self.agent_memories[agent_id].values())

        if len(memories) <= self.max_memories_per_agent:
            return

        # Sort by importance (descending) and access count (descending)
        memories.sort(key=lambda m: (m.importance.value, m.access_count, m.validation_count), reverse=True)

        # Remove excess memories
        to_remove = memories[self.max_memories_per_agent:]
        for memory in to_remove:
            memory_id = memory.memory_id
            del self.agent_memories[agent_id][memory_id]

            # Remove from index
            for tag in memory.tags:
                self.memory_index[tag].discard(memory_id)

            # Remove from cache
            if self._cache_ready:
                cache_key = f"memory:{agent_id}:{memory_id}"
                await self._cache.delete(cache_key)

        logger.debug(f"Removed {len(to_remove)} memories for agent {agent_id} to maintain limit")

    async def _consolidation_loop(self) -> None:
        """Background task to consolidate and clean up memories."""
        while True:
            try:
                await asyncio.sleep(self.consolidation_interval)
                await self._perform_consolidation()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in memory consolidation: {e}")

    async def _perform_consolidation(self) -> None:
        """Perform memory consolidation and cleanup."""
        current_time = get_timestamp_us()
        consolidation_cutoff = current_time - (7 * 24 * 60 * 60 * 1_000_000)  # 7 days ago

        total_cleaned = 0

        # Clean expired contexts
        expired_contexts = [
            ctx_id for ctx_id, ctx in self.shared_contexts.items()
            if ctx.is_expired(current_time)
        ]
        for ctx_id in expired_contexts:
            del self.shared_contexts[ctx_id]
            if self._cache_ready:
                cache_key = f"context:{ctx_id}"
                await self._cache.delete(cache_key)
            total_cleaned += 1

        # Clean old low-importance memories
        for agent_id, memories in self.agent_memories.items():
            to_remove = []
            for memory_id, memory in memories.items():
                # Remove memories that are:
                # 1. Older than 7 days AND low importance AND rarely accessed
                if (memory.timestamp_us < consolidation_cutoff and
                    memory.importance == MemoryImportance.LOW and
                    memory.access_count < 3):
                    to_remove.append(memory_id)

            for memory_id in to_remove:
                memory = memories[memory_id]
                del memories[memory_id]

                # Clean up index
                for tag in memory.tags:
                    self.memory_index[tag].discard(memory_id)

                # Clean up cache
                if self._cache_ready:
                    cache_key = f"memory:{agent_id}:{memory_id}"
                    await self._cache.delete(cache_key)

                total_cleaned += 1

        self.stats["consolidations_performed"] += 1
        if total_cleaned > 0:
            logger.info(f"Memory consolidation cleaned {total_cleaned} items")

    def get_memory_stats(self) -> Dict[str, Any]:
        """Get comprehensive memory statistics."""
        agent_stats = {}
        for agent_id, memories in self.agent_memories.items():
            memory_types = {}
            importance_levels = {}
            total_confidence = 0
            total_access = 0

            for memory in memories.values():
                # Count by type
                mem_type = memory.memory_type.value
                memory_types[mem_type] = memory_types.get(mem_type, 0) + 1

                # Count by importance
                imp_level = memory.importance.value
                importance_levels[imp_level] = importance_levels.get(imp_level, 0) + 1

                total_confidence += memory.confidence
                total_access += memory.access_count

            agent_stats[agent_id] = {
                "total_memories": len(memories),
                "memory_types": memory_types,
                "importance_levels": importance_levels,
                "avg_confidence": total_confidence / len(memories) if memories else 0,
                "total_access": total_access,
                "avg_access_per_memory": total_access / len(memories) if memories else 0
            }

        return {
            "global_stats": self.stats.copy(),
            "agent_stats": agent_stats,
            "active_contexts": len(self.shared_contexts),
            "index_size": sum(len(memories) for memories in self.memory_index.values()),
            "cache_enabled": self._cache_ready
        }


# Global memory manager instance
_memory_manager: Optional[AgentMemoryManager] = None


async def get_agent_memory_manager() -> AgentMemoryManager:
    """Get global agent memory manager instance."""
    global _memory_manager
    if _memory_manager is None:
        _memory_manager = AgentMemoryManager()
        await _memory_manager.initialize()
    return _memory_manager

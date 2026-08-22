"""
Base AI Agent Class for BizPilot AI Multi-Agent System
Defines common interface, prompt schemas, and execution protocol for all agents.
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
from datetime import datetime
import json

class BaseBizPilotAgent(ABC):
    """
    Abstract Base Class for BizPilot Autonomous Agents.
    Every agent specifies:
    - agent_id: Unique string identifier
    - name: Human-readable name
    - role: Concise functional role
    - context: Operational context and domain scope
    - system_prompt: Full behavioral and instruction prompt
    - tasks: Dictionary of supported callable tasks
    - output_schema: Formal JSON structure specification of outputs
    """

    def __init__(
        self,
        agent_id: str,
        name: str,
        role: str,
        context: str,
        system_prompt: str,
        supported_tasks: List[Dict[str, Any]],
        output_schema: Dict[str, Any]
    ):
        self.agent_id = agent_id
        self.name = name
        self.role = role
        self.context = context
        self.system_prompt = system_prompt
        self.supported_tasks = supported_tasks
        self.output_schema = output_schema

    def get_spec(self) -> Dict[str, Any]:
        """Returns the full agent specification for inspection and API."""
        return {
            "agent_id": self.agent_id,
            "name": self.name,
            "role": self.role,
            "context": self.context,
            "system_prompt": self.system_prompt,
            "supported_tasks": self.supported_tasks,
            "output_schema": self.output_schema,
            "status": "ONLINE",
            "last_active": datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        }

    @abstractmethod
    def execute_task(self, task_name: str, payload: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Executes a defined task and returns standardized structured output."""
        pass

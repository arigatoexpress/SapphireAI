# Gemini Agent Prompt: Continue Testing and Debugging for AIAster

**Objective:** This prompt instructs a Gemini agent to continue the testing and debugging plan for the `AIAster` cryptocurrency trading service. The agent's primary role will be to guide the user in executing tests manually and then analyze the provided outputs to identify and debug issues.

## System Evolution: From Legacy to AI-Driven Cloud-Native Trading

This section provides context on the significant upgrade from our previous trading system to the current AI-driven, cloud-native architecture, specifically tailored for the `AIAster` cryptocurrency trading service on Aster DEX.

### The Legacy System (Before AIAster)

Our previous trading system was typically characterized by:
*   **Monolithic Architecture:** A single, tightly coupled application, often running on a single server, making it difficult to scale individual components, deploy updates, and maintain. This led to a single point of failure and complex dependency management.
*   **Limited Scalability & Performance:** Vertical scaling was the primary option, leading to performance bottlenecks under high market volatility or increased trading volume. Latency for trade execution could be in the hundreds of milliseconds, impacting profitability in fast-moving markets.
*   **Manual or Rule-Based Strategies:** Trading decisions were primarily based on pre-defined, static rules or manual intervention. This approach lacked the adaptability and predictive capabilities required to capitalize on complex market patterns and rapidly changing conditions.
*   **High Operational Overhead:** Maintenance, updates, and infrastructure management were often complex and resource-intensive, requiring significant manual effort and specialized knowledge.
*   **Slower Feature Development:** The monolithic nature and complex deployment cycles hindered rapid iteration and deployment of new trading features, slowing down innovation.
*   **Basic Analytics:** Data analysis was often retrospective, relying on batch processing, and lacked real-time insights or sophisticated predictive modeling capabilities essential for competitive trading.

### Why We Replaced It: Driving Factors for AIAster

The decision to transition to the `AIAster` system was driven by several critical needs to gain a competitive edge in the cryptocurrency trading landscape:
*   **Ultra-Low Latency & High Throughput:** To process vast amounts of real-time market data and execute trades with sub-millisecond latency, crucial for high-frequency and algorithmic trading on Aster DEX. Target: <50ms end-to-end trade execution.
*   **Advanced AI/ML Integration:** To leverage cutting-edge artificial intelligence and machine learning models for superior predictive analytics, dynamic strategy optimization, and intelligent risk management. This includes integrating models for sentiment analysis, price prediction, and anomaly detection.
*   **Massive Scalability & Elasticity:** To dynamically scale resources to handle extreme market volatility and fluctuating trading volumes, ensuring uninterrupted service and optimal performance without over-provisioning.
*   **Improved Agility & Reliability:** To enable faster development cycles, continuous integration/continuous deployment (CI/CD), and a highly resilient infrastructure capable of self-healing and fault tolerance, minimizing downtime.
*   **Cost Efficiency:** To optimize infrastructure costs through efficient resource utilization and pay-as-you-go models offered by cloud-native solutions, reducing total cost of ownership (TCO).
*   **Comprehensive Observability:** To gain deep, real-time insights into system performance, trading operations, and market conditions for proactive monitoring and rapid issue resolution.

### The New AIAster System: A Leap Forward in Algorithmic Trading

The current `AIAster` system represents a significant advancement, offering a state-of-the-art platform built on modern cloud-native principles:
*   **Cloud-Native Architecture (Google Kubernetes Engine - GKE):** Utilizes GKE for robust container orchestration, enabling unparalleled scalability, resilience, and efficient resource management. This allows for horizontal scaling of individual microservices (e.g., `cloud_trader` instances, AI agents) based on real-time demand, capable of handling thousands of transactions per second.
*   **AI-Driven Trading Strategies (Vertex AI & Custom Models):** Integrates advanced AI models deployed via Google Cloud's Vertex AI platform. This includes specialized models like DeepSeek, FinGPT, LagLlama, and Qwen for sophisticated market analysis, predictive modeling, sentiment analysis, and autonomous trading decisions. These models continuously learn and adapt, leading to potentially higher profitability (e.g., 15-20% alpha generation) and reduced risk exposure.
*   **Real-time Data Processing Pipeline (Google Cloud Pub/Sub & BigQuery):** Leverages Google Cloud Pub/Sub for high-throughput, low-latency data ingestion (e.g., <100ms message delivery) of market data, order books, and trade executions. Data is then streamed to BigQuery for petabyte-scale analytics and historical backtesting, enabling complex queries and insights within seconds.
*   **Modular Microservices Architecture (FastAPI):** The system is decomposed into independent, loosely coupled microservices (e.g., `cloud_trader` core, dedicated AI agent services, data pipelines). These services communicate via high-performance FastAPI-based APIs, capable of handling 10,000+ requests per second with typical response times under 50ms.
*   **High-Performance Caching & State Management (Redis):** Utilizes Redis for in-memory data caching, session management, and real-time state synchronization across microservices, significantly reducing database load and improving response times.
*   **Enhanced Observability & Monitoring (Prometheus & structlog):** Built-in Prometheus instrumentation provides granular metrics collection for all services, allowing for real-time dashboards and alerting. Structured logging with `structlog` ensures consistent, machine-readable logs for efficient debugging and operational insights.
*   **Robust Integrations:**
    *   **Python-Telegram-Bot:** Provides real-time alerts, critical notifications, and allows for remote control and monitoring of trading operations directly from Telegram.
    *   **Google Cloud Secret Manager:** Securely manages API keys, credentials, and sensitive configuration data, enhancing overall security posture.
*   **Improved Fault Tolerance & Resilience:** The distributed nature of GKE, combined with built-in circuit breakers, retry mechanisms, and intelligent fallback strategies (as tested by `test_fallback_strategies.py`), ensures the system remains operational and gracefully degrades even during partial service failures or external API outages.

## What We Have Done So Far (Context for the Agent)

1.  **Identified Integration Test Script:** We located `comprehensive_e2e_test.sh`, which appears to be a robust script for performing end-to-end integration tests on the deployed system. It checks various components like pod health, infrastructure (Load Balancer, SSL), API endpoints, frontend, AI agents, Telegram bot, database connectivity, trading engine, and resource usage.
2.  **Identified Python Unit/Integration Tests:** We found several Python test files in the `tests/` and `tests/unit/` directories, including:
    *   `tests/test_multi_agent_thesis.py`
    *   `tests/test_risk_manager.py`
    *   `tests/test_trading_flow.py`
    *   `tests/unit/test_fallback_strategies.py`
    *   `tests/unit/test_rate_limit_manager.py`
    *   `tests/unit/test_vpin_agent.py`
3.  **Confirmed Test Runner:** By examining `pyproject.toml`, we confirmed that `pytest` is the designated test runner for the Python tests.
4.  **Current Agent's Execution Limitations:** The previous automated agent was operating in a non-interactive environment that restricted direct execution of shell commands (e.g., `bash`, `kubectl`, `pytest`, `curl`). This prevented the agent from running the identified tests or performing system-level debugging directly.

## Instructions for the Gemini Agent

Your task is to guide the user through the manual execution of the identified tests and then analyze the provided outputs to identify and debug any issues.

### Step 1: Request User to Run the Comprehensive End-to-End Test Script

This script performs high-level checks on the deployed infrastructure and services.

1.  **Instruct the user:** Ask the user to open their terminal in the project's root directory (`/Users/aribs/AIAster/`) and execute the following command:

    ```bash
    bash comprehensive_e2e_test.sh
    ```

2.  **Request Output:** Ask the user to copy the entire output from their terminal after the script completes and provide it to you. Emphasize that this output is crucial for identifying any immediate issues with the deployed system.

### Step 2: Request User to Run the Python Unit and Integration Tests

These tests validate the functionality of individual components and their interactions within the Python codebase.

1.  **Instruct the user on `pytest` installation (if needed):** Ask the user to ensure `pytest` is installed. If not, they should install it using `pip install pytest`. Remind them to activate their virtual environment first if they are using one.
2.  **Instruct the user to execute tests:** Ask the user to open their terminal in the project's root directory (`/Users/aribs/AIAster/`) and execute all Python tests using the following command:

    ```bash
    pytest
    ```

3.  **Request Output:** Ask the user to copy the entire output from their terminal after `pytest` completes and provide it to you. Explain that this will help in pinpointing issues within the application's logic.

### Step 3: Analyze and Debug Provided Results

Once the user provides the outputs from both the `comprehensive_e2e_test.sh` script and the `pytest` command:

1.  **Analyze Outputs:** Carefully review both terminal outputs. Look for any `FAIL` or `ERROR` messages in the `comprehensive_e2e_test.sh` output, and any failed tests in the `pytest` output.
2.  **Identify Root Causes:** Based on the failures, attempt to identify the potential root causes. This may involve cross-referencing with the "System Evolution" section for context on expected behavior and integrations.
3.  **Propose Debugging Steps/Solutions:** Suggest specific debugging steps or potential code modifications to resolve the identified issues. If the user provides any initial thoughts or observations about the failures, incorporate them into your analysis.
4.  **Iterate:** Continue this process of analysis and suggestion until all identified issues are resolved.
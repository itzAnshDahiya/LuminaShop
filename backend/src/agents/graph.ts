import { StateGraph, END, START } from "@langchain/langgraph";
import { AgentStateAnnotation } from "./state";
import { routerNode, routerEdge } from "./router";
import { discoveryAgentNode } from "./discoveryAgent";
import { negotiationAgentNode } from "./negotiationAgent";
import { checkoutAgentNode } from "./checkoutAgent";
import { generalAgentNode } from "./generalAgent";

/**
 * Builds and compiles the LuminaShop LangGraph state machine.
 *
 * Graph topology:
 *
 *   START → router → [discovery_agent | negotiation_agent | checkout_agent | general_agent] → END
 */
export function buildCommerceGraph() {
  const graph = new StateGraph(AgentStateAnnotation)
    // ── Nodes ──────────────────────────────────────────────────────────────
    .addNode("router", routerNode)
    .addNode("discovery_agent", discoveryAgentNode)
    .addNode("negotiation_agent", negotiationAgentNode)
    .addNode("checkout_agent", checkoutAgentNode)
    .addNode("general_agent", generalAgentNode)

    // ── Edges ───────────────────────────────────────────────────────────────
    // Entry point: always start at the router
    .addEdge(START, "router")

    // Router uses a conditional edge to dispatch to the right agent
    .addConditionalEdges("router", routerEdge, {
      discovery_agent: "discovery_agent",
      negotiation_agent: "negotiation_agent",
      checkout_agent: "checkout_agent",
      general_agent: "general_agent",
    })

    // All agents terminate at END
    .addEdge("discovery_agent", END)
    .addEdge("negotiation_agent", END)
    .addEdge("checkout_agent", END)
    .addEdge("general_agent", END);

  return graph.compile();
}

// Singleton compiled graph
export const commerceGraph = buildCommerceGraph();

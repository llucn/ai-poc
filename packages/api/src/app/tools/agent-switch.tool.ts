import { defineServerTool } from '../tool-registry/define-server-tool';
import { z } from 'zod';

/**
 * Agent Switch Tool
 *
 * Switches the current session to a different agent based on user intent classification.
 * This tool is designed for the selector agent to route conversations to specialized agents.
 *
 * Target agents:
 * - operational: Business tasks (work orders, expenses, invoices, purchase orders)
 * - rag: Knowledge retrieval (documentation, policies, maintenance guides)
 * - general: General queries and fallback
 *
 * NOTE: This tool can only be called on the first turn of a session.
 * Subsequent calls will return an error.
 */

const AgentSwitchParams = z.object({
  agent: z
    .string()
    .min(1)
    .describe(
      'Target agent name. Must be one of: operational, rag, general. Case-insensitive.',
    ),
  confidence_score: z
    .number()
    .min(0.0)
    .max(1.0)
    .describe(
      'Classification confidence score between 0.0 and 1.0. Use >=0.8 for clear matches, <0.8 for ambiguous cases.',
    ),
  prompt_forward: z
    .string()
    .min(1)
    .describe(
      'User request to pass to the target agent. Pass the original message if clear, or simplify if it contains unnecessary context.',
    ),
});

export const agentSwitchTool = defineServerTool({
  name: 'agent-switch',
  description:
    'Switch the session to a different agent based on user intent. Use this tool to route the conversation to the appropriate specialized agent (operational, rag, or general). Can only be called on the first turn. Returns { switched: true, targetAgent: "..." } on success or { switched: false, error: "..." } on failure.',
  parameters: AgentSwitchParams,
  execute: async (params, context) => {
    // This execute function is not used directly.
    // Execution is routed through SessionService.executeTool()
    // which calls AgentSwitchToolService.
    // This placeholder ensures the tool definition is valid.
    return {
      error:
        'Direct execution not supported. Tool should be called through SessionService.',
    };
  },
});

import { Injectable, Logger } from '@nestjs/common';
import type { McpToolSchema } from '../agent/agent-tool.entity';

/**
 * MCP (Model Context Protocol) client service for communicating with MCP servers.
 *
 * Implements JSON-RPC over HTTP (Streamable-HTTP transport) for:
 * - Initializing connections
 * - Listing available tools
 * - Calling tools with parameters
 *
 * This service is extracted from agent.service.ts to allow reuse across
 * multiple contexts (agent management + session message handling).
 */
@Injectable()
export class McpClientService {
  private readonly logger = new Logger(McpClientService.name);

  /**
   * Fetch available tools from an MCP server.
   *
   * Performs the MCP handshake (initialize + tools/list) and returns
   * normalized tool schemas.
   */
  async fetchTools(serverUrl: string): Promise<McpToolSchema[]> {
    let sessionId: string | null = null;

    try {
      // Step 1: Initialize
      const initRes = await this.mcpRpc(serverUrl, 'initialize', {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'ai-poc', version: '1.0.0' },
      });

      // Capture session ID from response headers if present
      sessionId = initRes.headers.get('Mcp-Session-Id');
      this.logger.log(
        `Initialized MCP server ${serverUrl}${sessionId ? ` (session: ${sessionId})` : ''}`
      );

      // Step 2: List tools
      const listRes = await this.mcpRpc(
        serverUrl,
        'tools/list',
        {},
        sessionId
      );

      const body = await listRes.text();
      const contentType = listRes.headers.get('Content-Type') || '';

      let rpcResult: unknown;
      if (contentType.includes('text/event-stream')) {
        rpcResult = this.parseSseJsonRpc(body);
      } else {
        const parsed = JSON.parse(body);
        rpcResult = parsed.result !== undefined ? parsed.result : parsed;
      }

      return this.normalizeToolSchema(rpcResult);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`fetchTools failed for ${serverUrl}: ${msg}`);
      throw new Error(`MCP tools/list failed: ${msg}`);
    }
  }

  /**
   * Call an MCP tool with given parameters.
   *
   * @param serverUrl - The MCP server base URL
   * @param toolName - The tool name from mcp_schema
   * @param params - Tool parameters (arbitrary JSON object)
   * @returns Tool execution result (arbitrary JSON)
   */
  async callTool(
    serverUrl: string,
    toolName: string,
    params: unknown
  ): Promise<unknown> {
    let sessionId: string | null = null;

    try {
      // Step 1: Initialize (required for each call sequence)
      const initRes = await this.mcpRpc(serverUrl, 'initialize', {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'ai-poc', version: '1.0.0' },
      });

      sessionId = initRes.headers.get('Mcp-Session-Id');

      // Step 2: Call tool
      const callRes = await this.mcpRpc(
        serverUrl,
        'tools/call',
        { name: toolName, arguments: params },
        sessionId
      );

      const body = await callRes.text();
      const contentType = callRes.headers.get('Content-Type') || '';

      let rpcResult: unknown;
      if (contentType.includes('text/event-stream')) {
        rpcResult = this.parseSseJsonRpc(body);
      } else {
        const parsed = JSON.parse(body);
        rpcResult = parsed.result !== undefined ? parsed.result : parsed;
      }

      this.logger.log(`Tool ${toolName} executed successfully`);
      return rpcResult;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`callTool failed for ${toolName}: ${msg}`);
      throw err;
    }
  }

  /**
   * Send a JSON-RPC request to an MCP server over HTTP.
   *
   * @private
   */
  private async mcpRpc(
    serverUrl: string,
    method: string,
    params: unknown,
    sessionId: string | null = null
  ): Promise<Response> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
    };
    if (sessionId) {
      headers['Mcp-Session-Id'] = sessionId;
    }

    const body = JSON.stringify({
      jsonrpc: '2.0',
      id: Date.now(),
      method,
      params,
    });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
      const res = await fetch(serverUrl, {
        method: 'POST',
        headers,
        body,
        signal: controller.signal,
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      return res;
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Parse the last JSON-RPC message from an SSE stream.
   *
   * @private
   */
  private parseSseJsonRpc(body: string): unknown {
    const lines = body.split('\n').filter((line) => line.startsWith('data:'));
    if (lines.length === 0) {
      throw new Error('No SSE data lines found');
    }
    const lastLine = lines[lines.length - 1];
    const json = lastLine.substring('data:'.length).trim();
    const parsed = JSON.parse(json);
    return parsed.result !== undefined ? parsed.result : parsed;
  }

  /**
   * Normalize various MCP response shapes into a consistent tool schema array.
   *
   * @private
   */
  private normalizeToolSchema(data: unknown): McpToolSchema[] {
    if (!data || typeof data !== 'object') return [];

    const obj = data as Record<string, unknown>;

    // Case 1: { tools: [...] }
    if (Array.isArray(obj.tools)) {
      return obj.tools.map((t) => this.normalizeToolItem(t));
    }

    // Case 2: array at top level
    if (Array.isArray(data)) {
      return data.map((t) => this.normalizeToolItem(t));
    }

    // Case 3: single tool object
    if ('name' in obj) {
      return [this.normalizeToolItem(obj)];
    }

    return [];
  }

  /**
   * @private
   */
  private normalizeToolItem(item: unknown): McpToolSchema {
    if (!item || typeof item !== 'object') {
      return { name: 'unknown', description: null, parameters: null };
    }
    const obj = item as Record<string, unknown>;
    return {
      name: typeof obj.name === 'string' ? obj.name : 'unknown',
      description:
        typeof obj.description === 'string' ? obj.description : null,
      parameters: obj.parameters !== undefined ? obj.parameters : null,
    };
  }
}

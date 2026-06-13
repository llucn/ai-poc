import { z } from 'zod';
import { defineClientTool } from '../client-tool-executor';

// Demo tool: log a message to the browser console and return an echo object
// with a timestamp. Used to verify the end-to-end suspend/resume flow.
defineClientTool({
  name: 'console-log-echo',
  description:
    'Log a message to the browser console and return an echo object with a timestamp. Use this to demonstrate client-side tool execution.',
  parameters: z.object({
    message: z.string().describe('The message to log to the browser console'),
  }),
  handler: async (params) => {
    // eslint-disable-next-line no-console
    console.log(params.message);
    return { echo: params.message, timestamp: Date.now() };
  },
});

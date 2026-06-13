import { z } from 'zod';
import { defineClientTool } from '../client-tool-executor';

// Long-running Client Tool example: open a modal dialog, then resolve ONLY
// after the user types something and clicks Confirm (or Cancel) — which may
// be seconds or minutes later.
//
// This demonstrates that the suspend/resume architecture supports arbitrarily
// long client-side interaction: the handler returns a Promise that stays
// pending until the user acts. While it is pending:
//   - the browser holds no SSE connection (the server already res.end()'d
//     after dispatching `client_call`);
//   - the suspended LLM context lives in t_pending_client_call;
//   - nothing on the server is blocked.
// When the user finishes, the Promise resolves and the chat page POSTs the
// result to /client-result, resuming the agent loop.
//
// Client Tools are plain functions with no React context, so this mounts the
// dialog imperatively into document.body (reusing the app's modal CSS).

defineClientTool({
  name: 'prompt-input',
  description:
    'Open a dialog asking the user to type an answer to a question, and return what they entered. Use this when you need information that only the user can provide interactively. The user may take a long time to respond.',
  parameters: z.object({
    title: z.string().describe('Dialog title shown to the user'),
    question: z.string().describe('The question or prompt shown to the user'),
    placeholder: z
      .string()
      .optional()
      .describe('Optional placeholder text for the input field'),
  }),
  // The Promise resolves only when the user submits or cancels — however long
  // that takes. executeClientTool awaits it; the loop resumes afterward.
  handler: (params) =>
    new Promise<{ cancelled: boolean; value: string }>((resolve) => {
      const overlay = document.createElement('div');
      overlay.className = 'ic-modal-overlay';

      const modal = document.createElement('div');
      modal.className = 'ic-modal';
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');

      const title = document.createElement('h2');
      title.className = 'ic-modal-title';
      title.textContent = params.title;

      const question = document.createElement('p');
      question.textContent = params.question;
      question.style.margin = '0 0 12px';

      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'ic-input';
      if (params.placeholder) input.placeholder = params.placeholder;

      const actions = document.createElement('div');
      actions.className = 'ic-modal-actions';

      const cancelBtn = document.createElement('button');
      cancelBtn.type = 'button';
      cancelBtn.className = 'ic-btn ic-btn-secondary';
      cancelBtn.textContent = 'Cancel';

      const confirmBtn = document.createElement('button');
      confirmBtn.type = 'button';
      confirmBtn.className = 'ic-btn ic-btn-primary';
      confirmBtn.textContent = 'Confirm';

      // Tear down the dialog and resolve the Promise exactly once.
      let settled = false;
      const finish = (cancelled: boolean) => {
        if (settled) return;
        settled = true;
        document.removeEventListener('keydown', onKey);
        overlay.remove();
        resolve({ cancelled, value: cancelled ? '' : input.value });
      };

      const onKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape') finish(true);
        else if (e.key === 'Enter') finish(false);
      };

      cancelBtn.addEventListener('click', () => finish(true));
      confirmBtn.addEventListener('click', () => finish(false));
      document.addEventListener('keydown', onKey);

      actions.append(cancelBtn, confirmBtn);
      modal.append(title, question, input, actions);
      overlay.append(modal);
      document.body.append(overlay);
      input.focus();
    }),
});

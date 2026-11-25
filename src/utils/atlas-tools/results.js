// MCP tool results: a short sentence of what was done, or why it was not.
export const toolResult = (text) => ({ content: [{ text, type: 'text' }], isError: false });

export const toolErrorResult = (text) => ({ content: [{ text, type: 'text' }], isError: true });

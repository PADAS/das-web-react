// MCP tool results: a short sentence of what was done, or why it was not, and
// in _meta.status the outcome a caller can act on without reading the text.
export const TOOL_STATUSES = {
  APPLIED: 'applied',
  CANCELLED: 'cancelled',
  REFUSED: 'refused',
  SUPERSEDED: 'superseded',
  TIMEOUT: 'timeout',
};

export const toolResult = (text) => ({
  _meta: { status: TOOL_STATUSES.APPLIED },
  content: [{ text, type: 'text' }],
  isError: false,
});

export const toolErrorResult = (text, status = TOOL_STATUSES.REFUSED) => ({
  _meta: { status },
  content: [{ text, type: 'text' }],
  isError: true,
});

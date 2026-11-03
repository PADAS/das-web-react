// Otus reads the code to word its reply, so codes are part of the contract.
export const HOST_TOOL_ERROR_CODES = {
  FAILED: 'failed',
  INVALID_ARGUMENTS: 'invalid_arguments',
  NOT_FOUND: 'not_found',
  UNKNOWN_TOOL: 'unknown_tool',
};

class HostToolError extends Error {
  constructor(code, message) {
    super(message);

    this.code = code;
  }
}

export default HostToolError;

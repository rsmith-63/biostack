/**
 * Parses the response from a QBlast 'Put' command.
 */
export const parseSubmitResponse = (text) => {
  const ridMatch = text.match(/RID\s*=\s*(\w+)/);
  const rtoeMatch = text.match(/RTOE\s*=\s*(\d+)/);
  
  if (!ridMatch) {
    throw new Error(`Failed to parse RID from BLAST response: ${text.substring(0, 100)}`);
  }

  return {
    rid: ridMatch[1],
    rtoe: rtoeMatch ? parseInt(rtoeMatch[1], 10) : 0
  };
};

/**
 * Parses the response from a QBlast 'Get' command with SearchInfo.
 */
export const parsePollResponse = (text) => {
  const statusMatch = text.match(/Status\s*=\s*(\w+)/i);
  const status = statusMatch ? statusMatch[1].toLowerCase() : 'unknown';
  
  return { status };
};

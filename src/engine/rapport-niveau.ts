import type { ToolState } from '../context/ToolStateContext';

export function getRapportNiveau(toolState: ToolState): 0 | 1 | 2 | 3 {
  const hasPostcode = toolState.postcode.length === 5;
  if (!hasPostcode) return 0;
  if (!toolState.huisTypeGekozen) return 1;
  if (toolState.highestStepVisited < 3) return 2;
  return 3;
}

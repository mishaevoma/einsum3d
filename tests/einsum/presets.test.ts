import { describe, expect, it } from 'vitest';
import { buildRelationMap, createPresets } from '@/src/einsum';

describe('createPresets', () => {
  it('produces valid derived output for every example', () => {
    const presets = createPresets();
    expect(presets.length).toBeGreaterThanOrEqual(8);

    for (const preset of presets) {
      expect(preset.state.error).toBeNull();
      expect(preset.state.output).not.toBeNull();
      const relation = buildRelationMap(
        preset.state.equation,
        preset.state.operands.map((operand) => operand.shape),
      );
      expect(relation.valid).toBe(true);
      if (relation.valid && preset.state.output) {
        expect(preset.state.output.shape).toEqual(relation.relationMap.shape);
        expect(preset.state.output.freeDims).toEqual(relation.freeDims);
        expect(preset.state.output.inputDims).toEqual(relation.inputDims);
      }
    }
  });
});

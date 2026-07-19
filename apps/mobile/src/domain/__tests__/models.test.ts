import { CalculationProvenanceSchema } from '../models';

describe('CalculationProvenanceSchema', () => {
  it('parses a real passport backend response successfully', () => {
    const rawData = {
      run_id: "123e4567-e89b-12d3-a456-426614174000",
      maturity: "screening",
      methodology_id: "m1",
      methodology_version: "v1.0",
      calculation_enabled: true,
      input_hash: "abcd",
      code_version: "v0.1.0",
      units: { "carbon": "tCO2e" },
      uncertainty: { "carbon": 5.0 },
      sources: [
        {
          source_id: "src1",
          title: "Test Source",
          organization: "Org",
          url: "https://test.com",
          version: null,
          accessed_at: "2026-07-19T00:00:00Z"
        }
      ],
      reviewer_id: null,
      reviewed_at: null,
      created_at: "2026-07-19T00:00:00Z"
    };

    const result = CalculationProvenanceSchema.safeParse(rawData);
    expect(result.success).toBe(true);
  });
});

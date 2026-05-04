import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ── Mock the DB module ────────────────────────────────────────────────────────
const mockOnConflictDoUpdate = vi.fn().mockResolvedValue([]);
const mockValues = vi.fn().mockReturnValue({ onConflictDoUpdate: mockOnConflictDoUpdate });
const mockInsert = vi.fn().mockReturnValue({ values: mockValues });
const mockDb = { insert: mockInsert };

vi.mock('@/lib/db', () => ({
  getDb: vi.fn(() => mockDb),
}));

// ── Import route handler after mocks are set up ───────────────────────────────
const { POST } = await import('@/app/api/leads/route');

// ── Helpers ───────────────────────────────────────────────────────────────────
function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/leads', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const sampleWizardData = {
  selectedAreas: ['career', 'health'],
  dreams: 'I want to wake up every morning feeling free and fulfilled.',
  style: 'minimal',
  goals: [
    { area: 'career', objective: 'Launch a business generating $10k/month', habit: 'Work for 1 focused hour before 9am' },
    { area: 'health', objective: 'Get lean, strong, and feel energetic every day', habit: 'Move my body for 30 minutes every morning' },
  ],
  manifesto: 'This is my dream life. This is my time.',
  enableTimeline: false,
  photoCount: 2,
};

// ── Tests ─────────────────────────────────────────────────────────────────────
describe('POST /api/leads', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOnConflictDoUpdate.mockResolvedValue([]);
    mockValues.mockReturnValue({ onConflictDoUpdate: mockOnConflictDoUpdate });
    mockInsert.mockReturnValue({ values: mockValues });
  });

  describe('input validation', () => {
    it('rejects a missing email with 400', async () => {
      const res = await POST(makeRequest({ source: 'wizard' }));
      expect(res.status).toBe(400);
      const json = await res.json() as { error: unknown };
      expect(json.error).toBeDefined();
    });

    it('rejects a malformed email with 400', async () => {
      const res = await POST(makeRequest({ email: 'not-an-email' }));
      expect(res.status).toBe(400);
    });

    it('rejects an empty body with 400', async () => {
      const res = await POST(makeRequest({}));
      expect(res.status).toBe(400);
    });
  });

  describe('successful lead capture', () => {
    it('returns 200 and success:true for a valid email', async () => {
      const res = await POST(makeRequest({ email: 'test@example.com' }));
      expect(res.status).toBe(200);
      const json = await res.json() as { success: boolean };
      expect(json.success).toBe(true);
    });

    it('calls db.insert with the correct email', async () => {
      await POST(makeRequest({ email: 'hello@manifesta.app' }));
      expect(mockInsert).toHaveBeenCalledWith(expect.anything());
      expect(mockValues).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'hello@manifesta.app' }),
      );
    });

    it('saves all wizard data fields when provided', async () => {
      await POST(makeRequest({ email: 'user@example.com', wizardData: sampleWizardData }));

      expect(mockValues).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'user@example.com',
          wizardData: expect.objectContaining({
            selectedAreas: ['career', 'health'],
            dreams: expect.any(String),
            style: 'minimal',
            goals: expect.arrayContaining([
              expect.objectContaining({ area: 'career' }),
              expect.objectContaining({ area: 'health' }),
            ]),
            manifesto: expect.any(String),
            enableTimeline: false,
            photoCount: 2,
          }),
        }),
      );
    });

    it('uses "wizard" as default source when none provided', async () => {
      await POST(makeRequest({ email: 'user@example.com' }));
      expect(mockValues).toHaveBeenCalledWith(
        expect.objectContaining({ source: 'wizard' }),
      );
    });

    it('saves the provided source field', async () => {
      await POST(makeRequest({ email: 'user@example.com', source: 'landing' }));
      expect(mockValues).toHaveBeenCalledWith(
        expect.objectContaining({ source: 'landing' }),
      );
    });

    it('performs an upsert so duplicate emails update rather than error', async () => {
      await POST(makeRequest({ email: 'returning@example.com', wizardData: sampleWizardData }));
      expect(mockOnConflictDoUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          set: expect.objectContaining({ wizardData: sampleWizardData }),
        }),
      );
    });
  });

  describe('error handling', () => {
    it('returns 503 when DATABASE_URL is missing', async () => {
      mockInsert.mockImplementationOnce(() => {
        throw new Error('DATABASE_URL environment variable is not set');
      });
      const res = await POST(makeRequest({ email: 'user@example.com' }));
      expect(res.status).toBe(503);
      const json = await res.json() as { error: string };
      expect(json.error).toMatch(/database not configured/i);
    });

    it('returns 500 on unexpected DB errors', async () => {
      mockInsert.mockImplementationOnce(() => {
        throw new Error('connection timeout');
      });
      const res = await POST(makeRequest({ email: 'user@example.com' }));
      expect(res.status).toBe(500);
    });

    it('returns 500 gracefully on malformed JSON body', async () => {
      const req = new NextRequest('http://localhost/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'not json{{{',
      });
      const res = await POST(req);
      expect(res.status).toBe(500);
    });
  });
});

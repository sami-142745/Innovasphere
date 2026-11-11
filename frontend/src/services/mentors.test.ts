import { describe, expect, it, vi } from 'vitest';
import { mentorService } from './mentors';
import { api } from '../api/client';

vi.mock('../api/client', () => ({
  api: { get: vi.fn() }
}));

describe('mentorService.receivedRequests', () => {
  it('returns an array when the API returns a page object', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: { content: [{ id: 'mr-1', studentName: 'Ada Lovelace', projectTitle: 'P', status: 'PENDING' }] }
    });
    const result = await mentorService.receivedRequests();
    expect(result).toEqual([{ id: 'mr-1', studentName: 'Ada Lovelace', projectTitle: 'P', status: 'PENDING' }]);
  });

  it('returns the array as-is when the API returns a bare array', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: [{ id: 'mr-1', studentName: 'Ada Lovelace', projectTitle: 'P', status: 'PENDING' }]
    });
    const result = await mentorService.receivedRequests();
    expect(result).toEqual([{ id: 'mr-1', studentName: 'Ada Lovelace', projectTitle: 'P', status: 'PENDING' }]);
  });

  it('returns an empty array when no data is returned', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: undefined });
    const result = await mentorService.receivedRequests();
    expect(result).toEqual([]);
  });
});

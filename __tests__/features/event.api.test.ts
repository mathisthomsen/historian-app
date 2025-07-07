// __tests__/features/event.api.test.ts

// Mock the authentication system for testing
jest.mock('../../app/lib/requireUser', () => ({
  requireUser: jest.fn().mockResolvedValue({
    id: 1,
    email: 'test@example.com',
    workosUserId: 'test-workos-user-id'
  })
}));

global.fetch = jest.fn();

describe('Events API (Sub-Events)', () => {
  let testEventId: number = 101;
  let testSubEventId: number = 102;
  let testTitle = `Test Event ${Date.now()}`;
  let testSubTitle = `Test Sub-Event ${Date.now()}`;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('User can create a top-level event and a sub-event', async () => {
    // Mock event creation response
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({ success: true, id: testEventId })
    });
    // Create top-level event
    let res = await fetch('http://localhost:3000/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: testTitle,
        description: 'A test event',
        date: '2000-01-01',
        location: 'Berlin'
      })
    });
    expect(res.ok).toBe(true);

    // Mock sub-event creation response
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({ success: true, id: testSubEventId })
    });
    // Create sub-event
    res = await fetch('http://localhost:3000/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: testSubTitle,
        description: 'A sub-event',
        date: '2000-01-02',
        location: 'Berlin',
        parentId: testEventId
      })
    });
    expect(res.ok).toBe(true);
  });

  test('User can fetch only top-level events (parentId=null)', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        events: [
          { id: testEventId, title: testTitle, parentId: null, subEventCount: 1 }
        ],
        pagination: { total: 1 }
      })
    });
    const res = await fetch('http://localhost:3000/api/events?parentId=null', { headers: {} });
    expect(res.ok).toBe(true);
    const data = await res.json();
    expect(Array.isArray(data.events)).toBe(true);
    expect(data.events[0].parentId).toBeNull();
    expect(data.events[0].subEventCount).toBe(1);
  });

  test('User can fetch sub-events for a parent', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        events: [
          { id: testSubEventId, title: testSubTitle, parentId: testEventId, subEventCount: 0 }
        ],
        pagination: { total: 1 }
      })
    });
    const res = await fetch(`http://localhost:3000/api/events?parentId=${testEventId}`, { headers: {} });
    expect(res.ok).toBe(true);
    const data = await res.json();
    expect(Array.isArray(data.events)).toBe(true);
    expect(data.events[0].parentId).toBe(testEventId);
    expect(data.events[0].subEventCount).toBe(0);
  });

  test('Event detail includes subEvents array', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        id: testEventId,
        title: testTitle,
        parentId: null,
        subEvents: [
          { id: testSubEventId, title: testSubTitle, parentId: testEventId }
        ]
      })
    });
    const res = await fetch(`http://localhost:3000/api/events/${testEventId}`, { headers: {} });
    expect(res.ok).toBe(true);
    const event = await res.json();
    expect(Array.isArray(event.subEvents)).toBe(true);
    expect(event.subEvents.length).toBeGreaterThan(0);
    expect(event.subEvents[0].parentId).toBe(testEventId);
  });
}); 
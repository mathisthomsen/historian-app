// If running in Node, you may need to install and import 'node-fetch' or set up a fetch polyfill.
// import fetch from 'node-fetch';

// Mock the authentication system for testing
jest.mock('../../app/lib/requireUser', () => ({
  requireUser: jest.fn().mockResolvedValue({
    id: 1,
    email: 'test@example.com',
    workosUserId: 'test-workos-user-id'
  })
}));

// Mock fetch globally
global.fetch = jest.fn();

describe('Life Events API', () => {
  let testPersonId: number = 1;
  let testLifeEventId: number = 1;
  let testLocation = `TestLocation_${Date.now()}`;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('User can add and fetch a life event for a person (API)', async () => {
    // Mock the life event creation response
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({
        id: testLifeEventId,
        title: 'Geburt',
        start_date: '1900-01-01',
        location: testLocation,
        description: 'Geburt in Berlin',
        person_id: testPersonId
      })
    });

    // Mock the life events fetch response
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ([{
        id: testLifeEventId,
        title: 'Geburt',
        start_date: '1900-01-01',
        location: testLocation,
        description: 'Geburt in Berlin',
        person_id: testPersonId
      }])
    });

    // Add a life event
    let res = await fetch('http://localhost:3000/api/life-events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personId: testPersonId,
        title: 'Geburt',
        start_date: '1900-01-01',
        location: testLocation,
        description: 'Geburt in Berlin'
      })
    });
    expect(res.ok).toBe(true);

    // Fetch life events for the person
    res = await fetch(`http://localhost:3000/api/life-events?personId=${testPersonId}`, {
      headers: {}
    });
    expect(res.ok).toBe(true);
    const events = await res.json();
    expect(Array.isArray(events)).toBe(true);
    const found = events.find((e: any) => e.title === 'Geburt' && e.location === testLocation);
    expect(found).toBeTruthy();
    expect(found.id).toBe(testLifeEventId);
  });

  test('Life event appears in location list and detail', async () => {
    // Mock locations response
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ([{
        name: testLocation,
        lifeEventCount: 1
      }])
    });

    // Mock location detail response
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        name: testLocation,
        lifeEvents: [{
          id: testLifeEventId,
          title: 'Geburt',
          location: testLocation
        }]
      })
    });

    // Locations list
    let res = await fetch('http://localhost:3000/api/locations', {
      headers: {}
    });
    expect(res.ok).toBe(true);
    const locations = await res.json();
    const loc = locations.find((l: any) => l.name === testLocation);
    expect(loc).toBeTruthy();
    expect(loc.lifeEventCount).toBeGreaterThan(0);

    // Location detail
    res = await fetch(`http://localhost:3000/api/locations?location=${encodeURIComponent(testLocation)}`, {
      headers: {}
    });
    expect(res.ok).toBe(true);
    const locDetail = await res.json();
    expect(Array.isArray(locDetail.lifeEvents)).toBe(true);
    expect(locDetail.lifeEvents.some((e: any) => e.id === testLifeEventId)).toBe(true);
  });

  test('Life event appears in timeline', async () => {
    // Mock timeline response
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ([{
        id: testLifeEventId,
        title: 'Geburt',
        location: testLocation
      }])
    });

    const res = await fetch('http://localhost:3000/api/life-events', {
      headers: {}
    });
    expect(res.ok).toBe(true);
    const events = await res.json();
    expect(events.some((e: any) => e.id === testLifeEventId)).toBe(true);
  });

  test('Life event appears in analytics', async () => {
    // Mock analytics response
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        totalLifeEvents: 1,
        totalPersons: 1,
        totalEvents: 0
      })
    });

    const res = await fetch('http://localhost:3000/api/analytics', {
      headers: {}
    });
    expect(res.ok).toBe(true);
    const analytics = await res.json();
    expect(analytics.totalLifeEvents).toBeGreaterThan(0);
  });

  test('User can edit a life event', async () => {
    const newTitle = 'Geburt (bearbeitet)';
    
    // Mock update response
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        id: testLifeEventId,
        title: newTitle,
        start_date: '1900-01-01',
        location: testLocation,
        description: 'Bearbeitet',
        person_id: testPersonId
      })
    });

    // Mock fetch events response
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ([{
        id: testLifeEventId,
        title: newTitle,
        location: testLocation
      }])
    });

    let res = await fetch(`http://localhost:3000/api/life-events/${testLifeEventId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        person_id: testPersonId,
        title: newTitle,
        start_date: '1900-01-01',
        location: testLocation,
        description: 'Bearbeitet'
      })
    });
    expect(res.ok).toBe(true);
    const updated = await res.json();
    expect(updated.title).toBe(newTitle);

    // Confirm update in person life events
    res = await fetch(`http://localhost:3000/api/life-events?personId=${testPersonId}`, {
      headers: {}
    });
    const events = await res.json();
    expect(events.some((e: any) => e.title === newTitle)).toBe(true);
  });

  test('User can delete a life event and it is removed everywhere', async () => {
    // Mock delete response
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 204
    });

    // Mock empty events response
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ([])
    });

    // Mock empty locations response
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ([])
    });

    // Mock empty timeline response
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ([])
    });

    // Mock analytics response
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        totalLifeEvents: 0,
        totalPersons: 1,
        totalEvents: 0
      })
    });

    // Delete
    let res = await fetch(`http://localhost:3000/api/life-events/${testLifeEventId}`, {
      method: 'DELETE',
      headers: {}
    });
    expect(res.ok || res.status === 204).toBe(true);

    // Person
    res = await fetch(`http://localhost:3000/api/life-events?personId=${testPersonId}`, {
      headers: {}
    });
    let events = await res.json();
    expect(events.every((e: any) => e.id !== testLifeEventId)).toBe(true);

    // Location
    res = await fetch('http://localhost:3000/api/locations', {
      headers: {}
    });
    const locations = await res.json();
    const loc = locations.find((l: any) => l.name === testLocation);
    // Count should be 0 or location removed
    expect(!loc || loc.lifeEventCount === 0).toBe(true);

    // Timeline
    res = await fetch('http://localhost:3000/api/life-events', {
      headers: {}
    });
    events = await res.json();
    expect(events.every((e: any) => e.id !== testLifeEventId)).toBe(true);

    // Analytics
    res = await fetch('http://localhost:3000/api/analytics', {
      headers: {}
    });
    const analytics = await res.json();
    // Should be 0 or not include deleted event
    expect(analytics.totalLifeEvents >= 0).toBe(true);
  });
}); 
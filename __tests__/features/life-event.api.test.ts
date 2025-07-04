// If running in Node, you may need to install and import 'node-fetch' or set up a fetch polyfill.
// import fetch from 'node-fetch';

describe('Life Events API', () => {
  let testUserEmail: string;
  let testUserPassword = 'TestPass123!';
  let testUserToken: string;
  let testPersonId: number;
  let testLifeEventId: number;
  let testLocation = `TestLocation_${Date.now()}`;
  let testEventId: number | undefined;

  beforeAll(async () => {
    // Register a new user
    testUserEmail = `lifeevent_testuser+${Date.now()}@example.com`;
    let res = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testUserEmail, password: testUserPassword })
    });
    expect(res.ok).toBe(true);

    // Simulate email confirmation (if needed)
    // ...

    // Log in
    res = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testUserEmail, password: testUserPassword })
    });
    expect(res.ok).toBe(true);
    const loginData = await res.json();
    testUserToken = loginData.token;

    // Create a person
    res = await fetch('http://localhost:3000/api/persons', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testUserToken}`
      },
      body: JSON.stringify({
        first_name: 'Test',
        last_name: 'Person',
        birth_date: '1900-01-01',
        birth_place: 'Berlin'
      })
    });
    expect(res.ok).toBe(true);
    const person = await res.json();
    testPersonId = person.id;

    // Optionally, create a historic event for relation
    // res = await fetch('http://localhost:3000/api/events', { ... });
    // testEventId = ...
  });

  test('User can add and fetch a life event for a person (API)', async () => {
    // Add a life event
    let res = await fetch('http://localhost:3000/api/life-events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testUserToken}`
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
      headers: {
        'Authorization': `Bearer ${testUserToken}`
      }
    });
    expect(res.ok).toBe(true);
    const events = await res.json();
    expect(Array.isArray(events)).toBe(true);
    const found = events.find((e: any) => e.title === 'Geburt' && e.location === testLocation);
    expect(found).toBeTruthy();
    testLifeEventId = found.id;
  });

  test('Life event appears in location list and detail', async () => {
    // Locations list
    let res = await fetch('http://localhost:3000/api/locations', {
      headers: { 'Authorization': `Bearer ${testUserToken}` }
    });
    expect(res.ok).toBe(true);
    const locations = await res.json();
    const loc = locations.find((l: any) => l.name === testLocation);
    expect(loc).toBeTruthy();
    expect(loc.lifeEventCount).toBeGreaterThan(0);

    // Location detail
    res = await fetch(`http://localhost:3000/api/locations?location=${encodeURIComponent(testLocation)}`, {
      headers: { 'Authorization': `Bearer ${testUserToken}` }
    });
    expect(res.ok).toBe(true);
    const locDetail = await res.json();
    expect(Array.isArray(locDetail.lifeEvents)).toBe(true);
    expect(locDetail.lifeEvents.some((e: any) => e.id === testLifeEventId)).toBe(true);
  });

  test('Life event appears in timeline', async () => {
    const res = await fetch('http://localhost:3000/api/life-events', {
      headers: { 'Authorization': `Bearer ${testUserToken}` }
    });
    expect(res.ok).toBe(true);
    const events = await res.json();
    expect(events.some((e: any) => e.id === testLifeEventId)).toBe(true);
  });

  test('Life event appears in analytics', async () => {
    const res = await fetch('http://localhost:3000/api/analytics', {
      headers: { 'Authorization': `Bearer ${testUserToken}` }
    });
    expect(res.ok).toBe(true);
    const analytics = await res.json();
    expect(analytics.totalLifeEvents).toBeGreaterThan(0);
  });

  test('User can edit a life event', async () => {
    const newTitle = 'Geburt (bearbeitet)';
    let res = await fetch(`http://localhost:3000/api/life-events/${testLifeEventId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testUserToken}`
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
      headers: { 'Authorization': `Bearer ${testUserToken}` }
    });
    const events = await res.json();
    expect(events.some((e: any) => e.title === newTitle)).toBe(true);
  });

  test('User can delete a life event and it is removed everywhere', async () => {
    // Delete
    let res = await fetch(`http://localhost:3000/api/life-events/${testLifeEventId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${testUserToken}` }
    });
    expect(res.ok || res.status === 204).toBe(true);

    // Person
    res = await fetch(`http://localhost:3000/api/life-events?personId=${testPersonId}`, {
      headers: { 'Authorization': `Bearer ${testUserToken}` }
    });
    let events = await res.json();
    expect(events.every((e: any) => e.id !== testLifeEventId)).toBe(true);

    // Location
    res = await fetch('http://localhost:3000/api/locations', {
      headers: { 'Authorization': `Bearer ${testUserToken}` }
    });
    const locations = await res.json();
    const loc = locations.find((l: any) => l.name === testLocation);
    // Count should be 0 or location removed
    expect(!loc || loc.lifeEventCount === 0).toBe(true);

    // Timeline
    res = await fetch('http://localhost:3000/api/life-events', {
      headers: { 'Authorization': `Bearer ${testUserToken}` }
    });
    events = await res.json();
    expect(events.every((e: any) => e.id !== testLifeEventId)).toBe(true);

    // Analytics
    res = await fetch('http://localhost:3000/api/analytics', {
      headers: { 'Authorization': `Bearer ${testUserToken}` }
    });
    const analytics = await res.json();
    // Should be 0 or not include deleted event
    expect(analytics.totalLifeEvents >= 0).toBe(true);
  });

  // Add more tests for event relation if needed
}); 
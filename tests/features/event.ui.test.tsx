import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import EventDetailPage from '../../app/events/[id]/page';

// Polyfill Response for Jest/node
import fetch, { Response as FetchResponse } from 'node-fetch';
globalThis.fetch = fetch as any;
globalThis.Response = FetchResponse as any;

// Mock router and params
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() })
}));

const mockParams = Promise.resolve({ id: '1' });

const baseEvent = {
  id: 1,
  title: 'Main Event',
  date: '2000-01-01',
  subEvents: [],
  parentId: null,
};

function createMockResponse(data: any) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

function renderWithData(eventOverrides = {}, lifeEvents: any[] = []) {
  jest.spyOn(global, 'fetch').mockImplementation((url) => {
    const urlStr = typeof url === 'string' ? url : url.toString();
    if (urlStr.includes('/api/events/1')) {
      return Promise.resolve(createMockResponse({ ...baseEvent, ...eventOverrides }));
    }
    if (urlStr.includes('/api/life-events?eventId=1')) {
      return Promise.resolve(createMockResponse(lifeEvents));
    }
    return Promise.reject('Unknown fetch');
  });
  return render(<EventDetailPage params={mockParams} />);
}

describe('EventDetailPage UI', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('shows empty state for life-events', async () => {
    // Ensure event is present, subEvents is empty, and viewType is 'life'
    renderWithData({ subEvents: [] }, []);
    // Switch to 'life' toggle (default is 'both')
    const lifeToggle = (await screen.findAllByText((c) => c.includes('Lebensereignisse')))[0];
    fireEvent.click(lifeToggle);
    // Wait for the empty state to appear
    await waitFor(() => {
      expect(screen.queryByText((c) => c.includes('Noch keine Lebensereignisse mit diesem historischen Ereignis verknüpft.'))).toBeInTheDocument();
    });
    // Now check for the headline and button
    const headlineMatches = await screen.findAllByText((c) => c.includes('Keine verwandten Lebensereignisse'));
    expect(headlineMatches.length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /personen verwalten/i })).toBeInTheDocument();
  });

  it('shows empty state for sub-events', async () => {
    renderWithData({ subEvents: [] }, []);
    const subToggle = (await screen.findAllByText((content) => content.includes('Unter-Ereignisse')))[0];
    fireEvent.click(subToggle);
    expect(await screen.findByText((content) => content.includes('Keine Unter-Ereignisse'))).toBeInTheDocument();
    expect((await screen.findAllByRole('button', { name: /unter-ereignis hinzufügen/i })).length).toBeGreaterThan(0);
  });

  it('shows empty state for both', async () => {
    renderWithData({ subEvents: [] }, []);
    const bothToggle = (await screen.findAllByText((content) => content.includes('Beides')))[0];
    fireEvent.click(bothToggle);
    expect(await screen.findByText((content) => content.includes('Keine verwandten Ereignisse'))).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /personen verwalten/i })).toBeInTheDocument();
    expect((await screen.findAllByRole('button', { name: /unter-ereignis hinzufügen/i })).length).toBeGreaterThan(0);
  });

  it('shows sub-events and life-events in merged timeline', async () => {
    const subEvents = [
      { id: 2, title: 'Sub 1', date: '2000-01-02', parentId: 1 },
      { id: 3, title: 'Sub 2', date: '2000-01-03', parentId: 1 },
    ];
    const lifeEvents = [
      { id: 10, title: 'Life 1', start_date: '2000-01-01', person: { id: 1, first_name: 'A', last_name: 'B' } },
    ];
    renderWithData({ subEvents }, lifeEvents);
    const bothToggle = (await screen.findAllByText((content) => content.includes('Beides')))[0];
    fireEvent.click(bothToggle);
    expect(await screen.findByText('Sub 1')).toBeInTheDocument();
    expect(screen.getByText('Sub 2')).toBeInTheDocument();
    expect(screen.getByText('Life 1')).toBeInTheDocument();
  });

  it('shows correct badges in toggle', async () => {
    const subEvents = [
      { id: 2, title: 'Sub 1', date: '2000-01-02', parentId: 1 },
    ];
    const lifeEvents = [
      { id: 10, title: 'Life 1', start_date: '2000-01-01', person: { id: 1, first_name: 'A', last_name: 'B' } },
    ];
    renderWithData({ subEvents }, lifeEvents);
    expect(await screen.findByText((content) => content.includes('Lebensereignisse'))).toBeInTheDocument();
    expect(screen.getByText((content) => content.includes('Unter-Ereignisse'))).toBeInTheDocument();
    expect(screen.getByText((content) => content.includes('Beides'))).toBeInTheDocument();
    // Badges: check for numbers
    expect(screen.getAllByText('1').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('2').length).toBeGreaterThanOrEqual(1);
  });
}); 
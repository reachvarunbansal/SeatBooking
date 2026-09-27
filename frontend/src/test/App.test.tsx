import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../App';

const mockFetch = vi.fn();

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  mockFetch.mockReset();
  vi.stubGlobal('fetch', mockFetch);

  mockFetch.mockImplementation((input: RequestInfo | URL) => {
    const url = String(input);

    if (url.includes('/api/venues') && !url.includes('/best-seats') && !url.includes('/api/venues/')) {
      return Promise.resolve({
        ok: true,
        json: async () => [
          { id: 'venue-1', name: 'Main Hall', rows: 2, columns: 5 },
          { id: 'venue-2', name: 'Balcony', rows: 2, columns: 5 },
        ],
      } as Response);
    }

    if (url.includes('/api/venues/venue-2') && !url.includes('/best-seats')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({
          id: 'venue-2',
          name: 'Balcony',
          layout: { rows: 1, columns: 5 },
          seats: [
            { id: 'a1', row: 'a', column: 1, status: 'BOOKED' },
            { id: 'a2', row: 'a', column: 2, status: 'AVAILABLE' },
            { id: 'a3', row: 'a', column: 3, status: 'AVAILABLE' },
            { id: 'a4', row: 'a', column: 4, status: 'AVAILABLE' },
            { id: 'a5', row: 'a', column: 5, status: 'AVAILABLE' },
          ],
        }),
      } as Response);
    }

    if (url.includes('/api/venues/venue-1') && !url.includes('/best-seats')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({
          id: 'venue-1',
          name: 'Main Hall',
          layout: { rows: 2, columns: 5 },
          seats: [
            { id: 'a1', row: 'a', column: 1, status: 'AVAILABLE' },
            { id: 'a2', row: 'a', column: 2, status: 'AVAILABLE' },
            { id: 'a3', row: 'a', column: 3, status: 'AVAILABLE' },
            { id: 'a4', row: 'a', column: 4, status: 'AVAILABLE' },
            { id: 'a5', row: 'a', column: 5, status: 'AVAILABLE' },
            { id: 'b1', row: 'b', column: 1, status: 'AVAILABLE' },
            { id: 'b2', row: 'b', column: 2, status: 'AVAILABLE' },
            { id: 'b3', row: 'b', column: 3, status: 'AVAILABLE' },
            { id: 'b4', row: 'b', column: 4, status: 'AVAILABLE' },
            { id: 'b5', row: 'b', column: 5, status: 'AVAILABLE' },
          ],
        }),
      } as Response);
    }

    if (url.includes('/best-seats')) {
      const isBalcony = url.includes('/api/venues/venue-2/');
      return Promise.resolve({
        ok: true,
        json: async () => ({
          row: 'a',
          seats: isBalcony
            ? [
                { id: 'balcony-a2', row: 'a', column: 2, status: 'AVAILABLE' },
                { id: 'balcony-a3', row: 'a', column: 3, status: 'AVAILABLE' },
              ]
            : [
                { id: 'a2', row: 'a', column: 2, status: 'AVAILABLE' },
                { id: 'a3', row: 'a', column: 3, status: 'AVAILABLE' },
              ],
        }),
      } as Response);
    }

    if (url.includes('/api/bookings')) {
      return Promise.resolve({
        ok: true,
        status: 201,
        json: async () => ({
          id: 'booking-1',
          venueId: 'venue-1',
          partySize: 2,
          seats: [
            { seat: { id: 'a2' } },
            { seat: { id: 'a3' } },
          ],
        }),
      } as Response);
    }

    return Promise.reject(new Error(`Unhandled fetch: ${url}`));
  });
});

describe('App', () => {
  it('fetches the venue and shows the best available seats for a party size', async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(await screen.findByRole('heading', { name: /choose your seats/i })).toBeInTheDocument();
    expect(await screen.findByText(/main hall/i)).toBeInTheDocument();

    const input = await screen.findByLabelText(/party size/i);
    await user.clear(input);
    await user.type(input, '2');
    await user.click(screen.getByRole('button', { name: /find best seats/i }));

    expect(await screen.findByText(/recommended seats are in/i)).toBeInTheDocument();
    expect(screen.getByText(/a2, a3/i)).toBeInTheDocument();
    const bestSeatsRequest = mockFetch.mock.calls.find(([url]) => String(url).includes('/best-seats'));
    expect(JSON.parse(String(bestSeatsRequest?.[1]?.body))).toMatchObject({ partySize: 2 });

    expect(screen.getByRole('button', { name: /seat a2 available/i })).toHaveClass('seat-recommended');
    expect(screen.getByRole('button', { name: /seat a3 available/i })).toHaveClass('seat-recommended');

    await user.click(screen.getByRole('button', { name: /book these seats/i }));

    expect(await screen.findByText(/booking confirmed for seats a2, a3/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /book these seats/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /seat a2 available/i })).toHaveClass('seat-available');
  });

  it('clears the previous recommendation on venue switch and finds seats for the new venue on request', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(await screen.findByRole('button', { name: /find best seats/i }));
    expect(await screen.findByText(/a2, a3/i)).toBeInTheDocument();

    const venueSelect = screen.getByRole('combobox', { name: /auditorium/i });
    await user.selectOptions(venueSelect, 'venue-2');

    expect(venueSelect).toHaveValue('venue-2');
    expect(await screen.findByRole('button', { name: /seat a1 booked/i })).toBeInTheDocument();
    expect(screen.queryByText(/^A2, A3$/)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /find best seats/i }));
    expect(await screen.findByText(/^A2, A3$/)).toBeInTheDocument();
    const recommendations = mockFetch.mock.calls.filter(([url]) => String(url).includes('/best-seats'));
    expect(String(recommendations[1]?.[0])).toContain('/api/venues/venue-2/best-seats');
  });

  it('ignores late venue detail and recommendation responses after switching venues', async () => {
    const defaultFetch = mockFetch.getMockImplementation();
    let resolveOldDetail: (response: Response) => void = () => {};
    let resolveOldRecommendation: (response: Response) => void = () => {};
    mockFetch.mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith('/api/venues/venue-1') && !init?.method) {
        return new Promise<Response>((resolve) => {
          resolveOldDetail = resolve;
        });
      }
      if (url.includes('/api/venues/venue-1/best-seats')) {
        return new Promise<Response>((resolve) => {
          resolveOldRecommendation = resolve;
        });
      }
      return defaultFetch?.(input, init) as Promise<Response>;
    });

    const user = userEvent.setup();
    render(<App />);
    const venueSelect = await screen.findByRole('combobox', { name: /auditorium/i });
    await user.click(screen.getByRole('button', { name: /find best seats/i }));
    await user.selectOptions(venueSelect, 'venue-2');
    expect(await screen.findByRole('button', { name: /seat a1 booked/i })).toBeInTheDocument();

    await act(async () => {
      resolveOldDetail({
        ok: true,
        json: async () => ({
          id: 'venue-1',
          name: 'Main Hall',
          layout: { rows: 1, columns: 1 },
          seats: [{ id: 'a1', row: 'a', column: 1, status: 'AVAILABLE' }],
        }),
      } as Response);
      resolveOldRecommendation({
        ok: true,
        json: async () => ({
          row: 'a',
          seats: [{ id: 'a5', row: 'a', column: 5, status: 'AVAILABLE' }],
        }),
      } as Response);
    });

    await waitFor(() => expect(screen.getByRole('button', { name: /seat a1 booked/i })).toBeInTheDocument());
    expect(screen.queryByText(/^A2, A3$/)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /seat a2 available/i })).not.toHaveClass('seat-recommended');
    expect(screen.getByRole('button', { name: /seat a5 available/i })).not.toHaveClass('seat-recommended');
    expect(screen.queryByRole('button', { name: /seat a1 available/i })).not.toBeInTheDocument();
  });

  it('prevents duplicate submissions while a booking is in flight', async () => {
    const defaultFetch = mockFetch.getMockImplementation();
    let resolveBooking: (response: Response) => void = () => {};
    mockFetch.mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
      if (String(input).endsWith('/api/bookings') && init?.method === 'POST') {
        return new Promise<Response>((resolve) => {
          resolveBooking = resolve;
        });
      }
      return defaultFetch?.(input, init) as Promise<Response>;
    });

    const user = userEvent.setup();
    render(<App />);
    await user.click(await screen.findByRole('button', { name: /find best seats/i }));
    await screen.findByText(/a2, a3/i);
    const bookButton = screen.getByRole('button', { name: /book these seats/i });
    await user.click(bookButton);

    expect(bookButton).toBeDisabled();
    await user.click(bookButton);
    expect(mockFetch.mock.calls.filter(([url, init]) => String(url).endsWith('/api/bookings') && init?.method === 'POST')).toHaveLength(1);

    resolveBooking({
      ok: true,
      status: 201,
      json: async () => ({
        id: 'booking-1',
        venueId: 'venue-1',
        partySize: 2,
        seats: [{ seat: { id: 'a2' } }, { seat: { id: 'a3' } }],
      }),
    } as Response);
    expect(await screen.findByText(/booking confirmed for seats a2, a3/i)).toBeInTheDocument();
  });

  it('keeps booking confirmation when refreshing the venue fails', async () => {
    const defaultFetch = mockFetch.getMockImplementation();
    let detailRequests = 0;
    mockFetch.mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.includes('/api/venues/venue-1') && !init?.method) {
        detailRequests += 1;
        if (detailRequests > 1) {
          return Promise.resolve({
            ok: false,
            status: 503,
            json: async () => ({ error: { message: 'Database is unavailable' } }),
          } as Response);
        }
      }
      return defaultFetch?.(input, init) as Promise<Response>;
    });

    const user = userEvent.setup();
    render(<App />);
    await user.click(await screen.findByRole('button', { name: /find best seats/i }));
    await screen.findByText(/a2, a3/i);
    await user.click(screen.getByRole('button', { name: /book these seats/i }));

    expect(await screen.findByText(/booking confirmed for seats a2, a3/i)).toBeInTheDocument();
    expect(screen.getByText(/booking was confirmed, but the venue could not be refreshed/i)).toBeInTheDocument();
    expect(screen.queryByText(/^booking failed/i)).not.toBeInTheDocument();
  });

  it('opens venue management controls', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(await screen.findByRole('button', { name: /manage venues/i }));

    expect(screen.getByRole('dialog', { name: /manage venues/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /manage venues/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/venue name/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add venue/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /delete main hall/i })).toBeInTheDocument();
  });

  it('sends JSON when adding a venue without an admin token', async () => {
    const defaultFetch = mockFetch.getMockImplementation();
    const createdVenue = { id: 'venue-2', name: 'New Venue', rows: 10, columns: 12 };
    mockFetch.mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith('/api/venues') && init?.method === 'POST') {
        return Promise.resolve({ ok: true, status: 201, json: async () => createdVenue } as Response);
      }
      if (url.includes('/api/venues/venue-2')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            id: createdVenue.id,
            name: createdVenue.name,
            layout: { rows: createdVenue.rows, columns: createdVenue.columns },
            seats: [],
          }),
        } as Response);
      }
      return defaultFetch?.(input, init) as Promise<Response>;
    });

    const user = userEvent.setup();
    render(<App />);
    await user.click(await screen.findByRole('button', { name: /manage venues/i }));
    await user.click(screen.getByRole('button', { name: /add venue/i }));

    expect(await screen.findByText(/new venue was added with 120 seats/i)).toBeInTheDocument();
    const createRequest = mockFetch.mock.calls.find(
      ([url, init]) => String(url).endsWith('/api/venues') && init?.method === 'POST',
    );
    expect(createRequest?.[1]?.headers).toMatchObject({ 'Content-Type': 'application/json' });
  });
});

import { useEffect, useMemo, useState } from 'react';
import AskAI from './Components/AskAI';
import BookSeats from './Components/BookSeats';
import Header from './Components/Header';
import ManageVenue from './Components/ManageVenue';
import VenueControls from './Components/VenueControls';
import VenueFloorSeating from './Components/VenueFloorSeating';
import type { CreateVenueInput, Seat, VenueDetail, VenueSummary } from './Components/types';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

function seatLabel(seat: Pick<Seat, 'row' | 'column'>): string {
  return `${seat.row.toUpperCase()}${seat.column}`;
}

type BookingSeatReference = {
  id?: string;
  seat?: {
    id?: string;
  };
};

type BookingResponse = {
  id: string;
  venueId: string;
  partySize: number;
  seatIds?: string[];
  seats?: BookingSeatReference[];
};

function extractSeatIds(booking: BookingResponse | undefined): string[] {
  if (!booking) {
    return [];
  }

  if (Array.isArray(booking.seatIds)) {
    return booking.seatIds.filter((seatId): seatId is string => Boolean(seatId));
  }

  return (booking.seats ?? [])
    .map((seatEntry) => seatEntry?.seat?.id ?? seatEntry?.id)
    .filter((seatId): seatId is string => Boolean(seatId));
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    let message = 'Request failed';
    try {
      const errorPayload = await response.json();
      message = errorPayload?.error?.message ?? errorPayload?.message ?? message;
    } catch {
      // Ignore JSON parsing failures and keep the default message.
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

function App() {
  const [venues, setVenues] = useState<VenueSummary[]>([]);
  const [selectedVenueId, setSelectedVenueId] = useState('');
  const [venueDetail, setVenueDetail] = useState<VenueDetail | null>(null);
  const [partySize, setPartySize] = useState(2);
  const [assistantPrompt, setAssistantPrompt] = useState('');
  const [assistantLoading, setAssistantLoading] = useState(false);
  const [bestSeats, setBestSeats] = useState<Seat[]>([]);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusError, setStatusError] = useState('');
  const [venuesLoading, setVenuesLoading] = useState(true);
  const [venueLoading, setVenueLoading] = useState(false);
  const [venuesError, setVenuesError] = useState<string | null>(null);
  const [venueError, setVenueError] = useState<string | null>(null);
  const [isVenueManagerOpen, setIsVenueManagerOpen] = useState(false);
  const [venueManagementError, setVenueManagementError] = useState('');
  const [venueManagementStatus, setVenueManagementStatus] = useState('');
  const [venueManagementLoading, setVenueManagementLoading] = useState(false);

  useEffect(() => {
    async function loadVenues() {
      try {
        setVenuesLoading(true);
        setVenuesError(null);
        const data = await requestJson<VenueSummary[]>('/api/venues');
        setVenues(data);
        if (!selectedVenueId && data[0]) {
          setSelectedVenueId(data[0].id);
        }
      } catch (error) {
        setVenuesError(error instanceof Error ? error.message : 'Unable to load venues.');
      } finally {
        setVenuesLoading(false);
      }
    }

    void loadVenues();
  }, [selectedVenueId]);

  useEffect(() => {
    if (!selectedVenueId) {
      return;
    }

    async function loadVenueDetail() {
      try {
        setVenueLoading(true);
        setVenueError(null);
        const data = await requestJson<VenueDetail>(`/api/venues/${selectedVenueId}`);
        setVenueDetail(data);
      } catch (error) {
        setVenueError(error instanceof Error ? error.message : 'Unable to load venue details.');
      } finally {
        setVenueLoading(false);
      }
    }

    void loadVenueDetail();
  }, [selectedVenueId]);

  const selectedVenue = useMemo(
    () => venues.find((venue) => venue.id === selectedVenueId) ?? null,
    [selectedVenueId, venues],
  );

  async function handleCreateVenue(input: CreateVenueInput, adminToken: string) {
    try {
      setVenueManagementLoading(true);
      setVenueManagementError('');
      setVenueManagementStatus('');
      const created = await requestJson<VenueSummary>('/api/venues', {
        method: 'POST',
        headers: adminToken ? { 'x-admin-token': adminToken } : undefined,
        body: JSON.stringify(input),
      });
      const refreshedVenues = await requestJson<VenueSummary[]>('/api/venues');
      setVenues(refreshedVenues);
      setSelectedVenueId(created.id);
      setBestSeats([]);
      setVenueManagementStatus(`${created.name} was added with ${input.rows * input.columns} seats.`);
    } catch (error) {
      setVenueManagementError(error instanceof Error ? error.message : 'Unable to add venue.');
    } finally {
      setVenueManagementLoading(false);
    }
  }

  async function handleDeleteVenue(adminToken: string) {
    if (!selectedVenueId || !selectedVenue) {
      return;
    }

    if (!window.confirm(`Delete ${selectedVenue.name}? Its seats and bookings will also be deleted.`)) {
      return;
    }

    try {
      setVenueManagementLoading(true);
      setVenueManagementError('');
      setVenueManagementStatus('');
      await requestJson<void>(`/api/venues/${selectedVenueId}`, {
        method: 'DELETE',
        headers: adminToken ? { 'x-admin-token': adminToken } : undefined,
      });
      const refreshedVenues = await requestJson<VenueSummary[]>('/api/venues');
      setVenues(refreshedVenues);
      setSelectedVenueId(refreshedVenues[0]?.id ?? '');
      setVenueDetail(null);
      setBestSeats([]);
      setVenueManagementStatus(`${selectedVenue.name} and its seats and bookings were deleted.`);
    } catch (error) {
      setVenueManagementError(error instanceof Error ? error.message : 'Unable to delete venue.');
    } finally {
      setVenueManagementLoading(false);
    }
  }

  async function handleFindBestSeats() {
    if (!selectedVenueId) {
      return;
    }

    try {
      setStatusError('');
      setStatusMessage('');
      const result = await requestJson<{ row?: string; seats: Seat[] }>(`/api/venues/${selectedVenueId}/best-seats`, {
        method: 'POST',
        body: JSON.stringify({ partySize }),
      });
      setBestSeats(result.seats ?? []);
      const rowLabel = result.row ? `row ${result.row.toUpperCase()}` : 'the best available row';
      setStatusMessage(`Recommended seats are in ${rowLabel}. First row, centered view.`);
    } catch (error) {
      setBestSeats([]);
      setStatusError(error instanceof Error ? error.message : 'Unable to find best seats.');
    }
  }

  async function handleAskAssistant() {
    if (!selectedVenueId || assistantPrompt.trim().length < 3) {
      return;
    }

    try {
      setAssistantLoading(true);
      setStatusError('');
      setStatusMessage('');
      const result = await requestJson<{ preferences: { partySize: number }; row?: string; seats: Seat[] }>(
        `/api/venues/${selectedVenueId}/seat-assistant`,
        {
          method: 'POST',
          body: JSON.stringify({ prompt: assistantPrompt }),
        },
      );
      setPartySize(result.preferences.partySize);
      setBestSeats(result.seats ?? []);
      const rowLabel = result.row ? `row ${result.row.toUpperCase()}` : 'the best available row';
      setStatusMessage(`AI found ${result.preferences.partySize} seat${result.preferences.partySize === 1 ? '' : 's'} in ${rowLabel}.`);
    } catch (error) {
      setBestSeats([]);
      setStatusError(error instanceof Error ? error.message : 'The AI seat assistant failed.');
    } finally {
      setAssistantLoading(false);
    }
  }

  async function handleBookSeats() {
    if (!selectedVenueId || bestSeats.length === 0) {
      return;
    }

    try {
      setStatusError('');
      const result = await requestJson<BookingResponse>('/api/bookings', {
        method: 'POST',
        body: JSON.stringify({
          venueId: selectedVenueId,
          seatIds: bestSeats.map((seat) => seat.id),
        }),
      });

      const confirmedSeatIds = extractSeatIds(result);
      const confirmedSeatLabels = confirmedSeatIds.map((seatId) => {
        const seat = bestSeats.find((candidate) => candidate.id === seatId);
        return seat ? seatLabel(seat) : seatId;
      });
      setStatusMessage(
        confirmedSeatLabels.length > 0
          ? `Booking confirmed for seats ${confirmedSeatLabels.join(', ')}.`
          : 'Booking confirmed.',
      );
      const refreshed = await requestJson<VenueDetail>(`/api/venues/${selectedVenueId}`);
      setVenueDetail(refreshed);
    } catch (error) {
      setStatusError(error instanceof Error ? error.message : 'Booking failed.');
    }
  }

  return (
    <main className="app-shell">
      <Header
        onManageVenues={() => {
          setIsVenueManagerOpen(true);
          setVenueManagementError('');
          setVenueManagementStatus('');
        }}
      />

      <ManageVenue
        isOpen={isVenueManagerOpen}
        selectedVenue={selectedVenue}
        isLoading={venueManagementLoading}
        error={venueManagementError}
        status={venueManagementStatus}
        onClose={() => setIsVenueManagerOpen(false)}
        onCreate={handleCreateVenue}
        onDelete={handleDeleteVenue}
      />

      {venuesError || venueError ? (
        <div className="error-banner">
          {(venuesError ?? venueError) ?? 'Unable to load data.'}
        </div>
      ) : null}

      <VenueControls
        venues={venues}
        selectedVenueId={selectedVenueId}
        partySize={partySize}
        maxPartySize={selectedVenue?.columns ?? 1}
        isLoading={venuesLoading}
        onVenueChange={setSelectedVenueId}
        onPartySizeChange={setPartySize}
        onFindBestSeats={handleFindBestSeats}
      />

      <AskAI
        prompt={assistantPrompt}
        isLoading={assistantLoading}
        isDisabled={!selectedVenueId || assistantPrompt.trim().length < 3}
        onPromptChange={setAssistantPrompt}
        onAsk={handleAskAssistant}
      />

      <div className="content-grid">
        <section>
          <VenueFloorSeating venue={venueDetail} isLoading={venueLoading} recommendedSeats={bestSeats} />
        </section>
        <BookSeats
          recommendedSeats={bestSeats}
          statusMessage={statusMessage}
          statusError={statusError}
          onBook={handleBookSeats}
        />
      </div>
    </main>
  );
}

export default App;

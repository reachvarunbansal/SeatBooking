import type { VenueSummary } from './types';
import FindBestSeats from './FindBestSeats';

type VenueControlsProps = {
    venues: VenueSummary[];
    selectedVenueId: string;
    partySizeDraft: string;
    maxPartySize: number;
    isLoading: boolean;
    onVenueChange: (venueId: string) => void;
    onPartySizeChange: (partySize: string) => void;
    onFindBestSeats: () => void;
    onOpenAskAi: () => void;
    onCreateVenue: () => void;
};

export default function VenueControls({
    venues,
    selectedVenueId,
    partySizeDraft,
    maxPartySize,
    isLoading,
    onVenueChange,
    onPartySizeChange,
    onFindBestSeats,
    onOpenAskAi,
    onCreateVenue,
}: VenueControlsProps) {
    const maxPartySizeValue = Math.max(maxPartySize, 1);
    const parsedPartySize = Number(partySizeDraft);
    const isPartySizeValid = /^\d+$/.test(partySizeDraft)
        && parsedPartySize >= 1
        && parsedPartySize <= maxPartySizeValue;

    if (isLoading) {
        return <div className="panel loading-message">Loading venues…</div>;
    }

    if (venues.length === 0) {
        return (
            <section className="panel no-venues-state" aria-labelledby="no-venues-title">
                <div>
                    <p className="section-eyebrow">Venue setup</p>
                    <h2 className="no-venues-title" id="no-venues-title">No Venues Yet</h2>
                    <p className="manage-description">Create a venue to set up its seating layout and start making bookings.</p>
                </div>
                <button type="button" className="button button-primary" onClick={onCreateVenue}>
                    Create Venue
                </button>
            </section>
        );
    }

    return (
        <section className="panel control-panel">
            <label className="form-field">
                <span className="field-label">Venue</span>
                <select
                    value={selectedVenueId}
                    onChange={(event) => onVenueChange(event.target.value)}
                    className="form-control form-control-select"
                >
                    <option value="" disabled>
                        Choose a venue and party size to see the best contiguous seats.
                    </option>
                    {venues.map((venue) => (
                        <option key={venue.id} value={venue.id}>{venue.name}</option>
                    ))}
                </select>
            </label>

            <label htmlFor="party-size" className="form-field">
                <span className="field-label">Party size</span>
                <input
                    id="party-size"
                    value={partySizeDraft}
                    min={1}
                    max={maxPartySizeValue}
                    type="number"
                    onChange={(event) => {
                        onPartySizeChange(event.target.value);
                    }}
                    className="form-control form-control-select form-control-party-size"
                />
            </label>

            <div className="venue-actions" aria-label="Seat actions">
                <FindBestSeats disabled={!selectedVenueId || !isPartySizeValid} onFind={onFindBestSeats} />
                <button
                    type="button"
                    className="button button-assistant"
                    disabled={!selectedVenueId}
                    onClick={onOpenAskAi}
                >
                    Ask AI
                </button>
            </div>
        </section>
    );
}
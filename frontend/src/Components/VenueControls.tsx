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
}: VenueControlsProps) {
    const maxPartySizeValue = Math.max(maxPartySize, 1);
    const parsedPartySize = Number(partySizeDraft);
    const isPartySizeValid = /^\d+$/.test(partySizeDraft)
        && parsedPartySize >= 1
        && parsedPartySize <= maxPartySizeValue;

    if (isLoading) {
        return <div className="panel loading-message">Loading venues…</div>;
    }

    return (
        <section className="panel control-panel">
            <label className="form-field">
                <span className="field-label">Auditorium</span>
                <select
                    value={selectedVenueId}
                    onChange={(event) => onVenueChange(event.target.value)}
                    className="form-control form-control-select"
                >
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

            <FindBestSeats disabled={!selectedVenueId || !isPartySizeValid} onFind={onFindBestSeats} />
        </section>
    );
}
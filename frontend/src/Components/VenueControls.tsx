import type { VenueSummary } from './types';
import FindBestSeats from './FindBestSeats';

type VenueControlsProps = {
    venues: VenueSummary[];
    selectedVenueId: string;
    partySize: number;
    maxPartySize: number;
    isLoading: boolean;
    onVenueChange: (venueId: string) => void;
    onPartySizeChange: (partySize: number) => void;
    onFindBestSeats: () => void;
};

export default function VenueControls({
    venues,
    selectedVenueId,
    partySize,
    maxPartySize,
    isLoading,
    onVenueChange,
    onPartySizeChange,
    onFindBestSeats,
}: VenueControlsProps) {
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
                    value={partySize}
                    min={1}
                    max={Math.max(maxPartySize, 1)}
                    type="number"
                    onChange={(event) => onPartySizeChange(event.target.value === '' ? 1 : Math.max(1, Number(event.target.value)))}
                    className="form-control form-control-select form-control-party-size"
                />
            </label>

            <FindBestSeats disabled={!selectedVenueId} onFind={onFindBestSeats} />
        </section>
    );
}
import type { Seat } from './types';

type BookSeatsProps = {
    recommendedSeats: Seat[];
    statusMessage: string;
    statusError: string;
    onBook: () => void;
};

export default function BookSeats({ recommendedSeats, statusMessage, statusError, onBook }: BookSeatsProps) {
    return (
        <aside className="panel reservation-panel">
            <p className="section-eyebrow">Your reservation</p>
            <h2 className="section-title">Best available seats</h2>

            {statusMessage ? <p className="status-message">{statusMessage}</p> : null}
            {statusError ? <p className="status-error">{statusError}</p> : null}

            {recommendedSeats.length ? (
                <>
                    <p className="recommended-label">Recommended seats:</p>
                    <div className="recommended-list">
                        {recommendedSeats.map((seat) => `${seat.row.toUpperCase()}${seat.column}`).join(', ')}
                    </div>
                    <button
                        type="button"
                        onClick={onBook}
                        className="button button-primary book-button"
                    >
                        Book These Seats
                    </button>
                </>
            ) : (
                <p className="empty-reservation">Choose a venue and party size to see the best contiguous seats.</p>
            )}
        </aside>
    );
}
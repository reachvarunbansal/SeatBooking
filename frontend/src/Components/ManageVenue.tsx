import { useState, type FormEvent } from 'react';
import type { CreateVenueInput, VenueSummary } from './types';

type ManageVenueProps = {
    isOpen: boolean;
    selectedVenue: VenueSummary | null;
    isLoading: boolean;
    error: string;
    status: string;
    onClose: () => void;
    onCreate: (input: CreateVenueInput, adminToken: string) => void;
    onDelete: (adminToken: string) => void;
};

export default function ManageVenue({
    isOpen,
    selectedVenue,
    isLoading,
    error,
    status,
    onClose,
    onCreate,
    onDelete,
}: ManageVenueProps) {
    const [name, setName] = useState('New Venue');
    const [rows, setRows] = useState('10');
    const [columns, setColumns] = useState('12');
    const [adminToken, setAdminToken] = useState('');

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        onCreate({ name, rows: Number(rows), columns: Number(columns) }, adminToken);
    }

    if (!isOpen) {
        return null;
    }

    return (
        <section
            className="panel manage-panel"
            role="dialog"
            aria-label="Manage venues"
        >
            <div className="manage-header">
                <div>
                    <p className="section-eyebrow">Venue administration</p>
                    <h2 className="manage-title">Manage Venues</h2>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    className="button button-close"
                >
                    Close
                </button>
            </div>

            <div className="manage-grid">
                <form onSubmit={handleSubmit} className="manage-subpanel">
                    <h3 className="subpanel-title">Add a venue</h3>
                    <div className="form-grid">
                        <label className="form-field form-field-wide">
                            <span>Admin token (optional)</span>
                            <input
                                type="password"
                                value={adminToken}
                                onChange={(event) => setAdminToken(event.target.value)}
                                placeholder="Only required when ADMIN_TOKEN is configured"
                                className="form-control"
                            />
                        </label>
                        <label className="form-field form-field-wide">
                            <span>Venue name</span>
                            <input
                                value={name}
                                onChange={(event) => setName(event.target.value)}
                                required
                                className="form-control"
                            />
                        </label>
                        <label className="form-field">
                            <span>Rows</span>
                            <input
                                type="number"
                                min={1}
                                max={100}
                                value={rows}
                                onChange={(event) => setRows(event.target.value)}
                                required
                                className="form-control"
                            />
                        </label>
                        <label className="form-field">
                            <span>Columns</span>
                            <input
                                type="number"
                                min={1}
                                max={100}
                                value={columns}
                                onChange={(event) => setColumns(event.target.value)}
                                required
                                className="form-control"
                            />
                        </label>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="button button-primary"
                        >
                            {isLoading ? 'Working…' : 'Add Venue'}
                        </button>
                    </div>
                </form>

                <div className="manage-subpanel manage-subpanel-danger">
                    <h3 className="subpanel-title">Delete selected venue</h3>
                    <p className="manage-description">
                        Deleting a venue permanently removes its seats, bookings, and booking-seat records.
                    </p>
                    <button
                        type="button"
                        onClick={() => onDelete(adminToken)}
                        disabled={!selectedVenue || isLoading}
                        className="button button-danger"
                    >
                        Delete {selectedVenue?.name ?? 'Selected Venue'}
                    </button>
                </div>
            </div>

            {status ? <p className="status-message">{status}</p> : null}
            {error ? <p className="status-error">{error}</p> : null}
        </section>
    );
}
import { useEffect, useRef, useState, type FormEvent, type MouseEvent } from 'react';
import type { CreateVenueInput, VenueSummary } from './types';

type ManageVenueProps = {
    isOpen: boolean;
    selectedVenue: VenueSummary | null;
    isLoading: boolean;
    error: string;
    status: string;
    onClose: () => void;
    onCreate: (input: CreateVenueInput) => void;
    onDelete: () => void;
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
    const dialogRef = useRef<HTMLDialogElement>(null);
    const venueNameRef = useRef<HTMLInputElement>(null);
    const openerRef = useRef<HTMLElement | null>(null);
    const [name, setName] = useState('');
    const [rows, setRows] = useState('10');
    const [columns, setColumns] = useState('12');

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) {
            return;
        }

        if (isOpen && !dialog.open) {
            openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
            if (typeof dialog.showModal === 'function') {
                dialog.showModal();
            } else {
                dialog.setAttribute('open', '');
            }
            venueNameRef.current?.focus();
        } else if (!isOpen && dialog.open) {
            if (typeof dialog.close === 'function') {
                dialog.close();
            } else {
                dialog.removeAttribute('open');
                openerRef.current?.focus();
            }
            openerRef.current = null;
        }
    }, [isOpen]);

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        onCreate({ name, rows: Number(rows), columns: Number(columns) });
    }

    function handleDialogClick(event: MouseEvent<HTMLDialogElement>) {
        if (event.target === event.currentTarget && !isLoading) {
            onClose();
        }
    }

    return (
        <dialog
            ref={dialogRef}
            className="manage-dialog"
            hidden={!isOpen}
            aria-labelledby="manage-venue-title"
            aria-describedby="manage-venue-description"
            aria-modal="true"
            onCancel={(event) => {
                event.preventDefault();
                if (!isLoading) onClose();
            }}
            onKeyDown={(event) => {
                if (typeof dialogRef.current?.showModal !== 'function' && event.key === 'Escape' && !isLoading) {
                    event.preventDefault();
                    onClose();
                }
            }}
            onClick={handleDialogClick}
        >
            <div className="manage-panel">
                <header className="manage-header">
                    <div>
                    <p className="section-eyebrow">Venue administration</p>
                        <h2 className="manage-title" id="manage-venue-title">Manage Venue</h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isLoading}
                        className="button button-close"
                        aria-label="Close Manage Venue dialog"
                    >
                        Close
                    </button>
                </header>

                <p className="manage-description" id="manage-venue-description">
                    Add a venue layout or delete the selected venue and its bookings.
                </p>

                <div className="manage-grid">
                    <form onSubmit={handleSubmit} className="manage-subpanel">
                        <h3 className="subpanel-title">Add Venue</h3>
                        <div className="form-grid">
                            <label className="form-field form-field-wide" htmlFor="venue-name">
                                <span>Venue name</span>
                            <input
                                ref={venueNameRef}
                                id="venue-name"
                                value={name}
                                onChange={(event) => setName(event.target.value)}
                                maxLength={100}
                                required
                                className="form-control"
                            />
                            </label>
                            <label className="form-field" htmlFor="venue-rows">
                                <span>Rows</span>
                                <input
                                    id="venue-rows"
                                    type="number"
                                    min={1}
                                    max={100}
                                    step={1}
                                    value={rows}
                                    onChange={(event) => setRows(event.target.value)}
                                    required
                                    className="form-control"
                                />
                            </label>
                            <label className="form-field" htmlFor="venue-columns">
                                <span>Columns</span>
                                <input
                                    id="venue-columns"
                                    type="number"
                                    min={1}
                                    max={100}
                                    step={1}
                                    value={columns}
                                    onChange={(event) => setColumns(event.target.value)}
                                    required
                                    className="form-control"
                                />
                            </label>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="button button-primary manage-submit"
                            >
                                {isLoading ? 'Working…' : 'Add Venue'}
                            </button>
                        </div>
                    </form>

                    <section className="manage-subpanel manage-subpanel-danger" aria-labelledby="delete-venue-title">
                        <h3 className="subpanel-title" id="delete-venue-title">Delete Venue</h3>
                        <p className="manage-description">
                            Deleting a venue permanently removes its seats, bookings, and booking-seat records.
                        </p>
                        <button
                            type="button"
                            onClick={onDelete}
                            disabled={!selectedVenue || isLoading}
                            className="button button-danger"
                        >
                            {selectedVenue ? `Delete Venue: ${selectedVenue.name}` : 'Delete Venue'}
                        </button>
                    </section>
                </div>

                {status ? <p className="status-message" role="status">{status}</p> : null}
                {error ? <p className="status-error" role="alert">{error}</p> : null}
            </div>
        </dialog>
    );
}
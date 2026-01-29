import React, { useState } from 'react';
import { CALENDAR_OPTIONS } from '../../../services/calendarService';
import './CalendarPickerModal.css';

const CalendarPickerModal = ({
    isOpen,
    onClose,
    onSelect,
    currentSelection = null,
    isMobile = false
}) => {
    const [selected, setSelected] = useState(currentSelection || '');

    const handleSelect = (value) => {
        setSelected(value);
    };

    const handleConfirm = () => {
        if (selected) {
            onSelect(selected);
        }
    };

    if (!isOpen) return null;

    const GoogleIcon = () => (
        <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/>
        </svg>
    );

    const AppleIcon = () => (
        <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.71,19.5C17.88,20.74 17,21.95 15.66,21.97C14.32,22 13.89,21.18 12.37,21.18C10.84,21.18 10.37,21.95 9.1,22C7.79,22.05 6.8,20.68 5.96,19.47C4.25,17 2.94,12.45 4.7,9.39C5.57,7.87 7.13,6.91 8.82,6.88C10.1,6.86 11.32,7.75 12.11,7.75C12.89,7.75 14.37,6.68 15.92,6.84C16.57,6.87 18.39,7.1 19.56,8.82C19.47,8.88 17.39,10.1 17.41,12.63C17.44,15.65 20.06,16.66 20.09,16.67C20.06,16.74 19.67,18.11 18.71,19.5M13,3.5C13.73,2.67 14.94,2.04 15.94,2C16.07,3.17 15.6,4.35 14.9,5.19C14.21,6.04 13.07,6.7 11.95,6.61C11.8,5.46 12.36,4.26 13,3.5Z"/>
        </svg>
    );

    const OutlookIcon = () => (
        <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M7.88,12.04Q7.88,10.87 7.37,10.04Q6.86,9.21 6,8.8L6,8.78Q6.86,8.38 7.37,7.55Q7.88,6.73 7.88,5.54L7.88,4.07Q7.88,3.05 8.47,2.53Q9.06,2 10.08,2L11.18,2L11.18,3.41L10.46,3.41Q9.88,3.41 9.62,3.71Q9.36,4 9.36,4.59L9.36,5.76Q9.36,6.74 8.83,7.35Q8.3,7.96 7.42,8.14L7.42,8.86Q8.3,9.04 8.83,9.65Q9.36,10.26 9.36,11.24L9.36,12.41Q9.36,13 9.62,13.29Q9.88,13.59 10.46,13.59L11.18,13.59L11.18,15L10.08,15Q9.06,15 8.47,14.47Q7.88,13.95 7.88,12.93L7.88,12.04M16.12,12.04Q16.12,13.21 16.63,13.96Q17.14,14.71 18,15L18,15.22Q17.14,15.62 16.63,16.45Q16.12,17.27 16.12,18.46L16.12,19.93Q16.12,20.95 15.53,21.47Q14.94,22 13.92,22L12.82,22L12.82,20.59L13.54,20.59Q14.12,20.59 14.38,20.29Q14.64,20 14.64,19.41L14.64,18.24Q14.64,17.26 15.17,16.65Q15.7,16.04 16.58,15.86L16.58,15.14Q15.7,14.96 15.17,14.35Q14.64,13.74 14.64,12.76L14.64,11.59Q14.64,11 14.38,10.71Q14.12,10.41 13.54,10.41L12.82,10.41L12.82,9L13.92,9Q14.94,9 15.53,9.53Q16.12,10.05 16.12,11.07L16.12,12.04Z"/>
        </svg>
    );

    const YahooIcon = () => (
        <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12.996,20L9.186,11.805L4.532,20H1L7.953,7.442L6.039,3H9.817L11.131,6.117L12.498,3H16.259L14.327,7.483L21.361,20H17.759L13.092,11.847L12.996,20Z"/>
        </svg>
    );

    const DownloadIcon = () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
    );

    const getIcon = (iconType) => {
        switch (iconType) {
            case 'google': return <GoogleIcon />;
            case 'apple': return <AppleIcon />;
            case 'outlook': return <OutlookIcon />;
            case 'yahoo': return <YahooIcon />;
            case 'download': return <DownloadIcon />;
            default: return <DownloadIcon />;
        }
    };

    return (
        <div className="calendar-picker-overlay" onClick={onClose}>
            <div
                className={`calendar-picker-modal ${isMobile ? 'mobile' : ''}`}
                onClick={e => e.stopPropagation()}
            >
                <div className="calendar-picker-header">
                    <h2 className="calendar-picker-title">Choose Your Calendar</h2>
                    <p className="calendar-picker-subtitle">
                        Select your preferred calendar app. We'll remember your choice.
                    </p>
                </div>

                <div className="calendar-picker-options">
                    {CALENDAR_OPTIONS.map(option => (
                        <button
                            key={option.value}
                            type="button"
                            className={`calendar-option ${selected === option.value ? 'selected' : ''}`}
                            onClick={() => handleSelect(option.value)}
                        >
                            <span className="calendar-option-icon">
                                {getIcon(option.icon)}
                            </span>
                            <span className="calendar-option-label">{option.label}</span>
                            {selected === option.value && (
                                <span className="calendar-option-check">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                <div className="calendar-picker-footer">
                    <button
                        type="button"
                        className="calendar-picker-cancel"
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        className="calendar-picker-confirm"
                        onClick={handleConfirm}
                        disabled={!selected}
                    >
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CalendarPickerModal;

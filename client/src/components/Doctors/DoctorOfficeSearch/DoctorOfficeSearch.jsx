import React, { useEffect, useRef, useState, useCallback } from 'react';
import './DoctorOfficeSearch.css';

const LOAD_TIMEOUT_MS = 10000;

const DoctorOfficeSearch = ({ onSelect, value, placeholder = "Search for a doctor's office or clinic..." }) => {
    const inputRef = useRef(null);
    const autocompleteRef = useRef(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [error, setError] = useState(null);

    // Sync parent value into the uncontrolled input via ref
    useEffect(() => {
        if (inputRef.current && value !== undefined && value !== null) {
            // Only update if the input isn't focused (don't fight Google Autocomplete)
            if (document.activeElement !== inputRef.current) {
                inputRef.current.value = value;
            }
        }
    }, [value]);

    const initAutocomplete = useCallback(() => {
        if (!inputRef.current) {
            setError('Search input not available');
            return;
        }

        if (!window.google?.maps?.places) {
            setError('Google Places library failed to load');
            return;
        }

        try {
            autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
                types: ['doctor', 'hospital', 'dentist'],
                fields: ['name', 'formatted_address', 'formatted_phone_number', 'address_components', 'types']
            });

            autocompleteRef.current.addListener('place_changed', handlePlaceSelect);
            setIsLoaded(true);
        } catch (err) {
            console.error('Error initializing autocomplete:', err);
            setError('Failed to initialize search');
        }
    }, []);

    useEffect(() => {
        let loadTimer = null;
        let pollInterval = null;

        // Start a timeout — if API doesn't load in time, show fallback
        loadTimer = setTimeout(() => {
            if (!isLoaded) {
                setError('Google Places took too long to load. Enter practice name manually.');
            }
        }, LOAD_TIMEOUT_MS);

        // Check if Google Maps is already loaded
        if (window.google && window.google.maps && window.google.maps.places) {
            clearTimeout(loadTimer);
            initAutocomplete();
            return () => clearTimeout(loadTimer);
        }

        // Load Google Maps JavaScript API
        const apiKey = process.env.REACT_APP_GOOGLE_PLACES_API_KEY;
        if (!apiKey) {
            clearTimeout(loadTimer);
            setError('Google Places API key not configured');
            return () => clearTimeout(loadTimer);
        }

        // Check if script is already being loaded
        if (document.querySelector('script[src*="maps.googleapis.com"]')) {
            pollInterval = setInterval(() => {
                if (window.google && window.google.maps && window.google.maps.places) {
                    clearInterval(pollInterval);
                    clearTimeout(loadTimer);
                    initAutocomplete();
                }
            }, 100);

            return () => {
                clearInterval(pollInterval);
                clearTimeout(loadTimer);
            };
        }

        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
        script.async = true;
        script.defer = true;
        script.onload = () => {
            clearTimeout(loadTimer);
            initAutocomplete();
        };
        script.onerror = () => {
            clearTimeout(loadTimer);
            setError('Failed to load Google Maps');
        };
        document.head.appendChild(script);

        return () => {
            clearTimeout(loadTimer);
            if (pollInterval) clearInterval(pollInterval);
            if (autocompleteRef.current) {
                window.google?.maps?.event?.clearInstanceListeners(autocompleteRef.current);
            }
        };
    }, [initAutocomplete]);

    const handlePlaceSelect = () => {
        const place = autocompleteRef.current.getPlace();

        if (!place || !place.name) {
            return;
        }

        // Parse address components
        const addressComponents = place.address_components || [];
        let street = '';
        let city = '';
        let state = '';
        let zipCode = '';

        for (const component of addressComponents) {
            const types = component.types;
            if (types.includes('street_number')) {
                street = component.long_name + ' ';
            } else if (types.includes('route')) {
                street += component.long_name;
            } else if (types.includes('locality')) {
                city = component.long_name;
            } else if (types.includes('administrative_area_level_1')) {
                state = component.short_name;
            } else if (types.includes('postal_code')) {
                zipCode = component.long_name;
            }
        }

        const officeData = {
            name: place.name,
            phone: place.formatted_phone_number || '',
            address: {
                street: street.trim(),
                city,
                state,
                zipCode
            },
            formattedAddress: place.formatted_address || '',
            types: place.types || []
        };

        // Update the input value via ref (uncontrolled)
        if (inputRef.current) {
            inputRef.current.value = place.name;
        }
        onSelect(officeData);
    };

    const handleInputChange = (e) => {
        const val = e.target.value;
        // If user clears, notify parent. If in error/manual mode, send typed name.
        if (val === '') {
            onSelect({ name: '' });
        } else if (error) {
            onSelect({ name: val, address: {}, phone: '' });
        }
    };

    if (error) {
        return (
            <div className="doctor-office-search-container">
                <input
                    type="text"
                    className="doctor-office-search-input"
                    defaultValue={value || ''}
                    onChange={handleInputChange}
                    placeholder="Enter office name manually"
                />
            </div>
        );
    }

    return (
        <div className="doctor-office-search-container">
            <div className="doctor-office-search-input-wrapper">
                <svg
                    className="doctor-office-search-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <circle cx="11" cy="11" r="8" />
                    <path d="M21 21l-4.35-4.35" />
                </svg>
                <input
                    ref={inputRef}
                    type="text"
                    className="doctor-office-search-input"
                    defaultValue={value || ''}
                    onChange={handleInputChange}
                    placeholder={isLoaded ? placeholder : "Loading Google Places..."}
                />
            </div>
            <p className="doctor-office-search-hint">
                Search by office name or address
            </p>
        </div>
    );
};

export default DoctorOfficeSearch;

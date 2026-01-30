import React, { useEffect, useRef, useState } from 'react';
import './PharmacySearch.css';

const PharmacySearch = ({ onSelect, placeholder = "Search for a pharmacy..." }) => {
    const inputRef = useRef(null);
    const autocompleteRef = useRef(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Check if Google Maps is already loaded
        if (window.google && window.google.maps && window.google.maps.places) {
            initAutocomplete();
            return;
        }

        // Load Google Maps JavaScript API
        const apiKey = process.env.REACT_APP_GOOGLE_PLACES_API_KEY;
        if (!apiKey) {
            setError('Google Places API key not configured');
            return;
        }

        // Check if script is already being loaded
        if (document.querySelector('script[src*="maps.googleapis.com"]')) {
            // Wait for it to load
            const checkLoaded = setInterval(() => {
                if (window.google && window.google.maps && window.google.maps.places) {
                    clearInterval(checkLoaded);
                    initAutocomplete();
                }
            }, 100);
            return () => clearInterval(checkLoaded);
        }

        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
        script.async = true;
        script.defer = true;
        script.onload = () => {
            initAutocomplete();
        };
        script.onerror = () => {
            setError('Failed to load Google Maps');
        };
        document.head.appendChild(script);

        return () => {
            // Cleanup autocomplete
            if (autocompleteRef.current) {
                window.google?.maps?.event?.clearInstanceListeners(autocompleteRef.current);
            }
        };
    }, []);

    const initAutocomplete = () => {
        if (!inputRef.current || !window.google?.maps?.places) return;

        try {
            autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
                types: ['pharmacy'],
                fields: ['name', 'formatted_address', 'formatted_phone_number', 'address_components', 'geometry']
            });

            autocompleteRef.current.addListener('place_changed', handlePlaceSelect);
            setIsLoaded(true);
        } catch (err) {
            console.error('Error initializing autocomplete:', err);
            setError('Failed to initialize pharmacy search');
        }
    };

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

        const pharmacyData = {
            name: place.name,
            phone: place.formatted_phone_number || '',
            fax: '', // Google doesn't provide fax
            address: {
                street: street.trim(),
                city,
                state,
                zipCode
            },
            formattedAddress: place.formatted_address || ''
        };

        onSelect(pharmacyData);

        // Clear the input after selection
        if (inputRef.current) {
            inputRef.current.value = '';
        }
    };

    if (error) {
        return (
            <div className="pharmacy-search-error">
                <p>{error}</p>
            </div>
        );
    }

    return (
        <div className="pharmacy-search">
            <div className="pharmacy-search-input-wrapper">
                <svg
                    className="pharmacy-search-icon"
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
                    className="pharmacy-search-input"
                    placeholder={isLoaded ? placeholder : "Loading..."}
                    disabled={!isLoaded}
                />
            </div>
            <p className="pharmacy-search-hint">
                Search by pharmacy name or address
            </p>
        </div>
    );
};

export default PharmacySearch;

import React, { useEffect, useRef, useState } from 'react';
import './FacilitySearch.css';

const FacilitySearch = ({ onSelect, value, placeholder = "Search for a hospital, clinic, or doctor's office..." }) => {
    const inputRef = useRef(null);
    const autocompleteRef = useRef(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [error, setError] = useState(null);
    const [inputValue, setInputValue] = useState(value || '');

    useEffect(() => {
        setInputValue(value || '');
    }, [value]);

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
                types: ['establishment'],
                fields: ['name', 'formatted_address', 'formatted_phone_number', 'address_components', 'types']
            });

            autocompleteRef.current.addListener('place_changed', handlePlaceSelect);
            setIsLoaded(true);
        } catch (err) {
            console.error('Error initializing autocomplete:', err);
            setError('Failed to initialize facility search');
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

        const facilityData = {
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

        // Set input value to facility name
        setInputValue(place.name);
        onSelect(facilityData);
    };

    const handleInputChange = (e) => {
        setInputValue(e.target.value);
        // If user clears or types, notify parent
        if (e.target.value === '') {
            onSelect({ name: '' });
        }
    };

    if (error) {
        return (
            <div className="facility-search-container">
                <input
                    type="text"
                    className="facility-search-input"
                    value={inputValue}
                    onChange={handleInputChange}
                    placeholder="Enter facility name manually"
                />
            </div>
        );
    }

    return (
        <div className="facility-search-container">
            <div className="facility-search-input-wrapper">
                <svg
                    className="facility-search-icon"
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
                    className="facility-search-input"
                    value={inputValue}
                    onChange={handleInputChange}
                    placeholder={isLoaded ? placeholder : "Loading..."}
                    disabled={!isLoaded}
                />
            </div>
        </div>
    );
};

export default FacilitySearch;

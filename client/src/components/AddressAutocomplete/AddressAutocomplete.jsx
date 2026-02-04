import React, { useEffect, useRef, useState } from 'react';
import './AddressAutocomplete.css';

const AddressAutocomplete = ({ onSelect, value, placeholder = "Start typing your address..." }) => {
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
                types: ['address'],
                componentRestrictions: { country: 'us' },
                fields: ['formatted_address', 'address_components']
            });

            autocompleteRef.current.addListener('place_changed', handlePlaceSelect);
            setIsLoaded(true);
        } catch (err) {
            console.error('Error initializing autocomplete:', err);
            setError('Failed to initialize search');
        }
    };

    const handlePlaceSelect = () => {
        const place = autocompleteRef.current.getPlace();

        if (!place || !place.address_components) {
            return;
        }

        // Parse address components
        const addressComponents = place.address_components || [];
        let streetNumber = '';
        let route = '';
        let city = '';
        let state = '';
        let zipCode = '';

        for (const component of addressComponents) {
            const types = component.types;
            if (types.includes('street_number')) {
                streetNumber = component.long_name;
            } else if (types.includes('route')) {
                route = component.long_name;
            } else if (types.includes('locality')) {
                city = component.long_name;
            } else if (types.includes('sublocality_level_1') && !city) {
                // Fallback for cities like NYC
                city = component.long_name;
            } else if (types.includes('administrative_area_level_1')) {
                state = component.short_name;
            } else if (types.includes('postal_code')) {
                zipCode = component.long_name;
            }
        }

        const street = streetNumber ? `${streetNumber} ${route}` : route;

        const addressData = {
            street: street.trim(),
            city,
            state,
            zipCode,
            formattedAddress: place.formatted_address || ''
        };

        // Set input to formatted address
        setInputValue(place.formatted_address || street);
        onSelect(addressData);
    };

    const handleInputChange = (e) => {
        setInputValue(e.target.value);
        // If user clears, notify parent
        if (e.target.value === '') {
            onSelect({ street: '', city: '', state: '', zipCode: '' });
        }
    };

    if (error) {
        return (
            <div className="address-autocomplete-container">
                <input
                    type="text"
                    className="address-autocomplete-input"
                    value={inputValue}
                    onChange={handleInputChange}
                    placeholder="Enter address manually"
                />
            </div>
        );
    }

    return (
        <div className="address-autocomplete-container">
            <div className="address-autocomplete-input-wrapper">
                <svg
                    className="address-autocomplete-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                </svg>
                <input
                    ref={inputRef}
                    type="text"
                    className="address-autocomplete-input"
                    value={inputValue}
                    onChange={handleInputChange}
                    placeholder={isLoaded ? placeholder : "Loading..."}
                    disabled={!isLoaded}
                />
            </div>
            <p className="address-autocomplete-hint">
                Search for your address
            </p>
        </div>
    );
};

export default AddressAutocomplete;

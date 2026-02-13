import React, { useEffect, useRef, useState } from 'react';
import './BillerSearch.css';

const BillerSearch = ({ onSelect, value, placeholder = "Search hospital or provider..." }) => {
    const inputRef = useRef(null);
    const autocompleteRef = useRef(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [error, setError] = useState(null);
    const [inputValue, setInputValue] = useState(value || '');

    useEffect(() => {
        setInputValue(value || '');
    }, [value]);

    useEffect(() => {
        if (window.google && window.google.maps && window.google.maps.places) {
            initAutocomplete();
            return;
        }

        const apiKey = process.env.REACT_APP_GOOGLE_PLACES_API_KEY;
        if (!apiKey) {
            setError('Google Places API key not configured');
            return;
        }

        if (document.querySelector('script[src*="maps.googleapis.com"]')) {
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
                componentRestrictions: { country: 'us' },
                fields: ['name', 'formatted_address', 'formatted_phone_number', 'website']
            });

            autocompleteRef.current.addListener('place_changed', handlePlaceSelect);
            setIsLoaded(true);
        } catch (err) {
            console.error('Error initializing biller search:', err);
            setError('Failed to initialize search');
        }
    };

    const handlePlaceSelect = () => {
        const place = autocompleteRef.current.getPlace();

        if (!place || !place.name) {
            return;
        }

        const billerData = {
            name: place.name || '',
            address: place.formatted_address || '',
            phone: place.formatted_phone_number || '',
            website: place.website || ''
        };

        setInputValue(place.name);
        onSelect(billerData);
    };

    const handleInputChange = (e) => {
        setInputValue(e.target.value);
        // Also update parent name field for manual typing
        onSelect({ name: e.target.value });
    };

    if (error) {
        return (
            <input
                type="text"
                className="bill-modal-input"
                value={inputValue}
                onChange={handleInputChange}
                placeholder="Enter biller name manually"
            />
        );
    }

    return (
        <div className="biller-search-wrapper">
            <input
                ref={inputRef}
                type="text"
                className="bill-modal-input biller-search-input"
                value={inputValue}
                onChange={handleInputChange}
                placeholder={isLoaded ? placeholder : "Loading..."}
            />
            {isLoaded && (
                <svg
                    className="biller-search-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
            )}
        </div>
    );
};

export default BillerSearch;

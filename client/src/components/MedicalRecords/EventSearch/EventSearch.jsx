import React, { useState, useEffect, useRef } from 'react';
import { clinicalTermsService } from '../../../services/clinicalTermsService';
import './EventSearch.css';

const EventSearch = ({ value, onChange, placeholder }) => {
    const [query, setQuery] = useState(value || '');
    const [results, setResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const debounceRef = useRef(null);
    const containerRef = useRef(null);

    useEffect(() => {
        setQuery(value || '');
    }, [value]);

    useEffect(() => {
        // Close dropdown when clicking outside
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleInputChange = (e) => {
        const inputValue = e.target.value;
        setQuery(inputValue);
        onChange(inputValue);

        // Clear previous debounce
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        if (inputValue.length < 2) {
            setResults([]);
            setShowDropdown(false);
            return;
        }

        // Debounce search
        debounceRef.current = setTimeout(async () => {
            setIsLoading(true);
            try {
                const searchResults = await clinicalTermsService.searchSimple(inputValue);
                setResults(searchResults);
                setShowDropdown(searchResults.length > 0);
            } catch (error) {
                console.error('Search error:', error);
                setResults([]);
            } finally {
                setIsLoading(false);
            }
        }, 300);
    };

    const handleSelect = (result) => {
        const selectedName = result.name || result.display;
        setQuery(selectedName);
        onChange(selectedName);
        setShowDropdown(false);
        setResults([]);
    };

    const handleFocus = () => {
        if (results.length > 0) {
            setShowDropdown(true);
        }
    };

    return (
        <div className="event-search-container" ref={containerRef}>
            <div className="event-search-input-wrapper">
                <input
                    type="text"
                    className="event-search-input"
                    value={query}
                    onChange={handleInputChange}
                    onFocus={handleFocus}
                    placeholder={placeholder || "e.g., Chest Pain, Broken Arm, Knee Surgery"}
                />
                {isLoading && (
                    <div className="event-search-spinner"></div>
                )}
            </div>

            {showDropdown && results.length > 0 && (
                <div className="event-search-dropdown">
                    {results.map((result, index) => (
                        <div
                            key={index}
                            className="event-search-item"
                            onClick={() => handleSelect(result)}
                        >
                            <span className="event-search-item-name">
                                {result.name || result.display}
                            </span>
                            {result.code && (
                                <span className="event-search-item-code">
                                    {result.code}
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default EventSearch;

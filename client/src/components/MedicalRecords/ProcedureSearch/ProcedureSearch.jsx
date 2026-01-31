import React, { useState, useEffect, useRef } from 'react';
import { clinicalTermsService } from '../../../services/clinicalTermsService';
import './ProcedureSearch.css';

const ProcedureSearch = ({ value, onChange, placeholder }) => {
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

        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        if (inputValue.length < 2) {
            setResults([]);
            setShowDropdown(false);
            return;
        }

        debounceRef.current = setTimeout(async () => {
            setIsLoading(true);
            try {
                const searchResults = await clinicalTermsService.searchProcedures(inputValue);
                setResults(searchResults);
                setShowDropdown(searchResults.length > 0);
            } catch (error) {
                console.error('Procedure search error:', error);
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
        <div className="procedure-search-container" ref={containerRef}>
            <div className="procedure-search-input-wrapper">
                <input
                    type="text"
                    className="procedure-search-input"
                    value={query}
                    onChange={handleInputChange}
                    onFocus={handleFocus}
                    placeholder={placeholder || "e.g., Appendectomy, Knee Replacement"}
                />
                {isLoading && (
                    <div className="procedure-search-spinner"></div>
                )}
            </div>

            {showDropdown && results.length > 0 && (
                <div className="procedure-search-dropdown">
                    {results.map((result, index) => (
                        <div
                            key={index}
                            className="procedure-search-item"
                            onClick={() => handleSelect(result)}
                        >
                            <span className="procedure-search-item-name">
                                {result.name || result.display}
                            </span>
                            {result.code && (
                                <span className="procedure-search-item-code">
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

export default ProcedureSearch;

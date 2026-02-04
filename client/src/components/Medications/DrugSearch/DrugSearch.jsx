import React, { useState, useEffect, useRef } from 'react';
import { rxNavService } from '../../../services/rxNavService';
import './DrugSearch.css';

const DrugSearch = ({ onSelect, placeholder = "Search medications..." }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const inputRef = useRef(null);
    const dropdownRef = useRef(null);
    const debounceRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target) &&
                !inputRef.current.contains(event.target)
            ) {
                setShowDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        if (query.length < 2) {
            setResults([]);
            setShowDropdown(false);
            return;
        }

        setIsLoading(true);

        debounceRef.current = setTimeout(async () => {
            try {
                const data = await rxNavService.autocomplete(query);
                setResults(data);
                setShowDropdown(data.length > 0);
                setHighlightedIndex(-1);
            } catch (error) {
                console.error('Search error:', error);
                setResults([]);
            } finally {
                setIsLoading(false);
            }
        }, 300);

        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, [query]);

    const handleSelect = async (item) => {
        setQuery(item.name);
        setShowDropdown(false);
        setResults([]);

        // Parse strength and unit directly from the autocomplete name as fallback
        const parsedFromName = parseStrengthFromName(item.name);

        // Try to get detailed drug info from RxNav
        const drugInfo = await rxNavService.getDrugInfo(item.rxcui);

        // Combine data, preferring drugInfo but falling back to parsed name
        onSelect({
            rxcui: item.rxcui,
            name: parsedFromName.baseName || item.name,
            fullName: drugInfo?.fullName || item.name,
            genericName: drugInfo?.synonym || '',
            synonym: drugInfo?.synonym || '',
            strength: drugInfo?.strength || parsedFromName.strength || '',
            unit: drugInfo?.unit || parsedFromName.unit || 'mg',
            dosageForm: drugInfo?.dosageForm || parsedFromName.dosageForm || '',
            tty: drugInfo?.tty || ''
        });
    };

    // Parse strength, unit, and base name from drug name string
    const parseStrengthFromName = (name) => {
        const result = {
            baseName: name,
            strength: '',
            unit: 'mg',
            dosageForm: ''
        };

        if (!name) return result;

        // Match patterns like "0.5 MG", "10 MG", "100 MCG", "500 MG/5ML"
        const strengthMatch = name.match(/(\d+\.?\d*)\s*(MG|MCG|G|ML|UNIT|%)/i);
        if (strengthMatch) {
            result.strength = strengthMatch[1];
            result.unit = strengthMatch[2].toLowerCase();
        }

        // Extract base drug name (everything before the number)
        const baseMatch = name.match(/^([A-Za-z\s\-]+?)(?:\s+\d)/);
        if (baseMatch) {
            result.baseName = baseMatch[1].trim();
        }

        // Extract dosage form (Tablet, Capsule, etc.)
        const formMatch = name.match(/(Oral\s+)?(Tablet|Capsule|Solution|Suspension|Injection|Cream|Ointment|Gel|Patch|Spray|Inhaler|Drops)/i);
        if (formMatch) {
            result.dosageForm = formMatch[0];
        }

        return result;
    };

    const handleKeyDown = (e) => {
        if (!showDropdown) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setHighlightedIndex(prev =>
                    prev < results.length - 1 ? prev + 1 : prev
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setHighlightedIndex(prev => (prev > 0 ? prev - 1 : -1));
                break;
            case 'Enter':
                e.preventDefault();
                if (highlightedIndex >= 0 && results[highlightedIndex]) {
                    handleSelect(results[highlightedIndex]);
                }
                break;
            case 'Escape':
                setShowDropdown(false);
                break;
            default:
                break;
        }
    };

    const SearchIcon = () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
    );

    return (
        <div className="drug-search-container">
            <div className="drug-search-input-wrapper">
                <span className="drug-search-icon">
                    <SearchIcon />
                </span>
                <input
                    ref={inputRef}
                    type="text"
                    className="drug-search-input"
                    placeholder={placeholder}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => results.length > 0 && setShowDropdown(true)}
                    onKeyDown={handleKeyDown}
                    autoComplete="off"
                />
                {isLoading && (
                    <span className="drug-search-loader">
                        <span className="drug-search-spinner"></span>
                    </span>
                )}
            </div>

            {showDropdown && results.length > 0 && (
                <div ref={dropdownRef} className="drug-search-dropdown">
                    {results.map((item, index) => (
                        <button
                            key={item.rxcui}
                            type="button"
                            className={`drug-search-item ${index === highlightedIndex ? 'highlighted' : ''}`}
                            onClick={() => handleSelect(item)}
                            onMouseEnter={() => setHighlightedIndex(index)}
                        >
                            <span className="drug-search-item-name">{item.name}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default DrugSearch;

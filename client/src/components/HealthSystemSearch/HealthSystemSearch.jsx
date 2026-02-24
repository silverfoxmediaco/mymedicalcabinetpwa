import React, { useState, useEffect, useRef } from 'react';
import { healthSystemService } from '../../services/healthSystemService';
import './HealthSystemSearch.css';

const HealthSystemSearch = ({ onSelect, placeholder = "Search your health system..." }) => {
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
                const data = await healthSystemService.search(query);
                setResults(data);
                setShowDropdown(data.length > 0);
                setHighlightedIndex(-1);
            } catch (error) {
                console.error('Health system search error:', error);
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

    const handleSelect = (item) => {
        setQuery('');
        setShowDropdown(false);
        setResults([]);
        onSelect({
            _id: item._id,
            name: item.name,
            city: item.city,
            state: item.state
        });
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
        <div className="hs-search-container">
            <div className="hs-search-input-wrapper">
                <span className="hs-search-icon">
                    <SearchIcon />
                </span>
                <input
                    ref={inputRef}
                    type="text"
                    className="hs-search-input"
                    placeholder={placeholder}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => results.length > 0 && setShowDropdown(true)}
                    onKeyDown={handleKeyDown}
                    autoComplete="off"
                />
                {isLoading && (
                    <span className="hs-search-loader">
                        <span className="hs-search-spinner"></span>
                    </span>
                )}
            </div>

            {showDropdown && results.length > 0 && (
                <div ref={dropdownRef} className="hs-search-dropdown">
                    {results.map((item, index) => (
                        <button
                            key={item._id}
                            type="button"
                            className={`hs-search-item ${index === highlightedIndex ? 'hs-search-item-highlighted' : ''}`}
                            onClick={() => handleSelect(item)}
                            onMouseEnter={() => setHighlightedIndex(index)}
                        >
                            <span className="hs-search-item-name">{item.name}</span>
                            {(item.city || item.state) && (
                                <span className="hs-search-item-location">
                                    {[item.city, item.state].filter(Boolean).join(', ')}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default HealthSystemSearch;

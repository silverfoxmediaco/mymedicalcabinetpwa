import React, { useState, useEffect, useRef } from 'react';
import { searchDoctors } from '../../../services/npiService';
import './DoctorSearch.css';

const DoctorSearch = ({ onSelect, placeholder = "Search by doctor name...", stateFilter = '' }) => {
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
                const options = {};
                if (stateFilter) options.state = stateFilter;

                const providers = await searchDoctors(query, options);
                setResults(providers);
                setShowDropdown(providers.length > 0);
                setHighlightedIndex(-1);
            } catch (error) {
                console.error('Doctor search error:', error);
                setResults([]);
            } finally {
                setIsLoading(false);
            }
        }, 400); // Slightly longer debounce for API calls

        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, [query, stateFilter]);

    const handleSelect = (provider) => {
        setQuery(provider.fullName || `${provider.firstName} ${provider.lastName}`);
        setShowDropdown(false);
        setResults([]);

        // Map NPI data to form fields
        onSelect({
            name: provider.fullName || `${provider.firstName} ${provider.lastName}`,
            firstName: provider.firstName,
            lastName: provider.lastName,
            credential: provider.credential,
            specialty: mapSpecialtyToOption(provider.specialty),
            npiNumber: provider.npiNumber,
            phone: provider.practiceAddress?.phone || '',
            fax: provider.practiceAddress?.fax || '',
            practice: {
                name: '', // NPI doesn't have practice name, just address
                address: {
                    street: provider.practiceAddress?.street || '',
                    city: provider.practiceAddress?.city || '',
                    state: provider.practiceAddress?.state || '',
                    zipCode: provider.practiceAddress?.zipCode?.substring(0, 5) || ''
                }
            },
            // Include raw data for reference
            rawNpiData: provider
        });
    };

    // Map NPI specialty descriptions to our dropdown options
    const mapSpecialtyToOption = (npiSpecialty) => {
        if (!npiSpecialty) return '';

        const specialtyLower = npiSpecialty.toLowerCase();

        const mappings = {
            'family': 'Family Medicine',
            'family medicine': 'Family Medicine',
            'internal medicine': 'Internal Medicine',
            'internist': 'Internal Medicine',
            'cardiovascular': 'Cardiology',
            'cardiology': 'Cardiology',
            'dermatology': 'Dermatology',
            'endocrinology': 'Endocrinology',
            'gastroenterology': 'Gastroenterology',
            'neurology': 'Neurology',
            'obstetrics': 'Obstetrics & Gynecology',
            'gynecology': 'Obstetrics & Gynecology',
            'ob/gyn': 'Obstetrics & Gynecology',
            'oncology': 'Oncology',
            'hematology': 'Oncology',
            'ophthalmology': 'Ophthalmology',
            'orthopedic': 'Orthopedics',
            'orthopaedic': 'Orthopedics',
            'pediatric': 'Pediatrics',
            'psychiatry': 'Psychiatry',
            'pulmonology': 'Pulmonology',
            'pulmonary': 'Pulmonology',
            'radiology': 'Radiology',
            'rheumatology': 'Rheumatology',
            'surgery': 'Surgery',
            'surgical': 'Surgery',
            'urology': 'Urology'
        };

        for (const [key, value] of Object.entries(mappings)) {
            if (specialtyLower.includes(key)) {
                return value;
            }
        }

        // Check for primary care indicators
        if (specialtyLower.includes('general practice') ||
            specialtyLower.includes('primary care')) {
            return 'Primary Care';
        }

        return 'Other';
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

    const formatLocation = (provider) => {
        const parts = [];
        if (provider.practiceAddress?.city) parts.push(provider.practiceAddress.city);
        if (provider.practiceAddress?.state) parts.push(provider.practiceAddress.state);
        return parts.join(', ');
    };

    return (
        <div className="doctor-search-container">
            <div className="doctor-search-input-wrapper">
                <span className="doctor-search-icon">
                    <SearchIcon />
                </span>
                <input
                    ref={inputRef}
                    type="text"
                    className="doctor-search-input"
                    placeholder={placeholder}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => results.length > 0 && setShowDropdown(true)}
                    onKeyDown={handleKeyDown}
                    autoComplete="off"
                />
                {isLoading && (
                    <span className="doctor-search-loader">
                        <span className="doctor-search-spinner"></span>
                    </span>
                )}
            </div>

            {showDropdown && results.length > 0 && (
                <div ref={dropdownRef} className="doctor-search-dropdown">
                    {results.map((provider, index) => (
                        <button
                            key={provider.npiNumber}
                            type="button"
                            className={`doctor-search-item ${index === highlightedIndex ? 'highlighted' : ''}`}
                            onClick={() => handleSelect(provider)}
                            onMouseEnter={() => setHighlightedIndex(index)}
                        >
                            <div className="doctor-search-item-main">
                                <span className="doctor-search-item-name">
                                    {provider.fullName}
                                </span>
                                {provider.specialty && (
                                    <span className="doctor-search-item-specialty">
                                        {provider.specialty}
                                    </span>
                                )}
                            </div>
                            <div className="doctor-search-item-details">
                                {formatLocation(provider) && (
                                    <span className="doctor-search-item-location">
                                        {formatLocation(provider)}
                                    </span>
                                )}
                                <span className="doctor-search-item-npi">
                                    NPI: {provider.npiNumber}
                                </span>
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {showDropdown && results.length === 0 && !isLoading && query.length >= 2 && (
                <div ref={dropdownRef} className="doctor-search-dropdown">
                    <div className="doctor-search-no-results">
                        No doctors found. Try a different name or check spelling.
                    </div>
                </div>
            )}
        </div>
    );
};

export default DoctorSearch;

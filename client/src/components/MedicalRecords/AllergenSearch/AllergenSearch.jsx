import React, { useState, useEffect, useRef } from 'react';
import './AllergenSearch.css';

// Common non-drug allergens
const COMMON_ALLERGENS = [
    // Foods
    { name: 'Peanuts', category: 'Food' },
    { name: 'Tree nuts', category: 'Food' },
    { name: 'Shellfish', category: 'Food' },
    { name: 'Fish', category: 'Food' },
    { name: 'Milk', category: 'Food' },
    { name: 'Eggs', category: 'Food' },
    { name: 'Wheat', category: 'Food' },
    { name: 'Soy', category: 'Food' },
    { name: 'Sesame', category: 'Food' },
    { name: 'Gluten', category: 'Food' },
    // Environmental
    { name: 'Pollen', category: 'Environmental' },
    { name: 'Dust mites', category: 'Environmental' },
    { name: 'Mold', category: 'Environmental' },
    { name: 'Pet dander', category: 'Environmental' },
    { name: 'Cat dander', category: 'Environmental' },
    { name: 'Dog dander', category: 'Environmental' },
    { name: 'Grass', category: 'Environmental' },
    { name: 'Ragweed', category: 'Environmental' },
    // Insects
    { name: 'Bee stings', category: 'Insect' },
    { name: 'Wasp stings', category: 'Insect' },
    { name: 'Insect bites', category: 'Insect' },
    // Materials
    { name: 'Latex', category: 'Material' },
    { name: 'Nickel', category: 'Material' },
    // Common drug classes
    { name: 'Penicillin', category: 'Drug' },
    { name: 'Sulfa drugs', category: 'Drug' },
    { name: 'Aspirin', category: 'Drug' },
    { name: 'NSAIDs', category: 'Drug' },
    { name: 'Ibuprofen', category: 'Drug' },
    { name: 'Codeine', category: 'Drug' },
    { name: 'Morphine', category: 'Drug' },
    { name: 'Contrast dye', category: 'Drug' },
    { name: 'Iodine', category: 'Drug' },
    { name: 'Amoxicillin', category: 'Drug' },
    { name: 'Cephalosporins', category: 'Drug' },
    { name: 'Tetracycline', category: 'Drug' },
    { name: 'Erythromycin', category: 'Drug' },
    { name: 'Fluoroquinolones', category: 'Drug' },
    { name: 'Anesthesia', category: 'Drug' },
    { name: 'Lidocaine', category: 'Drug' },
];

const RXNAV_API = 'https://rxnav.nlm.nih.gov/REST';

const AllergenSearch = ({ value, onChange, placeholder }) => {
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

    const searchDrugs = async (searchQuery) => {
        try {
            const response = await fetch(
                `${RXNAV_API}/approximateTerm.json?term=${encodeURIComponent(searchQuery)}&maxEntries=8`
            );
            if (!response.ok) return [];

            const data = await response.json();
            const candidates = data.approximateGroup?.candidate || [];

            return candidates.map(c => ({
                name: c.name,
                category: 'Drug',
                rxcui: c.rxcui
            }));
        } catch (error) {
            console.error('RxNav search error:', error);
            return [];
        }
    };

    const handleInputChange = async (e) => {
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
                // Search common allergens locally
                const lowerQuery = inputValue.toLowerCase();
                const commonMatches = COMMON_ALLERGENS.filter(a =>
                    a.name.toLowerCase().includes(lowerQuery)
                ).slice(0, 6);

                // Search drugs via RxNav
                const drugMatches = await searchDrugs(inputValue);

                // Combine results, common allergens first
                const combined = [...commonMatches];
                const seenNames = new Set(commonMatches.map(a => a.name.toLowerCase()));

                drugMatches.forEach(drug => {
                    if (!seenNames.has(drug.name.toLowerCase())) {
                        seenNames.add(drug.name.toLowerCase());
                        combined.push(drug);
                    }
                });

                setResults(combined.slice(0, 12));
                setShowDropdown(combined.length > 0);
            } catch (error) {
                console.error('Search error:', error);
            } finally {
                setIsLoading(false);
            }
        }, 300);
    };

    const handleSelect = (result) => {
        setQuery(result.name);
        onChange(result.name);
        setShowDropdown(false);
        setResults([]);
    };

    const handleFocus = () => {
        if (results.length > 0) {
            setShowDropdown(true);
        }
    };

    const getCategoryIcon = (category) => {
        switch (category) {
            case 'Food':
                return '🍽️';
            case 'Environmental':
                return '🌿';
            case 'Insect':
                return '🐝';
            case 'Material':
                return '⚠️';
            case 'Drug':
                return '💊';
            default:
                return '•';
        }
    };

    return (
        <div className="allergen-search-container" ref={containerRef}>
            <div className="allergen-search-input-wrapper">
                <input
                    type="text"
                    className="allergen-search-input"
                    value={query}
                    onChange={handleInputChange}
                    onFocus={handleFocus}
                    placeholder={placeholder || "e.g., Penicillin, Peanuts, Shellfish"}
                />
                {isLoading && (
                    <div className="allergen-search-spinner"></div>
                )}
            </div>

            {showDropdown && results.length > 0 && (
                <div className="allergen-search-dropdown">
                    {results.map((result, index) => (
                        <div
                            key={index}
                            className="allergen-search-item"
                            onClick={() => handleSelect(result)}
                        >
                            <span className="allergen-search-item-icon">
                                {getCategoryIcon(result.category)}
                            </span>
                            <span className="allergen-search-item-name">
                                {result.name}
                            </span>
                            <span className="allergen-search-item-category">
                                {result.category}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AllergenSearch;

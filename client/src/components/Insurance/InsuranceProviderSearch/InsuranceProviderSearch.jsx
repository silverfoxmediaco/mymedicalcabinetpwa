import React, { useState, useEffect, useRef } from 'react';
import './InsuranceProviderSearch.css';

// Comprehensive list of US health insurance providers with contact info
const INSURANCE_PROVIDERS = [
    { name: 'Wellmark Blue Cross Blue Shield', phone: '(800) 524-9242', website: 'wellmark.com' },
    { name: 'Aetna', phone: '(800) 872-3862', website: 'aetna.com' },
    { name: 'Aflac', phone: '(800) 992-3522', website: 'aflac.com' },
    { name: 'Ambetter', phone: '(877) 687-1169', website: 'ambetter.com' },
    { name: 'Amerigroup', phone: '(800) 600-4441', website: 'amerigroup.com' },
    { name: 'Anthem Blue Cross', phone: '(800) 333-0912', website: 'anthem.com' },
    { name: 'Anthem Blue Cross Blue Shield', phone: '(800) 331-1476', website: 'anthem.com' },
    { name: 'Arkansas Blue Cross Blue Shield', phone: '(800) 238-8379', website: 'arkansasbluecross.com' },
    { name: 'Avera Health Plans', phone: '(888) 322-2115', website: 'averahealthplans.com' },
    { name: 'AvMed', phone: '(800) 882-8633', website: 'avmed.org' },
    { name: 'Banner Health', phone: '(855) 422-6637', website: 'bannerhealth.com' },
    { name: 'BCBS of Alabama', phone: '(800) 292-8868', website: 'bcbsal.org' },
    { name: 'BCBS of Arizona', phone: '(800) 232-2345', website: 'azblue.com' },
    { name: 'BCBS of Georgia', phone: '(800) 436-4252', website: 'bcbsga.com' },
    { name: 'BCBS of Illinois', phone: '(800) 538-8833', website: 'bcbsil.com' },
    { name: 'BCBS of Kansas City', phone: '(888) 989-8842', website: 'bluekc.com' },
    { name: 'BCBS of Louisiana', phone: '(800) 392-4089', website: 'bcbsla.com' },
    { name: 'BCBS of Massachusetts', phone: '(800) 262-2583', website: 'bluecrossma.com' },
    { name: 'BCBS of Michigan', phone: '(800) 662-6667', website: 'bcbsm.com' },
    { name: 'BCBS of Minnesota', phone: '(800) 382-2000', website: 'bluecrossmn.com' },
    { name: 'BCBS of Nebraska', phone: '(800) 642-8980', website: 'nebraskablue.com' },
    { name: 'BCBS of New Mexico', phone: '(800) 835-8699', website: 'bcbsnm.com' },
    { name: 'BCBS of North Carolina', phone: '(800) 324-4963', website: 'bcbsnc.com' },
    { name: 'BCBS of Tennessee', phone: '(800) 565-9140', website: 'bcbst.com' },
    { name: 'BCBS of Texas', phone: '(800) 521-2227', website: 'bcbstx.com' },
    { name: 'Blue Cross Blue Shield', phone: '(800) 810-2583', website: 'bcbs.com' },
    { name: 'Blue Shield of California', phone: '(800) 393-6130', website: 'blueshieldca.com' },
    { name: 'Bright Health', phone: '(844) 926-4524', website: 'brighthealthplan.com' },
    { name: 'Capital Blue Cross', phone: '(800) 962-2242', website: 'capbluecross.com' },
    { name: 'CareFirst BCBS', phone: '(800) 544-8703', website: 'carefirst.com' },
    { name: 'CareSource', phone: '(800) 488-0134', website: 'caresource.com' },
    { name: 'Centene', phone: '(800) 225-2573', website: 'centene.com' },
    { name: 'Cigna', phone: '(800) 997-1654', website: 'cigna.com' },
    { name: 'Clover Health', phone: '(888) 778-1478', website: 'cloverhealth.com' },
    { name: 'Community Health Plan of Washington', phone: '(800) 942-0247', website: 'chpw.org' },
    { name: 'ConnectiCare', phone: '(800) 251-7722', website: 'connecticare.com' },
    { name: 'Devoted Health', phone: '(800) 338-6833', website: 'devoted.com' },
    { name: 'Emblem Health', phone: '(877) 411-3625', website: 'emblemhealth.com' },
    { name: 'Empire Blue Cross Blue Shield', phone: '(800) 553-9603', website: 'empireblue.com' },
    { name: 'Excellus BCBS', phone: '(800) 499-1275', website: 'excellusbcbs.com' },
    { name: 'Fallon Health', phone: '(800) 868-5200', website: 'fallonhealth.org' },
    { name: 'Florida Blue', phone: '(800) 352-2583', website: 'floridablue.com' },
    { name: 'Geisinger Health Plan', phone: '(800) 447-4000', website: 'geisinger.org' },
    { name: 'Group Health Cooperative', phone: '(888) 901-4636', website: 'ghc.org' },
    { name: 'HAP (Health Alliance Plan)', phone: '(800) 422-4641', website: 'hap.org' },
    { name: 'Harvard Pilgrim Health Care', phone: '(800) 848-9995', website: 'harvardpilgrim.org' },
    { name: 'Health Net', phone: '(800) 522-0088', website: 'healthnet.com' },
    { name: 'Health Partners', phone: '(800) 883-2177', website: 'healthpartners.com' },
    { name: 'Healthfirst', phone: '(866) 463-6743', website: 'healthfirst.org' },
    { name: 'HighMark', phone: '(800) 544-7447', website: 'highmark.com' },
    { name: 'Horizon Blue Cross Blue Shield of NJ', phone: '(800) 355-2583', website: 'horizonblue.com' },
    { name: 'Humana', phone: '(800) 448-6262', website: 'humana.com' },
    { name: 'Independence Blue Cross', phone: '(800) 275-2583', website: 'ibx.com' },
    { name: 'Kaiser Permanente', phone: '(800) 464-4000', website: 'kaiserpermanente.org' },
    { name: 'L.A. Care Health Plan', phone: '(888) 452-2273', website: 'lacare.org' },
    { name: 'Magellan Health', phone: '(800) 424-4908', website: 'magellanhealth.com' },
    { name: 'Medicaid', phone: '(800) 633-4227', website: 'medicaid.gov' },
    { name: 'Medical Mutual of Ohio', phone: '(800) 382-5729', website: 'medmutual.com' },
    { name: 'Medicare', phone: '(800) 633-4227', website: 'medicare.gov' },
    { name: 'Medica', phone: '(800) 952-3455', website: 'medica.com' },
    { name: 'Moda Health', phone: '(877) 605-3229', website: 'modahealth.com' },
    { name: 'Molina Healthcare', phone: '(888) 562-5442', website: 'molinahealthcare.com' },
    { name: 'MVP Health Care', phone: '(800) 777-4793', website: 'mvphealthcare.com' },
    { name: 'Oscar Health', phone: '(855) 672-2788', website: 'hioscar.com' },
    { name: 'Oxford Health Plans', phone: '(800) 444-6222', website: 'oxfordhealth.com' },
    { name: 'Paramount Health Care', phone: '(800) 462-3589', website: 'paramounthealthcare.com' },
    { name: 'PHCS (Private Healthcare Systems)', phone: '(800) 922-4362', website: 'multiplan.com' },
    { name: 'Piedmont Community Health Plan', phone: '(800) 400-7247', website: 'pchp.net' },
    { name: 'Point32Health', phone: '(800) 544-2022', website: 'point32health.org' },
    { name: 'Premera Blue Cross', phone: '(800) 722-1471', website: 'premera.com' },
    { name: 'Priority Health', phone: '(800) 942-0954', website: 'priorityhealth.com' },
    { name: 'Providence Health Plan', phone: '(800) 878-4445', website: 'providencehealthplan.com' },
    { name: 'Regence Blue Cross Blue Shield', phone: '(888) 367-2117', website: 'regence.com' },
    { name: 'Rocky Mountain Health Plans', phone: '(800) 346-4643', website: 'rmhp.org' },
    { name: 'Sanford Health Plan', phone: '(888) 605-6095', website: 'sanfordhealthplan.com' },
    { name: 'Scott and White Health Plan', phone: '(800) 321-7947', website: 'swhp.org' },
    { name: 'SelectHealth', phone: '(800) 538-5038', website: 'selecthealth.org' },
    { name: 'SummaCare', phone: '(800) 996-8701', website: 'summacare.com' },
    { name: 'Sutter Health Plus', phone: '(855) 315-5800', website: 'sutterhealthplus.org' },
    { name: 'Tricare', phone: '(800) 874-2273', website: 'tricare.mil' },
    { name: 'Tufts Health Plan', phone: '(800) 462-0224', website: 'tuftshealthplan.com' },
    { name: 'UMR', phone: '(800) 826-9781', website: 'umr.com' },
    { name: 'UPMC Health Plan', phone: '(888) 876-2756', website: 'upmchealthplan.com' },
    { name: 'United Healthcare', phone: '(800) 328-5979', website: 'uhc.com' },
    { name: 'VA Health Care', phone: '(877) 222-8387', website: 'va.gov/health-care' },
    { name: 'Wellcare', phone: '(866) 530-9491', website: 'wellcare.com' },
    { name: 'WellPoint', phone: '(800) 331-1476', website: 'wellpoint.com' }
];

const InsuranceProviderSearch = ({
    value = '',
    onChange,
    onSelect,
    placeholder = 'Search insurance provider...',
    required = false
}) => {
    const [inputValue, setInputValue] = useState(value);
    const [suggestions, setSuggestions] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const inputRef = useRef(null);
    const dropdownRef = useRef(null);

    useEffect(() => {
        setInputValue(value);
    }, [value]);

    useEffect(() => {
        // Close dropdown on outside click
        const handleClickOutside = (e) => {
            if (
                inputRef.current && !inputRef.current.contains(e.target) &&
                dropdownRef.current && !dropdownRef.current.contains(e.target)
            ) {
                setShowDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleInputChange = (e) => {
        const query = e.target.value;
        setInputValue(query);
        onChange?.(query);

        if (query.length >= 1) {
            const filtered = INSURANCE_PROVIDERS.filter(provider =>
                provider.name.toLowerCase().includes(query.toLowerCase())
            ).slice(0, 8);
            setSuggestions(filtered);
            setShowDropdown(filtered.length > 0);
            setHighlightedIndex(-1);
        } else {
            setSuggestions([]);
            setShowDropdown(false);
        }
    };

    const handleSelect = (provider) => {
        setInputValue(provider.name);
        setShowDropdown(false);
        onChange?.(provider.name);
        onSelect?.(provider);
    };

    const handleKeyDown = (e) => {
        if (!showDropdown) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setHighlightedIndex(prev =>
                    prev < suggestions.length - 1 ? prev + 1 : prev
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1);
                break;
            case 'Enter':
                e.preventDefault();
                if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
                    handleSelect(suggestions[highlightedIndex]);
                }
                break;
            case 'Escape':
                setShowDropdown(false);
                break;
            default:
                break;
        }
    };

    const handleFocus = () => {
        if (inputValue.length >= 1 && suggestions.length > 0) {
            setShowDropdown(true);
        }
    };

    return (
        <div className="insurance-provider-search-container">
            <div className="insurance-provider-search-input-wrapper">
                <input
                    ref={inputRef}
                    type="text"
                    className="insurance-provider-search-input"
                    value={inputValue}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onFocus={handleFocus}
                    placeholder={placeholder}
                    required={required}
                    autoComplete="off"
                />
            </div>

            {showDropdown && suggestions.length > 0 && (
                <div className="insurance-provider-search-dropdown" ref={dropdownRef}>
                    {suggestions.map((provider, index) => (
                        <div
                            key={provider.name}
                            className={`insurance-provider-search-item ${
                                index === highlightedIndex ? 'highlighted' : ''
                            }`}
                            onClick={() => handleSelect(provider)}
                        >
                            <div className="insurance-provider-search-item-info">
                                <span className="insurance-provider-search-item-name">
                                    {provider.name}
                                </span>
                                <span className="insurance-provider-search-item-phone">
                                    {provider.phone}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default InsuranceProviderSearch;

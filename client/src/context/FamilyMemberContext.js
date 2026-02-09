import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { familyMemberService } from '../services/familyMemberService';

const FamilyMemberContext = createContext();

export const useFamilyMember = () => {
    const context = useContext(FamilyMemberContext);
    if (!context) {
        throw new Error('useFamilyMember must be used within a FamilyMemberProvider');
    }
    return context;
};

export const FamilyMemberProvider = ({ children }) => {
    const [familyMembers, setFamilyMembers] = useState([]);
    const [activeMemberId, setActiveMemberIdState] = useState(() => {
        const stored = localStorage.getItem('activeFamilyMemberId');
        return stored && stored !== 'null' ? stored : null;
    });
    const [loading, setLoading] = useState(false);

    const loadFamilyMembers = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        setLoading(true);
        try {
            const members = await familyMemberService.getAll();
            setFamilyMembers(members);

            // Validate stored activeMemberId still exists
            if (activeMemberId) {
                const stillExists = members.some(m => m._id === activeMemberId);
                if (!stillExists) {
                    setActiveMemberIdState(null);
                    localStorage.removeItem('activeFamilyMemberId');
                }
            }
        } catch (error) {
            console.error('Error loading family members:', error);
            setFamilyMembers([]);
        } finally {
            setLoading(false);
        }
    }, [activeMemberId]);

    const setActiveMemberId = useCallback((id) => {
        const value = id || null;
        setActiveMemberIdState(value);
        if (value) {
            localStorage.setItem('activeFamilyMemberId', value);
        } else {
            localStorage.removeItem('activeFamilyMemberId');
        }
    }, []);

    const getActiveMemberName = useCallback(() => {
        if (!activeMemberId) return null;
        const member = familyMembers.find(m => m._id === activeMemberId);
        return member ? member.firstName : null;
    }, [activeMemberId, familyMembers]);

    // Load on mount
    useEffect(() => {
        loadFamilyMembers();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const value = {
        familyMembers,
        activeMemberId,
        setActiveMemberId,
        loadFamilyMembers,
        getActiveMemberName,
        loading
    };

    return (
        <FamilyMemberContext.Provider value={value}>
            {children}
        </FamilyMemberContext.Provider>
    );
};

export default FamilyMemberContext;

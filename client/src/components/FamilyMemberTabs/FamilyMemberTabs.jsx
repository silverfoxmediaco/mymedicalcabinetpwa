import React from 'react';
import { useFamilyMember } from '../../context/FamilyMemberContext';
import './FamilyMemberTabs.css';

const FamilyMemberTabs = ({ onAddMember }) => {
    const { familyMembers, activeMemberId, setActiveMemberId } = useFamilyMember();

    // Don't render if no family members and no add handler
    if (familyMembers.length === 0 && !onAddMember) return null;

    return (
        <div className="family-tabs-container">
            <div className="family-tabs-scroll">
                <button
                    className={`family-tab ${!activeMemberId ? 'family-tab-active' : ''}`}
                    onClick={() => setActiveMemberId(null)}
                >
                    Me
                </button>

                {familyMembers.map(member => (
                    <button
                        key={member._id}
                        className={`family-tab ${activeMemberId === member._id ? 'family-tab-active' : ''}`}
                        onClick={() => setActiveMemberId(member._id)}
                    >
                        {member.firstName}
                    </button>
                ))}

                {onAddMember && (
                    <button
                        className="family-tab family-tab-add"
                        onClick={onAddMember}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        Add
                    </button>
                )}
            </div>
        </div>
    );
};

export default FamilyMemberTabs;

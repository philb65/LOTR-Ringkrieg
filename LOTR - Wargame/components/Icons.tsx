

import React from 'react';
import { FactionName } from '../types';
import { FACTION_COLORS } from '../constants';

export const FactionIcon: React.FC<{ factionName: FactionName, size?: number }> = ({ factionName, size = 24 }) => {
    let color = FACTION_COLORS[factionName] || '#fff';
    let path = <path d="M12 2L2 22h20L12 2z" />; // Default triangle

    switch (factionName) {
        case 'Gondor/Rohan': // White Tree of Gondor
            color = '#FEFEFE'; // Always white
            path = <g stroke="black" strokeWidth="0.5" strokeLinejoin="round">
                <path d="M15.5 21.5v-2.5c0-1-1-1.5-1.5-1.5h-4c-.5 0-1.5.5-1.5 1.5v2.5m4-12.5v12.5m0-12.5c-2 0-3 1-3 2.5s1 2.5 3 2.5m0-5c2 0 3 1 3 2.5s-1 2.5-3 2.5m-3-2.5h6m-5.5-2.5c-1.5 0-2.5 1-2.5 2s1 2 2.5 2m-.5-6.5l.5-1.5m5.5 2.5c1.5 0 2.5 1 2.5 2s-1 2-2.5 2m.5-6.5l-.5-1.5m-2.5-1.5v-1m-1.5 7.5h-2.5m9 0h-2.5m-2-3h-2.5m7 0h-2.5M7 14.5h10M6.5 4.5l-1-1m12 1l1-1M5.5 7.5l-1.5-1M18.5 7.5l1.5-1"/>
            </g>;
            break;
        case 'Elben': // Star of the Noldor/Feanor
            path = <path d="M12 2l2.35 7.19L22 9.5l-5.83 4.27L18.15 22 12 17.5 5.85 22 7.83 13.77 2 9.5l7.65-.31L12 2z" />;
            break;
        case 'Zwerge': // Anvil and Hammer
            path = <g fillRule="evenodd">
              <path d="M6 15h12v2H6z"/>
              <path d="M8 17h8v3H8z"/>
              <path d="M4 14.5L12 9l8 5.5-1.5 1.5H5.5z"/>
              <path d="M18 7V5.5L16.5 4h-2l-1 1-2 1h-3l-1-2h-2L4 5.5V7l2-1h2.5l1 1h3l1.5-1.5 2 1.5H18z"/>
              <path d="M9.5 7.5L11 9V6.5l-1.5 1z M14.5 7.5L13 9V6.5l1.5 1z"/>
            </g>;
            break;
        case 'Mordor': // Eye of Sauron
            path = <g>
                <path d="M12 6c-4.5 0-8 3.5-10 6 2 2.5 5.5 6 10 6s8-3.5 10-6c-2-2.5-5.5-6-10-6zm0 10c-2.2 0-4-1.8-4-4s1.8-4 4-4 4 1.8 4 4-1.8 4-4 4z" fillRule="evenodd" />
                <path d="M12 12m-2 0a2 2 0 104 0 2 2 0 10-4 0" fill="red"/>
                <path d="M12 12l6 6" stroke="red" strokeWidth="1" />
            </g>;
            break;
        case 'Isengard': // White Hand of Saruman
            color = '#FEFEFE'; // Always white
            path = <path d="M10.2,22C9.54,22,9,21.46,9,20.8V14H8.5C7.67,14,7,13.33,7,12.5V9.5C7,8.67,7.67,8,8.5,8H9.75V6.5C9.75,5.12,10.87,4,12.25,4S14.75,5.12,14.75,6.5V10h1C16.54,10,17,10.67,17,11.5v3c0,0.83-0.46,1.5-1.25,1.5H15v4.8c0,0.66-0.54,1.2-1.2,1.2H10.2z M5.5,17C4.67,17,4,16.33,4,15.5v-4C4,10.67,4.67,10,5.5,10S7,10.67,7,11.5v4C7,16.33,6.33,17,5.5,17z M18.5,15.5c-0.83,0-1.5-0.67-1.5-1.5v-3c0-0.83,0.67-1.5,1.5-1.5s1.5,0.67,1.5,1.5v3C20,14.83,19.33,15.5,18.5,15.5z M3.5,13.5C2.67,13.5,2,12.83,2,12v-2.5C2,8.67,2.67,8,3.5,8S5,8.67,5,9.5V12C5,12.83,4.33,13.5,3.5,13.5z M20.5,12C19.67,12,19,11.33,19,10.5V8C19,7.17,19.67,6.5,20.5,6.5S22,7.17,22,8v2.5C22,11.33,21.33,12,20.5,12z M12.25,16L11,13.5h2.5L12.25,16z" />;
            break;
        case 'Angmar': // Witch King Crown
            path = <path d="M4 21h16v-2H4v2zM5.4 18h13.2l-1.6-9L12 3 6.9 9 5.4 18zm1.7-2l.9-5.5 4-4 4 4 .9 5.5H7.1z" />;
            break;
    }

    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill={color}>
            {path}
        </svg>
    );
};
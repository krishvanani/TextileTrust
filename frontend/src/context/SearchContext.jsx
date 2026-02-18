import React, { createContext, useContext, useState } from 'react';

const SearchContext = createContext();

export const useSearch = () => {
    const context = useContext(SearchContext);
    if (!context) {
        // Fallback to prevent crash if used outside provider
        return {
            showNavbarSearch: false,
            setShowNavbarSearch: () => {},
            searchTerm: '',
            setSearchTerm: () => {},
            category: 'All',
            setCategory: () => {}
        };
    }
    return context;
};

export const SearchProvider = ({ children }) => {
    const [showNavbarSearch, setShowNavbarSearch] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [category, setCategory] = useState('All');

    const value = {
        showNavbarSearch,
        setShowNavbarSearch,
        searchTerm,
        setSearchTerm,
        category,
        setCategory
    };

    return (
        <SearchContext.Provider value={value}>
            {children}
        </SearchContext.Provider>
    );
};

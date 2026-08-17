import React from "react";
import { FaSearch, FaTimes } from "react-icons/fa";
import "./SearchInput.css";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  placeholder = "Search...",
  className = "",
}) => {
  return (
    <div className={`search-input-wrapper ${className}`}>
      <FaSearch className="search-icon" />
      <input
        type="text"
        className="search-field"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      {value && (
        <button
          type="button"
          className="search-clear-btn"
          onClick={() => onChange("")}
          aria-label="Clear search input"
        >
          <FaTimes />
        </button>
      )}
    </div>
  );
};

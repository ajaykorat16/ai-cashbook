import React, { useState, useRef, useEffect } from 'react';

const CustomSelect = ({ options, defaultValue, onChange }) => {
    const [showMenu, setShowMenu] = useState(false);
    const [selectedOption, setSelectedOption] = useState(defaultValue);
    const selectRef = useRef(null);

    const handleSelectClick = () => {
        setShowMenu(!showMenu);
    };

    const handleOptionClick = (option) => {
        setSelectedOption(option);
        setShowMenu(false);
        if (onChange) {
            onChange(option);
        }
    };

    const handleClickOutside = (event) => {
        if (selectRef.current && !selectRef.current.contains(event.target)) {
            setShowMenu(false);
        }
    };

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div className="custom-select" ref={selectRef}>
            <button onClick={handleSelectClick}>
                <span>{selectedOption}</span>
                <img className="login_click" src="/images/down_white.svg" alt="Dropdown" />
            </button>
            <div className={`select-menu ${showMenu ? 'd-block' : 'd-none'}`}>
                {options.map((option, index) => (
                    <button
                        key={index}
                        onClick={() => handleOptionClick(option)}
                    >
                        {option}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default CustomSelect;

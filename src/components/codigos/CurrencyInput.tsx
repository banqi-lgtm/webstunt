import React, { useState, useEffect } from 'react';

interface CurrencyInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
}

export function CurrencyInput({ value, onChange, placeholder = '$ 0', className, id }: CurrencyInputProps) {
  const [displayValue, setDisplayValue] = useState('');

  useEffect(() => {
    if (value) {
      const numericString = value.toString().replace(/[^0-9]/g, '');
      if (numericString) {
        const number = parseInt(numericString, 10);
        setDisplayValue(`$ ${number.toLocaleString('es-CO')}`);
      } else {
        setDisplayValue('');
      }
    } else {
      setDisplayValue('');
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let rawValue = e.target.value.replace(/[^0-9]/g, '');
    if (!rawValue) {
      setDisplayValue('');
      onChange('');
      return;
    }
    const number = parseInt(rawValue, 10);
    setDisplayValue(`$ ${number.toLocaleString('es-CO')}`);
    onChange(rawValue);
  };

  return (
    <input
      id={id}
      type="text"
      value={displayValue}
      onChange={handleChange}
      placeholder={placeholder}
      className={`font-mono ${className || ''}`}
    />
  );
}

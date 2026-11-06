'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { filterConceptosCatalogo, ConceptoItem } from '@/lib/conceptosCatalogo';
import { Check } from 'lucide-react';

interface ConceptoAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelectConcepto?: (item: ConceptoItem) => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
}

export function ConceptoAutocomplete({
  value,
  onChange,
  onSelectConcepto,
  onFocus,
  placeholder = 'Ej. Servicios de producción evento Copa Stunt',
  className = '',
  disabled = false,
  required = false
}: ConceptoAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredItems = useMemo(() => {
    // Retorna máximo 3 opciones y solo si el usuario ha empezado a escribir (>= 2 caracteres)
    return filterConceptosCatalogo(value, 3);
  }, [value]);

  // Cerrar al hacer clic por fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Ajustar índice resaltado
  useEffect(() => {
    setHighlightedIndex(filteredItems.length > 0 ? 0 : -1);
  }, [filteredItems]);

  const handleSelect = (item: ConceptoItem) => {
    // Al seleccionar, colocamos la descripción limpia sin mostrar el código numérico
    onChange(item.descripcion);
    if (onSelectConcepto) {
      onSelectConcepto(item);
    }
    setIsOpen(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || filteredItems.length === 0) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        if (filteredItems.length > 0) {
          setIsOpen(true);
          e.preventDefault();
        }
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1 < filteredItems.length ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : filteredItems.length - 1));
    } else if (e.key === 'Enter') {
      if (highlightedIndex >= 0 && highlightedIndex < filteredItems.length) {
        e.preventDefault();
        handleSelect(filteredItems[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <input
        ref={inputRef}
        type="text"
        value={value}
        disabled={disabled}
        required={required}
        placeholder={placeholder}
        onFocus={(e) => {
          if (filteredItems.length > 0) setIsOpen(true);
          if (onFocus) onFocus(e);
        }}
        onChange={(e) => {
          onChange(e.target.value);
          setIsOpen(true);
        }}
        onKeyDown={handleKeyDown}
        className={className}
        autoComplete="off"
      />

      {isOpen && !disabled && filteredItems.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-[#0F0F12] border border-[#2E2E38] rounded-xl shadow-2xl shadow-black/95 p-1 animate-in fade-in zoom-in-95 duration-100">
          <div className="space-y-0.5">
            {filteredItems.map((item, idx) => {
              const isHighlighted = idx === highlightedIndex;
              const isSelected = value.trim().toLowerCase() === item.descripcion.trim().toLowerCase();

              return (
                <button
                  key={item.codigo}
                  type="button"
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  onClick={() => handleSelect(item)}
                  className={`w-full text-left px-3.5 py-2.5 rounded-lg flex items-center justify-between gap-3 transition-colors text-xs ${
                    isHighlighted
                      ? 'bg-zinc-800 text-white font-semibold'
                      : isSelected
                      ? 'bg-red-950/20 text-zinc-100 font-medium'
                      : 'text-zinc-300 hover:bg-zinc-800/60 hover:text-white font-medium'
                  }`}
                >
                  <span className="truncate flex-1">{item.descripcion}</span>
                  {isSelected && (
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 ml-2" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

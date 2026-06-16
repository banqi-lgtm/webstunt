import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check } from 'lucide-react';

interface Option {
  value: string;
  label: string;
  sublabel?: string;
}

interface SearchableDropdownProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
}

export function SearchableDropdown({ options, value, onChange, placeholder = 'Seleccionar...', label }: SearchableDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(o => o.value === value);
  const filteredOptions = options.filter(o => 
    o.label.toLowerCase().includes(search.toLowerCase()) || 
    (o.sublabel && o.sublabel.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="relative w-full" ref={wrapperRef}>
      {label && <label className="text-xs font-bold text-[#8A8A9A] uppercase tracking-wider mb-2 block">{label}</label>}
      <div 
        className="flex items-center justify-between w-full bg-[#12121A] border border-[#1C1C28] text-[#F5F5F7] rounded-md h-10 px-3 text-sm cursor-pointer hover:border-[#6366F1]/50 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={selectedOption ? 'text-[#F5F5F7]' : 'text-[#8A8A9A]'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-[#8A8A9A] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-[#12121A] border border-[#1C1C28] rounded-md shadow-2xl shadow-black/50 overflow-hidden">
          <div className="flex items-center px-3 border-b border-[#1C1C28]">
            <Search className="w-4 h-4 text-[#8A8A9A]" />
            <input 
              type="text" 
              className="w-full bg-transparent text-sm text-[#F5F5F7] h-10 px-2 focus:outline-none placeholder:text-[#8A8A9A]"
              placeholder="Buscar..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onClick={e => e.stopPropagation()}
              autoFocus
            />
          </div>
          <div className="max-h-60 overflow-y-auto custom-scrollbar">
            {filteredOptions.length > 0 ? (
              filteredOptions.map(option => (
                <div 
                  key={option.value}
                  className={`px-3 py-2 text-sm cursor-pointer flex items-center justify-between hover:bg-[#1C1C28] transition-colors ${value === option.value ? 'bg-[#1C1C28]/50' : ''}`}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                    setSearch('');
                  }}
                >
                  <div className="flex flex-col">
                    <span className="text-[#F5F5F7] font-medium">{option.label}</span>
                    {option.sublabel && <span className="text-[10px] text-[#8A8A9A]">{option.sublabel}</span>}
                  </div>
                  {value === option.value && <Check className="w-4 h-4 text-[#6366F1]" />}
                </div>
              ))
            ) : (
              <div className="px-3 py-4 text-center text-sm text-[#8A8A9A]">
                No se encontraron resultados.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

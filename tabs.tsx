import React, { useState, createContext, useContext, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface TabsContextProps {
  value: string;
  onChange: (value: string) => void;
}

const TabsContext = createContext<TabsContextProps | undefined>(undefined);

interface TabsProps {
  value: string;
  onValueChange: (value: string) => void;
  children: ReactNode;
  className?: string;
}

export const Tabs = ({ value, onValueChange, children, className }: TabsProps) => {
  return (
    <TabsContext.Provider value={{ value, onChange: onValueChange }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
};

interface TabsListProps {
  children: ReactNode;
  className?: string;
}

export const TabsList = ({ children, className }: TabsListProps) => {
  return (
    <div role="tablist" className={cn('inline-flex h-10 items-center justify-center rounded-md bg-gray-100 p-1 text-gray-500', className)}>
      {children}
    </div>
  );
};

interface TabsTriggerProps {
  children: ReactNode;
  value: string;
  className?: string;
}

export const TabsTrigger = ({ children, value, className }: TabsTriggerProps) => {
  const context = useContext(TabsContext);

  if (!context) {
    throw new Error('TabsTrigger must be used within a Tabs');
  }

  const { value: selectedValue, onChange } = context;
  const isSelected = selectedValue === value;

  return (
    <button
      role="tab"
      aria-selected={isSelected}
      aria-controls={`tab-panel-${value}`}
      id={`tab-trigger-${value}`}
      tabIndex={isSelected ? 0 : -1}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
        isSelected
          ? 'bg-white text-gray-950 shadow-sm'
          : 'text-gray-500 hover:text-gray-900',
        className
      )}
      onClick={() => onChange(value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onChange(value);
        }
      }}
      type="button"
    >
      {children}
    </button>
  );
};

interface TabsContentProps {
  children: ReactNode;
  value: string;
  className?: string;
}

export const TabsContent = ({ children, value, className }: TabsContentProps) => {
  const context = useContext(TabsContext);

  if (!context) {
    throw new Error('TabsContent must be used within a Tabs');
  }

  const { value: selectedValue } = context;

  if (selectedValue !== value) {
    return null;
  }

  return (
    <div
      role="tabpanel"
      id={`tab-panel-${value}`}
      aria-labelledby={`tab-trigger-${value}`}
      className={cn('mt-2 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2', className)}
    >
      {children}
    </div>
  );
};
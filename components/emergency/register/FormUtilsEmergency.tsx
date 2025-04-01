import { useState } from 'react';

export const useSelectsState = () => {
  const [openSelects, setOpenSelects] = useState<Record<string, boolean>>({});

  const toggleSelect = (selectName: string) => {
    setOpenSelects(prev => ({
      ...prev,
      [selectName]: !prev[selectName]
    }));
  };

  const closeAllSelects = () => {
    setOpenSelects({});
  };

  const closeSelect = (selectName: string) => {
    setOpenSelects(prev => ({
      ...prev,
      [selectName]: false
    }));
  };

  const openSelect = (selectName: string) => {
    setOpenSelects(prev => ({
      ...prev,
      [selectName]: true
    }));
  };

  return {
    openSelects,
    toggleSelect,
    closeAllSelects,
    closeSelect,
    openSelect
  };
};

export default useSelectsState;

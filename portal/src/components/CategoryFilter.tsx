import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface CategoryFilterProps {
  categories: string[];
  selectedCategory: string | null;
  onCategorySelect: (category: string | null) => void;
}

const CategoryFilter: React.FC<CategoryFilterProps> = ({
  categories,
  selectedCategory,
  onCategorySelect
}) => {
  const { t } = useLanguage();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        {t('categories')}
      </h3>
      
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onCategorySelect(null)}
          className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
            selectedCategory === null
              ? 'bg-gradient-to-r from-teal-500 to-orange-500 text-white shadow-lg'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          {t('all')}
        </button>
        
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => onCategorySelect(category)}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              selectedCategory === category
                ? 'bg-gradient-to-r from-teal-500 to-orange-500 text-white shadow-lg'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {t(category)}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CategoryFilter;
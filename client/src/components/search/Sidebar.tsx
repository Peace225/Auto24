// Sidebar.tsx
export default function Sidebar({ onFilterChange, availableBrands, selectedBrands }) {
  return (
    <div className="w-72 space-y-6">
      <h3 className="font-black text-xs uppercase">Fabricants</h3>
      {availableBrands.map(brand => (
        <label key={brand} className="flex items-center gap-3">
          <input 
            type="checkbox" 
            checked={selectedBrands.includes(brand)}
            onChange={(e) => onFilterChange('brand', brand, e.target.checked)} 
          />
          {brand}
        </label>
      ))}
    </div>
  );
}
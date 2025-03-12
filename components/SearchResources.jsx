import { useState } from 'react';
import { useRouter } from 'next/router';

export default function SearchResources() {
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/resources?search=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  return (
    <form onSubmit={handleSearch} className="mt-3">
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar recursos..."
          className="w-full p-2 pl-10 border rounded-md shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <button 
          type="submit" 
          className="absolute inset-y-0 right-0 flex items-center px-3 text-sm text-blue-600 hover:text-blue-800"
        >
          Buscar
        </button>
      </div>
    </form>
  );
}

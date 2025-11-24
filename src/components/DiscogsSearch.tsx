import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { ChevronDown, ChevronUp, X, Filter } from 'lucide-react';

interface DiscogsResult {
    id: number;
    title: string;
    year?: string;
    thumb?: string;
    format?: string[];
    label?: string[];
    country?: string;
    type: 'release' | 'master';
    master_id?: number;
}

interface DiscogsSearchProps {
    initialQuery?: string;
    onSelect: (item: DiscogsResult) => void;
}

const COMMON_FORMATS = ['Vinyl', 'CD', 'Cassette', 'Digital', 'Box Set', 'DVD'];

export default function DiscogsSearch({ initialQuery = '', onSelect }: DiscogsSearchProps) {
    const [query, setQuery] = useState(initialQuery);
    const [results, setResults] = useState<DiscogsResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Filter states
    const [showFilters, setShowFilters] = useState(false);
    const [selectedFormats, setSelectedFormats] = useState<string[]>([]);
    const [selectedYear, setSelectedYear] = useState('');
    const [countryFilter, setCountryFilter] = useState('');
    const [labelFilter, setLabelFilter] = useState('');

    const handleSearch = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        setError('');
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/discogs/search?q=${encodeURIComponent(query)}`);
            if (!res.ok) throw new Error('Failed to search');
            const data = await res.json();
            setResults(data.results || []);
        } catch (err) {
            setError('Failed to search Discogs. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Auto-search on mount if initialQuery is provided
    useEffect(() => {
        if (initialQuery) {
            handleSearch();
        }
    }, []);

    // Extract unique values for dropdowns
    const availableYears = useMemo(() => {
        const years = results
            .map(r => r.year)
            .filter((y): y is string => !!y)
            .sort((a, b) => parseInt(b) - parseInt(a));
        return Array.from(new Set(years));
    }, [results]);

    const availableCountries = useMemo(() => {
        const countries = results
            .map(r => r.country)
            .filter((c): c is string => !!c);
        return Array.from(new Set(countries)).sort();
    }, [results]);

    const availableLabels = useMemo(() => {
        const labels = results
            .flatMap(r => r.label || [])
            .filter(l => l);
        return Array.from(new Set(labels)).sort();
    }, [results]);

    // Filter results based on selected filters
    const filteredResults = useMemo(() => {
        return results.filter(item => {
            // Format filter
            if (selectedFormats.length > 0) {
                const hasMatchingFormat = item.format?.some(f =>
                    selectedFormats.some(sf => f.toLowerCase().includes(sf.toLowerCase()))
                );
                if (!hasMatchingFormat) return false;
            }

            // Year filter
            if (selectedYear && item.year !== selectedYear) return false;

            // Country filter
            if (countryFilter && item.country !== countryFilter) return false;

            // Label filter
            if (labelFilter && !item.label?.includes(labelFilter)) return false;

            return true;
        });
    }, [results, selectedFormats, selectedYear, countryFilter, labelFilter]);

    const toggleFormat = (format: string) => {
        setSelectedFormats(prev =>
            prev.includes(format)
                ? prev.filter(f => f !== format)
                : [...prev, format]
        );
    };

    const clearFilters = () => {
        setSelectedFormats([]);
        setSelectedYear('');
        setCountryFilter('');
        setLabelFilter('');
    };

    const hasActiveFilters = selectedFormats.length > 0 || selectedYear || countryFilter || labelFilter;

    return (
        <div className="w-full max-w-4xl mx-auto p-4">
            <form onSubmit={handleSearch} className="flex gap-2 mb-4">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search for album, artist, or catalog number..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-white/30 transition-colors"
                />
                <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-white text-black font-medium rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                    {loading ? 'Searching...' : 'Search'}
                </button>
            </form>

            {error && (
                <div className="text-red-400 mb-4 text-center">{error}</div>
            )}

            {/* Filter Toggle Button */}
            {results.length > 0 && (
                <div className="mb-4 flex items-center justify-between">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors text-white"
                    >
                        <Filter className="w-4 h-4" />
                        <span>Filters</span>
                        {hasActiveFilters && (
                            <span className="px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                                {selectedFormats.length + (selectedYear ? 1 : 0) + (countryFilter ? 1 : 0) + (labelFilter ? 1 : 0)}
                            </span>
                        )}
                        {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    <div className="text-sm text-white/60">
                        Showing <span className="text-white font-medium">{filteredResults.length}</span> of <span className="text-white font-medium">{results.length}</span> results
                    </div>
                </div>
            )}

            {/* Filter Panel */}
            <AnimatePresence>
                {showFilters && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden mb-4"
                    >
                        <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-4">
                            {/* Format Filter */}
                            <div>
                                <h3 className="text-sm font-medium text-white mb-2">Format</h3>
                                <div className="flex flex-wrap gap-2">
                                    {COMMON_FORMATS.map(format => (
                                        <button
                                            key={format}
                                            onClick={() => toggleFormat(format)}
                                            className={`px-3 py-1.5 rounded-full text-sm transition-all ${selectedFormats.includes(format)
                                                ? 'bg-blue-500 text-white'
                                                : 'bg-white/10 text-white/80 hover:bg-white/20'
                                                }`}
                                        >
                                            {format}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Year Filter */}
                            <div>
                                <h3 className="text-sm font-medium text-white mb-2">Year</h3>
                                <select
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded px-3 py-1.5 text-white focus:outline-none focus:border-white/30"
                                >
                                    <option value="">All Years</option>
                                    {availableYears.map(year => (
                                        <option key={year} value={year}>{year}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Country Filter */}
                            <div>
                                <h3 className="text-sm font-medium text-white mb-2">Country</h3>
                                <select
                                    value={countryFilter}
                                    onChange={(e) => setCountryFilter(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded px-3 py-1.5 text-white focus:outline-none focus:border-white/30"
                                >
                                    <option value="">All Countries</option>
                                    {availableCountries.map(country => (
                                        <option key={country} value={country}>{country}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Label Filter */}
                            <div>
                                <h3 className="text-sm font-medium text-white mb-2">Label</h3>
                                <select
                                    value={labelFilter}
                                    onChange={(e) => setLabelFilter(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded px-3 py-1.5 text-white focus:outline-none focus:border-white/30"
                                >
                                    <option value="">All Labels</option>
                                    {availableLabels.slice(0, 100).map(label => (
                                        <option key={label} value={label}>{label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Clear Filters Button */}
                            {hasActiveFilters && (
                                <button
                                    onClick={clearFilters}
                                    className="w-full px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                                >
                                    <X className="w-4 h-4" />
                                    Clear All Filters
                                </button>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Active Filters Display */}
            {hasActiveFilters && (
                <div className="mb-4 flex flex-wrap gap-2">
                    {selectedFormats.map(format => (
                        <span
                            key={format}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-blue-500/20 border border-blue-500/50 text-blue-300 rounded-full text-sm"
                        >
                            {format}
                            <button
                                onClick={() => toggleFormat(format)}
                                className="hover:bg-blue-500/30 rounded-full p-0.5"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    ))}
                    {selectedYear && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-500/20 border border-blue-500/50 text-blue-300 rounded-full text-sm">
                            Year: {selectedYear}
                            <button
                                onClick={() => setSelectedYear('')}
                                className="hover:bg-blue-500/30 rounded-full p-0.5"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    )}
                    {countryFilter && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-500/20 border border-blue-500/50 text-blue-300 rounded-full text-sm">
                            Country: {countryFilter}
                            <button
                                onClick={() => setCountryFilter('')}
                                className="hover:bg-blue-500/30 rounded-full p-0.5"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    )}
                    {labelFilter && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-500/20 border border-blue-500/50 text-blue-300 rounded-full text-sm">
                            Label: {labelFilter}
                            <button
                                onClick={() => setLabelFilter('')}
                                className="hover:bg-blue-500/30 rounded-full p-0.5"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    )}
                </div>
            )}

            {/* Results */}
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                <AnimatePresence>
                    {filteredResults.map((item) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="flex gap-4 p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors cursor-pointer group"
                            onClick={() => onSelect(item)}
                        >
                            <div className="relative w-20 h-20 flex-shrink-0 bg-black/40 rounded overflow-hidden">
                                {item.thumb ? (
                                    <Image
                                        src={item.thumb}
                                        alt={item.title}
                                        fill
                                        className="object-cover"
                                        unoptimized
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-white/20">
                                        No Image
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 min-w-0">
                                <h3 className="font-medium text-lg text-white truncate group-hover:text-blue-400 transition-colors">
                                    {item.title}
                                </h3>
                                <div className="text-sm text-white/60 mt-1 space-y-1">
                                    {item.year && <p>Year: {item.year}</p>}
                                    {item.format && <p>Format: {item.format.slice(0, 3).join(', ')}</p>}
                                    {item.label && <p>Label: {item.label.slice(0, 1).join(', ')}</p>}
                                    {item.country && <p>Country: {item.country}</p>}
                                    <p className="text-xs uppercase tracking-wider opacity-60">{item.type}</p>
                                </div>
                            </div>

                            <div className="flex items-center">
                                <span className="px-4 py-2 bg-white/10 rounded-full text-sm font-medium text-white/80 group-hover:bg-white group-hover:text-black transition-all">
                                    Select
                                </span>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {!loading && filteredResults.length === 0 && results.length > 0 && (
                    <div className="text-center text-white/40 py-8">
                        No results match your filters. Try adjusting your criteria.
                    </div>
                )}

                {!loading && results.length === 0 && query && !error && (
                    <div className="text-center text-white/40 py-8">
                        No results found. Try a different search term.
                    </div>
                )}
            </div>
        </div>
    );
}

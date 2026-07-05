import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../lib/axios";
import { Search, MapPin, Package, Star } from "lucide-react";

interface SearchResult {
  id: string;
  nickname: string;
  legalFullName?: string;
  rating: number;
  packagesDeliveredCount: number;
  currentCity?: string;
  currentCountry?: string;
  createdAt: string;
}

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-xl bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="h-14 w-14 rounded-full bg-brand-muted/10" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-2/3 rounded bg-brand-muted/10" />
          <div className="h-3 w-1/2 rounded bg-brand-muted/10" />
        </div>
      </div>
    </div>
  );
}

function UserCard({ user }: { user: SearchResult }) {
  return (
    <Link
      to={`/users/${user.id}`}
      className="flex items-center gap-3 rounded-xl bg-white p-5 shadow-sm transition hover:shadow-md"
    >
      <img
        src={`https://api.dicebear.com/9.x/personas/svg?seed=${user.id}&backgroundColor=e8edf5`}
        alt={user.nickname}
        className="h-14 w-14 shrink-0 rounded-full border-2 border-brand-primary/10 object-cover"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-brand-primary">
          {user.legalFullName || user.nickname}
        </p>
        <p className="truncate text-xs text-brand-muted">@{user.nickname}</p>
        {user.currentCity && (
          <p className="mt-1 flex items-center gap-1 text-xs text-brand-muted">
            <MapPin className="h-3 w-3 shrink-0" />
            {user.currentCity}, {user.currentCountry}
          </p>
        )}
        <div className="mt-1 flex items-center gap-3 text-xs text-brand-muted">
          <span className="flex items-center gap-1">
            <Star className="h-3 w-3 shrink-0 text-brand-accent" />
            {user.rating > 0 ? user.rating.toFixed(1) : "—"}
          </span>
          <span className="flex items-center gap-1">
            <Package className="h-3 w-3 shrink-0 text-brand-accent" />
            {user.packagesDeliveredCount} delivered
          </span>
        </div>
      </div>
    </Link>
  );
}

function UserSearch() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedQuery(query.trim()), 400);
    return () => clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setResults([]);
      setSearched(false);
      return;
    }

    setLoading(true);
    setSearched(true);
    api
      .get(`/auth/users/search?q=${encodeURIComponent(debouncedQuery)}`)
      .then((res) => setResults(res.data.users))
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, [debouncedQuery]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="mb-2 text-2xl font-bold text-brand-primary">Search Users</h1>
      <p className="mb-6 text-sm text-brand-muted">
        Find verified senders and travelers by name.
      </p>

      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-muted" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by nickname or name... (min. 2 characters)"
          className="w-full rounded-lg border border-brand-muted/30 bg-white py-3 pl-11 pr-4 text-sm text-brand-primary outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : searched && results.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-brand-muted">
            No users found matching '{debouncedQuery}'.
          </p>
        </div>
      ) : results.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {results.map((u) => (
            <UserCard key={u.id} user={u} />
          ))}
        </div>
      ) : (
        <div className="py-16 text-center">
          <p className="text-brand-muted">
            Start typing at least 2 characters to search.
          </p>
        </div>
      )}
    </div>
  );
}

export default UserSearch;

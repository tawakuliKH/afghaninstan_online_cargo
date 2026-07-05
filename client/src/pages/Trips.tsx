import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import api from "../lib/axios";
import {
  Search,
  MapPin,
  Calendar,
  Weight,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Plus,
} from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { getData } from "country-list";

const countries = getData().sort((a, b) => a.name.localeCompare(b.name));

interface Trip {
  id: string;
  originCountry: string;
  originCity: string;
  destCountry: string;
  destCity: string;
  departureDate: string;
  capacityWeight?: number;
  capacityNote?: string;
  notes?: string;
  createdAt: string;
  traveler: {
    id: string;
    nickname: string;
    legalFullName?: string;
    whatsappNumber?: string;
    email?: string;
  };
}

interface SearchForm {
  originCountry: string;
  destCountry: string;
}

function ContactInfo({
  trip,
  canSeeContact,
}: {
  trip: Trip;
  canSeeContact: boolean;
}) {
  if (canSeeContact && (trip.traveler.whatsappNumber || trip.traveler.email)) {
    return (
      <div className="mt-3 space-y-1 border-t border-brand-muted/10 pt-3">
        {trip.traveler.whatsappNumber && (
          <p className="text-xs text-brand-muted">
            WhatsApp:{" "}
            <span className="font-medium text-brand-primary">
              {trip.traveler.whatsappNumber}
            </span>
          </p>
        )}
        {trip.traveler.email && (
          <p className="text-xs text-brand-muted">
            Email:{" "}
            <span className="font-medium text-brand-primary">
              {trip.traveler.email}
            </span>
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="mt-3 border-t border-brand-muted/10 pt-3">
      <p className="text-xs italic text-brand-muted">
        {!canSeeContact && (
          <Link
            to="/register"
            onClick={(e) => e.stopPropagation()}
            className="text-brand-accent hover:underline"
          >
            Create an account and post a trip or package
          </Link>
        )}{" "}
        to see contact details
      </p>
    </div>
  );
}

function TripCard({
  trip,
  viewerCanSeeContact,
}: {
  trip: Trip;
  viewerCanSeeContact: boolean;
}) {
  const navigate = useNavigate();
  const isClosed = new Date(trip.departureDate) < new Date();

  return (
    <div
      onClick={() => navigate(`/trips/${trip.id}`)}
      className="cursor-pointer rounded-xl bg-white p-5 shadow-sm transition hover:shadow-md"
    >
      {/* Route */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-1 items-center gap-2">
          <div className="text-center">
            <p className="text-xs text-brand-muted">From</p>
            <p className="font-semibold text-brand-primary">{trip.originCity}</p>
            <p className="text-xs text-brand-muted">{trip.originCountry}</p>
          </div>
          <div className="flex-1 border-t-2 border-dashed border-brand-secondary/40 mx-2" />
          <MapPin className="h-4 w-4 shrink-0 text-brand-accent" />
          <div className="text-center">
            <p className="text-xs text-brand-muted">To</p>
            <p className="font-semibold text-brand-primary">{trip.destCity}</p>
            <p className="text-xs text-brand-muted">{trip.destCountry}</p>
          </div>
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
            isClosed
              ? "bg-brand-muted/10 text-brand-muted"
              : "bg-green-100 text-green-700"
          }`}
        >
          {isClosed ? "Trip Closed" : "Active"}
        </span>
      </div>

      {/* Details */}
      <div className="mt-4 flex flex-wrap gap-3">
        <span className="flex items-center gap-1 rounded-full bg-brand-primary/5 px-3 py-1 text-xs text-brand-primary">
          <Calendar className="h-3 w-3" />
          {new Date(trip.departureDate).toLocaleDateString()}
        </span>
        {trip.capacityWeight && (
          <span className="flex items-center gap-1 rounded-full bg-brand-secondary/10 px-3 py-1 text-xs text-brand-secondary">
            <Weight className="h-3 w-3" />
            {trip.capacityWeight} kg
          </span>
        )}
        {trip.capacityNote && (
          <span className="rounded-full bg-brand-muted/10 px-3 py-1 text-xs text-brand-muted">
            {trip.capacityNote}
          </span>
        )}
      </div>

      {trip.notes && (
        <p className="mt-3 text-xs text-brand-muted">{trip.notes}</p>
      )}

      {/* Traveler */}
      {/* Traveler */}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img
            src={`https://api.dicebear.com/9.x/notionists/svg?seed=${trip.traveler.id}&backgroundColor=b6e3f4,c0aede,d1d4f9&backgroundType=gradientLinear`}
            alt={trip.traveler.nickname}
            className="h-10 w-10 rounded-full border-2 border-brand-primary/10 object-cover"
          />
          <div>
            <p className="text-xs text-brand-muted">Traveler</p>
            <Link
              to={`/users/${trip.traveler.id}`}
              onClick={(e) => e.stopPropagation()}
              className="text-sm font-medium text-brand-primary hover:text-brand-accent"
            >
              {trip.traveler.legalFullName || trip.traveler.nickname}
            </Link>
          </div>
        </div>
      </div>

      <ContactInfo trip={trip} canSeeContact={viewerCanSeeContact} />
    </div>
  );
}

function Trips() {
  const { user } = useAuthStore();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const viewerCanSeeContact = Boolean(user && user.hasPosted);
  const [activeFilters, setActiveFilters] = useState({
    originCountry: "",
    destCountry: "",
    startDate: "",
    endDate: "",
  });

  const { register, handleSubmit } = useForm<SearchForm>();

  const fetchTrips = async (filters = activeFilters, p = page) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p) });
      if (filters.originCountry)
        params.set("originCountry", filters.originCountry);
      if (filters.destCountry) params.set("destCountry", filters.destCountry);
      if (filters.startDate) params.set("startDate", filters.startDate);
      if (filters.endDate) params.set("endDate", filters.endDate);

      const res = await api.get(`/trips?${params.toString()}`);
      setTrips(res.data.trips);
      setTotalPages(res.data.pagination.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, [page]);

  const onSearch = (data: SearchForm) => {
    const filters = {
      originCountry: data.originCountry,
      destCountry: data.destCountry,
      startDate: startDate ? startDate.toISOString() : "",
      endDate: endDate ? endDate.toISOString() : "",
    };
    setActiveFilters(filters);
    setPage(1);
    fetchTrips(filters, 1);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-primary">
            Available Trips
          </h1>
          <p className="text-sm text-brand-muted">
            Find travelers who can carry your package
          </p>
        </div>
        {user?.accountStatus === "APPROVED" && (
          <Link
            to="/trips/new"
            className="flex items-center gap-2 rounded-lg bg-brand-accent px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Post a trip
          </Link>
        )}
      </div>

      {/* Search form */}
      <form
        onSubmit={handleSubmit(onSearch)}
        className="mb-8 rounded-xl bg-white p-5 shadow-sm"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-brand-muted">
              From country
            </label>
            <select
              {...register("originCountry")}
              className="w-full rounded-lg border border-brand-muted/30 bg-brand-bg px-3 py-2 text-sm text-brand-primary outline-none focus:border-brand-primary"
            >
              <option value="">Any country</option>
              {countries.map((c) => (
                <option key={c.code} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-brand-muted">
              To country
            </label>
            <select
              {...register("destCountry")}
              className="w-full rounded-lg border border-brand-muted/30 bg-brand-bg px-3 py-2 text-sm text-brand-primary outline-none focus:border-brand-primary"
            >
              <option value="">Any country</option>
              {countries.map((c) => (
                <option key={c.code} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-brand-muted">
              Departure from
            </label>
            <DatePicker
              selected={startDate}
              onChange={setStartDate}
              placeholderText="Start date"
              className="w-full rounded-lg border border-brand-muted/30 bg-brand-bg px-3 py-2 text-sm text-brand-primary outline-none focus:border-brand-primary"
              dateFormat="yyyy-MM-dd"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-brand-muted">
              Departure to
            </label>
            <DatePicker
              selected={endDate}
              onChange={setEndDate}
              placeholderText="End date"
              className="w-full rounded-lg border border-brand-muted/30 bg-brand-bg px-3 py-2 text-sm text-brand-primary outline-none focus:border-brand-primary"
              dateFormat="yyyy-MM-dd"
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 rounded-lg bg-brand-primary px-5 py-2 text-sm font-semibold text-white transition hover:opacity-90"
          >
            <Search className="h-4 w-4" />
            Search trips
          </button>
        </div>
      </form>

      {/* Results */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
        </div>
      ) : trips.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-brand-muted">
            No trips found matching your search.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {trips.map((trip) => (
            <TripCard
              key={trip.id}
              trip={trip}
              viewerCanSeeContact={viewerCanSeeContact}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-3">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-lg border border-brand-muted/30 p-2 text-brand-primary transition hover:bg-brand-primary/5 disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm text-brand-muted">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded-lg border border-brand-muted/30 p-2 text-brand-primary transition hover:bg-brand-primary/5 disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

export default Trips;

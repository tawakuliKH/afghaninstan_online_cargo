import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, Link } from "react-router-dom";
import api from "../lib/axios";
import toast from "react-hot-toast";
import { Loader2, ArrowLeft, AlertTriangle } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { getData } from "country-list";

const countries = getData().sort((a, b) => a.name.localeCompare(b.name));

const tripSchema = z.object({
  originCountry: z.string().min(1, "Required"),
  originCity: z.string().min(1, "Required"),
  destCountry: z.string().min(1, "Required"),
  destCity: z.string().min(1, "Required"),
  departureDate: z.date(),
  capacityWeight: z.coerce.number().positive().optional().or(z.literal("")),
  capacityNote: z.string().optional(),
  notes: z.string().optional(),
});

type TripForm = z.infer<typeof tripSchema>;

function Field({
  label,
  error,
  required,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-brand-primary">
        {label}
        {required && <span className="text-brand-danger"> *</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-brand-danger">{error}</p>}
    </div>
  );
}

function Input({
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-lg border border-brand-muted/30 bg-brand-bg px-4 py-2.5 text-sm text-brand-primary outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 ${className}`}
    />
  );
}

function Select({
  className = "",
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full rounded-lg border border-brand-muted/30 bg-brand-bg px-4 py-2.5 text-sm text-brand-primary outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 ${className}`}
    />
  );
}

function NewTrip() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const hasUnpaidCommission = Boolean(user?.hasUnpaidCommission);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<TripForm>({
    resolver: zodResolver(tripSchema) as any,
  });

  const onSubmit = async (data: TripForm) => {
    try {
      await api.post("/trips", {
        ...data,
        capacityWeight: data.capacityWeight || undefined,
        departureDate: data.departureDate.toISOString(),
      });
      toast.success("Trip posted successfully!");
      navigate("/trips");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to post trip");
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Link
        to="/trips"
        className="mb-6 flex items-center gap-2 text-sm text-brand-muted hover:text-brand-primary"
      >
        <ArrowLeft className="h-4 w-4" /> Back to trips
      </Link>

      <div className="rounded-2xl bg-white p-8 shadow-lg">
        <h1 className="mb-6 text-2xl font-bold text-brand-primary">
          Post a Trip
        </h1>

        {hasUnpaidCommission && (
          <div className="mb-6 flex items-center gap-2 rounded-lg border border-brand-danger/30 bg-brand-danger/5 px-4 py-3 text-sm text-brand-danger">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            You have unpaid commission. Please settle it before posting new trips.
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Route */}
          <div>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-brand-muted">
              Route
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="From country" required error={errors.originCountry?.message}>
                <Select {...register("originCountry")}>
                  <option value="">Select country</option>
                  {countries.map((c) => (
                    <option key={c.code} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="From city" required error={errors.originCity?.message}>
                <Input {...register("originCity")} placeholder="City" />
              </Field>
              <Field label="To country" required error={errors.destCountry?.message}>
                <Select {...register("destCountry")}>
                  <option value="">Select country</option>
                  {countries.map((c) => (
                    <option key={c.code} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="To city" required error={errors.destCity?.message}>
                <Input {...register("destCity")} placeholder="City" />
              </Field>
            </div>
          </div>

          {/* Departure */}
          <div>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-brand-muted">
              Travel Details
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field
                label="Departure date"
                required
                error={errors.departureDate?.message}
              >
                <Controller
                  control={control}
                  name="departureDate"
                  render={({ field }) => (
                    <DatePicker
                      selected={field.value}
                      onChange={field.onChange}
                      minDate={new Date()}
                      placeholderText="Select date"
                      dateFormat="yyyy-MM-dd"
                      className="w-full rounded-lg border border-brand-muted/30 bg-brand-bg px-4 py-2.5 text-sm text-brand-primary outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
                    />
                  )}
                />
              </Field>
              <Field
                label="Capacity (kg) — optional"
                error={errors.capacityWeight?.message}
              >
                <Input
                  {...register("capacityWeight")}
                  type="number"
                  step="0.1"
                  placeholder="e.g. 5"
                />
              </Field>
            </div>
            <div className="mt-4">
              <Field
                label="Capacity note — optional"
                error={errors.capacityNote?.message}
              >
                <Input
                  {...register("capacityNote")}
                  placeholder="e.g. One carry-on bag, no liquids"
                />
              </Field>
            </div>
          </div>

          {/* Notes */}
          <Field
            label="Additional notes — optional"
            error={errors.notes?.message}
          >
            <textarea
              {...register("notes")}
              rows={3}
              placeholder="Any other details travelers or senders should know..."
              className="w-full rounded-lg border border-brand-muted/30 bg-brand-bg px-4 py-2.5 text-sm text-brand-primary outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
            />
          </Field>

          <button
            type="submit"
            disabled={isSubmitting || hasUnpaidCommission}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-accent px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Post trip
          </button>
        </form>
      </div>
    </div>
  );
}

export default NewTrip;

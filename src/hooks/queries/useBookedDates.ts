import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { addDays, parseISO } from "date-fns";

interface BookedRange {
  start_date: string;
  end_date: string;
}

export function useBookedDates(productId: string | undefined) {
  const { data: bookedDates = [], isLoading } = useQuery({
    queryKey: ["booked-dates", productId],
    queryFn: async () => {
      if (!productId) return [];
      const { data, error } = await supabase.rpc("get_booked_dates", {
        p_product_id: productId,
      });
      if (error) {
        console.error("Error fetching booked dates:", error);
        return [];
      }
      // Expand date ranges into individual Date objects
      const dates: Date[] = [];
      (data as BookedRange[]).forEach((range) => {
        let current = parseISO(range.start_date);
        const end = parseISO(range.end_date);
        while (current <= end) {
          dates.push(new Date(current));
          current = addDays(current, 1);
        }
      });
      return dates;
    },
    enabled: !!productId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return { bookedDates, isLoading };
}

export function isDateBooked(date: Date, bookedDates: Date[]): boolean {
  return bookedDates.some(
    (d) =>
      d.getFullYear() === date.getFullYear() &&
      d.getMonth() === date.getMonth() &&
      d.getDate() === date.getDate()
  );
}

export function hasBookedDateInRange(start: Date, end: Date, bookedDates: Date[]): boolean {
  return bookedDates.some((d) => d >= start && d <= end);
}

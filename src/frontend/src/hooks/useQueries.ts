import { useQuery } from "@tanstack/react-query";
import type { PropertyListing } from "../backend.d";
import { useActor } from "./useActor";

export function useRecentListings(limit = 6) {
  const { actor, isFetching } = useActor();
  return useQuery<PropertyListing[]>({
    queryKey: ["recentListings", limit],
    queryFn: async () => {
      if (!actor) return [];
      const all = await actor.getAllPublishedListings();
      return all.slice(0, limit);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAllListings() {
  const { actor, isFetching } = useActor();
  return useQuery<PropertyListing[]>({
    queryKey: ["allListings"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllPublishedListings();
    },
    enabled: !!actor && !isFetching,
  });
}

import { apiFetch } from "./apiClient";

export type MyPageRegion = {
  regionId: number;
  regionName: string;
};

export type StampsResponse = {
  collectedCount: number;
  totalRegionCount: number;
  stamps: Array<{
    regionId: number;
    regionName: string;
    collected: boolean;
    visitCount: number;
  }>;
};

export type CompletedTripsResponse = {
  totalCount: number;
  completedTrips: Array<{
    completedTripId: number;
    itineraryId: number;
    region: MyPageRegion;
    title: string;
    startDate: string;
    endDate: string;
    nights: number;
    stayHours: number;
    partySize: number;
    estimatedSpending: number;
    populationContributionDays: number;
    completedAt: string;
  }>;
};

export function getMyStamps(): Promise<StampsResponse> {
  return apiFetch<StampsResponse>("/api/users/me/stamps");
}

export function getCompletedTrips(): Promise<CompletedTripsResponse> {
  return apiFetch<CompletedTripsResponse>("/api/users/me/completed-trips");
}

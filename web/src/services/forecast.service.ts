import type { Forecast, History, Horizon } from "../types/api.types";
import { getJson } from "./api.client";

const idPath = (id: string) => `/v1/instruments/${encodeURIComponent(id)}`;

export function getForecast(id: string, horizon: Horizon, signal?: AbortSignal): Promise<Forecast> {
  return getJson<Forecast>(`${idPath(id)}/forecast?h=${horizon}`, signal);
}

export function getHistory(id: string, signal?: AbortSignal): Promise<History> {
  return getJson<History>(`${idPath(id)}/history`, signal);
}

import { getForecast, getHistory } from "../services/forecast.service";
import type { Forecast, History, Horizon } from "../types/api.types";
import { useAsync } from "./useAsync";

export const useForecast = (id: string | null, horizon: Horizon) =>
  useAsync<Forecast | null>(
    (s) => (id ? getForecast(id, horizon, s) : Promise.resolve(null)),
    [id, horizon],
  );

export const useHistory = (id: string | null) =>
  useAsync<History | null>(
    (s) => (id ? getHistory(id, s) : Promise.resolve(null)),
    [id],
  );

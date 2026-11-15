import { getForecast, getHistory } from "../services/forecast.service";
import type { Horizon } from "../types/api.types";
import { useAsync } from "./useAsync";

export const useForecast = (id: string | null, horizon: Horizon) =>
  useAsync((s) => (id ? getForecast(id, horizon, s) : Promise.reject(new Error("No instrument"))), [id, horizon]);

export const useHistory = (id: string | null) =>
  useAsync((s) => (id ? getHistory(id, s) : Promise.reject(new Error("No instrument"))), [id]);

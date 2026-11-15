import type { Instrument } from "../types/api.types";
import { getJson } from "./api.client";

export async function listInstruments(signal?: AbortSignal): Promise<Instrument[]> {
  const res = await getJson<{ instruments: Instrument[] }>("/v1/instruments", signal);
  return res.instruments;
}

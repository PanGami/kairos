import { listInstruments } from "../services/instrument.service";
import { useAsync } from "./useAsync";

export const useInstruments = () => useAsync(listInstruments, []);

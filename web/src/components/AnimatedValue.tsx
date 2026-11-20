import { useAnimatedNumber } from "../hooks/useAnimatedNumber";

interface Props {
  value: number;
  format: (n: number) => string;
  durationMs?: number;
}

export function AnimatedValue({ value, format, durationMs = 220 }: Props) {
  const animated = useAnimatedNumber(value, durationMs);
  return <>{format(animated)}</>;
}

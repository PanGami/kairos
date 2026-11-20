import { useLocale } from "../hooks/useLocale";

export function Disclaimer() {
  const { t } = useLocale();
  return <p className="disclaimer">{t.footer.disclaimer}</p>;
}

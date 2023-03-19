import { translate } from "../lib/i18n";
import { useApp } from "../state/app";

export const T = ({ transKey }: { transKey: string }) => {
  const { app } = useApp();
  return <>{translate(app.config.lang, transKey)}</>
};

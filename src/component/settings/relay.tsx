import { useApp } from '../../state/app';
import './relay.scss';

export const RelaySetting = () => {
  const { mux } = useApp();

  return (
    <form id="RelaySetting">
      <table border={0} cellSpacing={0}>
        <thead>
          <tr>
            <th className="RelayURL">リレーURL</th>
            <th className="Permission">READ</th>
            <th>WRITE</th>
          </tr>
        </thead>
        <tbody>
          {mux.allRelays.map(r => (
            <tr key={r.url}>
              <td className="RelayURL">{r.url}</td>
              <td className="Permission"><input type="checkbox" checked={r.isReadable} disabled /></td>
              <td className="Permission"><input type="checkbox" checked={r.isWritable} disabled /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </form>
  );
};

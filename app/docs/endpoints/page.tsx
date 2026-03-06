import Link from 'next/link';
import { getDocsData } from '@/lib/contracts';

export const metadata = {
  title: 'Endpoint Index'
};

export default async function EndpointsPage() {
  const data = await getDocsData();

  return (
    <article>
      <span className="eyebrow">Endpoint index</span>
      <h1 className="mt-5">Consumer endpoint directory</h1>
      <p>Generated from the OpenAPI contract and filtered to the public consumer scope.</p>

      <div className="table-shell mt-6">
        <table>
          <thead>
            <tr>
              <th>Group</th>
              <th>Method</th>
              <th>Path</th>
              <th>Summary</th>
            </tr>
          </thead>
          <tbody>
            {data.endpoints.map((endpoint) => (
              <tr key={endpoint.id}>
                <td>{endpoint.group}</td>
                <td className="font-[var(--font-plex-mono)] text-[var(--accent-strong)]">{endpoint.method}</td>
                <td className="font-[var(--font-plex-mono)]">
                  <Link href={`/docs/endpoints/${endpoint.id}`} className="text-[var(--text)] hover:text-[var(--accent-strong)]">
                    {endpoint.path}
                  </Link>
                </td>
                <td>{endpoint.summary}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  );
}

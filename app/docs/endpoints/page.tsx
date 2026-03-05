import Link from 'next/link';
import { getDocsData } from '@/lib/contracts';

export const metadata = {
  title: 'Endpoint Index'
};

export default async function EndpointsPage() {
  const data = await getDocsData();

  return (
    <article>
      <h1 className="text-3xl font-semibold text-slate-100">Endpoint Index</h1>
      <p className="mt-3 text-slate-300">Generated from OpenAPI contract and filtered to consumer scope.</p>

      <div className="mt-8 overflow-hidden rounded-2xl border border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-800/70 text-slate-200">
            <tr>
              <th className="px-3 py-2">Group</th>
              <th className="px-3 py-2">Method</th>
              <th className="px-3 py-2">Path</th>
              <th className="px-3 py-2">Summary</th>
            </tr>
          </thead>
          <tbody>
            {data.endpoints.map((endpoint) => (
              <tr key={endpoint.id} className="border-t border-white/10 text-slate-300">
                <td className="px-3 py-2">{endpoint.group}</td>
                <td className="px-3 py-2 font-mono text-cyan-200">{endpoint.method}</td>
                <td className="px-3 py-2 font-mono">
                  <Link href={`/docs/endpoints/${endpoint.id}`} className="hover:text-cyan-200">
                    {endpoint.path}
                  </Link>
                </td>
                <td className="px-3 py-2">{endpoint.summary}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  );
}

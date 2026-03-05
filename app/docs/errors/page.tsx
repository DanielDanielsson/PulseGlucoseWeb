import { getDocsData } from '@/lib/contracts';
import ErrorsContent from '@/content/docs/errors.mdx';

export const metadata = {
  title: 'Errors'
};

export default async function ErrorsPage() {
  const data = await getDocsData();

  return (
    <article>
      <ErrorsContent />

      <div className="mt-8 overflow-hidden rounded-xl border border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-800/70 text-slate-200">
            <tr>
              <th className="px-3 py-2">Code</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {data.agentContext.errorCodes.map((errorCode) => (
              <tr key={errorCode.code} className="border-t border-white/10 text-slate-300">
                <td className="px-3 py-2 font-mono text-cyan-200">{errorCode.code}</td>
                <td className="px-3 py-2">{errorCode.status}</td>
                <td className="px-3 py-2">{errorCode.action || errorCode.message || 'Check endpoint docs'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  );
}

import { getContractBundle } from '@/lib/contracts/fetch-contracts';

export async function GET() {
  const bundle = await getContractBundle();

  return Response.json(bundle.openApi, {
    headers: {
      'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=60'
    }
  });
}

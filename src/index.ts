interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpToolExport {
  tools: McpToolDefinition[];
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  meter?: { credits: number };
  cost?: Record<string, unknown>;
  provider?: string;
}

/**
 * Walk Score MCP — wraps the Walk Score API (walkscore.com)
 *
 * Tools:
 * - walkscore_score: walkability (Walk/Transit/Bike Score) for a location
 *
 * Requires a BYO API key via the _apiKey parameter (sent as the `wsapikey`
 * query param). Get a free key at walkscore.com/professional/api.php.
 *
 * The Walk Score API keys results by BOTH coordinates AND street address —
 * lat, lon, and address are all required by the endpoint.
 */


const BASE_URL = 'https://api.walkscore.com';

const tools: McpToolExport['tools'] = [
  {
    name: 'walkscore_score',
    description:
      'How walkable is <address> — Walk/Transit/Bike Score (0-100) plus a human-readable description of walkability, transit, and biking. NOTE: the Walk Score API requires lat AND lon AND address to all be provided — the coordinates locate the point and the address disambiguates it. Example: walkscore_score({ address: "1119 8th Avenue, Seattle, WA 98101", lat: 47.6085, lon: -122.3295, transit: true, bike: true, _apiKey: "your-key" })',
    inputSchema: {
      type: 'object',
      properties: {
        address: {
          type: 'string',
          description: 'Full street address, e.g. "1119 8th Avenue, Seattle, WA 98101"',
        },
        lat: {
          type: 'number',
          description: 'Latitude of the location, e.g. 47.6085',
        },
        lon: {
          type: 'number',
          description: 'Longitude of the location, e.g. -122.3295',
        },
        transit: {
          type: 'boolean',
          description: 'Set true to also return the Transit Score (public transit availability)',
        },
        bike: {
          type: 'boolean',
          description: 'Set true to also return the Bike Score (bikeability)',
        },
        _apiKey: {
          type: 'string',
          description: 'Walk Score API key (get one free at walkscore.com/professional/api.php)',
        },
      },
      required: ['address', 'lat', 'lon', '_apiKey'],
    },
  },
];

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  const apiKey = args._apiKey as string | undefined;
  delete args._apiKey;

  if (!apiKey) {
    throw new Error(
      'Walk Score requires an API key. Get a free key at https://www.walkscore.com/professional/api.php and pass it via the `_apiKey` argument.',
    );
  }

  switch (name) {
    case 'walkscore_score':
      return getScore(args, apiKey);
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// Walk Score status codes (from the returned `status` field). Only 1 means the
// response body carries real scores; everything else needs an explanation so
// the agent doesn't treat a null score as "not walkable".
function statusNote(status: number): string | undefined {
  switch (status) {
    case 1:
      return undefined;
    case 2:
      return 'status 2 = score is being calculated, try again shortly';
    case 30:
      return 'status 30 = invalid API key';
    case 40:
      return 'status 40 = API quota exceeded for this key';
    default:
      return `status ${status} = unexpected Walk Score status code`;
  }
}

async function getScore(args: Record<string, unknown>, apiKey: string) {
  const address = args.address as string;
  const lat = args.lat as number;
  const lon = args.lon as number;

  const params = new URLSearchParams({
    format: 'json',
    wsapikey: apiKey,
    address,
    lat: String(lat),
    lon: String(lon),
  });
  if (args.transit) params.set('transit', '1');
  if (args.bike) params.set('bike', '1');

  const data = (await getJson(`/score?${params}`)) as {
    status: number;
    walkscore?: number;
    description?: string;
    more_info_link?: string;
    transit?: { score?: number; description?: string };
    bike?: { score?: number; description?: string };
  };

  const note = statusNote(data.status);

  return {
    address,
    walk_score: data.walkscore,
    walk_description: data.description,
    transit_score: data.transit?.score,
    transit_description: data.transit?.description,
    bike_score: data.bike?.score,
    bike_description: data.bike?.description,
    more_info: data.more_info_link,
    status: data.status,
    ...(note ? { status_note: note } : {}),
  };
}

// Shared GET helper — non-2xx surfaces as an actionable HTTP error.
async function getJson(path: string): Promise<unknown> {
  const res = await fetch(`${BASE_URL}${path}`);
  if (!res.ok) throw new Error(`WalkScore error: HTTP ${res.status}`);
  return res.json();
}

export default { tools, callTool, meter: { credits: 1 } } satisfies McpToolExport;

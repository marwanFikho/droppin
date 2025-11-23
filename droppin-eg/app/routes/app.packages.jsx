import { useLoaderData, Link as RemixLink } from '@remix-run/react';
import { Page, Layout, Card, DataTable, Text, Badge, InlineStack, Button, Box } from '@shopify/polaris';
import { authenticate } from '../shopify.server';
import prisma from '../db.server';
import { makeClient } from '../utils/droppinApi';

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shopDomain = session.shop;
  const config = await prisma.droppinShopConfig.findUnique({ where: { shop: shopDomain } });
  const apiKey = config?.apiKey || '';
  const apiBaseUrl = config?.apiBaseUrl || process.env.DROPPIN_API_URL || '';
  if (!apiKey || !apiBaseUrl) {
    return { packages: [], missingApiKey: !apiKey, missingApiBaseUrl: !apiBaseUrl };
  }
  const url = new URL(request.url);
  const status = url.searchParams.get('status') || undefined;
  const page = url.searchParams.get('page') || 1;
  const client = makeClient(apiKey, apiBaseUrl);
  let packagesResp;
  try {
    packagesResp = await client.listPackages({ status, page, limit: 20 });
  } catch (e) {
    return { packages: [], error: e.message };
  }
  return { packagesResp, apiKey, apiBaseUrl };
};

export default function PackagesPage() {
  const { packagesResp, apiKey, apiBaseUrl, missingApiKey, missingApiBaseUrl, error } = useLoaderData();
  const packages = packagesResp?.packages || [];

  return (
    <Page title="Packages" subtitle="Manage all Droppin packages">
      <Layout>
        {(missingApiKey || missingApiBaseUrl) && (
          <Layout.Section>
            <Card>
              <Text variant="bodyMd" tone="critical">{missingApiKey ? 'API key missing.' : ''} {missingApiBaseUrl ? 'API Base URL missing.' : ''} Please open Settings and fill the required fields.</Text>
            </Card>
          </Layout.Section>
        )}
        {error && (
          <Layout.Section>
            <Card>
              <Text tone="critical">Failed to load packages: {error}</Text>
            </Card>
          </Layout.Section>
        )}
        <Layout.Section>
          <Card>
            <InlineStack align="space-between" blockAlign="center">
              <Text variant="headingMd">Packages ({packages.length})</Text>
              <Button url="/app">Back Home</Button>
            </InlineStack>
            <Box padding="200" />
            <DataTable
              columnContentTypes={['text','text','text','text','text']}
              headings={['Tracking','Status','Recipient','Pickup Time','Actions']}
              rows={packages.map(p => [
                p.trackingNumber,
                <Badge key={p.id} tone={badgeTone(p.status)}>{p.status}</Badge>,
                p.deliveryContactName || '-',
                p.schedulePickupTime || '-',
                <Button key={`view-${p.id}`} url={`/app/packages/${p.id}`}>View</Button>
              ])}
            />
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

function badgeTone(status) {
  const s = (status || '').toLowerCase();
  if (s.includes('delivered')) return 'success';
  if (s.includes('cancel') || s.includes('reject')) return 'critical';
  if (s.includes('pending') || s.includes('await')) return 'attention';
  if (s.includes('transit') || s.includes('assigned') || s.includes('picked')) return 'info';
  return 'neutral';
}

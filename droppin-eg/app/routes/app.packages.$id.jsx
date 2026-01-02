import { useLoaderData, Form, useNavigation } from '@remix-run/react';
import { Page, Layout, Card, Text, InlineStack, Badge, Button, BlockStack, Select, TextField } from '@shopify/polaris';
import { authenticate } from '../shopify.server';
import prisma from '../db.server';
import { makeClient } from '../utils/droppinApi';

export const loader = async ({ request, params }) => {
  const { session } = await authenticate.admin(request);
  const shopDomain = session.shop;
  const config = await prisma.droppinShopConfig.findUnique({ where: { shop: shopDomain } });
  const apiKey = config?.apiKey || '';
  const apiBaseUrl = config?.apiBaseUrl || 'https://api.droppin-eg.com';
  if (!apiKey || !apiBaseUrl) return { package: null, missingApiKey: !apiKey, missingApiBaseUrl: !apiBaseUrl };
  const client = makeClient(apiKey, apiBaseUrl);
  try {
    const pkg = await client.getPackage(params.id);
    const items = await client.listItems(params.id).catch(() => ({ items: [] }));
    return { package: pkg, items: items.items || [], apiKey };
  } catch (e) {
    return { package: null, error: e.message };
  }
};
export const action = async ({ request, params }) => {
  const { session } = await authenticate.admin(request);
  const shopDomain = session.shop;
  const config = await prisma.droppinShopConfig.findUnique({ where: { shop: shopDomain } });
  const apiKey = config?.apiKey || '';
  const apiBaseUrl = config?.apiBaseUrl || 'https://api.droppin-eg.com';
  const form = await request.formData();
  const intent = form.get('_intent');
  const client = makeClient(apiKey, apiBaseUrl);
  if (intent === 'status') {
    const status = form.get('status');
    const note = form.get('note') || undefined;
    await client.updateStatus(params.id, { status, note });
  } else if (intent === 'note') {
    const note = form.get('note');
    await client.addNote(params.id, note);
  }
  return null;
};

export default function PackageDetail() {
  const { package: pkg, items, error, missingApiKey } = useLoaderData();
  const nav = useNavigation();
  if (missingApiKey) return <Page title="Package"><Layout><Layout.Section><Card><Text tone="critical">API key missing.</Text></Card></Layout.Section></Layout></Page>;
  if (error) return <Page title="Package"><Layout><Layout.Section><Card><Text tone="critical">{error}</Text></Card></Layout.Section></Layout></Page>;
  if (!pkg) return <Page title="Package"><Layout><Layout.Section><Card><Text>Not found.</Text></Card></Layout.Section></Layout></Page>;
  return (
    <Page title={`Package ${pkg.trackingNumber}`}> 
      <Layout>
        <Layout.Section>
          <Card>
            <InlineStack align="space-between">
              <Text variant="headingMd">Details</Text>
              <Badge tone={badgeTone(pkg.status)}>{pkg.status}</Badge>
            </InlineStack>
            <BlockStack gap="300">
              <Text>Recipient: {pkg.deliveryContactName} ({pkg.deliveryContactPhone})</Text>
              <Text>Delivery Address: {pkg.deliveryAddress}</Text>
              <Text>Pickup Address: {pkg.pickupAddress}</Text>
              <Text>COD Amount: {pkg.codAmount}</Text>
              <Text>Delivery Cost: {pkg.deliveryCost}</Text>
              <Text>Priority: {pkg.priority}</Text>
              <Text>Schedule Pickup: {pkg.schedulePickupTime}</Text>
              <Button url={`/app/packages/${pkg.id}/edit`} variant="secondary">Edit (if allowed)</Button>
            </BlockStack>
          </Card>
        </Layout.Section>
        <Layout.Section>
          <Card>
            <BlockStack gap="300">
              <Text variant="headingMd">Status</Text>
              <Form method="post">
                <input type="hidden" name="_intent" value="status" />
                <InlineStack gap="200" blockAlign="center">
                  <Select name="status" label="Change status" labelHidden options={statusOptions()} defaultValue={pkg.status} />
                  <TextField name="note" label="Note (optional)" labelHidden placeholder="Note" autoComplete="off" />
                  <Button submit loading={nav.state === 'submitting'}>Update</Button>
                </InlineStack>
              </Form>
            </BlockStack>
          </Card>
        </Layout.Section>
        <Layout.Section>
          <Card>
            <BlockStack gap="300">
              <Text variant="headingMd">Items</Text>
              {(items||[]).length === 0 ? (
                <Text>— No items —</Text>
              ) : (
                (items||[]).map(it => (
                  <InlineStack key={it.id} align="space-between">
                    <Text>{it.quantity} x {it.description}</Text>
                    <Text>{it.codAmount}</Text>
                  </InlineStack>
                ))
              )}
            </BlockStack>
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

function statusOptions() {
  return [
    'awaiting_schedule','scheduled_for_pickup','pending','assigned','pickedup','in-transit','delivered','delivered-awaiting-return','delivered-returned','cancelled','cancelled-awaiting-return','cancelled-returned','rejected','rejected-awaiting-return','rejected-returned','return-requested','return-in-transit','return-pending','return-completed','exchange-awaiting-schedule','exchange-awaiting-pickup','exchange-in-process','exchange-in-transit','exchange-awaiting-return','exchange-returned','exchange-cancelled'
  ].map(v => ({ label: v, value: v }));
}

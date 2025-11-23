import { useLoaderData, Form, useNavigation, redirect } from '@remix-run/react';
import { Page, Layout, Card, TextField, Button, BlockStack, Text, InlineGrid } from '@shopify/polaris';
import { authenticate } from '../shopify.server';
import prisma from '../db.server';
import { makeClient } from '../utils/droppinApi';

export const loader = async ({ request, params }) => {
  const { session } = await authenticate.admin(request);
  const shopDomain = session.shop;
  const config = await prisma.droppinShopConfig.findUnique({ where: { shop: shopDomain } });
  const apiKey = config?.apiKey || '';
  const apiBaseUrl = config?.apiBaseUrl || process.env.DROPPIN_API_URL || '';
  if (!apiKey || !apiBaseUrl) return { pkg: null, missingApiKey: !apiKey, missingApiBaseUrl: !apiBaseUrl };
  const client = makeClient(apiKey, apiBaseUrl);
  const pkg = await client.getPackage(params.id);
  return { pkg, apiKey };
};

export const action = async ({ request, params }) => {
  const { session } = await authenticate.admin(request);
  const shopDomain = session.shop;
  const config = await prisma.droppinShopConfig.findUnique({ where: { shop: shopDomain } });
  const apiKey = config?.apiKey || '';
  const apiBaseUrl = config?.apiBaseUrl || process.env.DROPPIN_API_URL || '';
  const form = await request.formData();
  const body = {
    packageDescription: form.get('packageDescription') || undefined,
    deliveryAddress: form.get('deliveryAddress') ? parseAddress(form.get('deliveryAddress')) : undefined,
    pickupAddress: form.get('pickupAddress') ? parseAddress(form.get('pickupAddress')) : undefined,
    schedulePickupTime: form.get('schedulePickupTime') || undefined,
    priority: form.get('priority') || undefined,
    shopNotes: form.get('shopNotes') || undefined,
  };
  const client = makeClient(apiKey, apiBaseUrl);
  await client.updatePackage(params.id, body);
  return redirect(`/app/packages/${params.id}`);
};

function parseAddress(raw) {
  // Expecting simple "street, city, state zip, country | name | phone" for now (can refine later)
  const [addrPart, contactName, contactPhone] = (raw || '').split('|').map(s => (s||'').trim());
  const [street, city, stateZip, country] = (addrPart || '').split(',').map(s => (s||'').trim());
  const [state, zipCode] = (stateZip || '').split(' ').map(s => (s||'').trim());
  return { street, city, state, zipCode, country, contactName, contactPhone };
}

export default function EditPackage() {
  const { pkg, missingApiKey } = useLoaderData();
  const nav = useNavigation();
  if (missingApiKey) return <Page title="Edit Package"><Layout><Layout.Section><Card>Missing API key</Card></Layout.Section></Layout></Page>;
  if (!pkg) return <Page title="Edit Package"><Layout><Layout.Section><Card>Not found</Card></Layout.Section></Layout></Page>;
  return (
    <Page title={`Edit ${pkg.trackingNumber}`} backAction={{ url: `/app/packages/${pkg.id}` }}>
      <Layout>
        <Layout.Section>
          <Card>
            <Form method="post">
              <BlockStack gap="400">
                <TextField label="Description" name="packageDescription" defaultValue={pkg.packageDescription || ''} autoComplete="off" />
                <TextField label="Pickup Address (street, city, state zip, country | name | phone)" name="pickupAddress" defaultValue={pkg.pickupAddress ? `${pkg.pickupAddress} | ${pkg.pickupContactName||''} | ${pkg.pickupContactPhone||''}` : ''} autoComplete="off" />
                <TextField label="Delivery Address (street, city, state zip, country | name | phone)" name="deliveryAddress" defaultValue={pkg.deliveryAddress ? `${pkg.deliveryAddress} | ${pkg.deliveryContactName||''} | ${pkg.deliveryContactPhone||''}` : ''} autoComplete="off" />
                <TextField label="Schedule Pickup Time (DD/MM/YYYY HH:mm)" name="schedulePickupTime" defaultValue={pkg.schedulePickupTime || ''} autoComplete="off" />
                <TextField label="Priority" name="priority" defaultValue={pkg.priority || ''} autoComplete="off" />
                <TextField label="Shop Notes" name="shopNotes" defaultValue={pkg.shopNotes || ''} autoComplete="off" multiline={4} />
                <InlineGrid columns={{ xs: 1, sm: 2 }} gap="400">
                  <Button submit primary loading={nav.state === 'submitting'}>Save</Button>
                  <Button url={`/app/packages/${pkg.id}`}>
                    Cancel
                  </Button>
                </InlineGrid>
              </BlockStack>
            </Form>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

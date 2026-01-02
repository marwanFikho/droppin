import { Form, useActionData, useLoaderData, useNavigation } from '@remix-run/react';
import { Page, Layout, Card, Text, TextField, Select, Button, InlineStack, Box, Banner, ResourceList, ResourceItem, Checkbox } from '@shopify/polaris';
import { authenticate } from '../shopify.server';
import prisma from '../db.server';
import { makeClient } from '../utils/droppinApi';

// Loader: fetch only API key (base URL removed per request)
export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shopDomain = session.shop;
  let apiKey = '';
  try {
    const config = await prisma.droppinShopConfig.findUnique({ where: { shop: shopDomain }, select: { apiKey: true } });
    apiKey = config?.apiKey || '';
  } catch (e) {
    console.warn('DroppinShopConfig read failed:', e?.message);
  }
  // Fetch shop packages to select for pickup
  let packagesResp = { packages: [] };
  if (apiKey) {
    try {
      const client = makeClient(apiKey);
      packagesResp = await client.listPackages({ status: 'awaiting_pickup', limit: 50 });
    } catch (e) {
      console.warn('Failed to load packages for pickup:', e?.message);
    }
  }
  return { apiKey, packagesResp };
};

// Action: temporary preview only (no backend call yet)
export const action = async ({ request }) => {
  const form = await request.formData();
  const packageIds = form.getAll('packageIds');
  const scheduledTime = form.get('scheduledTime');
  const pickupAddress = form.get('pickupAddress');
  // For now, preview; wiring to backend pickups endpoint will be next step
  return { ok: true, preview: { packageIds, scheduledTime, pickupAddress } };
};

export default function CreatePickupPage() {
  const { apiKey, packagesResp } = useLoaderData();
  const actionData = useActionData();
  const nav = useNavigation();
  const isSubmitting = nav.state === 'submitting';
  const packages = packagesResp?.packages || [];

  return (
    <Page title="Create Pickup" subtitle="Request a pickup and create packages in one step">
      <Layout>
        {!apiKey && (
          <Layout.Section>
            <Banner title="Missing Droppin API Key" status="critical">
              <p>Configure your Droppin API key in Settings before creating pickups.</p>
            </Banner>
          </Layout.Section>
        )}
        <Layout.Section>
          <Card>
            <Form method="post">
              <Text variant="headingSm">Select Packages</Text>
              <Box padding="200" />
              {packages.length === 0 ? (
                <Text tone="subdued">No packages awaiting pickup.</Text>
              ) : (
                <ResourceList
                  resourceName={{ singular: 'package', plural: 'packages' }}
                  items={packages}
                  renderItem={(item) => {
                    const { id, trackingNumber, deliveryContactName, deliveryAddress, schedulePickupTime, status } = item;
                    return (
                      <ResourceItem id={id} accessibilityLabel={`Select package ${trackingNumber}`}>
                        <InlineStack align="space-between" blockAlign="center">
                          <InlineStack gap="200">
                            <Checkbox name="packageIds" value={id} label={trackingNumber} />
                            <Text>{deliveryContactName || '-'}</Text>
                            <Text tone="subdued">{deliveryAddress || '-'}</Text>
                          </InlineStack>
                          <Text tone="subdued">{schedulePickupTime || status}</Text>
                        </InlineStack>
                      </ResourceItem>
                    );
                  }}
                />
              )}
              <Box padding="400" />
              <Text variant="headingSm">Recipient Details</Text>
              <Box padding="200" />
              <InlineStack gap="400">
                <TextField label="Recipient Name" name="deliveryContactName" autoComplete="name" />
                <TextField label="Recipient Phone" name="deliveryContactPhone" autoComplete="tel" />
              </InlineStack>
              <Box padding="300" />
              <TextField label="Delivery Address" name="deliveryAddressStreet" multiline={3} autoComplete="street-address" />
              <InlineStack gap="400">
                <TextField label="City" name="deliveryAddressCity" />
                <TextField label="State" name="deliveryAddressState" />
                <TextField label="Zip Code" name="deliveryAddressZipCode" />
                <TextField label="Country" name="deliveryAddressCountry" value="Egypt" onChange={() => {}} disabled />
              </InlineStack>
              <Box padding="400" />
              <Text variant="headingSm">Package Details</Text>
              <Box padding="200" />
              <InlineStack gap="400">
                <TextField label="Package Description" name="packageDescription" />
                <TextField label="Weight (kg)" name="weight" type="number" min={0} step={0.1} />
                <Select label="Priority" name="priority" options={[{label:'Normal',value:'normal'},{label:'Express',value:'express'},{label:'Same-day',value:'same-day'}]} />
              </InlineStack>
              <Box padding="400" />
              <Text variant="headingSm">Pickup Details</Text>
              <Box padding="200" />
              <TextField label="Pickup Address" name="pickupAddress" multiline={2} />
              <InlineStack gap="400">
                <TextField label="Pickup Date & Time" name="scheduledTime" type="datetime-local" />
              </InlineStack>
              <Box padding="400" />
              <InlineStack gap="400" align="end">
                <Button url="/app/packages">Cancel</Button>
                <Button primary submit loading={isSubmitting}>Preview Pickup</Button>
              </InlineStack>
            </Form>
          </Card>
        </Layout.Section>
        {actionData?.ok && (
          <Layout.Section>
            <Card>
              <Text variant="headingMd">Preview</Text>
              <Box padding="200" />
              <pre style={{whiteSpace:'pre-wrap'}}>{JSON.stringify(actionData.preview, null, 2)}</pre>
            </Card>
          </Layout.Section>
        )}
      </Layout>
    </Page>
  );
}

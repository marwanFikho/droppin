import { useActionData, useLoaderData, Form, useNavigation } from '@remix-run/react';
import { Page, Layout, Card, Text, TextField, Select, Button, InlineStack, Box, Banner } from '@shopify/polaris';
import { authenticate } from '../shopify.server';
import prisma from '../db.server';

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shopDomain = session.shop;
  let config;
  try {
    config = await prisma.droppinShopConfig.findUnique({ where: { shop: shopDomain }, select: { apiKey: true, shop: true } });
  } catch {}
  const apiBaseUrl = process.env.DROPPIN_API_URL || 'https://api.droppin-eg.com';
  // Until we formalize additional fields in DroppinShopConfig, keep defaults empty
  const shownShippingFees = null;
  const shippingFees = null;
  const contactName = null;
  const contactPhone = null;
  const pickupAddress = '';
  return { apiBaseUrl, defaults: { shownShippingFees, shippingFees, contactName, contactPhone, pickupAddress } };
};

export const action = async ({ request }) => {
  const form = await request.formData();
  // For step 1, just echo back the payload without calling backend
  const payload = Object.fromEntries(form);
  return { ok: true, preview: payload };
};

export default function CreateShipmentPage() {
  const { apiBaseUrl, defaults } = useLoaderData();
  const actionData = useActionData();
  const nav = useNavigation();
  const isSubmitting = nav.state === 'submitting';

  return (
    <Page title="Create Shipment" subtitle="Create a Droppin package from a Shopify order or manually">
      <Layout>
        {!apiBaseUrl && (
          <Layout.Section>
            <Banner title="Missing API Base URL" status="critical">
              <p>Open Settings and configure Droppin API Base URL and API Key before creating shipments.</p>
            </Banner>
          </Layout.Section>
        )}
        <Layout.Section>
          <Card>
            <Form method="post">
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
              <Box padding="300" />
              <InlineStack gap="400">
                <TextField label="Package Description" name="packageDescription" />
                <TextField label="Weight (kg)" name="weight" type="number" min={0} step={0.1} />
                <Select label="Priority" name="priority" options={[{label:'Normal',value:'normal'},{label:'Express',value:'express'},{label:'Same-day',value:'same-day'}]} />
              </InlineStack>
              <Box padding="300" />
              <InlineStack gap="400">
                <TextField label="Pickup Contact Name" name="pickupContactName" value={defaults.contactName || ''} onChange={() => {}} />
                <TextField label="Pickup Contact Phone" name="pickupContactPhone" value={defaults.contactPhone || ''} onChange={() => {}} />
              </InlineStack>
              <TextField label="Pickup Address" name="pickupAddress" value={defaults.pickupAddress || ''} onChange={() => {}} multiline={2} />
              <Box padding="300" />
              <InlineStack gap="400">
                <TextField label="Shown Shipping (EGP)" name="shownDeliveryCost" type="number" min={0} step={0.01} value={defaults.shownShippingFees?.toString() || ''} onChange={() => {}} />
                <TextField label="Delivery Cost (EGP)" name="deliveryCost" type="number" min={0} step={0.01} value={defaults.shippingFees?.toString() || ''} onChange={() => {}} />
              </InlineStack>
              <Box padding="300" />
              <InlineStack gap="400" align="end">
                <Button url="/app/packages">Cancel</Button>
                <Button primary submit loading={isSubmitting}>Preview Payload</Button>
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

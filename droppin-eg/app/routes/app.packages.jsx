import { useLoaderData, Link as RemixLink } from '@remix-run/react';
import { Page, Layout, Card, DataTable, Text, Badge, InlineStack, Button, Box, Modal, BlockStack } from '@shopify/polaris';
import { authenticate } from '../shopify.server';
import prisma from '../db.server';
import { makeClient } from '../utils/droppinApi';
import { useState } from 'react';

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
  const apiBaseUrl = process.env.DROPPIN_API_URL || 'https://api.droppin-eg.com';
  if (!apiKey || !apiBaseUrl) {
    return { packagesResp: null, packages: [], missingApiKey: !apiKey, missingApiBaseUrl: !apiBaseUrl };
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
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [modalActive, setModalActive] = useState(false);

  const handleViewPackage = (pkg) => {
    setSelectedPackage(pkg);
    setModalActive(true);
  };

  const handleCloseModal = () => {
    setModalActive(false);
    setSelectedPackage(null);
  };

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
            <Text variant="headingMd">Packages ({packages.length})</Text>
            <Box padding="200" />
            <DataTable
              columnContentTypes={['text','text','text','text','text']}
              headings={['Tracking','Status','Recipient','Pickup Time','Actions']}
              rows={packages.map(p => [
                p.trackingNumber,
                <Badge key={p.id} tone={badgeTone(p.status)}>{p.status}</Badge>,
                p.deliveryContactName || '-',
                p.schedulePickupTime || '-',
                <Button key={`view-${p.id}`} onClick={() => handleViewPackage(p)}>View</Button>
              ])}
            />
          </Card>
        </Layout.Section>
      </Layout>

      <Modal
        open={modalActive}
        onClose={handleCloseModal}
        title={selectedPackage ? `Package ${selectedPackage.trackingNumber}` : 'Package Details'}
        primaryAction={{
          content: 'Close',
          onAction: handleCloseModal,
        }}
      >
        <Modal.Section>
          {selectedPackage && (
            <BlockStack gap="400">
              <InlineStack align="space-between">
                <Text variant="headingMd">Status</Text>
                <Badge tone={badgeTone(selectedPackage.status)}>{selectedPackage.status}</Badge>
              </InlineStack>
              
              <BlockStack gap="200">
                <Text variant="headingMd">Delivery Information</Text>
                <Text><strong>Recipient:</strong> {selectedPackage.deliveryContactName || 'N/A'}</Text>
                <Text><strong>Phone:</strong> {selectedPackage.deliveryContactPhone || 'N/A'}</Text>
                <Text><strong>Address:</strong> {selectedPackage.deliveryAddress || 'N/A'}</Text>
              </BlockStack>

              <BlockStack gap="200">
                <Text variant="headingMd">Pickup Information</Text>
                <Text><strong>Scheduled Time:</strong> {selectedPackage.schedulePickupTime || 'N/A'}</Text>
                <Text><strong>Pickup Address:</strong> {selectedPackage.pickupAddress || 'N/A'}</Text>
              </BlockStack>

              <BlockStack gap="200">
                <Text variant="headingMd">Package Details</Text>
                <Text><strong>Tracking Number:</strong> {selectedPackage.trackingNumber}</Text>
                <Text><strong>Description:</strong> {selectedPackage.packageDescription || 'N/A'}</Text>
                <Text><strong>Priority:</strong> {selectedPackage.priority || 'Normal'}</Text>
                {selectedPackage.shopNotes && (
                  <Text><strong>Notes:</strong> {selectedPackage.shopNotes}</Text>
                )}
              </BlockStack>

              {selectedPackage.assignedDriver && (
                <BlockStack gap="200">
                  <Text variant="headingMd">Driver Information</Text>
                  <Text><strong>Driver:</strong> {selectedPackage.assignedDriver}</Text>
                </BlockStack>
              )}
            </BlockStack>
          )}
        </Modal.Section>
      </Modal>
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

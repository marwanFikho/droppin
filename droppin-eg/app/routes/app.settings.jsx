import { useState } from "react";
import { Page, Card, TextField, Button, BlockStack, Text } from "@shopify/polaris";
import { json, redirect } from "@remix-run/node";
import { useLoaderData, Form, useActionData } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const loader = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);
  const shopDomain = session.shop;
  const config = await prisma.droppinShopConfig.findUnique({ where: { shop: shopDomain } });
  return json({ apiKey: config?.apiKey || "", apiBaseUrl: config?.apiBaseUrl || (process.env.DROPPIN_API_URL || '') });
};

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shopDomain = session.shop;
  const formData = await request.formData();
  const apiKey = (formData.get("apiKey") || "").toString();
  const apiBaseUrl = (formData.get("apiBaseUrl") || "").toString();
  await prisma.droppinShopConfig.upsert({
    where: { shop: shopDomain },
    update: { apiKey, apiBaseUrl },
    create: { shop: shopDomain, apiKey, apiBaseUrl },
  });
  return redirect("/app/settings");
};

export default function Settings() {
  const { apiKey, apiBaseUrl } = useLoaderData();
  const actionData = useActionData();
  const [value, setValue] = useState(apiKey || "");
  const [base, setBase] = useState(apiBaseUrl || "");

  return (
    <Page title="Droppin Settings">
      <Card sectioned>
        <BlockStack gap="400">
          <Text variant="headingMd">Enter your Droppin API Key</Text>
          <Form method="post">
            <TextField
              label="API Key"
              name="apiKey"
              value={value}
              onChange={setValue}
              autoComplete="off"
            />
            <TextField
              label="Droppin API Base URL (e.g., https://api.yourdomain.com/api)"
              name="apiBaseUrl"
              value={base}
              onChange={setBase}
              autoComplete="off"
            />
            <Button submit primary>
              Save
            </Button>
          </Form>
          {apiKey && (
            <Text variant="bodyMd" color="success">
              Current API Key: {apiKey}
            </Text>
          )}
          {base && (
            <Text variant="bodyMd" color="success">
              Current API Base URL: {base}
            </Text>
          )}
        </BlockStack>
      </Card>
    </Page>
  );
} 
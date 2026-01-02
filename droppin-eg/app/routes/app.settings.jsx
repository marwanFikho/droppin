import { useState } from "react";
import { Page, Card, TextField, Button, BlockStack, Text } from "@shopify/polaris";
import { json, redirect } from "@remix-run/node";
import { useLoaderData, Form, useActionData } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const loader = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);
  const shopDomain = session.shop;
  const config = await prisma.droppinShopConfig.findUnique({ where: { shop: shopDomain }, select: { apiKey: true } });
  return json({ apiKey: config?.apiKey || "" });
};

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shopDomain = session.shop;
  const formData = await request.formData();
  const apiKey = (formData.get("apiKey") || "").toString();
  await prisma.droppinShopConfig.upsert({
    where: { shop: shopDomain },
    update: { apiKey },
    create: { shop: shopDomain, apiKey },
  });
  return redirect("/app/settings");
};

export default function Settings() {
  const { apiKey } = useLoaderData();
  const actionData = useActionData();
  const [value, setValue] = useState(apiKey || "");

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
            <Button submit primary>
              Save
            </Button>
          </Form>
          {apiKey && (
            <Text variant="bodyMd" color="success">
              Current API Key: {apiKey}
            </Text>
          )}
        </BlockStack>
      </Card>
    </Page>
  );
} 
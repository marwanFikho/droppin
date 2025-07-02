import { useState } from "react";
import { Page, Card, TextField, Button, BlockStack, Text } from "@shopify/polaris";
import { json, redirect } from "@remix-run/node";
import { useLoaderData, Form, useActionData } from "@remix-run/react";
import { apiKeyStore } from "../utils/apiKeyStore";

export const loader = async () => {
  // In real app, fetch from DB by shop
  return json({ apiKey: apiKeyStore.key });
};

export const action = async ({ request }) => {
  const formData = await request.formData();
  const apiKey = formData.get("apiKey");
  // In real app, save to DB by shop
  apiKeyStore.key = apiKey;
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
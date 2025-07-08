import { AppProvider } from "@shopify/polaris";
import enTranslations from "@shopify/polaris/locales/en.json";
import {
  Page,
  Layout,
  Card,
  Text,
  BlockStack,
} from "@shopify/polaris";

export default function Privacy() {
  return (
    <AppProvider i18n={enTranslations}>
      <style>{`
        .droppin-legal-container {
          max-width: 700px;
          margin: 40px auto 0 auto;
          background: #fff;
          border-radius: 18px;
          box-shadow: 0 4px 24px rgba(0,0,0,0.09);
          padding: 40px 32px 32px 32px;
          font-family: 'Inter', 'Montserrat', Arial, sans-serif;
        }
        .droppin-legal-container h2 {
          font-size: 2rem;
          margin-bottom: 18px;
        }
        .droppin-legal-container h3 {
          font-size: 1.2rem;
          margin-top: 32px;
          margin-bottom: 10px;
          color: #FF7A29;
        }
        .droppin-legal-container ul {
          margin: 0 0 18px 18px;
        }
        .droppin-legal-container p {
          margin-bottom: 14px;
          color: #222;
        }
        .droppin-legal-container strong {
          color: #FF7A29;
        }
      `}</style>
      <Page>
        <Layout>
          <Layout.Section>
            <div className="droppin-legal-container">
              <BlockStack gap="500">
                <Text variant="headingMd" as="h2">
                  Privacy Policy for Droppin EG
                </Text>
                <Text as="p">
                  <strong>Last updated:</strong> {new Date().toLocaleDateString()}
                </Text>
                <Text as="p">
                  This Privacy Policy describes how Droppin EG ("we", "us", or "our") collects, uses, and shares information when you use our Shopify app.
                </Text>
                <Text variant="headingMd" as="h3">
                  Information We Collect
                </Text>
                <Text as="p">
                  We collect information that you provide directly to us, such as:
                </Text>
                <ul>
                  <li>Shop information (shop domain, access tokens)</li>
                  <li>Order data (customer information, shipping addresses, order details)</li>
                  <li>App usage data and preferences</li>
                </ul>
                <Text variant="headingMd" as="h3">
                  How We Use Your Information
                </Text>
                <Text as="p">
                  We use the information we collect to:
                </Text>
                <ul>
                  <li>Provide and maintain our shipping services</li>
                  <li>Process orders and facilitate deliveries</li>
                  <li>Communicate with you about our services</li>
                  <li>Improve our app and services</li>
                  <li>Comply with legal obligations</li>
                </ul>
                <Text variant="headingMd" as="h3">
                  Data Sharing
                </Text>
                <Text as="p">
                  We share your information with:
                </Text>
                <ul>
                  <li>Droppin delivery partners to fulfill orders</li>
                  <li>Service providers who assist in our operations</li>
                  <li>Legal authorities when required by law</li>
                </ul>
                <Text variant="headingMd" as="h3">
                  Your Rights
                </Text>
                <Text as="p">
                  You have the right to:
                </Text>
                <ul>
                  <li>Access your personal data</li>
                  <li>Request correction of your data</li>
                  <li>Request deletion of your data</li>
                  <li>Object to processing of your data</li>
                  <li>Data portability</li>
                </ul>
                <Text variant="headingMd" as="h3">
                  Data Retention
                </Text>
                <Text as="p">
                  We retain your data for as long as necessary to provide our services and comply with legal obligations. When you uninstall our app or request data deletion, we will delete your data within 30 days.
                </Text>
                <Text variant="headingMd" as="h3">
                  Contact Us
                </Text>
                <Text as="p">
                  If you have any questions about this Privacy Policy, please contact us at:
                </Text>
                <Text as="p">
                  Email: droppin.eg@gmail.com<br />
                  Website: https://droppin-eg.com
                </Text>
              </BlockStack>
            </div>
          </Layout.Section>
        </Layout>
      </Page>
    </AppProvider>
  );
} 
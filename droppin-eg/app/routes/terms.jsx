import { AppProvider } from "@shopify/polaris";
import enTranslations from "@shopify/polaris/locales/en.json";
import {
  Page,
  Layout,
  Card,
  Text,
  BlockStack,
} from "@shopify/polaris";

export default function Terms() {
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
                  Terms of Service for Droppin EG
                </Text>
                <Text as="p">
                  <strong>Last updated:</strong> {new Date().toLocaleDateString()}
                </Text>
                <Text as="p">
                  These Terms of Service ("Terms") govern your use of the Droppin EG Shopify app ("Service") operated by Droppin EG ("we", "us", or "our").
                </Text>
                <Text variant="headingMd" as="h3">
                  Acceptance of Terms
                </Text>
                <Text as="p">
                  By installing and using our app, you agree to be bound by these Terms. If you disagree with any part of these terms, you may not access the Service.
                </Text>
                <Text variant="headingMd" as="h3">
                  Description of Service
                </Text>
                <Text as="p">
                  Droppin EG is a shipping and delivery service that integrates with Shopify to provide:
                </Text>
                <ul>
                  <li>Order processing and fulfillment</li>
                  <li>Delivery tracking and management</li>
                  <li>Shipping rate calculations</li>
                  <li>Customer delivery notifications</li>
                </ul>
                <Text variant="headingMd" as="h3">
                  User Responsibilities
                </Text>
                <Text as="p">
                  You agree to:
                </Text>
                <ul>
                  <li>Provide accurate and complete information</li>
                  <li>Comply with all applicable laws and regulations</li>
                  <li>Not use the service for illegal or unauthorized purposes</li>
                  <li>Maintain the security of your account</li>
                  <li>Pay all fees associated with the service</li>
                </ul>
                <Text variant="headingMd" as="h3">
                  Payment Terms
                </Text>
                <Text as="p">
                  Payment for our services is processed through Shopify's billing system. You agree to pay all fees associated with your use of the service. Fees are non-refundable except as required by law.
                </Text>
                <Text variant="headingMd" as="h3">
                  Privacy and Data Protection
                </Text>
                <Text as="p">
                  Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the Service, to understand our practices regarding the collection and use of your information.
                </Text>
                <Text variant="headingMd" as="h3">
                  Intellectual Property
                </Text>
                <Text as="p">
                  The Service and its original content, features, and functionality are and will remain the exclusive property of Droppin EG and its licensors. The Service is protected by copyright, trademark, and other laws.
                </Text>
                <Text variant="headingMd" as="h3">
                  Limitation of Liability
                </Text>
                <Text as="p">
                  In no event shall Droppin EG, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses.
                </Text>
                <Text variant="headingMd" as="h3">
                  Termination
                </Text>
                <Text as="p">
                  We may terminate or suspend your access immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
                </Text>
                <Text variant="headingMd" as="h3">
                  Changes to Terms
                </Text>
                <Text as="p">
                  We reserve the right to modify or replace these Terms at any time. If a revision is material, we will try to provide at least 30 days notice prior to any new terms taking effect.
                </Text>
                <Text variant="headingMd" as="h3">
                  Contact Information
                </Text>
                <Text as="p">
                  If you have any questions about these Terms of Service, please contact us at:
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
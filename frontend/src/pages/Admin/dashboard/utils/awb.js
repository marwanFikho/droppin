/**
 * File Purpose:
 * - AWB generation/printing utility module.
 * - Builds single/multi-page AWB HTML, calculates totals, and opens browser print windows for labels.
 * - Used by Admin print actions and bulk AWB operations.
 */

import QRCode from 'qrcode';
import { packageService } from '../../../../services/api';
import { formatEnglishWithArabic } from '../../../../utils/arabicTransliteration';

export const buildAwbPageHtml = async (pkg) => {
  // Ensure we have Items for AWB
  let packageForAwb = pkg;
  if (!pkg?.Items || !Array.isArray(pkg.Items)) {
    try {
      const resp = await packageService.getPackageById(pkg.id);
      if (resp && resp.data) packageForAwb = resp.data;
    } catch (err) {
      // ignore and fallback
    }
  }

  const qrDataUrl = await QRCode.toDataURL((packageForAwb.trackingNumber || pkg.trackingNumber || ''));
  const logoUrl = window.location.origin + '/assets/images/logo.jpg';
  const awbPkg = packageForAwb;
  const cod = parseFloat((awbPkg.codAmount != null ? awbPkg.codAmount : pkg.codAmount) || 0);
  const isShopify = (awbPkg.shopifyOrderId !== undefined && awbPkg.shopifyOrderId !== null && awbPkg.shopifyOrderId !== '');
  const itemsSum = (Array.isArray(awbPkg.Items) && awbPkg.Items.length > 0)
    ? awbPkg.Items.reduce((sum, it) => sum + (parseFloat(it.codAmount || 0) || 0), 0)
    : cod;
  const shippingValue = Number(awbPkg.shownDeliveryCost ?? awbPkg.deliveryCost ?? pkg.shownDeliveryCost ?? pkg.deliveryCost ?? 0) || 0;

  // For Shopify packages: Sub Total = COD - shownShippingFees, Delivery fees = shownShippingFees, Total = COD
  // For manually created packages: Sub Total = itemsSum, Delivery fees = shippingValue, Total = subTotal + shipping
  const subTotal = isShopify ? Math.max(0, cod - shippingValue) : itemsSum;
  const deliveryFees = shippingValue;
  const total = isShopify ? cod : (subTotal + shippingValue);

  const totalsRows = isShopify
    ? `<tr><td>Sub Total:</td><td>${subTotal.toFixed(2)} EGP</td></tr>`
      + `<tr><td>Delivery fees & Taxes:</td><td>${deliveryFees.toFixed(2)} EGP</td></tr>`
      + `<tr><td><b>Total:</b></td><td><b>${total.toFixed(2)} EGP</b></td></tr>`
    : `<tr><td>Sub Total:</td><td>${subTotal.toFixed(2)} EGP</td></tr>`
      + `<tr><td>Shipping:</td><td>${deliveryFees.toFixed(2)} EGP</td></tr>`
      + `<tr><td><b>Total:</b></td><td><b>${total.toFixed(2)} EGP</b></td></tr>`;
  const shopName = awbPkg.Shop?.businessName || awbPkg.shop?.businessName;
  const [shopNameDisplay, recipientNameDisplay, addressDisplay] = await Promise.all([
    formatEnglishWithArabic(shopName || '-'),
    formatEnglishWithArabic(awbPkg.deliveryContactName || '-'),
    formatEnglishWithArabic(awbPkg.deliveryAddress || '-')
  ]);
  const isExchange = (awbPkg.type === 'exchange');
  const exch = awbPkg.exchangeDetails || {};
  const takeItems = Array.isArray(exch.takeItems) ? exch.takeItems : [];
  const giveItems = Array.isArray(exch.giveItems) ? exch.giveItems : [];
  const cd = exch.cashDelta || {};
  const moneyAmount = Number.parseFloat(cd.amount || 0) || 0;
  const moneyType = cd.type || null;
  const moneyLabel = moneyType === 'give' ? 'Give to customer' : (moneyType === 'take' ? 'Take from customer' : 'Money');
  const shippingDisplay = Number(awbPkg.shownDeliveryCost ?? awbPkg.deliveryCost ?? shippingValue) || 0;

  const itemsSectionDefault = `
          <table class="awb-table">
            <thead>
              <tr><th>Item</th><th>Qty</th><th>COD Per Unit</th><th>Total COD</th></tr>
            </thead>
            <tbody>
              ${
                awbPkg.Items && awbPkg.Items.length > 0
                  ? awbPkg.Items.map(item => `
                    <tr>
                      <td>${item.description || '-'}</td>
                      <td>${item.quantity}</td>
                      <td>${item.codAmount && item.quantity ? (item.codAmount / item.quantity).toFixed(2) : '0.00'} EGP</td>
                      <td>${parseFloat(item.codAmount || 0).toFixed(2)} EGP</td>
                    </tr>
                  `).join('')
                  : `
                    <tr>
                      <td>${awbPkg.packageDescription || '-'}</td>
                      <td>${awbPkg.itemsNo ?? 1}</td>
                      <td>${cod.toFixed(2)} EGP</td>
                      <td>${cod.toFixed(2)} EGP</td>
                    </tr>`
              }
            </tbody>
          </table>
          <div class="awb-section">
            <b>Payment Method:</b> COD
          </div>
          <div class="awb-section" style="display:flex;justify-content:flex-end;">
            <table class="awb-info-table" style="width:300px;">
              ${totalsRows}
            </table>
          </div>`;

  const itemsSectionExchange = `
          <div class="awb-section">
            <table class="awb-table">
              <thead>
                <tr><th colspan="2">Items to take from customer</th></tr>
              </thead>
              <tbody>
                ${
                  takeItems.length > 0
                    ? takeItems.map(it => `
                        <tr>
                          <td>${(it.description || '-')}</td>
                          <td>Qty: ${(parseInt(it.quantity) || 0)}</td>
                        </tr>
                      `).join('')
                    : `<tr><td colspan="2">None</td></tr>`
                }
              </tbody>
            </table>
            <table class="awb-table" style="margin-top:12px;">
              <thead>
                <tr><th colspan="2">Items to give to customer</th></tr>
              </thead>
              <tbody>
                ${
                  giveItems.length > 0
                    ? giveItems.map(it => `
                        <tr>
                          <td>${(it.description || '-')}</td>
                          <td>Qty: ${(parseInt(it.quantity) || 0)}</td>
                        </tr>
                      `).join('')
                    : `<tr><td colspan="2">None</td></tr>`
                }
              </tbody>
            </table>
          </div>
          <div class="awb-section" style="display:flex;justify-content:flex-end;">
            <table class="awb-info-table" style="width:360px;">
              <tr><td>${moneyLabel}:</td><td>EGP ${moneyAmount.toFixed(2)}</td></tr>
              <tr><td>Shipping Fees:</td><td>EGP ${shippingDisplay.toFixed(2)}</td></tr>
            </table>
          </div>`;

  return `
    <div class="awb-page">
      <div class="awb-container">
        <div class="awb-header">
          <img src="${logoUrl}" class="awb-logo" alt="Droppin Logo" />
          <div>
            <img src="${qrDataUrl}" alt="QR Code" style="height:140px;width:140px;" />
          </div>
        </div>
        <div class="awb-section">
          <table class="awb-info-table">
            <tr>
              <td>
                <div class="awb-tracking">Tracking #: ${awbPkg.trackingNumber || '-'}</div>
                <div class="awb-shop-name">Shop Name: ${shopNameDisplay}</div>
              </td>
              <td><b>Date:</b> ${awbPkg.createdAt ? new Date(awbPkg.createdAt).toLocaleDateString() : '-'}</td>
            </tr>
            <tr>
              <td colspan="2">
                <div><b>Recipient:</b> ${recipientNameDisplay}</div>
                <div><b>Email:</b> ${awbPkg.deliveryContactEmail || '-'}</div>
                <div><b>Phone:</b> ${awbPkg.deliveryContactPhone || '-'}</div>
                <div><b>Address:</b> ${addressDisplay}</div>
                ${isShopify ? `<div><b>Shopify Order:</b> ${awbPkg.shopifyOrderName || awbPkg.shopifyOrderId}</div>` : ''}
              </td>
            </tr>
          </table>
        </div>
        <div class="awb-section">
          <b>Description:</b> ${awbPkg.packageDescription || '-'}
        </div>
        ${awbPkg.shopNotes ? `<div class="awb-section"><b>Shop Notes:</b> ${awbPkg.shopNotes}</div>` : ''}
        ${isExchange ? itemsSectionExchange : itemsSectionDefault}
        <div class="awb-footer">Thank you for your order!</div>
      </div>
    </div>
  `;
};

export const getAwbDocumentHtml = (pagesHtml) => `
  <html>
    <head>
      <title>Droppin Air Waybill</title>
      <style>
        @page { margin: 0; }
        body { font-family: Arial, sans-serif; background: #fff; color: #111; margin: 0; padding: 0; }
        .awb-page { page-break-after: always; break-after: page; }
        .awb-page:last-child { page-break-after: auto; break-after: auto; }
        .awb-container { width: 800px; margin: 0 auto; padding: 32px; background: #fff; }
        .awb-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #111; padding-bottom: 16px; }
        .awb-logo { height: 80px; width: auto; }
        .awb-shop-name { font-size: 1.2rem; font-weight: bold; color: #004b6f; margin-top: 4px; }
        .awb-section { margin-top: 24px; }
        .awb-table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        .awb-table th, .awb-table td { border: 1px solid #111; padding: 8px; text-align: left; }
        .awb-table th { background: #f5f5f5; }
        .awb-info-table { width: 100%; margin-top: 16px; }
        .awb-info-table td { padding: 4px 8px; }
        .awb-footer { margin-top: 32px; text-align: center; font-size: 1.1rem; font-weight: bold; }
        .awb-tracking { font-size: 22px; font-weight: bold; }
      </style>
    </head>
    <body>
      ${pagesHtml.join('\n')}
    </body>
  </html>
`;

export const openAndPrintAwbDocument = (docHtml) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Popup was blocked. Please allow popups for this site and try again.');
    return;
  }
  printWindow.document.open();
  printWindow.document.write(docHtml);
  printWindow.document.close();
  printWindow.onload = () => {
    printWindow.focus();
    printWindow.print();
  };
};

// backend/scripts/fix_delivery_cost_for_delivered_packages.js
const { sequelize } = require('../models');
const Package = require('../models/package.model');
const Shop = require('../models/shop.model');

async function fixDeliveryCostForAllPackages() {
  try {
    // Fetch all packages (not just delivered ones)
    const allPackages = await Package.findAll({
      attributes: ['id', 'shopId', 'shownDeliveryCost', 'status'],
    });
    console.log(`Found ${allPackages.length} total packages.`);

    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const pkg of allPackages) {
      try {
        // Fetch the shop's shownShippingFees
        const shop = await Shop.findByPk(pkg.shopId);
        if (shop && shop.shownShippingFees != null) {
          const shownShippingFees = parseFloat(shop.shownShippingFees);
          if (pkg.shownDeliveryCost !== shownShippingFees) {
            // Update the shownDeliveryCost
            await Package.update(
              { shownDeliveryCost: shownShippingFees },
              { where: { id: pkg.id } }
            );
            updatedCount++;
            console.log(`Updated package ${pkg.id} (${pkg.status}): shownDeliveryCost set to ${shownShippingFees}`);
          } else {
            skippedCount++;
            console.log(`Skipped package ${pkg.id} (${pkg.status}): shownDeliveryCost already correct (${shownShippingFees})`);
          }
        } else {
          skippedCount++;
          console.log(`Skipped package ${pkg.id} (${pkg.status}): shop not found or no shown shipping fees`);
        }
      } catch (err) {
        errorCount++;
        console.error(`Error processing package ${pkg.id}:`, err.message);
      }
    }
    
    console.log(`\n=== Summary ===`);
    console.log(`Total packages processed: ${allPackages.length}`);
    console.log(`Packages updated: ${updatedCount}`);
    console.log(`Packages skipped: ${skippedCount}`);
    console.log(`Errors encountered: ${errorCount}`);
    console.log(`Done.`);
    process.exit(0);
  } catch (err) {
    console.error('Error updating shownDeliveryCost for all packages:', err);
    process.exit(1);
  }
}

fixDeliveryCostForAllPackages(); 
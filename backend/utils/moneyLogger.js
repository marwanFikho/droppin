const { MoneyTransaction, Shop, User } = require('../models');
const { createNotification } = require('../controllers/notification.controller');

/**
 * Log a money transaction for a shop and notify the shop user
 * @param {number} shopId 
 * @param {number} amount Positive decimal amount
 * @param {'ToCollect'|'TotalCollected'|'settelled'|'Revenue'|'DriverCashOnHand'} attribute 
 * @param {'increase'|'decrease'} changeType
 * @param {string} [description]
 * @param {Transaction} [transaction] Optional transaction object
 */
const logMoneyTransaction = async (shopId, amount, attribute, changeType, description = null, transaction = null, opts = {}) => {
  try {
    if (!shopId || !amount) return;
    const payload = {
      shopId,
      amount: parseFloat(amount).toFixed(2),
      attribute,
      changeType,
      description
    };
    if (opts && opts.driverId) payload.driverId = opts.driverId;
    await MoneyTransaction.create(payload, transaction ? { transaction } : {});

    // Skip notifications for Revenue to avoid exposing admin-only revenue to shops
    if (attribute === 'Revenue' || attribute === 'DriverCashOnHand') {
      return;
    }

    const sendNotification = async () => {
      const shop = await Shop.findByPk(shopId);
      if (shop && shop.userId) {
        const shopUser = await User.findByPk(shop.userId);
        if (shopUser) {
          let title = 'Financial Update';
          let changeWord = changeType === 'increase' ? 'increased' : 'decreased';
          let attrLabel = attribute === 'ToCollect' ? 'To Collect' : (attribute === 'TotalCollected' ? 'Total Collected' : (attribute === 'Revenue' ? 'Revenue' : attribute));
          let msg = `Your shop's ${attrLabel} has ${changeWord} by $${parseFloat(amount).toFixed(2)}.`;
          if (description) msg += ` Reason: ${description}`;
          await createNotification({
            userId: shopUser.id,
            userType: 'shop',
            title,
            message: msg,
            data: { shopId, amount, attribute, changeType, description }
          });
        }
      }
    };

    // If we're inside a DB transaction, delay notification until after commit to avoid SQLITE_BUSY
    if (transaction && typeof transaction.afterCommit === 'function') {
      transaction.afterCommit(() => {
        // Fire and forget; do not await inside hook
        sendNotification().catch(() => {});
      });
    } else {
      await sendNotification();
    }
  } catch (err) {
    console.error('Failed to log money transaction or send notification:', err);
  }
};

module.exports = { logMoneyTransaction }; 
const { MoneyTransaction, Shop, User } = require('../models');
const { createNotification } = require('../controllers/notification.controller');

/**
 * Log a money transaction for a shop and notify the shop user
 * @param {number} shopId 
 * @param {number} amount Positive decimal amount
 * @param {'ToCollect'|'TotalCollected'|'settelled'} attribute 
 * @param {'increase'|'decrease'} changeType
 * @param {string} [description]
 * @param {Transaction} [transaction] Optional transaction object
 */
const logMoneyTransaction = async (shopId, amount, attribute, changeType, description = null, transaction = null) => {
  try {
    if (!shopId || !amount) return;
    await MoneyTransaction.create({
      shopId,
      amount: parseFloat(amount).toFixed(2),
      attribute,
      changeType,
      description
    }, transaction ? { transaction } : {});

    // Notify the shop user
    const shop = await Shop.findByPk(shopId);
    if (shop && shop.userId) {
      const shopUser = await User.findByPk(shop.userId);
      if (shopUser) {
        let title = 'Financial Update';
        let changeWord = changeType === 'increase' ? 'increased' : 'decreased';
        let attrLabel = attribute === 'ToCollect' ? 'To Collect' : (attribute === 'TotalCollected' ? 'Total Collected' : attribute);
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
  } catch (err) {
    console.error('Failed to log money transaction or send notification:', err);
  }
};

module.exports = { logMoneyTransaction }; 
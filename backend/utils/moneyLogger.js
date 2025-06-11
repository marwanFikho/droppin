const { MoneyTransaction, Shop } = require('../models');

/**
 * Log a money transaction for a shop
 * @param {number} shopId 
 * @param {number} amount Positive decimal amount
 * @param {'ToCollect'|'TotalCollected'} attribute 
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
  } catch (err) {
    console.error('Failed to log money transaction:', err);
  }
};

module.exports = { logMoneyTransaction }; 
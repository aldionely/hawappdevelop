export const calculateAdminFee = (amount, description, rules, transactionType = "in", adminCalculationAmount = null) => {
  const keywords = ["TOPUP", "NARIK", "TF", "TRANSFER", "TARIK"];
  const descriptionUpper = description.toUpperCase();
  
  const hasKeyword = keywords.some(keyword => descriptionUpper.startsWith(keyword));

  if (!hasKeyword) {
    return 0; 
  }

  const amountForFeeCalculation = transactionType === "out" && adminCalculationAmount !== null ? adminCalculationAmount : amount;

  for (const rule of rules) {
    if (amountForFeeCalculation >= rule.min_amount && amountForFeeCalculation <= rule.max_amount) {
      return rule.fee;
    }
  }
  
  return 0; 
};
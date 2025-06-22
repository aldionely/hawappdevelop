import { appBalanceKeysAndNames } from '@/lib/shiftConstants';

// PERUBAHAN: Fungsi sekarang menerima objek transaksi (tx) bukan hanya deskripsi
export const calculateProductAdminFee = (tx, products) => {
  // Gunakan tx.keyword jika ada, jika tidak (untuk data lama), gunakan tx.description
  const identifier = tx.keyword || tx.description;

  if (!identifier || !products || products.length === 0) {
    return { fee: 0, relatedAppKey: null, productName: null, costPrice: 0 };
  }
  
  const identifierUpper = identifier.toUpperCase();

  for (const product of products) {
    const productKeywordUpper = product.keyword.toUpperCase();
    const productNameUpper = product.name.toUpperCase();
    
    // Logika Pencocokan Baru:
    // 1. Prioritaskan pencocokan dengan KEYWORD
    // 2. Jika gagal, coba cocokkan dengan NAMA PRODUK (untuk kompatibilitas data lama)
    if (identifierUpper === productKeywordUpper || identifierUpper === productNameUpper) {
      return {
        fee: product.sell_price - product.cost_price, 
        relatedAppKey: product.related_app_key,
        productName: product.name,
        costPrice: product.cost_price 
      };
    }
  }
  return { fee: 0, relatedAppKey: null, productName: null, costPrice: 0 };
};

export const updateAppBalancesFromTransaction = (currentBalances, transaction, appBalanceDefinitions, productDetails = null) => {
  let newBalances = { ...currentBalances };
  const descUpper = transaction.description.toUpperCase();
  
  // Logika untuk topup/tarik tunai (tidak berubah)
  if (transaction.type === 'in' && transaction.saldoKeluarAplikasi && transaction.saldoKeluarAplikasi > 0) {
    for (const { key, name } of appBalanceDefinitions) {
      const appNameUpper = name.toUpperCase();
      if (descUpper.includes(appNameUpper) && (descUpper.includes("TOPUP") || descUpper.includes("TF") || descUpper.includes("TRANSFER") || descUpper.includes("ISI ULANG"))) {
        newBalances[key] = (newBalances[key] || 0) - transaction.saldoKeluarAplikasi;
        break; 
      }
    }
  } else if (transaction.type === 'out' && transaction.saldoMasukAplikasi && transaction.saldoMasukAplikasi > 0) {
    for (const { key, name } of appBalanceDefinitions) {
      const appNameUpper = name.toUpperCase();
      if (descUpper.includes(appNameUpper) && (descUpper.includes("NARIK") || descUpper.includes("TARIK"))) {
        newBalances[key] = (newBalances[key] || 0) + transaction.saldoMasukAplikasi;
        break;
      }
    }
  }
  
  // Logika untuk produk (tidak berubah, karena `productDetails` sudah dihitung dengan benar)
  if (productDetails && productDetails.relatedAppKey) {
    const specialAppKeysForCostPriceDeduction = ['BERKAT', 'RITA', 'ISIMPEL', 'SIDOMPUL', 'DIGIPOS'];
    
    if (newBalances.hasOwnProperty(productDetails.relatedAppKey)) {
      if (specialAppKeysForCostPriceDeduction.includes(productDetails.relatedAppKey.toUpperCase())) {
        newBalances[productDetails.relatedAppKey] = (newBalances[productDetails.relatedAppKey] || 0) - productDetails.costPrice;
      } else {
        if (productDetails.fee > 0) {
             newBalances[productDetails.relatedAppKey] = (newBalances[productDetails.relatedAppKey] || 0) - productDetails.fee;
        }
      }
    }
  }
  
  return newBalances;
};
// src/components/worker/ProductTab.jsx

import React, { useState, useMemo } from 'react';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, ArrowLeft } from 'lucide-react';

// Fungsi ini diletakkan di luar komponen untuk efisiensi
const sortByNameNumerically = (a, b) => {
  const numRegex = /[\d.]+/g;
  const nameA = a.name;
  const nameB = b.name;
  const numsA = nameA.match(numRegex)?.map(Number) || [];
  const numsB = nameB.match(numRegex)?.map(Number) || [];
  const minLength = Math.min(numsA.length, numsB.length);
  for (let i = 0; i < minLength; i++) {
    if (numsA[i] !== numsB[i]) {
      return numsA[i] - numsB[i];
    }
  }
  if (numsA.length !== numsB.length) {
    return numsA.length - numsB.length;
  }
  return nameA.localeCompare(nameB);
};

export const ProductTab = () => {
    const { products, sellProductAndUpdateShift, appBalanceKeysAndNames } = useData();
    const { toast } = useToast();
    const [filterCategory, setFilterCategory] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const getAppName = (appKey) => {
        if (!appKey) return 'Tidak Ada';
        const app = appBalanceKeysAndNames.find(a => a.key === appKey);
        return app ? app.name : 'Tidak Diketahui';
    };

    const categories = useMemo(() => {
        if (!products) return [];
        const uniqueCategories = new Set(products.map(p => p.category || 'Lainnya'));
        return Array.from(uniqueCategories).sort();
    }, [products]);

    // Logika untuk memfilter KATEGORI berdasarkan pencarian
    const filteredCategories = useMemo(() => {
        if (!searchTerm) return categories;
        return categories.filter(cat => cat.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [categories, searchTerm]);

    // Logika untuk mendapatkan PRODUK berdasarkan kategori yang dipilih
    const filteredProducts = useMemo(() => {
        if (!filterCategory) return [];
        return products.filter(p => (p.category || 'Lainnya') === filterCategory);
    }, [products, filterCategory]);

    const handleSellProduct = async (product) => {
        const result = await sellProductAndUpdateShift(product);
        if (result.success) {
            toast({ title: 'Produk Terjual!', description: `${product.name} telah tercatat sebagai transaksi.` });
        } else {
            toast({ variant: 'destructive', title: 'Gagal Menjual', description: result.error || 'Terjadi kesalahan.' });
        }
    };
    
    // Fungsi ini sekarang akan tersedia di seluruh komponen
    const handleBackToCategories = () => {
        setFilterCategory('');
        setSearchTerm(''); // Reset pencarian saat kembali
    };

    return (
        <div className="space-y-4 max-h-[calc(100vh-250px)] overflow-y-auto pr-2">
            
            {!filterCategory ? (
                // TAMPILAN 1: TAMPILAN KARTU KATEGORI
                <div>
                    <h3 className="text-base font-semibold text-center my-2 mb-4">Pilih Kategori Produk</h3>
                    {/* Bar pencarian untuk kategori */}
                    <div className="relative flex-grow mb-4">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Cari kategori..."
                            className="w-full pl-8"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    {filteredCategories.length === 0 ? (
                        <p className="text-center text-gray-500 pt-10">Kategori tidak ditemukan.</p>
                    ) : (
                        <div className="grid grid-cols-2 gap-3">
                            {filteredCategories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => {
                                        setFilterCategory(cat);
                                        setSearchTerm(''); // Reset search term saat kategori dipilih
                                    }}
                                    className="p-4 border rounded-lg bg-white text-center font-semibold text-sm shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors duration-150"
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

            ) : (
                // TAMPILAN 2: TAMPILAN PRODUK DALAM KATEGORI
                <div>
                    <Button variant="outline" size="sm" onClick={handleBackToCategories} className="mb-4 w-full">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Kembali ke Semua Kategori
                    </Button>
                    
                    <h3 className="text-lg font-bold text-center mb-4">{filterCategory}</h3>

                    {filteredProducts.length === 0 ? (
                        <p className="text-center text-gray-500 pt-10">Tidak ada produk di kategori ini.</p>
                    ) : (
                        <div className="grid grid-cols-2 gap-3">
                            {filteredProducts.sort(sortByNameNumerically).map(product => (
                                <div key={product.id} className="p-3 border rounded-lg bg-white flex flex-col items-start space-y-2 shadow-sm">
                                    <div className="w-full">
                                        <p className="font-semibold text-sm truncate" title={product.name}>{product.name}</p>
                                        <p className="text-xs text-gray-500">Kode: {product.keyword}</p>
                                        <p className="text-xs text-gray-500">Aplikasi: {getAppName(product.related_app_key)}</p>
                                    </div>
                                    <div className="w-full flex justify-between items-center mt-auto pt-2 border-t">
                                        <p className="font-semibold text-xs">Rp {product.sell_price.toLocaleString()}</p>
                                        <Button size="sm" className="h-7 text-xs px-3" onClick={() => handleSellProduct(product)}>Jual</Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
// src/components/admin/tabs/ProductsTab.jsx (MODIFIED)

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Edit3, PlusCircle, Search, ArrowLeft } from 'lucide-react'; // Import Search and ArrowLeft
import { formatNumberInput, parseFormattedNumber } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Komponen Form dipisahkan agar lebih rapi
const ProductForm = ({ product, onSave, onCancel }) => {
  const { appBalanceKeysAndNames } = useData();
  const [name, setName] = useState(product ? product.name || '' : '');
  const [keyword, setKeyword] = useState(product ? product.keyword || '' : '');
  const [category, setCategory] = useState(product ? product.category || '' : '');
  const [costPrice, setCostPrice] = useState(product ? String(product.cost_price) : "");
  const [displayCostPrice, setDisplayCostPrice] = useState(product ? formatNumberInput(String(product.cost_price)) : "");
  const [sellPrice, setSellPrice] = useState(product ? String(product.sell_price) : "");
  const [displaySellPrice, setDisplaySellPrice] = useState(product ? formatNumberInput(String(product.sell_price)) : "");
  const [relatedAppKey, setRelatedAppKey] = useState(product && product.related_app_key ? product.related_app_key : "NONE");
  const { toast } = useToast();

  const handleCostPriceChange = (e) => {
    const value = e.target.value;
    setCostPrice(parseFormattedNumber(value));
    setDisplayCostPrice(formatNumberInput(value));
  };
  const handleSellPriceChange = (e) => {
    const value = e.target.value;
    setSellPrice(parseFormattedNumber(value));
    setDisplaySellPrice(formatNumberInput(value));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !keyword.trim() || !category.trim()) {
      toast({ variant: "destructive", title: "Error", description: "Nama, Kata Kunci, dan Kategori produk harus diisi." });
      return;
    }
    const numCostPrice = parseFloat(costPrice);
    const numSellPrice = parseFloat(sellPrice);

    if (isNaN(numCostPrice) || isNaN(numSellPrice)) {
      toast({ variant: "destructive", title: "Error", description: "Harga modal dan harga jual harus angka." });
      return;
    }
    if (numCostPrice < 0 || numSellPrice < 0) {
      toast({ variant: "destructive", title: "Error", description: "Harga tidak boleh negatif." });
      return;
    }

    onSave({
      name,
      keyword: keyword.toUpperCase(),
      category: category.toUpperCase(),
      cost_price: numCostPrice,
      sell_price: numSellPrice,
      related_app_key: relatedAppKey === "NONE" ? null : relatedAppKey,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Input type="text" placeholder="Nama Produk" value={name} onChange={(e) => setName(e.target.value)} required className="text-xs sm:text-sm" />
      <Input type="text" placeholder="Kata Kunci Produk (unik, huruf besar)" value={keyword} onChange={(e) => setKeyword(e.target.value.toUpperCase())} required className="text-xs sm:text-sm" />
      <Input type="text" placeholder="Kategori Produk (e.g. DIAMOND FF)" value={category} onChange={(e) => setCategory(e.target.value)} required className="text-xs sm:text-sm" />
      <Input type="text" placeholder="Harga Modal (Rp)" value={displayCostPrice} onChange={handleCostPriceChange} required className="text-xs sm:text-sm" />
      <Input type="text" placeholder="Harga Jual (Rp)" value={displaySellPrice} onChange={handleSellPriceChange} required className="text-xs sm:text-sm" />
      <Select value={relatedAppKey} onValueChange={setRelatedAppKey}>
        <SelectTrigger className="w-full text-xs sm:text-sm">
          <SelectValue placeholder="Pilih Aplikasi Terkait (Opsional)" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="NONE">Tidak Ada</SelectItem>
          {appBalanceKeysAndNames.map(app => (
            <SelectItem key={app.key} value={app.key}>{app.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline" size="sm" onClick={onCancel}>Batal</Button>
        </DialogClose>
        <Button type="submit" size="sm">Simpan Produk</Button>
      </DialogFooter>
    </form>
  );
};


// Fungsi pengurutan diletakkan di luar agar tidak dibuat ulang setiap render
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

export const ProductsTab = () => {
  const { products, addProduct, updateProduct, removeProduct, appBalanceKeysAndNames } = useData();
  const { toast } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [filterCategory, setFilterCategory] = useState(''); // Changed to empty string for initial state
  const [searchTerm, setSearchTerm] = useState("");

  // Ref untuk kontainer scroll
  const scrollContainerRef = useRef(null);
  const scrollPositionRef = useRef(null);

  // useEffect untuk mengembalikan posisi scroll
  useEffect(() => {
    if (scrollContainerRef.current && scrollPositionRef.current !== null) {
      scrollContainerRef.current.scrollTop = scrollPositionRef.current;
      scrollPositionRef.current = null;
    }
  }, [products]); // Dijalankan saat daftar produk berubah

  const getAppName = (appKey) => {
    if (!appKey || appKey === "NONE") return 'Tidak Ada';
    const app = appBalanceKeysAndNames.find(a => a.key === appKey);
    return app ? app.name : 'Tidak Diketahui';
  };

  const categories = useMemo(() => {
    if (!products) return [];
    const uniqueCategories = new Set(products.map(p => p.category || 'Lainnya'));
    return Array.from(uniqueCategories).sort();
  }, [products]);

  // New Memo: Filter categories based on search term
  const filteredCategories = useMemo(() => {
    if (!searchTerm) return categories;
    return categories.filter(cat => cat.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [categories, searchTerm]);

  const filteredProducts = useMemo(() => {
    if (!filterCategory) return []; // No category selected, no products to show yet
    let results = products.filter(p => (p.category || 'Lainnya') === filterCategory);
    if (searchTerm) {
      results = results.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.keyword.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return results;
  }, [products, filterCategory, searchTerm]);

  const handleSaveProduct = async (productData) => {
    if (editingProduct && scrollContainerRef.current) {
        scrollPositionRef.current = scrollContainerRef.current.scrollTop;
    }

    const existingProductWithKeyword = products.find(p => p.keyword === productData.keyword && (!editingProduct || p.id !== editingProduct.id));
    if (existingProductWithKeyword) {
        toast({ variant: "destructive", title: "Gagal", description: "Kata kunci produk sudah digunakan." });
        return;
    }

    const result = editingProduct
      ? await updateProduct(editingProduct.id, productData)
      : await addProduct(productData);

    if (result.success) {
      toast({ title: "Berhasil", description: `Produk telah ${editingProduct ? 'diperbarui' : 'ditambahkan'}.` });
      setIsFormOpen(false);
      setEditingProduct(null);
      // After saving, if we were viewing a category, re-select it to show updated list
      if (filterCategory) {
        setFilterCategory(filterCategory); 
      }
    } else {
      toast({ variant: "destructive", title: "Gagal", description: result.error?.message || "Terjadi kesalahan." });
    }
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setIsFormOpen(true);
  };

  const handleAddNewProduct = () => {
    setEditingProduct(null);
    setIsFormOpen(true);
  };

  const handleDeleteProduct = async (productId) => {
    const result = await removeProduct(productId);
    if (result.success) {
      toast({ title: "Berhasil", description: "Produk telah dihapus." });
    } else {
      toast({ variant: "destructive", title: "Gagal", description: result.error?.message || "Terjadi kesalahan." });
    }
  };
  
  const specialAppKeysForCostPriceDeduction = ['BERKAT', 'RITA', 'ISIMPEL', 'SIDOMPUL', 'DIGIPOS'];

  const handleBackToCategories = () => {
    setFilterCategory('');
    setSearchTerm(''); // Reset search term when going back
  };


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-md sm:text-lg font-semibold">Manajemen Produk</h2>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={handleAddNewProduct} className="text-xs">
              <PlusCircle size={16} className="mr-2" /> Tambah Produk Baru
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}</DialogTitle>
            </DialogHeader>
            <ProductForm
              product={editingProduct}
              onSave={handleSaveProduct}
              onCancel={() => { setIsFormOpen(false); setEditingProduct(null); }}
            />
          </DialogContent>
        </Dialog>
      </div>

        {!filterCategory ? (
            // DISPLAY CATEGORIES
            <div>
                <h3 className="text-base font-semibold text-center my-2 mb-4">Pilih Kategori Produk</h3>
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
                    <div className="grid grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-2">
                        {filteredCategories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => {
                                    setFilterCategory(cat);
                                    setSearchTerm(''); // Clear search when category is selected
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
            // DISPLAY PRODUCTS IN SELECTED CATEGORY
            <div>
                <Button variant="outline" size="sm" onClick={handleBackToCategories} className="mb-4 w-full">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Kembali ke Semua Kategori
                </Button>

                <h3 className="text-lg font-bold text-center mb-4">{filterCategory}</h3>
                
                <div className="relative flex-grow mb-4">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder={`Cari produk di ${filterCategory}...`}
                        className="w-full pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {filteredProducts.length === 0 ? (
                    <p className="text-center text-gray-500 pt-10">Tidak ada produk di kategori ini yang cocok dengan pencarian.</p>
                ) : (
                    <div ref={scrollContainerRef} className="space-y-2 max-h-[60vh] overflow-y-auto pr-2">
                        {filteredProducts
                            .sort(sortByNameNumerically)
                            .map((product) => {
                            const profit = product.sell_price - product.cost_price;
                            let deductionText = null;
                            if (product.related_app_key) {
                                const isSpecialKey = specialAppKeysForCostPriceDeduction.includes(product.related_app_key.toUpperCase());
                                if (isSpecialKey) {
                                deductionText = "(Saldo App dikurangi Modal)";
                                } else if (profit > 0) {
                                deductionText = "(Saldo App dikurangi Profit)";
                                }
                            }
                            return (
                                <div key={product.id} className="flex items-center justify-between p-2 sm:p-3 border rounded-lg bg-white text-xs sm:text-sm">
                                <div>
                                    <p className="font-semibold">{product.name}</p>
                                    <p className="text-gray-600">Kata Kunci: {product.keyword}</p>
                                    <p className="text-gray-500">Modal: Rp {product.cost_price.toLocaleString()} | Jual: Rp {product.sell_price.toLocaleString()}</p>
                                    <p className="text-teal-600 font-medium">Profit (Admin Kas): Rp {profit.toLocaleString()}</p>
                                    <p className="text-blue-500">Aplikasi Terkait: {getAppName(product.related_app_key)}
                                    {deductionText && <span className="text-orange-500 ml-1">{deductionText}</span>}
                                    </p>
                                </div>
                                <div className="flex items-center space-x-1 sm:space-x-2">
                                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handleEditProduct(product)}>
                                    <Edit3 size={14} />
                                    </Button>
                                    <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive" size="icon" className="h-7 w-7">
                                        <Trash2 size={14} />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                        <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Tindakan ini akan menghapus produk "{product.name}" secara permanen.
                                        </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                        <AlertDialogCancel>Batal</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDeleteProduct(product.id)} className="bg-red-600 hover:bg-red-700">
                                            Hapus
                                        </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        )}

       <div className="mt-4 p-3 border rounded-lg bg-gray-50 text-xs text-gray-600">
        <p className="font-semibold mb-1">Cara Kerja Admin & Saldo Aplikasi dari Produk:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Profit (Harga Jual - Harga Modal) akan <strong>selalu menambah Total Admin Shift</strong> (masuk ke kas).</li>
          <li>Jika produk terkait dengan aplikasi <strong>BERKAT, RITA, ISIMPEL, SIDOMPUL, atau DIGIPOS</strong>: Saldo aplikasi tersebut akan <strong>dikurangi sebesar Harga Modal</strong> produk.</li>
          <li>Jika produk terkait dengan aplikasi <strong>lainnya</strong> (misal DANA, BCA): Saldo aplikasi tersebut akan dikurangi sebesar <strong>HARGA JUAL</strong> (jika harga jual lebih dari 0).</li>
          <li>Pastikan kata kunci unik.</li>
        </ul>
      </div>
    </div>
  );
};
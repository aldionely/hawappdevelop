import React, { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Edit3, PlusCircle } from 'lucide-react';
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

const ProductForm = ({ product, onSave, onCancel }) => {
  const { appBalanceKeysAndNames } = useData();
  const [name, setName] = useState(product ? product.name : "");
  const [keyword, setKeyword] = useState(product ? product.keyword : "");
  const [costPrice, setCostPrice] = useState(product ? product.cost_price : "");
  const [displayCostPrice, setDisplayCostPrice] = useState(product ? formatNumberInput(String(product.cost_price)) : "");
  const [sellPrice, setSellPrice] = useState(product ? product.sell_price : "");
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
    if (!name.trim() || !keyword.trim()) {
      toast({ variant: "destructive", title: "Error", description: "Nama produk dan kata kunci harus diisi." });
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
      cost_price: numCostPrice, 
      sell_price: numSellPrice,
      related_app_key: relatedAppKey === "NONE" ? null : relatedAppKey, 
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Input type="text" placeholder="Nama Produk" value={name} onChange={(e) => setName(e.target.value)} required className="text-xs sm:text-sm" />
      <Input type="text" placeholder="Kata Kunci Produk (unik, huruf besar)" value={keyword} onChange={(e) => setKeyword(e.target.value.toUpperCase())} required className="text-xs sm:text-sm" />
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

export const ProductsTab = () => {
  const { products, addProduct, updateProduct, removeProduct, appBalanceKeysAndNames } = useData();
  const { toast } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const getAppName = (appKey) => {
    if (!appKey || appKey === "NONE") return 'Tidak Ada';
    const app = appBalanceKeysAndNames.find(a => a.key === appKey);
    return app ? app.name : 'Tidak Diketahui';
  };

  const handleSaveProduct = async (productData) => {
    let result;
    const existingProductWithKeyword = products.find(p => p.keyword === productData.keyword && (!editingProduct || p.id !== editingProduct.id));
    if (existingProductWithKeyword) {
        toast({ variant: "destructive", title: "Gagal", description: "Kata kunci produk sudah digunakan." });
        return;
    }

    if (editingProduct) {
      result = await updateProduct(editingProduct.id, productData);
    } else {
      result = await addProduct(productData);
    }

    if (result.success) {
      toast({ title: "Berhasil", description: `Produk telah ${editingProduct ? 'diperbarui' : 'ditambahkan'}.` });
      setIsFormOpen(false);
      setEditingProduct(null);
    } else {
      toast({ variant: "destructive", title: "Gagal", description: result.error || "Terjadi kesalahan." });
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
      toast({ variant: "destructive", title: "Gagal", description: result.error || "Terjadi kesalahan." });
    }
  };
  
  const specialAppKeysForCostPriceDeduction = ['BERKAT', 'RITA', 'ISIMPEL', 'SIDOMPUL', 'DIGIPOS'];

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

      {products.length === 0 ? (
        <p className="text-center text-gray-500 py-4 text-xs sm:text-sm">Belum ada produk.</p>
      ) : (
        <div className="space-y-2">
          {products.map((product) => (
            <div key={product.id} className="flex items-center justify-between p-2 sm:p-3 border rounded-lg bg-white text-xs sm:text-sm">
              <div>
                <p className="font-semibold">{product.name}</p>
                <p className="text-gray-600">Kata Kunci: {product.keyword}</p>
                <p className="text-gray-500">Modal: Rp {product.cost_price.toLocaleString()} | Jual: Rp {product.sell_price.toLocaleString()}</p>
                <p className="text-teal-600 font-medium">Profit (Admin Kas): Rp {(product.sell_price - product.cost_price).toLocaleString()}</p>
                <p className="text-blue-500">Aplikasi Terkait: {getAppName(product.related_app_key)}
                  {product.related_app_key && specialAppKeysForCostPriceDeduction.includes(product.related_app_key.toUpperCase()) && 
                    <span className="text-orange-500 ml-1">(Saldo App dikurangi Modal)</span>
                  }
                  {product.related_app_key && !specialAppKeysForCostPriceDeduction.includes(product.related_app_key.toUpperCase()) && product.sell_price - product.cost_price > 0 &&
                     <span className="text-orange-500 ml-1">(Saldo App dikurangi Profit)</span>
                  }
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
          ))}
        </div>
      )}
       <div className="mt-4 p-3 border rounded-lg bg-gray-50 text-xs text-gray-600">
        <p className="font-semibold mb-1">Cara Kerja Admin & Saldo Aplikasi dari Produk:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Profit (Harga Jual - Harga Modal) akan <strong>selalu menambah Total Admin Shift</strong> (masuk ke kas).</li>
          <li>Jika produk terkait dengan aplikasi <strong>BERKAT, RITA, ISIMPEL, SIDOMPUL, atau DIGIPOS</strong>: Saldo aplikasi tersebut akan <strong>dikurangi sebesar Harga Modal</strong> produk.</li>
          <li>Jika produk terkait dengan aplikasi <strong>lainnya</strong> (misal DANA, BCA): Saldo aplikasi tersebut akan <strong>dikurangi sebesar Profit</strong> (jika profit > 0).</li>
          <li>Pastikan kata kunci unik.</li>
        </ul>
      </div>
    </div>
  );
};
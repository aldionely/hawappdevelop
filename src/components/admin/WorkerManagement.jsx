import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Edit3, Eye, EyeOff, Save } from 'lucide-react';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";

export const WorkerManagement = ({ workers, newWorker, setNewWorker, onAddWorker, onRemoveWorker, onUpdatePassword }) => {
  const [editingWorkerId, setEditingWorkerId] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState({});

  const handleEditPassword = (workerId) => {
    setEditingWorkerId(workerId);
    setNewPassword(""); 
  };

  const handleSavePassword = async () => {
    if (editingWorkerId && newPassword) {
      const success = await onUpdatePassword(editingWorkerId, newPassword);
      if (success) {
        setEditingWorkerId(null);
        setNewPassword("");
      }
    }
  };

  const toggleShowPassword = (workerId) => {
    setShowPassword(prev => ({ ...prev, [workerId]: !prev[workerId] }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-md sm:text-lg font-semibold mb-3">Tambah Pekerja Baru</h2>
        <form onSubmit={onAddWorker} className="space-y-3 p-3 border rounded-lg bg-white">
          <Input
            type="text"
            placeholder="Nama Lengkap Pekerja"
            value={newWorker.name}
            onChange={(e) => setNewWorker({ ...newWorker, name: e.target.value })}
            className="text-xs sm:text-sm"
          />
          <Input
            type="text"
            placeholder="Username"
            value={newWorker.username}
            onChange={(e) => setNewWorker({ ...newWorker, username: e.target.value })}
            className="text-xs sm:text-sm"
          />
          <Input
            type="password"
            placeholder="Password"
            value={newWorker.password}
            onChange={(e) => setNewWorker({ ...newWorker, password: e.target.value })}
            className="text-xs sm:text-sm"
          />
          <Button type="submit" size="sm" className="text-xs">Tambah Pekerja</Button>
        </form>
      </div>

      <div>
        <h2 className="text-md sm:text-lg font-semibold mb-3">Daftar Pekerja</h2>
        {workers.length === 0 ? (
          <p className="text-center text-gray-500 py-4 text-xs sm:text-sm">Belum ada pekerja terdaftar.</p>
        ) : (
          <div className="space-y-2">
            {workers.map((worker) => (
              <div key={worker.id} className="flex items-center justify-between p-2 sm:p-3 border rounded-lg bg-white text-xs sm:text-sm">
                <div>
                  <p className="font-semibold">{worker.name}</p>
                  <p className="text-gray-600">Username: {worker.username}</p>
                  <div className="flex items-center mt-1">
                    <p className="text-gray-600 mr-2">Password: {showPassword[worker.id] ? worker.password : '••••••••'}</p>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-500 hover:text-blue-600" onClick={() => toggleShowPassword(worker.id)}>
                      {showPassword[worker.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                    </Button>
                  </div>
                </div>
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handleEditPassword(worker.id)}>
                        <Edit3 size={14} />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Password untuk {worker.name}</DialogTitle>
                      </DialogHeader>
                      <div className="py-4">
                        <Input
                          type="password"
                          placeholder="Password Baru"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                        />
                      </div>
                      <DialogFooter>
                        <DialogClose asChild>
                           <Button variant="outline" size="sm">Batal</Button>
                        </DialogClose>
                        <Button onClick={handleSavePassword} size="sm">Simpan Password</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  
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
                          Tindakan ini akan menghapus pekerja {worker.name} dan semua data shift terkait secara permanen.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={() => onRemoveWorker(worker.id)} className="bg-red-600 hover:bg-red-700">
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
      </div>
    </div>
  );
};
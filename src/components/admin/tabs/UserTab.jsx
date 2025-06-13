import React, { useState } from "react";
import { useData } from "@/contexts/DataContext";
import { useToast } from "@/components/ui/use-toast";
import { WorkerManagement } from "@/components/admin/WorkerManagement";

export const UserTab = () => {
  const { workers, addWorker, removeWorker, updateWorkerPassword } = useData();
  const { toast } = useToast();
  const [newWorker, setNewWorker] = useState({
    username: "",
    password: "",
    name: "",
  });

  const handleAddWorker = async (e) => {
    e.preventDefault();
    if (!newWorker.username || !newWorker.password || !newWorker.name) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Semua field harus diisi",
      });
      return;
    }

    if (workers.some(w => w.username === newWorker.username)) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Username sudah digunakan",
      });
      return;
    }

    const result = await addWorker(newWorker);
    if (result.success) {
      setNewWorker({ username: "", password: "", name: "" });
      toast({
        title: "Berhasil",
        description: "Pekerja baru telah ditambahkan",
      });
    } else {
      toast({
        variant: "destructive",
        title: "Gagal Menambahkan Pekerja",
        description: result.error || "Terjadi kesalahan.",
      });
    }
  };

  const handleRemoveWorker = async (workerId) => {
    const result = await removeWorker(workerId);
    if (result.success) {
      toast({
        title: "Berhasil",
        description: "Pekerja telah dihapus",
      });
    } else {
      toast({
        variant: "destructive",
        title: "Gagal Menghapus Pekerja",
        description: result.error || "Terjadi kesalahan.",
      });
    }
  };

  const handleUpdatePassword = async (workerId, newPassword) => {
    if (!newPassword) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Password baru tidak boleh kosong.",
      });
      return false;
    }
    const result = await updateWorkerPassword(workerId, newPassword);
    if (result.success) {
      toast({
        title: "Berhasil",
        description: "Password pekerja telah diperbarui.",
      });
      return true;
    } else {
      toast({
        variant: "destructive",
        title: "Gagal Memperbarui Password",
        description: result.error || "Terjadi kesalahan.",
      });
      return false;
    }
  };


  return (
    <WorkerManagement
      workers={workers}
      newWorker={newWorker}
      setNewWorker={setNewWorker}
      onAddWorker={handleAddWorker}
      onRemoveWorker={handleRemoveWorker}
      onUpdatePassword={handleUpdatePassword}
    />
  );
};
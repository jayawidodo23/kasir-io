"use client";

import type React from "react";

import { useState } from "react";
import { LucideIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { verifyPin, setPin, clearSession } from "@/lib/auth";
import { Lock, Check, X } from "lucide-react";
import { useRouter } from "next/navigation";

export default function GantiPinPage() {
  const router = useRouter();
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    // Verify current PIN
    if (!verifyPin(currentPin)) {
      setError("PIN lama salah");
      return;
    }

    // Validate new PIN
    if (newPin.length < 4) {
      setError("PIN baru minimal 4 digit");
      return;
    }

    if (newPin !== confirmPin) {
      setError("Konfirmasi PIN tidak cocok");
      return;
    }

    // Save new PIN
    setPin(newPin);
    setSuccess(true);

    // Clear form
    setCurrentPin("");
    setNewPin("");
    setConfirmPin("");

    // Clear session and redirect after 2 seconds
    setTimeout(() => {
      clearSession();
      router.push("/");
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ganti PIN"
        description="Ubah PIN keamanan aplikasi"
        icon={Lock}
      />

      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Keamanan Aplikasi</CardTitle>
            <CardDescription>
              PIN digunakan untuk melindungi akses ke aplikasi kasir
            </CardDescription>
          </CardHeader>
          <CardContent>
            {success ? (
              <div className="flex items-center gap-3 p-4 bg-green-500/10 text-green-600 rounded-lg">
                <Check className="w-5 h-5" />
                <div>
                  <p className="font-medium">PIN berhasil diubah!</p>
                  <p className="text-sm">
                    Anda akan diarahkan untuk login ulang...
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="flex items-center gap-3 p-4 bg-red-500/10 text-red-600 rounded-lg">
                    <X className="w-5 h-5" />
                    <p>{error}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="currentPin">PIN Lama</Label>
                  <Input
                    id="currentPin"
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="Masukkan PIN lama"
                    value={currentPin}
                    onChange={(e) => setCurrentPin(e.target.value)}
                    className="text-lg tracking-widest"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPin">PIN Baru</Label>
                  <Input
                    id="newPin"
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="Masukkan PIN baru"
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    className="text-lg tracking-widest"
                    required
                    minLength={4}
                  />
                  <p className="text-sm text-muted-foreground">
                    Minimal 4 digit
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPin">Konfirmasi PIN Baru</Label>
                  <Input
                    id="confirmPin"
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="Masukkan ulang PIN baru"
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value)}
                    className="text-lg tracking-widest"
                    required
                    minLength={4}
                  />
                </div>

                <Button type="submit" className="w-full" size="lg">
                  Ubah PIN
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface PageHeaderProps {
  title: string;
  description: string;
  icon?: LucideIcon;
}

export function PageHeader({
  title,
  description,
  icon: Icon,
}: PageHeaderProps) {
  return (
    <div className="flex items-center gap-3">
      {Icon && <Icon className="w-8 h-8" />}
      <div>
        <h1 className="text-3xl font-bold">{title}</h1>
        <p className="text-gray-600">{description}</p>
      </div>
    </div>
  );
}

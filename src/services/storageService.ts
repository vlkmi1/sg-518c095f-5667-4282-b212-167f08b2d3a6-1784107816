import { supabase } from "@/integrations/supabase/client";

export interface UploadResult {
  url: string | null;
  path: string | null;
  error: Error | null;
}

// Image compression utility
async function compressImage(file: File, maxWidth: number = 1920, quality: number = 0.8): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        // Resize if needed
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas context not available"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error("Image compression failed"));
            }
          },
          "image/jpeg",
          quality
        );
      };
      img.onerror = () => reject(new Error("Image loading failed"));
    };
    reader.onerror = () => reject(new Error("File reading failed"));
  });
}

export const storageService = {
  // Upload catch image with automatic compression
  async uploadCatchImage(file: File, userId: string): Promise<UploadResult> {
    try {
      // Compress image before upload
      const compressedBlob = await compressImage(file, 1920, 0.85);
      
      // Generate unique filename
      const fileExt = "jpg"; // Always save as JPEG after compression
      const fileName = `${userId}/${Date.now()}.${fileExt}`;
      const filePath = `catches/${fileName}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from("catches")
        .upload(filePath, compressedBlob, {
          contentType: "image/jpeg",
          upsert: false,
        });

      if (error) {
        console.error("Upload error:", error);
        return { url: null, path: null, error };
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("catches")
        .getPublicUrl(data.path);

      return { url: publicUrl, path: data.path, error: null };
    } catch (error) {
      console.error("Storage error:", error);
      return { 
        url: null, 
        path: null, 
        error: error instanceof Error ? error : new Error("Unknown error") 
      };
    }
  },

  // Delete catch image
  async deleteCatchImage(path: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase.storage
        .from("catches")
        .remove([path]);

      if (error) {
        console.error("Delete error:", error);
        return { error };
      }

      return { error: null };
    } catch (error) {
      console.error("Storage error:", error);
      return { 
        error: error instanceof Error ? error : new Error("Unknown error") 
      };
    }
  },

  // Get geolocation
  async getCurrentLocation(): Promise<{ latitude: number; longitude: number } | null> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        console.warn("Geolocation not supported");
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.warn("Geolocation error:", error);
          resolve(null);
        }
      );
    });
  },

  // Upload catch photo
  async uploadCatchPhoto(file: File, userId: string): Promise<{ url: string; path: string }> {
    try {
      // Validate file
      if (!file.type.startsWith("image/")) {
        throw new Error("Soubor musí být obrázek");
      }

      // Check file size (max 10MB)
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        throw new Error("Soubor je příliš velký (max 10MB)");
      }

      console.log("Upload starting:", {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        userId
      });

      // Generate unique filename
      const fileExt = file.name.split(".").pop();
      const fileName = `${userId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

      console.log("Generated path:", fileName);

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from("catches")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      console.log("Upload result:", { data, error });

      if (error) {
        console.error("Storage upload error:", error);
        throw new Error(`Chyba při nahrávání: ${error.message}`);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("catches")
        .getPublicUrl(fileName);

      console.log("Public URL:", urlData.publicUrl);

      return {
        url: urlData.publicUrl,
        path: fileName,
      };
    } catch (error: any) {
      console.error("uploadCatchPhoto error:", error);
      throw error;
    }
  },

  // Upload avatar/profile picture
  async uploadAvatar(file: File, userId: string): Promise<{ url: string; path: string }> {
    try {
      // Compress and resize image
      const compressedFile = await storageService.compressImage(file, 400, 400, 0.8);
      
      // Generate unique filename
      const fileExt = file.name.split(".").pop();
      const fileName = `${userId}_${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("catches")
        .upload(filePath, compressedFile);

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data } = supabase.storage
        .from("catches")
        .getPublicUrl(filePath);

      console.log("uploadAvatar success:", { url: data.publicUrl, path: filePath });
      return { url: data.publicUrl, path: filePath };
    } catch (error) {
      console.error("uploadAvatar error:", error);
      throw error;
    }
  },

  // Delete avatar
  async deleteAvatar(filePath: string): Promise<void> {
    try {
      const { error } = await supabase.storage
        .from("catches")
        .remove([filePath]);

      if (error) {
        throw error;
      }

      console.log("deleteAvatar success:", filePath);
    } catch (error) {
      console.error("deleteAvatar error:", error);
      throw error;
    }
  },
};
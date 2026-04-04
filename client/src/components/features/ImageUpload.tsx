// src/components/features/ImageUpload.tsx
import { Upload } from 'lucide-react';

interface Props {
  onUploadSuccess: (url: string) => void;
}

export default function ImageUpload({ onUploadSuccess }: Props) {
  const uploadWidget = () => {
    // @ts-ignore
    window.cloudinary.openUploadWidget(
      {
        cloudName: "dpje4d7xa", // 🟢 Ton vrai Cloud Name récupéré
        uploadPreset: "spaceauto24", // 🟢 Ton preset tout neuf
        sources: ["local", "camera", "url"],
        multiple: false,
        cropping: true, // Optionnel: permet au vendeur de recadrer la photo
        styles: {
          palette: {
            window: "#FFFFFF",
            sourceBg: "#F4F4F5",
            windowBorder: "#90A0B3",
            tabIcon: "#0078FF",
            inactiveTabIcon: "#69778A",
            menuIcons: "#0078FF",
            link: "#0078FF",
            action: "#FF6200", // Orange SpaceAuto24
            inProgress: "#0078FF",
            complete: "#20B832",
            error: "#EA2727",
            textDark: "#000000",
            textLight: "#FFFFFF"
          }
        }
      },
      (error: any, result: any) => {
        if (!error && result && result.event === "success") {
          const imageUrl = result.info.secure_url;
          console.log("Image uploadée avec succès :", imageUrl);
          onUploadSuccess(imageUrl);
        }
      }
    );
  };

  return (
    <button
      type="button"
      onClick={uploadWidget}
      className="w-full h-40 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center gap-3 hover:border-blue-500 hover:bg-blue-50 transition-all group"
    >
      <div className="bg-gray-100 p-4 rounded-full group-hover:bg-blue-100 transition-colors">
        <Upload className="w-8 h-8 text-gray-400 group-hover:text-blue-600" />
      </div>
      <div className="text-center">
        <span className="block text-sm font-bold text-gray-700">Ajouter une photo</span>
        <span className="text-xs text-gray-400">PNG, JPG jusqu'à 10MB</span>
      </div>
    </button>
  );
}
import { useRef, useState } from "react";

interface Props {
  initialPhoto?: File | null;
  initialPreview?: string | null;
  onNext: (photo: File, preview: string) => void;
  onBack: () => void;
}

export function StepPhoto({ initialPhoto, initialPreview, onNext, onBack }: Props) {
  const [photo, setPhoto] = useState<File | null>(initialPhoto ?? null);
  const [preview, setPreview] = useState<string | null>(initialPreview ?? null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Veuillez sélectionner une image (JPG, PNG, HEIC…)");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setError("L'image est trop lourde (max 20 MB avant compression)");
      return;
    }
    setError("");
    setPhoto(file);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  const handleNext = () => {
    if (!photo || !preview) {
      setError("Veuillez ajouter une photo du problème.");
      return;
    }
    onNext(photo, preview);
  };

  return (
    <>
      <div className="field-group">
        {preview ? (
          <div
            className="upload-zone has-preview"
            onClick={() => galleryRef.current?.click()}
          >
            <div className="photo-preview-wrapper">
              <img src={preview} alt="Aperçu" className="photo-preview" />
              <div className="photo-overlay">
                <span>Changer la photo</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="photo-choices">
            <button
              className="photo-choice-btn photo-choice-camera"
              onClick={() => cameraRef.current?.click()}
              type="button"
            >
              <span className="photo-choice-icon">📷</span>
              <span className="photo-choice-label">Prendre une photo</span>
            </button>

            <div className="photo-choice-separator">
              <span className="photo-choice-line" />
              <span className="photo-choice-or">ou</span>
              <span className="photo-choice-line" />
            </div>

            <div
              className={`upload-zone ${dragOver ? "dragover" : ""}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => galleryRef.current?.click()}
            >
              <div className="upload-icon-wrapper">🖼️</div>
              <div className="upload-text">
                Choisir depuis la <strong>galerie</strong>
              </div>
              <div className="upload-hint">JPG, PNG, HEIC · max 20 MB</div>
            </div>
          </div>
        )}

        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          style={{ display: "none" }}
          onChange={handleInputChange}
        />
        <input
          ref={galleryRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleInputChange}
        />
      </div>

      {error && <p className="field-error">{error}</p>}
      {photo && (
        <p className="photo-name">
          {photo.name} — {(photo.size / 1024 / 1024).toFixed(2)} MB (sera compressée)
        </p>
      )}

      <div className="step-actions">
        <button className="btn btn-secondary" onClick={onBack} type="button">
          ← Retour
        </button>
        <button className="btn btn-primary" onClick={handleNext} type="button">
          Continuer <span className="btn-arrow">→</span>
        </button>
      </div>
    </>
  );
}

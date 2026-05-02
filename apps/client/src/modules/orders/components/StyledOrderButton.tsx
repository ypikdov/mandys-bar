import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import "./StyledOrderButton.css";

interface StyledOrderButtonProps {
  onClick: () => void;
  disabled?: boolean;
  isSent?: boolean;
}

const StyledOrderButton = ({ onClick, disabled, isSent }: StyledOrderButtonProps) => {
  const isProcessing = Boolean(disabled && !isSent);
  const label = isSent
    ? "Pedido registrado"
    : isProcessing
      ? "Registrando pedido..."
      : "Registrar pedido";

  const hint = isSent
    ? "Comprobante listo para compartir"
    : isProcessing
      ? "Generando comprobante PDF"
      : "Descarga inmediata del PDF";

  return (
    <div className="styled-button-wrapper">
      <button
        type="button"
        className={`order-button ${isSent ? "sent" : ""} ${isProcessing ? "is-processing" : ""}`}
        onClick={onClick}
        disabled={disabled}
      >
        <span className="order-button__accent" aria-hidden="true">
          {isSent ? (
            <CheckCircle2 className="order-button__icon" />
          ) : isProcessing ? (
            <Loader2 className="order-button__icon order-button__icon--spin" />
          ) : (
            <ArrowRight className="order-button__icon" />
          )}
        </span>

        <span className="order-button__copy">
          <span className="order-button__label">{label}</span>
          <span className="order-button__hint">{hint}</span>
        </span>

        <span className="order-button__trailing" aria-hidden="true">
          {isSent ? <CheckCircle2 className="order-button__trailing-icon" /> : <ArrowRight className="order-button__trailing-icon" />}
        </span>
      </button>
    </div>
  );
};

export default StyledOrderButton;

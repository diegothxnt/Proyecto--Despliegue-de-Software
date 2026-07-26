import './PremiumModal.css';

function PremiumModal({ onClose }) {
  const whatsappLink = 'https://wa.me/04127985110?text=Hola%2C%20adjunto%20captura%20del%20pago%20de%20TaskFlow%20Premium';

  return (
    <div className="modal-overlay">
      <div className="premium-modal">
        <h2>Actualízate a Premium</h2>
        <p>Has alcanzado el límite de <strong>10 tareas gratuitas</strong>. Para crear más, obtén el plan ilimitado por solo <strong>$5 USD</strong>.</p>

        <div className="payment-methods">
          <h3>Opciones de pago</h3>
          <div className="payment-card">
            <h4>Pago Móvil (Venezuela)</h4>
            <p><strong>Cédula:</strong> 31.326.600</p>
            <p><strong>Teléfono:</strong> 0412-7985110</p>
            <p><strong>Banco:</strong> BNC</p>
          </div>
          <div className="payment-card">
            <h4>PayPal</h4>
            <p>Enlace: <a href="https://paypal.me/taskflowpremium" target="_blank" rel="noreferrer">paypal.me/taskflowpremium</a></p>
          </div>
        </div>

        <div className="whatsapp-section">
          <p>Después de realizar el pago, envía la captura por WhatsApp para activar tu cuenta:</p>
          <a href={whatsappLink} target="_blank" rel="noreferrer" className="whatsapp-btn">
            Enviar captura al 0412-7985110
          </a>
        </div>

        <p className="info-text">Tu cuenta se activará en un máximo de 24 horas.</p>
        <button className="close-modal-btn" onClick={onClose}>Entendido</button>
      </div>
    </div>
  );
}

export default PremiumModal;
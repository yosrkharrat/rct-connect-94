import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, Mail, MessageCircle, Shield } from 'lucide-react';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();

  const adminContacts = [
    { name: 'Montassar Mekkaoui', phone: '93 500 687', role: 'Contact principal' },
    { name: 'Fares Chakroun', phone: '98 773 438', email: 'fares.chakroun@esprit.tn', role: 'Support technique' },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="relative h-48 rct-gradient-hero flex items-end">
        <button
          onClick={() => navigate('/login')}
          className="absolute top-6 left-4 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <div className="relative p-6 pb-8 w-full">
          <h1 className="font-display font-extrabold text-3xl text-white drop-shadow-lg">Mot de passe oublié</h1>
          <p className="text-white/80 font-body text-sm mt-1">Récupération de compte</p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 -mt-4">
        <div className="bg-card rounded-2xl rct-shadow-elevated p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg">Besoin d'aide ?</h2>
              <p className="text-xs text-muted-foreground">Contactez un administrateur</p>
            </div>
          </div>

          <p className="text-sm text-muted-foreground mb-4">
            Pour récupérer votre code CIN (mot de passe), veuillez contacter l'un des administrateurs du Running Club Tunis ci-dessous.
          </p>

          <div className="bg-muted rounded-xl p-4 mb-4">
            <p className="text-xs font-semibold text-foreground mb-2">📌 Informations nécessaires :</p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Votre nom complet</li>
              <li>• Votre groupe (si vous le connaissez)</li>
              <li>• Date approximative de votre inscription</li>
            </ul>
          </div>
        </div>

        {/* Admin Contacts */}
        <div className="space-y-3 mb-6">
          {adminContacts.map((admin, idx) => (
            <div key={idx} className="bg-card rounded-2xl rct-shadow-card p-4">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-full rct-gradient-hero flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  {admin.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm">{admin.name}</h3>
                  <p className="text-xs text-muted-foreground">{admin.role}</p>
                </div>
              </div>

              <div className="space-y-2">
                <a
                  href={`tel:${admin.phone.replace(/\s/g, '')}`}
                  className="flex items-center gap-2 text-sm p-2 rounded-lg hover:bg-muted transition-colors"
                >
                  <Phone className="w-4 h-4 text-primary" />
                  <span>{admin.phone}</span>
                </a>

                {admin.email && (
                  <a
                    href={`mailto:${admin.email}`}
                    className="flex items-center gap-2 text-sm p-2 rounded-lg hover:bg-muted transition-colors"
                  >
                    <Mail className="w-4 h-4 text-primary" />
                    <span className="truncate">{admin.email}</span>
                  </a>
                )}

                <a
                  href={`https://wa.me/${admin.phone.replace(/\s/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm p-2 rounded-lg hover:bg-muted transition-colors"
                >
                  <MessageCircle className="w-4 h-4 text-green-500" />
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Additional Info */}
        <div className="bg-card rounded-2xl rct-shadow-card p-4 mb-6">
          <h3 className="font-semibold text-sm mb-2">💡 Conseils de sécurité</h3>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Mémorisez bien votre code CIN après récupération</li>
            <li>• Ne partagez jamais votre code avec d'autres membres</li>
            <li>• Les admins ne vous demanderont jamais votre code par message</li>
          </ul>
        </div>

        <div className="mb-6">
          <button
            onClick={() => navigate('/login')}
            className="w-full h-12 rct-gradient-hero text-white font-display font-bold rounded-xl rct-glow-blue transition-transform active:scale-[0.98]"
          >
            Retour à la connexion
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;

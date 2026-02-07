/**
 * SkipLink Component - WCAG 2.4.1 Bypass Blocks
 * Permet aux utilisateurs de clavier/lecteurs d'écran d'ignorer la navigation répétitive
 */
const SkipLink = () => {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[9999] 
                 focus:bg-orange-600 focus:text-white focus:px-4 focus:py-2 focus:rounded-lg 
                 focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
    >
      Aller au contenu principal
    </a>
  );
};

export default SkipLink;

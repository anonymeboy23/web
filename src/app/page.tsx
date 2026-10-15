export default function Home() {
  return (
    <main className="site-shell">
      <nav className="topbar">
        <a className="brand" href="#accueil" aria-label="Noria, accueil">
          <span className="brand-mark">N</span>
          <span>Noria</span>
        </a>
        <div className="topbar-links" aria-label="Navigation principale">
          <a href="#vision">La plateforme</a>
          <a href="#roles">Espaces</a>
          <a href="#securite">Sécurité</a>
        </div>
        <a className="login-link" href="/connexion">Se connecter <span aria-hidden="true">↗</span></a>
      </nav>

      <section className="hero" id="accueil">
        <div className="hero-copy">
          <p className="eyebrow"><span /> Gestion scolaire, avec justesse</p>
          <h1>Le lien entre l’école et <em>chaque famille.</em></h1>
          <p className="hero-text">Noria réunit l’administration, les classes, les élèves et les parents dans un espace calme, lisible et sécurisé.</p>
          <div className="hero-actions">
            <a className="text-action" href="/connexion/eleve">Espace élève / parent <span aria-hidden="true">→</span></a>
            <a className="primary-action" href="/connexion">Accéder à mon espace <span aria-hidden="true">→</span></a>
            <a className="text-action" href="#vision">Découvrir la plateforme <span aria-hidden="true">↓</span></a>
          </div>
        </div>
        <div className="hero-visual" aria-label="Aperçu abstrait de l'organisation scolaire">
          <div className="visual-orbit orbit-one" />
          <div className="visual-orbit orbit-two" />
          <div className="visual-core">
            <span className="core-label">École</span>
            <strong>Le quotidien,<br />mieux organisé.</strong>
            <span className="core-line" />
            <span className="core-note">Un même fil pour avancer ensemble</span>
          </div>
          <span className="visual-tag tag-top">Notes &amp; bulletins</span>
          <span className="visual-tag tag-bottom">Communications</span>
        </div>
      </section>

      <section className="intro-band" id="vision">
        <p className="section-kicker">Une base solide pour l’essentiel</p>
        <div className="intro-grid">
          <h2>Moins de dispersion.<br /><span>Plus de présence.</span></h2>
          <p>Une expérience pensée pour les décisions importantes : suivre une classe, transmettre les points, publier un bulletin ou rester proche de la progression d’un enfant.</p>
        </div>
      </section>

      <section className="role-section" id="roles">
        <div className="section-heading">
          <p className="section-kicker">Des espaces qui respectent chaque rôle</p>
          <h2>Une vue claire,<br /><span>pour chacun.</span></h2>
        </div>
        <div className="role-grid">
          <article className="role-card card-school"><span className="card-index">01</span><h3>École</h3><p>Le centre de pilotage pour les classes, les utilisateurs, les notes et les communications.</p><span className="card-arrow">↗</span></article>
          <article className="role-card card-class"><span className="card-index">02</span><h3>Titulaire</h3><p>Un accès concentré sur sa classe pour transmettre les points et les bulletins.</p><span className="card-arrow">↗</span></article>
          <article className="role-card card-family"><span className="card-index">03</span><h3>Élève &amp; parent</h3><p>Les résultats publiés et les messages de l’école, au même endroit.</p><span className="card-arrow">↗</span></article>
        </div>
      </section>

      <footer className="footer" id="securite">
        <div><span className="brand-mark small">N</span><span className="footer-title">Noria</span></div>
        <p>Une gestion scolaire qui laisse plus de place à l’essentiel.</p>
        <span className="footer-status"><i /> Données protégées par conception</span>
      </footer>
    </main>
  );
}

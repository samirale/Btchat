import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, Lock, Eye, Key, AlertTriangle, Scale, Server, Fingerprint, RefreshCw } from 'lucide-react';

export default function Terms() {
  return (
    <div className="container mx-auto max-w-4xl p-6">
      <div className="bg-black/80 p-8 rounded-lg border border-green-500/30 shadow-lg">
        <div className="flex items-center gap-4 mb-8">
          <Link to="/login" className="btn-matrix p-2">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold glow">Conditions Générales d'Utilisation</h1>
        </div>

        <div className="space-y-8 text-green-500/90">
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Scale className="w-6 h-6" />
              <h2 className="text-xl font-semibold">1. Cadre Juridique et Acceptation</h2>
            </div>
            <div className="space-y-3">
              <p>
                En utilisant BtChat, vous acceptez expressément ces conditions d'utilisation 
                et notre politique de confidentialité. Ce service est soumis aux lois sur la 
                protection des données personnelles, notamment le RGPD en Europe.
              </p>
              <p>
                Si vous n'acceptez pas l'intégralité de ces conditions, vous devez cesser 
                immédiatement d'utiliser notre service.
              </p>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-6 h-6" />
              <h2 className="text-xl font-semibold">2. Engagement de Sécurité</h2>
            </div>
            <div className="space-y-3">
              <p>
                BtChat s'engage à maintenir les plus hauts standards de sécurité pour protéger 
                vos communications. Notre système repose sur :
              </p>
              <ul className="list-none space-y-4 mt-4">
                <li className="flex items-start gap-3">
                  <Lock className="w-5 h-5 mt-1 flex-shrink-0" />
                  <div>
                    <strong className="block">Chiffrement de bout en bout</strong>
                    <span>Vos messages sont chiffrés avant de quitter votre appareil et ne peuvent 
                    être déchiffrés que par le destinataire prévu.</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Eye className="w-5 h-5 mt-1 flex-shrink-0" />
                  <div>
                    <strong className="block">Protection contre les captures d'écran</strong>
                    <span>Système de détection et de notification des tentatives de capture 
                    d'écran pour préserver la confidentialité des conversations.</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Key className="w-5 h-5 mt-1 flex-shrink-0" />
                  <div>
                    <strong className="block">Gestion sécurisée des clés</strong>
                    <span>Utilisation d'algorithmes de chiffrement avancés et gestion 
                    sécurisée des clés de chiffrement.</span>
                  </div>
                </li>
              </ul>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <Server className="w-6 h-6" />
              <h2 className="text-xl font-semibold">3. Traitement des Données</h2>
            </div>
            <div className="space-y-3">
              <p>
                Nous appliquons des mesures strictes concernant le traitement de vos données :
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Les messages sont stockés uniquement sous forme chiffrée</li>
                <li>Aucun accès aux contenus des messages par notre équipe</li>
                <li>Suppression automatique des messages après un certain délai</li>
                <li>Aucune exploitation commerciale de vos données personnelles</li>
                <li>Transparence totale sur les données collectées</li>
              </ul>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6" />
              <h2 className="text-xl font-semibold">4. Utilisations Interdites</h2>
            </div>
            <div className="space-y-3">
              <p>
                Les activités suivantes sont strictement interdites et entraîneront la 
                suspension immédiate du compte :
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Tentatives de contournement du chiffrement</li>
                <li>Distribution de logiciels malveillants</li>
                <li>Harcèlement ou menaces envers d'autres utilisateurs</li>
                <li>Usurpation d'identité</li>
                <li>Activités illégales de toute nature</li>
                <li>Tentatives d'extraction massive de données</li>
                <li>Partage non autorisé de clés de chiffrement</li>
              </ul>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <Fingerprint className="w-6 h-6" />
              <h2 className="text-xl font-semibold">5. Responsabilités des Utilisateurs</h2>
            </div>
            <div className="space-y-3">
              <p>
                En tant qu'utilisateur, vous êtes responsable de :
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>La sécurité de vos identifiants de connexion</li>
                <li>La confidentialité de vos clés de chiffrement</li>
                <li>L'utilisation légale et éthique du service</li>
                <li>La véracité des informations fournies</li>
                <li>La protection de vos appareils contre les accès non autorisés</li>
              </ul>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <RefreshCw className="w-6 h-6" />
              <h2 className="text-xl font-semibold">6. Mises à Jour et Modifications</h2>
            </div>
            <div className="space-y-3">
              <p>
                Nous nous réservons le droit de modifier ces conditions pour :
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Améliorer la sécurité du service</li>
                <li>Adapter aux évolutions technologiques</li>
                <li>Se conformer aux changements législatifs</li>
                <li>Optimiser la protection des utilisateurs</li>
              </ul>
              <p className="mt-4">
                Les utilisateurs seront notifiés des modifications importantes. L'utilisation 
                continue du service après modification constitue l'acceptation des nouvelles 
                conditions.
              </p>
            </div>
          </section>

          <div className="mt-8 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
            <p className="text-sm">
              <strong>Note importante :</strong> BtChat est conçu pour la protection maximale 
              de vos communications. Cependant, aucun système n'est infaillible. Nous vous 
              recommandons de rester vigilant et d'appliquer les bonnes pratiques de sécurité 
              numérique.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
# POC local ERWeb → Ecoscope

## Périmètre

1. Worktree `/Users/ray/workspace/frontend/das-web-react__worktrees/ecoscope-poc`, branche `codex/erweb-ecoscope-poc`, remote PADAS/das-web-react. Un commit local POC autorisé par l’utilisateur ; aucun push ni PR.
2. Exigences et contrat : `/Users/ray/.codex/visualizations/2026/11/16/01a1e222-b590-73a0-b04c-7a21420eabe0/poc-coordination.md`.
3. Pas de nouveau test automatisé. Validation manuelle par le coordinateur ; contrôles lint/compilation.
4. Changement confirmé par coordinateur : API FastAPI dans preview dev, ERWeb/Ecoscope Web locaux.

## Implémentation

1. Onglet Analyse `/analysis` conditionné par les trois variables `REACT_APP_ECOSCOPE_URL`, `REACT_APP_ECOSCOPE_API_URL`, `REACT_APP_ECOSCOPE_SITE_ID` ; surface pleine largeur, navigation EarthRanger native, i18n six langues.
2. Bearer ER envoyé uniquement à FastAPI dans POST `/v1/integrations/earthranger/launch`, `{site_id,connection_id}` → `{transaction_id,code,expires_in:60}`.
3. Iframe GET `/er/prepare?transaction_id=T`, premier load déclenche form POST `/er/launch` avec T+C. Aucun bearer dans URL, iframe ou postMessage. Code mémoire uniquement, effacé après soumission.
4. UUID partagé par connexion ER dans localStorage, lancement/déconnexion sérialisés via Web Locks et marqueur de déconnexion bloquant les lancements tardifs ; conservé au renouvellement bearer/rechargement, supprimé à déconnexion/nouvelle connexion.
5. Déconnexion ordinaire ER attend POST `/v1/integrations/earthranger/logout` (204), conserve liaison, ferme iframe dans les onglets ; échec API affiche message et conserve connexion ER pour réessayer.
6. Première liaison et gestion des comptes : entièrement dans Ecoscope, conformément au contrat avec worker Web. Le serveur confirme une barrière durable sur connection_id révoqué (409 INTEGRATION_CONNECTION_ENDED), y compris lancement concurrent tardif.

## Vérification

1. ESLint sur tous les fichiers JS modifiés : réussi.
2. Stylelint sur les deux fichiers SCSS modifiés : réussi.
3. Version i18n et `git diff --check` : réussis. Relecture sécurité/lifecycle faite : aucun bearer vers iframe, code opaque mémoire, lancement tardif bloqué et vérification du bearer courant via cookie avant lancement pour refuser une identité obsolète dans un autre onglet. Compilation complète `node .yarn/releases/yarn-4.18.1.cjs build` sous Node26.13.1 : réussie (Vite + service worker). Dépendances exactes installées par coordinateur ; aucun lockfile modifié.
4. Parcours navigateur réel : mené par le coordinateur, qui confirme le POC auth validé ; les résultats détaillés restent dans son suivi partagé.

## Environnement

1. `REACT_APP_ECOSCOPE_URL=http://embedded.poc.localhost:3001`
2. `REACT_APP_ECOSCOPE_API_URL=<URL API preview dev>`
3. `REACT_APP_ECOSCOPE_SITE_ID=mep-dev`
4. Parent ER autorisé : `http://er.poc.localhost:9000`.

## Ajustement IAB du 17 novembre 2026

1. Le coordinateur a observé l’en-tête Analyse et l’erreur de lancement attendue (API pont désactivée), mais le bouton Réessayer conservait son aspect HTML natif.
2. `EcoscopeTab` utilise désormais le mixin partagé `buttons.chip-text-button`, déjà utilisé pour Réessayer dans EventsFeed et LinkEventModal, avec centrage dans l’état d’erreur. Le mixin fournit survol et focus clavier.
3. ESLint ciblé, Stylelint ciblé et `git diff --check` : réussis. Build complet Node26.13.1/Yarn4 : réussi, service worker inclus. Aucun nouveau test, aucune modification auth/config/env, aucun redémarrage Vite9000, aucun commit/push. Vérification visuelle finale réservée au coordinateur.

## Icône Analyse du 17 novembre 2026

1. L’entrée Analyse utilise désormais le SVG monochrome existant `common/images/icons/ecoscope-logo.svg` dans la barre latérale et le menu global. Le graphique Tableau garde son icône existante. Aucun SVG ni style redessiné/modifié.
2. ESLint ciblé et `git diff --check` : réussis. Build complet Node26.13.1/Yarn4 : réussi, service worker inclus. Stylelint non requis : aucun SCSS modifié.
3. HMR prêt pour capture IAB par le coordinateur ; Vite9000 conservé. Aucun changement auth/config, aucun nouveau test, aucun commit/push.

## Simplification de l’en-tête Analyse

1. Demande utilisateur : retrait du lien redondant « Retour à EarthRanger ». Seuls son JSX, l’import Link devenu inutile et le style returnLink ont été supprimés. En-tête Analyse/avec Ecoscope, logo monochrome et navigation native conservés.
2. ESLint ciblé, Stylelint ciblé et `git diff --check` : réussis. Build complet Node26.13.1/Yarn4 : réussi, service worker inclus.
3. HMR prêt pour capture IAB ; Vite9000 conservé. Aucun changement auth/config, aucun nouveau test, aucun commit/push.

## Conservation locale du POC

1. L’utilisateur autorise un commit local unique de tous les changements ERWeb du POC, sans push. Diff complet et quatre fichiers non suivis relus. Aucun secret, fichier .env, build, dépendance ou artefact généré inclus.
2. Derniers lint/stylelint/build déjà réussis ; aucun changement source depuis cette validation. Hooks Git normaux conservés.

## Conservation de la navigation Ecoscope entre onglets ERWeb

1. Diagnostic : `EcoscopeTab` était l’élément de la Route Analyse ; tout départ démontait son iframe. Il est désormais monté hors Routes, avec une identité stable liée à l’utilisateur ER principal, et ne démarre qu’à la première ouverture Analyse.
2. Les changements d’onglet modifient uniquement `hidden` et `inert` (avec `display:none` explicite). L’état launch, l’URL src et la clé de l’iframe ne dépendent pas de l’onglet : même document conservé pour sa navigation/travail interne.
3. Un renouvellement du bearer actualise seulement la référence pour un futur lancement/réessai ; il ne relance pas l’iframe. Le reducer utilisateur conserve son id pendant chargement et changement de profil ; aucun remount transitoire provoqué par ces opérations.
4. Déconnexion/changement de connexion : annulation immédiate du lancement en cours, effacement du code et de l’iframe, état terminé empêchant la réactivation via tabLocation mémorisée. Écoute des changements de connexion inter-onglets et remise à zéro sur changement réel d’utilisateur. Aucun nouveau polling ni changement du protocole d’authentification.
5. Vérifications : ESLint et Stylelint ciblés, `git diff --check`, relecture de chaque hunk : réussis. Suite existante SideBar : 72 tests réussis, avec `--watchman=false` après refus d’accès local Watchman. Aucun nouveau test/fichier de test modifié. Build complet Node26.13.1/Yarn4 : réussi, service worker inclus.
6. HMR prêt pour vérification manuelle par coordinateur : navigation interne Ecoscope, départ Événements/Calques/Réglages puis retour avec même DOM/frame ; déconnexion ER avec Analyse masquée, puis reconnexion sans ancien état. Vite9000 conservé ; aucun commit/push pour cette demande.

## Validation IAB de la persistance — résultats du coordinateur

1. Réussi : Sources de données → Événements → Analyse conserve la même iframe (name/src) et la page interne.
2. Réussi : Mes workflows avec recherche « QA » → Calques puis Réglages → retours Analyse conserve la recherche et le même name/src. Masquée : une iframe, invisible, section hidden=true.
3. Réussi : nouvel onglet ER sur /events ne monte aucune iframe avant première ouverture Analyse.
4. Réussi : déconnexion ER alors qu’Analyse est masquée mène à /login, sans iframe. Après reconnexion : aucune iframe avant Analyse, puis nouvelle iframe et nouvelle transaction, recherche vide et réouverture sans mot de passe Ecoscope (liaison conservée).
5. Contrôles existants : 1 suite SideBar, 72 tests réussis ; ESLint/Stylelint ciblés et build complet réussis. `--watchman=false` remplace uniquement Watchman par le crawler standard Jest : aucune sélection additionnelle, aucun skip, aucune modification de seuil ou configuration des tests.
6. Commit complémentaire local autorisé après cette validation ; commit initial conservé sans amendement, aucun push/PR.

## Suppression du bandeau Analyse — 18 novembre 2026

1. Retrait du bandeau « Analyse / avec Ecoscope », de son import SVG inutilisé et des seuls styles header/brand. La section conserve son libellé accessible ; l’iframe flex occupe l’espace disponible. États de chargement/erreur, authentification, persistance et navigation globale ER inchangés.
2. Relecture humaine du diff uniquement. Sur instruction explicite utilisateur : aucun test, lint, Stylelint, build, typecheck ni hook exécuté. Commit local avec hooks désactivés pour cette opération ; aucun push/PR par ce worker.
3. Worktree déplacé par le coordinateur dans le répertoire sibling `das-web-react__worktrees`. Environnement et secrets existants réutilisés sans modification. Vite relancé et prêt sur 127.0.0.1:9000, PID 30277 / session 44450 ; validation navigateur réservée au coordinateur.

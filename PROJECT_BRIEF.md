# AGRISAMA AI : plan d'implémentation pour Antigravity

> Document de référence du projet placé à la racine (`PROJECT_BRIEF.md`), exécuté et mis à jour étape par étape.

---

## 1. Contexte et mission

**Problème.** Dans les zones horticoles du Sénégal (Niayes, Delta du fleuve Sénégal, Casamance), les petits producteurs vendent mal leurs récoltes : afflux simultané de produits, manque de circuits structurés, manque d'information sur la demande. Résultat : invendus, ventes précipitées, baisse des prix, pertes après récolte. De leur côté, les acheteurs (grossistes, commerçants, distributeurs) peinent à trouver rapidement des volumes et une qualité fiables.

**Mission de l'application.** AGRISAMA AI est une **plateforme intermédiaire entre producteurs et acheteurs**. Elle ne vend pas elle-même : elle met en relation, regroupe les récoltes, sécurise la transaction et accélère la vente avant la détérioration des produits.

**Utilisateurs.** Producteurs, coopératives, acheteurs, administrateur.

---

## 2. Contraintes non négociables

- Mobile-first, application web progressive (PWA), légère, utilisable avec une connexion lente ou instable.
- Interface en français, avec icônes, gros boutons et fort contraste. Prévoir l'ajout du wolof (audio ou textes) sans refonte.
- Connexion par numéro de téléphone et code OTP, pas d'e-mail obligatoire.
- Aucune clé secrète dans le code : variables d'environnement uniquement.
- Chaque fonctionnalité livrée avec des tests et un court résumé de ce qui a été fait.
- Données personnelles : consentement à l'inscription et masquage des numéros avant confirmation d'une transaction.

---

## 3. Stack recommandée

- **Frontend :** Next.js (React) + Tailwind CSS, configuré en PWA.
- **Backend :** routes API Next.js.
- **Base de données :** Prisma ORM compatible PostgreSQL (Supabase) et SQLite local via `DATABASE_URL`.
- **Authentification :** OTP par SMS, rôles et règles d'accès par rôle.
- **IA :** Assistant d'extraction en langage naturel (Français & Wolof), estimation visuelle par photo, prévision des prix et alertes de surproduction.
- **Notifications :** SMS et WhatsApp générés à chaque changement de statut de commande.

---

## 4. Modèle de données

- `users` : id, rôle (`PRODUCTEUR`, `COOPERATIVE`, `ACHETEUR`, `ADMIN`), nom, téléphone, zone, langue, statut de vérification.
- `products` : id, nom, catégorie, durée de conservation en jours (`shelfLifeDays`).
- `offers` : id, producteur, produit, quantité en kg, prix FCFA/kg, date de récolte, date limite de vente (`expiryDate`), photo, statut.
- `demands` : id, acheteur, produit, quantité en kg, prix maximum, date de livraison, lieu.
- `matches` : id, offre, demande, score de compatibilité, statut.
- `groupings` : id, demande, liste d'offres, volume total.
- `orders` : id, offre, demande, producteur, acheteur, quantité, prix convenu, statut, historique des statuts.
- `messages` : id, commande, expéditeur, contenu, date.
- `ratings`, `notifications`, `price_history`, `support_tickets`.

**Statuts d'une commande :** `PROPOSEE`, `ACCEPTEE`, `EN_LIVRAISON`, `LIVREE`, `LITIGE`, `ANNULEE`.

---

## 5. Journal d'exécution des étapes

### Étape 0 : préparation (jour 1) — ✅ TERMINÉE
- [x] Création du projet propre à partir de zéro.
- [x] Placement de `PROJECT_BRIEF.md` à la racine.
- [x] Définition de l'architecture, du schéma de base de données et des écrans du MVP.

### Étape 1 : fondations (semaine 1) — ✅ TERMINÉE
- [x] Initialisation Next.js 14, Tailwind CSS et configuration PWA (`manifest.json`, `icon.svg`, `sw.js`).
- [x] Création de la base de données Prisma (`schema.prisma`) et des données de départ (`seed.js` : 10 produits horticoles du Sénégal avec durées de conservation en jours).
- [x] Mise en place de l'authentification par téléphone + code OTP (`authService.ts`, `/api/auth`, `ScreenAuth.tsx`) et des 4 rôles.
- [x] Design system à boutons larges, icônes, fort contraste et support bilingue Français / Wolof (`i18n.ts`).
- [x] Tests automatisés : `tests/etape1_fondations.test.ts`.

### Étape 2 : module Offres (semaine 2) — ✅ TERMINÉE
- [x] Formulaire de publication mobile en 4 étapes : 1. Produit, 2. Quantité et Prix, 3. Date de récolte et Zone, 4. Photo (`ScreenOffers.tsx`).
- [x] Calcul automatique de la date limite de vente (`expiryDate = harvestDate + shelfLifeDays`).
- [x] Page liste filtrable par produit et par zone, avec compte à rebours visuel de péremption et alerte d'urgence.
- [x] Tests automatisés : `tests/etape2_offres.test.ts`.

### Étape 3 : module Demandes (semaine 2) — ✅ TERMINÉE
- [x] Formulaire de demande acheteur : produit, volume en kg, prix maximum, date et lieu de livraison (`ScreenDemands.tsx`).
- [x] Liste et détail des demandes, avec filtre vue par acheteur (`demandService.ts`, `/api/demands`).
- [x] Tests automatisés : `tests/etape3_demandes.test.ts`.

### Étape 4 : matching et correspondances (semaine 3) — ✅ TERMINÉE
- [x] Score pondéré entre offres et demandes : Produit (bloquant), Volume (25%), Prix (25%), Distance (20%), Date & Priorité anti-péremption (30%) (`matchingService.ts`).
- [x] Page « Correspondances » bidirectionnelle (par demande ou par offre) avec alerte pour les offres proches de la péremption (`ScreenMatches.tsx`).
- [x] Tests unitaires sur le score et le calcul de péremption : `tests/etape4_matching.test.ts`.

### Étape 5 : commandes, messagerie, notifications (semaine 3) — ✅ TERMINÉE
- [x] Création d'une commande à partir d'une correspondance ou d'un regroupement, avec suivi des 6 statuts et historique horodaté (`orderService.ts`, `ScreenOrders.tsx`).
- [x] Messagerie interne par commande.
- [x] Numéros de téléphone strictement masqués (`+221 77 ••• •• 01`) tant que la commande est `PROPOSEE`, et déverrouillés automatiquement dès l'acceptation (`ACCEPTEE`) avec boutons d'appel et WhatsApp.
- [x] Notifications SMS et WhatsApp générées à chaque changement de statut.
- [x] Notation mutuelle (1 à 5 étoiles + avis) après livraison (`LIVREE`).
- [x] Tests de bout en bout : `tests/etape5_commandes_intermediaire.test.ts`.

### Étapes 6, 7 & 8 : tests, pilote terrain & IA avancée — ✅ TERMINÉES
- [x] Regroupement automatique de plusieurs récoltes (`computeGroupingForDemand`) pour satisfaire une grande demande acheteur.
- [x] Prévision des prix et conseil sur le meilleur moment de vente (`aiAdvisorService.ts`).
- [x] Alerte de surproduction par zone horticole.
- [x] Assistant texte et vocal en langage naturel (Français & Wolof) pour pré-remplir une offre en une phrase.
- [x] Support par WhatsApp, bouton « Signaler un problème » et tableau de bord des 5 indicateurs de réussite de la section 7 (`ScreenAIAndPilot.tsx`).
- [x] Tests automatisés : `tests/etape8_ia_regroupement.test.ts`.

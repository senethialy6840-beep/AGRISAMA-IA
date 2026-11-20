# AgriSama IA — Plateforme Full-Stack Producteurs & Acheteurs d’Oignons

**AgriSama IA** est une plateforme web Full-Stack (**Next.js 14 + Prisma + Supabase PostgreSQL / Storage / Realtime**) conçue pour connecter directement les producteurs d’oignons du Sénégal (zone des Niayes et Vallée du Fleuve) et les acheteurs (grossistes, commerçants, centrales d’achat).

---

## Fonctionnalités principales

- **Espace Producteurs (Productions & Offres de récolte)** : connexion rapide 3 champs (`Nom`, `Téléphone`, `Localisation`), publication de lots d’oignons en `kg` ou `tonnes`, photo facultative stockée sur **Supabase Storage**, gestion des statuts (`Disponible`, `Réservée`, `Vendue`), recherche et filtres.
- **Espace Acheteurs (Demandes d’achat)** : dépôt et gestion de demandes d’approvisionnement, budget max en `FCFA/kg`, contact téléphonique direct, recherche et filtres.
- **Synchronisation temps réel** : mises à jour instantanées via **Supabase Realtime** (`Offer`, `Demand`, `Match`).
- **Tableau de bord Administrateur privé (`/admin`)** : accès exclusif protégé par authentification serveur (`401`/`403`), supervision des indicateurs et gestion globale.
- **Sécurité PostgreSQL & RLS** : Row Level Security activée sur toutes les tables Supabase, contrôle d’accès RBAC côté serveur et sessions signées `HttpOnly`.

---

## Installation et démarrage local

1. Installer les dépendances :
   ```bash
   npm install
   ```
2. Copier `.env.example` vers `.env` et renseigner vos identifiants Supabase et administrateur.
3. Générer le client Prisma et lancer les tests :
   ```bash
   npx prisma generate
   npm test
   ```
4. Compiler et démarrer en production :
   ```bash
   npm run build
   npm start
   ```

---

## Déploiement en production (Vercel + Supabase)

1. Importer ce dépôt GitHub dans **Vercel**.
2. Ajouter les variables d’environnement listées dans `.env.example` dans les paramètres du projet Vercel.
3. Lancer le déploiement (`npm run build` exécute automatiquement `prisma generate && next build`).

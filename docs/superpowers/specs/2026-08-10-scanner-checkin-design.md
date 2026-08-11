# Comptes scanner & sécurisation du check-in — Design

Date : 2026-08-10
Statut : Validé

## Contexte

La collection `reservations` porte déjà un champ `available` : `true` tant
que le billet n'a pas été présenté à l'entrée, `false` une fois validé —
objectif : empêcher que deux personnes entrent avec le même billet. Une
page `/check-in` et une action `setReservationAvailability` existent déjà
et implémentent ce bascule. Deux problèmes réels ont été identifiés en
explorant le code existant, que cette fonctionnalité doit résoudre :

1. **Le QR code envoyé par courriel n'est pas un lien.** `sendTicketEmail.ts`
   encode directement le JSON du billet
   (`QRCode.toDataURL(JSON.stringify({reservationId, ticketId, ...}))`).
   Scanné avec l'appareil photo d'un téléphone, ça affiche du texte brut —
   rien ne s'ouvre. Il doit encoder une URL vers `/check-in`.
2. **`/check-in` et `setReservationAvailability` n'ont aucune
   authentification.** N'importe qui connaissant ou devinant l'URL peut
   valider ou dévalider n'importe quel billet, sans se connecter — la même
   classe de faille que les Server Actions admin corrigées précédemment
   dans ce projet.

Ce travail ajoute un rôle « scanner » (comptes individuels, gérés par
l'admin, limités à un événement) et corrige ces deux problèmes.

## Décisions issues du brainstorming

1. **Comptes individuels** (nom + identifiant + mot de passe), créés par
   l'admin, stockés dans une nouvelle collection Appwrite — pas un mot de
   passe unique partagé. Permet de révoquer un accès précis et, plus tard,
   de savoir qui a validé quoi.
2. **Un compte scanner est limité à un événement précis**, assigné par
   l'admin à la création.
3. **Saisie manuelle en secours** sur la page de check-in (recherche par
   email du client, dans l'événement assigné au scanner) — utile quand
   l'appareil photo ne scanne pas.

## Modèle de données

### Nouvelle collection Appwrite `scanners`

| Champ | Type | Notes |
|---|---|---|
| `name` | string | Nom affiché, ex. « Sécurité porte 1 » |
| `username` | string | Identifiant de connexion, unique |
| `passwordHash` | string | `scrypt(password, passwordSalt)`, hex |
| `passwordSalt` | string | Aléatoire, 16 octets, hex — un salt par compte, jamais réutilisé |
| `eventId` | string | Événement auquel le compte est limité |
| `active` | boolean | Permet à l'admin de révoquer sans supprimer |

**Prérequis avant déploiement (hors du périmètre de ce code) :** cette
collection doit être créée manuellement dans la console Appwrite avec ces
attributs, comme les collections existantes (`events`, `tickets`, etc.), et
avec un **index unique sur `username`** — la vérification d'unicité côté
application (`createScanner`) protège le cas courant mais ne remplace pas
une contrainte en base contre deux créations concurrentes du même
identifiant. Deux nouvelles variables d'environnement sont également
requises :
- `NEXT_PUBLIC_APPWRITE_COLLECTION_SCANNERS` — id de cette collection.
- `SCANNER_SESSION_SECRET` — chaîne aléatoire longue, dédiée à la
  signature des sessions scanner (indépendante de `ADMIN_PASSWORD` : un
  compte scanner compromis ne doit pas éclairer sur l'accès admin, et
  inversement).

`NEXT_PUBLIC_URL` (déjà utilisée ailleurs dans le projet) doit aussi être
configurée : le lien du code QR en dépend directement
(`${NEXT_PUBLIC_URL}/check-in?id=...}`) et son absence bloque désormais
explicitement l'envoi du courriel de confirmation plutôt que de produire
un lien cassé.

`src/utils/config.ts` reçoit une fonction `getScannerConfig()` du même
type que `getReservationConfig()` — retourne une erreur explicite si la
collection n'est pas configurée, au lieu de planter.

### Pourquoi un hachage différent de celui de l'admin

Le token admin actuel est `sha256(ADMIN_PASSWORD)` — un secret partagé
unique, comparé tel quel, un choix déjà identifié comme faible mais
tolérable pour un seul mot de passe fixe (voir l'audit de sécurité de ce
projet). Ici, plusieurs mots de passe distincts vivent en base : `scrypt`
avec un sel aléatoire par compte est le minimum requis, sans quoi deux
comptes avec le même mot de passe produiraient le même hachage et une
fuite de la base exposerait des hachages directement comparables (rainbow
tables). Implémenté avec le module `crypto` natif de Node — aucune
nouvelle dépendance.

## Authentification scanner

### Session

Un cookie `scanner-token` (httpOnly, sameSite lax, secure en prod) porte
un jeton auto-signé, sans dépendance JWT :

```
payload   = base64url(JSON.stringify({ scannerId, eventId, exp }))
signature = HMAC-SHA256(payload, SCANNER_SESSION_SECRET) en hex
token     = `${payload}.${signature}`
```

Durée de vie : 12 heures (`exp = Date.now() + 12h`) — couvre une soirée
d'événement sans laisser une session ouverte indéfiniment.

`requireScannerSession()` : décode le cookie, revérifie la signature
(`crypto.timingSafeEqual`, jamais une comparaison `===` sur un secret),
vérifie `exp`, puis **relit le document `scanners` en base** pour
confirmer `active === true` — un compte désactivé par l'admin perd l'accès
immédiatement, sans attendre l'expiration du token. Retourne le document
scanner (ou `null`).

### Connexion / déconnexion

Même patron que l'admin (`/api/admin/login`, `/api/admin/logout`), dupliqué
pour les scanners plutôt que généralisé — deux systèmes d'auth
volontairement indépendants, pas de facteur commun à casser :

- `POST /api/scanner/login` (`{ username, password }`) → cherche le
  compte par `username`, vérifie le mot de passe (`scrypt` + comparaison
  `timingSafeEqual`), vérifie `active`, pose le cookie `scanner-token`.
- `POST /api/scanner/logout` → efface le cookie.
- Page `/scan/login` (redirige vers `/scan` si déjà connecté, comme
  `/admin/login`), formulaire `ScannerLoginForm` (nom d'utilisateur + mot
  de passe, calqué sur `LoginForm.tsx`). Accepte un paramètre
  `?redirect=` (validé : doit commencer par `/check-in`, sinon ignoré) et
  y redirige après connexion — permet de revenir directement sur le billet
  scanné avant la connexion.
- Page `/scan` : accueil minimal post-connexion (« Connecté en tant que
  {name} — scannez un billet pour le valider », bouton de déconnexion).
  Protégée par `requireScannerSession()` — redirige vers `/scan/login` si
  aucune session scanner valide (contrairement à `/check-in`, cette page
  n'accepte pas une session admin : c'est l'écran d'accueil du rôle
  scanner spécifiquement).

## Sécurisation de `/check-in`

### Qui peut valider un billet

Une nouvelle fonction `getCheckInActor()` (dans `src/utils/scannerAuth.ts`)
essaie, dans l'ordre : session scanner valide, puis session admin valide
(un admin peut toujours valider n'importe quel billet, sans compte
scanner dédié). Retourne :
- `{ type: 'scanner', scannerId, eventId, name }`
- `{ type: 'admin' }`
- `null`

Si `null`, `/check-in` redirige vers `/scan/login?redirect=<url
courante>`.

### Portée par événement

Si l'acteur est un `scanner`, la page (et l'action de validation) vérifie
que `reservation.event_ID === actor.eventId` avant d'afficher les
informations du billet ou d'autoriser la validation. Sinon : message
« Ce billet appartient à un autre événement. » — pas de fuite
d'information sur le billet réel. Un `admin` n'a pas cette restriction.

### QR code → URL, et simplification du contenu

`sendTicketEmail.ts` génère aujourd'hui un QR contenant un JSON complet
(`reservationId`, `ticketId`, `eventId`, `customerId`, `email`,
`paymentIntent`). Nouveau contenu, plus simple et plus sûr :

```
${process.env.NEXT_PUBLIC_URL}/check-in?id=<reservationId>
```

Le `reservationId` suffit : la page recharge le document de réservation
par son id, puis lit `event_ID`/`ticket_ID`/`customer_ID` **directement
sur ce document** pour aller chercher l'événement, le ticket et le client
— au lieu de faire confiance à des champs venus de l'URL (actuellement
`eventId`/`ticketId`/`customerId` viennent du payload JSON contrôlé côté
client). C'est à la fois la simplification nécessaire pour un lien court
et un durcissement : la seule source de vérité devient la base de
données.

Le paramètre `?data=<json>` existant reste accepté en repli (billets déjà
envoyés avant ce changement, ou tout PDF déjà généré) : la page en extrait
uniquement `reservationId` et ignore le reste du payload, avec la même
re-dérivation depuis la base.

### Saisie manuelle en secours

Sur `/check-in`, si aucun `id`/`data` n'est fourni dans l'URL (le scanner
arrive sur la page depuis `/scan` sans avoir scanné), un formulaire
« Rechercher par courriel » interroge les réservations du client dans
l'événement assigné au scanner (nouvelle action
`findReservationsByEmailForEvent(email, eventId)`), et affiche la liste
des billets correspondants (nom du client, ticket, statut) pour que le
scanner clique sur le bon. Pour un `admin`, la recherche n'est pas limitée
à un événement.

## Fichiers

### Nouveaux

- `src/utils/scannerAuth.ts` — hachage/vérification de mot de passe,
  création/vérification du jeton de session, `requireScannerSession()`,
  `getCheckInActor()`.
- `src/app/actions/adminScanners.ts` — `createScanner`, `getScanners`,
  `toggleScannerActive`, `deleteScanner` (toutes gardées par
  `requireAdminSession()`, même patron que `adminEvents.ts` etc.).
- `src/app/actions/scannerCheckIn.ts` — `findReservationsByEmailForEvent`
  (gardée par `getCheckInActor()` — scanner ou admin uniquement, pas une
  action publique).
- `src/app/api/scanner/login/route.ts`, `src/app/api/scanner/logout/route.ts`.
- `src/app/scan/login/page.tsx` + `src/components/scan/ScannerLoginForm.tsx`.
- `src/app/scan/page.tsx` (accueil post-connexion) +
  `src/components/scan/ScannerLogoutButton.tsx`.
- `src/components/admin/ScannerManager.tsx` +
  `src/app/admin/(protected)/scanners/page.tsx`.

### Modifiés

- `src/utils/config.ts` — ajoute `getScannerConfig()`.
- `src/utils/sendTicketEmail.ts` — QR encode une URL `/check-in?id=...` au
  lieu du JSON brut.
- `src/app/check-in/page.tsx` — ajoute la vérification d'acteur
  (redirection si non connecté), la portée par événement pour les
  scanners, la lecture des relations depuis le document de réservation
  plutôt que depuis l'URL, et le formulaire de recherche par courriel.
- `src/app/actions/updateReservationAvailability.ts` — l'action
  `setReservationAvailability` est actuellement appelable sans aucune
  authentification ; elle doit désormais exiger un acteur valide
  (`getCheckInActor()`) et, pour un scanner, vérifier la portée événement
  avant d'écrire.
- `src/components/admin/AdminSidebar.tsx` et
  `src/components/admin/AdminBottomNav.tsx` — ajoutent un lien
  « Scanners » (liste `links`/`moreLinks`), même patron que les entrées
  existantes.

## Flux

```
Admin crée un compte scanner (nom, identifiant, mot de passe, événement)
  → createScanner() → scrypt(password) → document `scanners`

Scanner ouvre /scan/login → POST /api/scanner/login
  → vérifie identifiant/mot de passe/active → pose scanner-token
  → redirige vers /scan (ou ?redirect= si présent)

Invité scanne son billet (QR = /check-in?id=<reservationId>)
  → pas de session ? redirige /scan/login?redirect=/check-in?id=...
  → session valide → getCheckInActor()
  → charge la réservation par id → dérive event/ticket/client depuis
    ses champs event_ID/ticket_ID/customer_ID
  → scanner : vérifie event_ID === actor.eventId, sinon refuse
  → affiche statut + bouton "Marquer comme utilisé" si available === true
  → setReservationAvailability(id, false) après revérification de l'acteur
    et de la portée événement côté serveur (jamais uniquement côté page)
```

## Gestion d'erreurs

Pattern `{ success, error }` cohérent avec le reste du projet pour toutes
les nouvelles actions serveur. Messages affichés sur `/check-in` :
réservation introuvable, billet déjà utilisé, billet d'un autre
événement, session expirée/absente (redirection plutôt qu'un message).

## Tests

Nouveau fichier `tests/scannerAuth.test.ts` : hachage/vérification de mot
de passe (aller-retour correct, mot de passe erroné rejeté), création et
vérification de jeton (jeton valide accepté, signature falsifiée rejetée,
jeton expiré rejeté).

Nouveau fichier `tests/adminScanners.test.ts` : même structure que
`tests/adminTickets.test.ts` (mock Appwrite + mock `requireAdminSession`)
— création (avec hachage), refus sans session admin, unicité du
`username`, activation/désactivation, suppression.

`setReservationAvailability` (fichier existant, pas encore testé) reçoit
sa première couverture : refus sans acteur valide, refus si portée
événement incorrecte pour un scanner, succès pour un admin ou un scanner
dans la bonne portée.

## Hors périmètre (explicitement exclu)

- Pas de scan par caméra intégré à l'application — l'appareil photo natif
  du téléphone suffit une fois le QR corrigé en URL.
- Pas de traçabilité « qui a validé quel billet » au-delà de la portée par
  événement (pas de journal d'audit dans cette itération).
- Pas de réinitialisation de mot de passe en libre-service pour les
  scanners — l'admin recrée/modifie le compte directement.
- Pas de compteur temps réel « X/Y billets validés » sur la page scanner
  (pourrait s'appuyer sur `AdminRealtimeSync` existant dans une itération
  future).
- Pas de migration des billets déjà envoyés — leurs QR (JSON brut, sans
  URL) resteront non cliquables ; seule la saisie manuelle ou la
  compatibilité `?data=` permet de les traiter s'ils sont un jour
  scannés/copiés autrement.

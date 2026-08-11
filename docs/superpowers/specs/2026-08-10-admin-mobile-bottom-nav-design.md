# Barre de navigation mobile (admin) — Design

Date : 2026-08-10
Statut : Validé

## Contexte

Le panneau admin (`src/app/admin/(protected)/*`) utilise `AdminSidebar.tsx`,
une barre latérale desktop qui, sous le seuil `xl` (1280px), se transforme
en bouton hamburger dépliant la liste complète des 9 liens en place (au-dessus
du contenu). Sur mobile, cette interaction (bouton en haut, liste qui pousse
le contenu vers le bas) ne correspond pas au patron attendu d'une navigation
d'application mobile. L'objectif est de remplacer cette navigation mobile par
une barre fixe en bas d'écran, façon app native.

## Décisions issues du brainstorming

1. **Liens en accès direct** : Vue d'ensemble, Événements, Réservations,
   Tickets — les 4 actions les plus fréquentes au quotidien.
2. **5ᵉ onglet « Plus »** : ouvre une feuille (sheet) qui remonte du bas,
   listant les liens restants — Codes Promo, Clients & invités, Galerie,
   Prestataires, Statistiques (`/admin/dashboard#stats`).
3. **Le hamburger mobile actuel est supprimé** : la barre du bas devient
   l'unique navigation mobile ; `AdminSidebar` ne gère plus que le desktop.

## Architecture

### Nouveau composant — `src/components/admin/AdminBottomNav.tsx`

`'use client'`. Rendu par `AdminLayoutWrapper`, visible uniquement sous
`xl` (`xl:hidden`, même seuil que celui déjà utilisé par `AdminSidebar`
pour son propre bouton mobile aujourd'hui).

```ts
const primaryLinks = [
  { href: '/admin/dashboard', label: 'Accueil', icon: PiChartLineUp },
  { href: '/admin/events', label: 'Événements', icon: PiMaskHappy },
  { href: '/admin/reservations', label: 'Réservations', icon: PiCalendarBlank },
  { href: '/admin/tickets', label: 'Tickets', icon: PiTicket },
] as const

const moreLinks = [
  { href: '/admin/promo-codes', label: 'Codes Promo', icon: PiTag },
  { href: '/admin/customers', label: 'Clients & invités', icon: PiUsersThree },
  { href: '/admin/gallery', label: 'Galerie', icon: PiImage },
  { href: '/admin/providers', label: 'Prestataires', icon: PiBriefcase },
  { href: '/admin/dashboard#stats', label: 'Statistiques', icon: PiChartLineUp },
] as const
```

- Barre fixe : `fixed inset-x-0 bottom-0 z-40`, fond
  `bg-[rgba(10,10,10,0.92)]` avec `backdrop-blur`, bordure supérieure
  `border-t border-white/10`, `padding-bottom: env(safe-area-inset-bottom)`
  pour l'encoche/barre de gestes iOS.
- 5 cellules à largeur égale (`grid grid-cols-5`), chacune icône + label
  court en `text-[10px]`. Le libellé du premier onglet est raccourci en
  « Accueil » (contre « Vue d'ensemble » dans `AdminSidebar`) — délibéré,
  une cellule de barre du bas n'a pas la largeur du libellé desktop ; même
  `href` (`/admin/dashboard`) dans les deux cas. Style actif identique à
  `AdminSidebar` :
  couleur/texte en `rgba(201,161,77,1)` avec halo doré léger, contre
  `text-white/55` au repos.
- État actif d'un lien direct : même logique que `AdminSidebar`
  (`pathname === href || pathname.startsWith(`${href}/`)`).
- État actif de **Plus** : `true` si le pathname courant correspond à l'un
  des `moreLinks` (sinon `false`) — géré par un état local `isSheetOpen`
  pour l'ouverture, indépendant de l'état actif visuel.
- Tap sur **Plus** → `setIsSheetOpen(true)`, ouverture d'une feuille custom
  (pas le composant `Modal` existant, qui est centré — ici le panneau est
  ancré en bas) :
  - `fixed inset-0 z-50` : overlay `bg-black/70 backdrop-blur-xl` cliquable
    pour fermer + panneau `absolute inset-x-0 bottom-0 rounded-t-3xl
    border-t border-white/10 bg-[...]` listant les 5 `moreLinks` (icône +
    label, même style de ligne que les liens de `AdminSidebar`).
  - Fermeture : clic sur l'overlay, touche Échap, ou clic sur un lien
    (navigation + fermeture).
  - Verrouillage du scroll du `body` pendant l'ouverture et gestion de la
    touche Échap : même pattern que `src/components/ui/Modal.tsx`
    (`useEffect` avec `document.addEventListener('keydown', …)` et
    `document.body.style.overflow = 'hidden'`), dupliqué ici en local plutôt
    que factorisé — un seul autre composant dans le code n'a pas besoin
    d'une abstraction partagée pour l'instant (YAGNI).

### `src/components/admin/AdminSidebar.tsx` (modifié)

- Le conteneur racine `<aside>` passe de `flex` à `hidden xl:flex` : le
  composant ne s'affiche plus du tout sous `xl`.
- Suppression du bouton hamburger mobile (bloc « Toggle Button for Mobile »),
  de l'état `isOpen`/`setIsOpen`, et du wrapper conditionnel
  `${isOpen ? 'flex' : 'hidden'} xl:flex` autour de la zone repliable — cette
  zone est de nouveau toujours visible telle quelle, car le composant entier
  ne rend plus que sur desktop.
- Suppression des imports `PiList`, `PiX` devenus inutilisés.
- Le comportement desktop existant (collapse/expand via
  `isCollapsed`/`onToggleCollapse`) n'est pas modifié.

### `src/components/admin/AdminLayoutWrapper.tsx` (modifié)

- Ajoute `<AdminBottomNav />` juste avant la fermeture du conteneur racine
  (rendu une fois, en dehors du flux normal puisqu'il est `fixed`).
- Le conteneur racine (actuellement `pb-16`) passe à `pb-28 xl:pb-16` pour
  que le contenu défilant ne soit jamais masqué par la barre fixe sur
  mobile ; inchangé sur desktop où la barre ne s'affiche pas.

## Flux

```
Lien direct (Accueil/Événements/Réservations/Tickets)
  → <Link> standard → navigation Next.js normale

Onglet « Plus »
  → setIsSheetOpen(true) → feuille glisse depuis le bas
  → clic lien interne → navigation + setIsSheetOpen(false)
  → clic overlay / Échap → setIsSheetOpen(false), pas de navigation
```

## Gestion d'erreurs

Aucune — navigation pure côté client, pas d'appel réseau ni d'action
serveur impliqués dans ce changement.

## Tests

Aucun test automatisé ajouté : aucun composant de navigation admin
(`AdminSidebar`, `AdminLayoutWrapper`) n'a de couverture aujourd'hui — pas
de React Testing Library dans ce projet. Vérification par `tsc --noEmit`,
`npm run build`, et un contrôle manuel du rendu (viewport mobile) après
implémentation.

## Hors périmètre (explicitement exclu)

- Pas de badge de notification ni de contenu dynamique sur les onglets.
- Pas de réutilisation/abstraction du composant `Modal` existant pour la
  feuille « Plus » (patron d'interaction différent — ancré en bas, pas
  centré) ; pas de composant `Sheet` générique créé pour un seul usage.
- Pas de changement du comportement desktop de `AdminSidebar`
  (collapse/expand) ni de la page elle-même sous chaque lien.
- Le lien « Statistiques » reste une ancre vers `/admin/dashboard#stats`
  telle qu'elle existe déjà, sans modification.

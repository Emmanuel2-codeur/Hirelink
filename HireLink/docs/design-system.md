# Système de design HireLink (web)

**Principes** : lisibilité d'abord (texte 16 px, contraste AA vérifié), cibles tactiles ≥ 44 px, un seul h1 par écran,
aucune information portée par la couleur seule, mouvement sobre (`prefers-reduced-motion` respecté), RTL natif.

## Jetons (`web/tailwind.config.js`)
| Rôle | Jeton | Valeur |
|---|---|---|
| Identité / navigation | `yale` (700/800/900) | #284B63 |
| Actions / IA | `teal` (50/100/600) | #3C6E71 |
| Accent sur fonds sombres | `mint` | #7DD3B8 |
| Titres / texte secondaire | `ink` / `muted` | #1B2A35 / #5B6670 |
| Bordures / fond | `line` / `alabaster` | #D5DBE0 / #F5F7F8 |
| Succès / alerte / erreur | `success` / `warning` / `danger` | #166534 / #92400E / #B91C1C |

Échelle d'élévation : `shadow-card` (cartes), `shadow-pop` (menus, fenêtres). Rayons : 8 / 14 / 20 px.
Police : Inter (variable) + Noto Sans Arabic.

## Composants (`web/src/components`)
`ui/button` (6 variantes, états chargement) · `ui/card` (Card, Badge, StatCard) · `ui/kit` (PageHeader, EmptyState, Alert,
Skeleton, ScoreRing, Avatar) · `illustrations` (9 illustrations + motif « ruban ») · `AppLayout` (barre latérale / barre du bas).

## Règles appliquées
- Navigation : barre latérale (bureau), barre du bas ≤ 5 entrées + « Plus » (mobile), lien d'évitement, focus visible.
- Formulaires : libellé visible sur chaque champ, erreurs sous le champ (`aria-describedby`), `autocomplete`, bouton avec chargement.
- Retours : `Alert` (icône + texte, annoncé aux lecteurs d'écran), squelettes de chargement, états vides illustrés avec action.
- Arabe : `dir="rtl"` automatique, propriétés logiques (`ms-`/`me-`/`start-`/`end-`), isolats bidi pour les noms latins.
- Vérification : audit axe-core (WCAG 2.1 AA + bonnes pratiques) = 0 violation sur les écrans principaux.

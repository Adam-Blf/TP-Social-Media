# Documentation API

## Conventions générales

- **Base URL par défaut** : 
- **Format** : toutes les routes consomment et répondent en JSON ().
- **Authentification** : non implémentée dans cette version (prévoir une gateway externe si nécessaire).
- **Validation** : chaque entrée est contrôlée via . En cas d’erreur, la réponse contient ,  et la liste des champs fautifs ().

## Ressource Utilisateurs

### 
Retourne la liste complète des utilisateurs.

### 
Crée un utilisateur.



### 
Détail d’un utilisateur par identifiant Mongo.

### 
Met à jour partiellement un utilisateur (mêmes champs que , tous optionnels).

### 
Supprime l’utilisateur ciblé.

---

## Ressource Groupes

### 
Liste tous les groupes avec leurs membres enrichis.

### 
Crée un groupe.



### 
Détail d’un groupe.

### 
Met à jour les méta-données du groupe.

### 
Ajoute un membre (champs  et ).

### 
Modifie le rôle d’un membre.

### 
Retire un membre (au moins un admin doit rester).

### 
Crée un événement pour le groupe. Par défaut, tous les membres sont invités.



Réponse : représentation complète de l’événement (identique aux routes ).

### Discussions de groupe
- 
- 
- 

Les membres peuvent poster si  est activé ou s’ils sont administrateurs.

---

## Ressource Événements

### 
Liste des événements. Filtres possibles :

- 
- 
- 
- 

### 
Crée un événement sans passer par un groupe (voir payload ci-dessus,  devient optionnel).

### 
Retourne l’événement avec organisateurs, participants et groupe peuplé.

### 
Met à jour un événement (champs identiques à , tous optionnels).

### Gestion des participants
- 
  
- 
- 

---

## Sondages d’événement

Les chemins ci-dessous sont préfixés par  :

-  : liste des sondages.
-  : création (organisateur obligatoire).
-  : réponse par un participant.

Payload d’un sondage :


Réponse à un sondage :


---

## Billetterie

Préfixe : 

-  : liste des types de billet.
-  : création (organisateur, billetterie activée).
-  : achat/parrainage d’un billet.

Exemple de type de billet :


Exemple d’achat :


Une même adresse email ne peut obtenir qu’un seul billet par événement.

---

## Albums photo

Préfixe : 

-  : liste des albums.
-  : création (participant ou organisateur).
-  : ajout d’une photo.
-  : commentaire sur une photo.

Exemple d’ajout de photo :


---

## Shopping list

Préfixe : 

-  : récupère la liste des apports.
-  : ajoute un élément unique (shopping list activée).
-  : supprime un élément.



---

## Covoiturage

Préfixe : 

-  : liste des offres.
-  : création d’une offre (covoiturage activé).
-  : suppression.



---

## Discussions d’événement

Préfixe : 

-  : récupère les fils.
-  : crée un fil pour l’événement (participant ou organisateur).
-  : ajoute un message ou une réponse ().

---

## Codes d’erreur

| Code | Signification | Exemple |
|------|---------------|---------|
| 400  | Mauvaise requête / validation métier | utilisateur inexistant, organisateur manquant |
| 403  | Action interdite | membre non autorisé à créer un événement |
| 404  | Ressource introuvable | groupe, événement ou sous-document absent |
| 409  | Conflit | participant déjà inscrit, billet déjà réservé |
| 422  | Validation des champs | champs manquants ou mal formés |
| 500  | Erreur interne | erreur inattendue côté serveur |

---

## Santé

-  : statut simple , utile pour les probes.

---

## Notes complémentaires

- Tous les identifiants sont des ObjectId MongoDB.
- Les timestamps (, ) sont gérés automatiquement par Mongoose.
- Les routes ne nécessitent pas d’authentification dans cette version d’école ; l’intégration d’un SSO ou JWT devra être effectuée en amont.

